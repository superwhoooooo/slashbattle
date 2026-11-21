// The four peoples of the storm cities (logic/world.js's CITY_DEFS), one for each regional phenomenon. Pure data: names,
// colours, roles, the odd line of small talk, and each people's CHAMPION (who stands in the city's temple, joins you
// for the storm like a Tears of the Kingdom sage, and gives you the people's gift against it). Their look is src/speciesModels.js.
export const SPECIES = {
  dunekin: {
    id: 'dunekin', name: 'Dunekin', blurb: 'Tall-eared desert folk who read the wind like a book, and never trust a calm day.',
    colors: [0xe8b86a, 0xf2cf8a, 0xd9a05a, 0xf0c27a],
    names: ['Zahri', 'Qadir', 'Samira', 'Idris', 'Nahla', 'Tarik', 'Yusra', 'Hakim', 'Safiya', 'Rashid'],
    roles: ['Windreader', 'Caravan-master', 'Sand-glassblower', 'Dune-guide', 'Sundial-keeper', 'Spice-trader'],
    talk: ['The sand has been singing the wrong song for a season.', 'If the wind stops, run. It is only taking a breath.', 'My grandmother crossed the dunes blindfolded. She would not cross them now.'],
    champion: {
      name: 'Sahra', title: 'Wind Chieftain of the Dunekin', color: 0xd9a05a, gear: 0xc0442e,
      power: 'Sirocco', powerText: 'calls up a whirlwind that drags monsters together and flays them',
      gift: 'Sand Veil', giftText: 'A Dunekin veil: the sandstorm barely shoves you and you can see through it.',
      join: 'The sand will not let a stranger cross alone. I am coming with you, and my wind goes where you go.',
    },
  },
  frostkin: {
    id: 'frostkin', name: 'Frostkin', blurb: 'Round, white and warm-hearted, they keep a fire lit in every window and a story for every one of them.',
    colors: [0xe8f6ff, 0xcfeaff, 0xbfdcff, 0xf4fbff],
    names: ['Bjorn', 'Sigrun', 'Ivar', 'Freya', 'Leif', 'Astrid', 'Haldis', 'Ulf', 'Eira', 'Toke'],
    roles: ['Fire-tender', 'Rime-weaver', 'Sled-wright', 'Ice-fisher', 'Aurora-singer', 'Furrier'],
    talk: ['Keep moving out there, and keep your fires close.', 'The whiteout does not hate you. It simply does not know you are there.', 'We say a name for every fire we light. Do you have a good name?'],
    champion: {
      name: 'Talwyn', title: 'Wingwarden of the Frostkin', color: 0xdff0ff, gear: 0x3a7ac8,
      power: 'Gale Volley', powerText: 'looses a volley of wind arrows at up to three monsters',
      gift: 'Downfeather Cloak', giftText: 'Woven from Frostkin down: the whiteout\'s cold creeps in far slower.',
      join: 'My wings are no use to Rimehold grounded. I will fly at your shoulder; when something moves in the snow, I will see it first.',
    },
  },
  embervolk: {
    id: 'embervolk', name: 'Embervolk', blurb: 'Horned smiths with ember-bright cheeks. Loud, proud, and quick to forgive anyone who can lift a hammer.',
    colors: [0xff7a3a, 0xff9a5a, 0xe85a2a, 0xffa24a],
    names: ['Kael', 'Brannoch', 'Ignis', 'Pyra', 'Torvald', 'Cinda', 'Rurik', 'Ashka', 'Vulcan', 'Sear'],
    roles: ['Forge-master', 'Slag-sifter', 'Anvil-singer', 'Vent-warden', 'Coal-runner', 'Glass-blower'],
    talk: ['The vents have been grumbling since before the ashfall. Something is stoking them.', 'Our forges never go cold. That is not a boast; it is a warning.', 'Show me a good blade and I will show you a bad day for a monster.'],
    champion: {
      name: 'Brannoch', title: 'Boulder-Son of the Embervolk', color: 0x8a4a2a, gear: 0xff7a2a,
      power: 'Boulder Roll', powerText: 'curls into a ball and rolls through monsters, flinging them away',
      gift: 'Ashguard Mantle', giftText: 'Forged slag mail: embers that land on you only sting.',
      join: 'Ha! You want to walk into THAT? Then I am rolling in first. Embervolk do not let friends get burned alone.',
    },
  },
  mirefolk: {
    id: 'mirefolk', name: 'Mirefolk', blurb: 'Wide-eyed fen-dwellers who hang lanterns from everything and speak softly, so as not to wake the bog.',
    colors: [0x8ae86a, 0xa8f08a, 0x6ed088, 0xb6f09a],
    names: ['Ribbit', 'Marsh', 'Lilt', 'Bracken', 'Sedge', 'Pondle', 'Reedy', 'Moss', 'Tansy', 'Brook'],
    roles: ['Lantern-hanger', 'Reed-weaver', 'Bog-guide', 'Wisp-whisperer', 'Pond-poet', 'Toad-tender'],
    talk: ['Shh. The fog is listening.', 'We hang a light for every one we lose. The fen is very bright now.', 'Follow the wisps, not the voices. The voices are the fog.'],
    champion: {
      name: 'Lilt', title: 'Lanternbearer of the Mirefolk', color: 0x4ac8a0, gear: 0xdaff6a,
      power: 'Lantern Tide', powerText: 'sends a wave of lantern-light that hurts monsters, burns off poison clouds and mends you',
      gift: 'Mirelight Charm', giftText: 'A Mirefolk lantern charm: the miasma\'s poison clouds barely hurt you.',
      join: 'Softly now... I will carry the lantern. Stay in its light and the fog cannot find you.',
    },
  },
}
export const speciesById = (id) => SPECIES[id] ?? null
export const championOf = (speciesId) => SPECIES[speciesId]?.champion ?? null
