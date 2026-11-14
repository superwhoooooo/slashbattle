// The co-op connection layer (ported from flopsim's multiplayer): peer to peer over WebRTC (PeerJS), with
// no game server of our own.
//
//  - One player HOSTS and gets a 4-letter room code; up to three friends JOIN with it. The host relays
//    messages between everyone (a star). The free public PeerJS service only matches players by code;
//    game data goes straight between browsers.
//  - Relay fallback: when a network blocks the direct connection (common on school / office / guest wifi),
//    joining switches by itself to passing messages through free public MQTT servers (no account). The host
//    listens on all of them; a joiner uses the first that works. Slower than direct, and public: anyone who
//    knew the room code could watch the traffic (positions, hits, names), nothing personal.
//  - Liveness: everyone sends state many times a second, so a connection that goes quiet for
//    SILENCE_TIMEOUT seconds is treated as gone (covers tabs closed without a goodbye).
//
// This file knows nothing about the game: it moves plain objects. src/coop.js gives them meaning.
// Bundled (not lazy-loaded) so `npm run build:single`'s one-file build, which inlines only the main script, has them.
import { Peer } from 'peerjs'
import mqtt from 'mqtt'
import { MAX_PLAYERS, PROTOCOL, SILENCE_TIMEOUT, cleanName, isValidCode, makeRoomCode } from '../logic/coop.js'

const ROOM_PREFIX = 'slashbattle-coop-'
// How browsers find a route to each other. STUN finds a direct path through most home routers. Add a TURN
// service's { urls, username, credential } here to reach very strict networks without the MQTT relay.
const TURN_SERVERS = []
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  ...TURN_SERVERS,
]
const RELAY_BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt', 'wss://test.mosquitto.org:8081/mqtt']
const RELAY_PREFIX = 'slashbattle-relay/v1/'
const DIRECT_TIMEOUT = 9000 // ms to wait for a direct connection before switching to the relay

async function relayConnect(url) {
  return new Promise((resolve) => {
    let client
    try {
      client = mqtt.connect(url, { connectTimeout: 6000, reconnectPeriod: 2000, clean: true })
    } catch {
      resolve(null)
      return
    }
    const timer = setTimeout(() => {
      try { client.end(true) } catch { /* ignore */ }
      resolve(null)
    }, 8000)
    client.once('connect', () => {
      clearTimeout(timer)
      resolve(client)
    })
  })
}

const decoder = new TextDecoder()
const decode = (payload) => {
  try { return JSON.parse(decoder.decode(payload)) } catch { return null }
}

/** Looks like a PeerJS DataConnection to the rest of this file, but sends through a relay server. */
class RelayConn {
  constructor(client, topicOut, myId, peerId, metadata) {
    this.client = client
    this.topicOut = topicOut
    this.myId = myId
    this.peer = peerId
    this.metadata = metadata
    this.open = false
    this.relay = true
    this.handlers = {}
  }
  on(event, fn) { (this.handlers[event] ||= []).push(fn); return this }
  emit(event, arg) { for (const fn of this.handlers[event] || []) fn(arg) }
  send(m) { if (this.open) this.client.publish(this.topicOut, JSON.stringify({ k: 'm', from: this.myId, m })) }
  close() {
    if (!this.open) return
    try { this.client.publish(this.topicOut, JSON.stringify({ k: 'bye', from: this.myId })) } catch { /* ignore */ }
    this.open = false
    this.emit('close')
  }
}

export class Link {
  /**
   * @param {object} handlers
   *   onMessage(m, fromId)  a game message arrived (the host also gets clients' messages before relaying them)
   *   onPeerJoin(id, name)  host: someone joined (send them a welcome from here)
   *   onPeerLeave(id)       someone left / timed out
   *   onConnected()         joiner: the connection to the host is open
   *   onClosed(reason)      our session ended (left, host gone, failed)
   *   onStatus(text)        a line for the panel
   */
  constructor(handlers) {
    this.h = handlers
    this.peer = null
    this.conns = new Map() // host: peer id -> conn; joiner: 'host' -> conn
    this.lastHeard = new Map()
    this.relayClients = []
    this.relayConns = new Map()
    this.isHost = false
    this.code = null
    this.myId = null
    this.name = ''
    this.closing = false
  }

