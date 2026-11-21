// The four peoples of the storm cities (logic/world.js's CITY_DEFS), one for each regional phenomenon. Pure data: names,
// colours, roles and the odd line of small talk. Their look (ears, horns, tails...) is src/npcs.js's `dressSpecies`.
export const SPECIES = {
  dunekin: {
    id: 'dunekin', name: 'Dunekin', blurb: 'Tall-eared desert folk who read the wind like a book, and never trust a calm day.',
    colors: [0xe8b86a, 0xf2cf8a, 0xd9a05a, 0xf0c27a],
    names: ['Zahri', 'Qadir', 'Samira', 'Idris', 'Nahla', 'Tarik', 'Yusra', 'Hakim', 'Safiya', 'Rashid'],
    roles: ['Windreader', 'Caravan-master', 'Sand-glassblower', 'Dune-guide', 'Sundial-keeper', 'Spice-trader'],
    talk: ['The sand has been singing the wrong song for a season.', 'If the wind stops, run. It is only taking a breath.', 'My grandmother crossed the dunes blindfolded. She would not cross them now.'],
  },
  frostkin: {
    id: 'frostkin', name: 'Frostkin', blurb: 'Round, white and warm-hearted, they keep a fire lit in every window and a story for every one of them.',
    colors: [0xe8f6ff, 0xcfeaff, 0xbfdcff, 0xf4fbff],
    names: ['Bjorn', 'Sigrun', 'Ivar', 'Freya', 'Leif', 'Astrid', 'Haldis', 'Ulf', 'Eira', 'Toke'],
    roles: ['Fire-tender', 'Rime-weaver', 'Sled-wright', 'Ice-fisher', 'Aurora-singer', 'Furrier'],
    talk: ['Keep moving out there, and keep your fires close.', 'The whiteout does not hate you. It simply does not know you are there.', 'We say a name for every fire we light. Do you have a good name?'],
  },
  embervolk: {
    id: 'embervolk', name: 'Embervolk', blurb: 'Horned smiths with ember-bright cheeks. Loud, proud, and quick to forgive anyone who can lift a hammer.',
    colors: [0xff7a3a, 0xff9a5a, 0xe85a2a, 0xffa24a],
    names: ['Kael', 'Brannoch', 'Ignis', 'Pyra', 'Torvald', 'Cinda', 'Rurik', 'Ashka', 'Vulcan', 'Sear'],
    roles: ['Forge-master', 'Slag-sifter', 'Anvil-singer', 'Vent-warden', 'Coal-runner', 'Glass-blower'],
    talk: ['The vents have been grumbling since before the ashfall. Something is stoking them.', 'Our forges never go cold. That is not a boast; it is a warning.', 'Show me a good blade and I will show you a bad day for a monster.'],
  },
  mirefolk: {
    id: 'mirefolk', name: 'Mirefolk', blurb: 'Wide-eyed fen-dwellers who hang lanterns from everything and speak softly, so as not to wake the bog.',
    colors: [0x8ae86a, 0xa8f08a, 0x6ed088, 0xb6f09a],
    names: ['Ribbit', 'Marsh', 'Lilt', 'Bracken', 'Sedge', 'Pondle', 'Reedy', 'Moss', 'Tansy', 'Brook'],
    roles: ['Lantern-hanger', 'Reed-weaver', 'Bog-guide', 'Wisp-whisperer', 'Pond-poet', 'Toad-tender'],
    talk: ['Shh. The fog is listening.', 'We hang a light for every one we lose. The fen is very bright now.', 'Follow the wisps, not the voices. The voices are the fog.'],
  },
}
export const speciesById = (id) => SPECIES[id] ?? null