  get active() { return Boolean(this.peer) }
  get connected() { return this.isHost ? Boolean(this.peer) : this.conns.has('host') && this.conns.get('host').open }
  get viaRelay() { return [...this.conns.values()].some((c) => c.relay) }
  peerCount() { return this.conns.size }

  async _peer(id) {
    return id ? new Peer(id, { config: { iceServers: ICE_SERVERS }, debug: 0 }) : new Peer({ config: { iceServers: ICE_SERVERS }, debug: 0 })
  }

  async host(name) {
    if (this.peer) return
    this.closing = false
    this.isHost = true
    this.name = cleanName(name, 'Host')
    this.code = makeRoomCode()
    this.h.onStatus?.('Creating a room...')
    let peer
    try {
      peer = this.peer = await this._peer(ROOM_PREFIX + this.code)
    } catch (error) {
      this.h.onStatus?.(`Could not load the network code: ${error.message}`)
      this._teardown('failed')
      return
    }
    peer.on('open', () => {
      this.myId = 'host'
      this._relayHost()
      this.h.onStatus?.(`Room code: ${this.code}. Friends press P and join with it.`)
      this.h.onConnected?.()
    })
    peer.on('connection', (conn) => this._acceptClient(conn))
    peer.on('disconnected', () => { try { peer.reconnect() } catch { /* ignore */ } }) // lost the matchmaking server: rejoin it (open games keep going)
    peer.on('error', (err) => {
      if (err.type === 'unavailable-id' && this.peer === peer) {
        // code taken: try a fresh one
        try { peer.destroy() } catch { /* ignore */ }
        this.peer = null
        this.host(this.name)
        return
      }
      if (err.type === 'peer-unavailable' || err.type === 'network' || err.type === 'disconnected') return // transient
      this.h.onStatus?.(`Could not host: ${err.type || err.message}`)
      if (!this.conns.size) this._teardown('failed')
    })
  }

  async join(code, name) {
    if (this.peer) return
    if (!isValidCode(code)) {
      this.h.onStatus?.('Type the 4-letter room code first.')
      return
    }
    this.closing = false
    this.isHost = false
    this.code = code
    this.name = cleanName(name, 'Friend')
    this.h.onStatus?.(`Connecting to room ${code}...`)
    let peer
    try {
      peer = this.peer = await this._peer()
    } catch (error) {
      this.h.onStatus?.(`Could not load the network code: ${error.message}`)
      this._teardown('failed')
      return
    }
    peer.on('open', (id) => {
      this.myId = id
      // ?coopRelay in the address skips the direct try (for testing, or a network known to block it).
      if (/[?&]coopRelay\b/.test(globalThis.location?.search ?? '')) {
        this._joinViaRelay(code)
        return
      }
      const conn = peer.connect(ROOM_PREFIX + code, { reliable: true, metadata: { name: this.name, v: PROTOCOL } })
      const timeout = setTimeout(() => {
        if (conn.open || this.peer !== peer) return
        // A wrong code fails fast with 'peer-unavailable', so getting here means the room exists but the
        // network blocks the direct route: go through a relay instead.
        try { conn.close() } catch { /* ignore */ }
        this._joinViaRelay(code)
      }, DIRECT_TIMEOUT)
      conn.on('open', () => {
        clearTimeout(timeout)
        this.conns.set('host', conn)
        this.lastHeard.set('host', performance.now())
        this.h.onStatus?.(`Connected to room ${code}!`)
        this.h.onConnected?.()
      })
      conn.on('data', (m) => this._receive(m, 'host'))
      conn.on('close', () => {
        if (this.conns.get('host') !== conn) return
        this._teardown('hostLeft')
      })
    })
    peer.on('error', (err) => {
      if (this.peer !== peer) return
      if (err.type === 'peer-unavailable') {
        if (this.conns.has('host')) return
        this.h.onStatus?.(`No room with code ${code}. Check it and try again.`)
        this._teardown('failed')
      } else if (!this.conns.has('host')) {
        this.h.onStatus?.(`Connection failed: ${err.type || err.message}`)
        this._teardown('failed')
      }
    })
  }

  _acceptClient(conn) {
    if (this.conns.size >= MAX_PLAYERS - 1) {
      conn.on('open', () => {
        conn.send({ t: 'full' })
        setTimeout(() => conn.close(), 400)
      })
      return
    }
    conn.on('open', () => {
      if (conn.metadata?.v !== PROTOCOL) {
        conn.send({ t: 'version', v: PROTOCOL })
        setTimeout(() => conn.close(), 400)
        return
      }
      this.conns.set(conn.peer, conn)
      this.lastHeard.set(conn.peer, performance.now())
      this.h.onPeerJoin?.(conn.peer, cleanName(conn.metadata?.name))
    })
    conn.on('data', (m) => this._receive(m, conn.peer))
    conn.on('close', () => this._dropPeer(conn.peer))
    conn.on('error', () => this._dropPeer(conn.peer))
  }

  _dropPeer(id) {
    if (!this.conns.has(id)) return
    const conn = this.conns.get(id)
    this.conns.delete(id)
    this.relayConns.delete(id)
    this.lastHeard.delete(id)
    try { conn.close() } catch { /* ignore */ }
    this.broadcast({ t: 'leave', id })
    this.h.onPeerLeave?.(id)
  }

  leave() {
    if (!this.peer) return
    this.broadcast({ t: 'leave', id: this.myId })
    this._teardown('left')
  }

  _teardown(reason) {
    if (this.closing) return
    this.closing = true
    for (const conn of this.conns.values()) { try { conn.close() } catch { /* ignore */ } }
    this.conns.clear()
    this.lastHeard.clear()
    try { this.peer?.destroy() } catch { /* ignore */ }
    for (const client of this.relayClients) { try { client.end(false) } catch { /* ignore */ } }
    this.relayClients = []
    this.relayConns.clear()
    this.welcomed = false
    this.peer = null
    const wasHost = this.isHost
    this.isHost = false
    this.myId = null
    this.h.onClosed?.(reason, wasHost)
  }

  // ---------- relay fallback ----------
  async _relayHost() {
    const code = this.code
    const inbox = `${RELAY_PREFIX}${code}/host`
    await Promise.all(RELAY_BROKERS.map(async (url) => {
      const client = await relayConnect(url)
      if (!client) return
      if (!this.peer || this.code !== code) { client.end(true); return }
      this.relayClients.push(client)
      client.subscribe(inbox)
      client.on('message', (topic, payload) => {
        if (topic !== inbox) return
        const d = decode(payload)
        if (!d || typeof d.from !== 'string') return
        let conn = this.relayConns.get(d.from)
        if (d.k === 'hello') {
          if (conn || this.conns.has(d.from)) return // they repeat hello until welcomed
          conn = new RelayConn(client, `${RELAY_PREFIX}${code}/c/${d.from}`, 'host', d.from, { name: d.name, v: d.v })
          this.relayConns.set(d.from, conn)
          this._acceptClient(conn)
          conn.open = true
          conn.emit('open')
          return
        }
        if (!conn) return
        if (d.k === 'm') conn.emit('data', d.m)
        else if (d.k === 'bye') { conn.open = false; conn.emit('close') }
      })
    }))
  }

  async _joinViaRelay(code) {
    if (!this.peer) return
    this.h.onStatus?.('Your network blocked the direct connection. Trying a relay instead...')
    const myId = this.myId
    for (const url of RELAY_BROKERS) {
      const client = await relayConnect(url)
      if (!this.peer) { client?.end(true); return }
      if (!client) continue
      const inbox = `${RELAY_PREFIX}${code}/c/${myId}`
      const conn = new RelayConn(client, `${RELAY_PREFIX}${code}/host`, myId, 'host', null)
      conn.open = true
      client.subscribe(inbox)
      client.on('message', (topic, payload) => {
        if (topic !== inbox) return
        const d = decode(payload)
        if (!d) return
        if (d.k === 'm') conn.emit('data', d.m)
        else if (d.k === 'bye') { conn.open = false; conn.emit('close') }
      })
      conn.on('data', (m) => this._receive(m, 'host'))
      conn.on('close', () => { if (this.conns.get('host') === conn) this._teardown('hostLeft') })
      this.conns.set('host', conn)
      this.lastHeard.set('host', performance.now())
      this.welcomed = false
      for (let i = 0; i < 8 && !this.welcomed && this.peer; i++) {
        client.publish(`${RELAY_PREFIX}${code}/host`, JSON.stringify({ k: 'hello', from: myId, name: this.name, v: PROTOCOL }))
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      if (this.welcomed) {
        this.relayClients.push(client)
        this.lastHeard.set('host', performance.now())
        this.h.onStatus?.(`Connected to room ${code} through a relay (a little slower, but it works on this network).`)
        this.h.onConnected?.()
        return
      }
      this.conns.delete('host')
      client.end(true)
    }
    this.h.onStatus?.("Couldn't connect, even through a relay. Check the code, that the host is still in the room, and that you both have the latest version (refresh).")
    this._teardown('failed')
  }

  // ---------- messages ----------
  /** Host: to every client (except `skip`). Joiner: to the host, who passes it on. */
  broadcast(m, skip = null) {
    for (const [id, conn] of this.conns) {
      if (id === skip || !conn.open) continue
      try { conn.send(m) } catch { /* a closing channel: its close handler cleans up */ }
    }
  }

  /** To one player ('host' or a peer id). */
  sendTo(id, m) {
    if (this.isHost) {
      const conn = this.conns.get(id)
      if (conn?.open) { try { conn.send(m) } catch { /* ignore */ } }
    } else {
      const conn = this.conns.get('host')
      if (!conn?.open) return
      try { conn.send(id === 'host' ? m : { ...m, to: id }) } catch { /* ignore */ }
    }
  }

  _receive(m, from) {
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return
    this.lastHeard.set(from, performance.now())
    if (m.t === 'welcome') this.welcomed = true
    if (m.t === 'full') { this.h.onStatus?.(`That room is full (${MAX_PLAYERS} players).`); this._teardown('full'); return }
    if (m.t === 'version') { this.h.onStatus?.('The host has a different version of the game. Both refresh the page and try again.'); this._teardown('version'); return }
    if (this.isHost) {
      // Pass on whatever isn't just for the host, stamped with who sent it.
      if (m.to && m.to !== 'host') { this.sendTo(m.to, { ...m, from }); return }
      if (!m.to && !m.hostOnly) this.broadcast({ ...m, from }, from)
      m = { ...m, from }
    }
    if (m.t === 'leave' && !this.isHost) { this.h.onPeerLeave?.(m.id); return }
    this.h.onMessage?.(m, m.from || from)
  }

  /** Call every frame: drops connections that have gone quiet. */
  tick() {
    if (!this.peer) return
    const now = performance.now()
    for (const [id, at] of this.lastHeard) {
      if (now - at < SILENCE_TIMEOUT * 1000) continue
      if (this.isHost) this._dropPeer(id)
      else { this.h.onStatus?.('Lost the connection to the host.'); this._teardown('hostLeft') }
      return
    }
  }
}
