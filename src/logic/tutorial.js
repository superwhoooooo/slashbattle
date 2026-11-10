// Pure rules for tutorial mode: an ordered list of steps grouped into chapters. Each step is finished
// by one kind of event ({ type, amount?, target? }): the player moved, sprinted, swung, killed something
// (optionally a given monster type), hid, ambushed, chained, opened a chest, used an ability... or, for
// the "read this" steps at the end, pressed Continue (event 'next').
//
// Fields: chapter, title, hint (how, keyboard), touch (how, touch), why (what it is for / the deeper rule),
// need (how much of the event), target (only kills of this monster type count), desktopOnly (skipped on
// touch), read (an explanation card finished by Continue).
export const TUTORIAL_CHAPTERS = ['Basics', 'Combat tricks', 'Gear', 'Enemies', 'The big picture']

export const TUTORIAL_STEPS = [
  // --- Basics ---
  { id: 'move', chapter: 0, event: 'move', need: 6, title: 'Move around',
    hint: 'WASD or the arrow keys to walk a few steps.', touch: 'Drag the left stick to walk a few steps.',
    why: 'The sundeck has no walls. Anyone whose middle leaves the edge falls: monsters die, you lose HP and respawn.' },
  { id: 'sprint', chapter: 0, event: 'sprint', need: 8, title: 'Sprint', desktopOnly: true,
    hint: 'Hold Shift while you move to run 1.5x faster.', touch: '',
    why: 'Sprinting is how you get out of a slam ring or away from a crowd. In water rooms Shift dives instead.' },
  { id: 'attack', chapter: 0, event: 'attack', need: 3, title: 'Cast your staff',
    hint: 'Left click or Space. The Wizard Staff fires magic orbs at your mouse cursor.', touch: 'Hold the right stick to aim and attack.',
    why: 'The staff is always in slot 1 and can never be swapped out. Every hit also knocks monsters back.' },
  { id: 'kill', chapter: 0, event: 'kill', need: 1, title: 'Pop a jelly',
    hint: 'A practice Blobbo is wandering in. Hit it until it pops.', touch: 'Aim at the Blobbo with the right stick until it pops.',
    why: 'Every kill scores points and gets a trick name (Slash, Checkout for a fall, Cannonball in a pool...).' },
  { id: 'crystals', chapter: 0, event: 'crystal', need: 2, title: 'Grab the crystals',
    hint: 'Popped monsters drop crystals. Walk near them and they fly to you.', touch: 'Walk near the crystals and they fly to you.',
    why: 'Crystals open chests in a run. Press T to bank them for the skill tree between runs. Monsters that fall drop none.' },

  // --- Combat tricks ---
  { id: 'weapon', chapter: 1, event: 'weapon', need: 1, title: 'Switch weapons',
    hint: 'You just got an Energy Sword. Press 2 to hold it, 1 for the staff (gamepad: LB / RB).', touch: 'Tap the sword in the hotbar.',
    why: 'You carry up to 5 weapons. Melee swings hit everything in an arc in front of you and shove harder; guns hit from range.' },
  { id: 'chain', chapter: 1, event: 'chain', need: 1, title: 'Build a kill chain',
    hint: 'Pop two jellies within 2.5 seconds of each other.', touch: 'Pop two jellies within 2.5 seconds of each other.',
    why: 'Each quick kill raises the CHAIN multiplier on your points. Let it lapse and it resets.' },
  { id: 'hide', chapter: 1, event: 'hide', need: 1, title: 'Hide in a suitcase',
    hint: 'Walk up to a suitcase and press E.', touch: 'Walk up to a suitcase and tap HIDE.',
    why: 'Inside, monsters lose sight of you and search nearby. You have about 10 seconds: overstay and you are thrown out and lose 10% HP. Each suitcase works once.' },
  { id: 'ambush', chapter: 1, event: 'ambush', need: 1, title: 'Ambush!',
    hint: 'Press E to pop out, then hit a jelly right away. Hide again in a new suitcase if the moment passes.', touch: 'Tap HIDE to pop out, then hit a jelly right away.',
    why: 'For a moment after leaving a suitcase your hits deal bonus ambush damage. Hide, let them lose you, then strike.' },
  { id: 'auto', chapter: 1, event: 'autoShoot', need: 1, title: 'Auto-shoot',
    hint: 'Press L to toggle auto-shoot (shown bottom-right). It holds the trigger for guns.', touch: 'Tap AUTO to toggle auto-shoot.',
    why: 'Handy with the staff and rapid-fire guns: you aim, it keeps firing.' },
  { id: 'firstperson', chapter: 1, event: 'firstPerson', need: 1, title: 'First-person view', desktopOnly: true,
    hint: 'Press 0 to look through your own eyes. W walks where you look. Press 0 or Esc to come back.', touch: '',
    why: 'Every weapon aims at the crosshair in first person, which helps for long shots and diving.' },

  // --- Gear ---
  { id: 'chest', chapter: 2, event: 'chest', need: 1, title: 'Open a chest',
    hint: 'A free cooler appeared. Stand next to it and press F.', touch: 'Stand next to the cooler and tap CHEST.',
    why: 'Chests cost crystals (more each time) and give a weapon, ability or pet you do not have yet. Bosses leave a free one.' },
  { id: 'ability', chapter: 2, event: 'ability', need: 1, title: 'Use an ability',
    hint: 'You got Shockwave. Press Q to blast everything near you.', touch: 'Tap the Shockwave slot to use it.',
    why: 'Abilities go on Q Z X C V in the order you find them, each with a cooldown shown on its slot.' },
  { id: 'powerup', chapter: 2, event: 'powerup', need: 1, title: 'Pick up a power-up',
    hint: 'A glowing power-up is lying on the deck. Walk over it.', touch: 'Walk over the glowing power-up.',
    why: 'Power-ups are passive perks (speed, damage, crystals...). They appear every 16-28 seconds during a run.' },
  { id: 'loadout', chapter: 2, event: 'loadout', need: 1, title: 'Open the power-up menu',
    hint: 'Press Tab to open the power-up menu (it pauses the game). Press Tab again to close it.', touch: 'Tap MENU to open the power-up menu.',
    why: 'Only 3 power-ups can be on at once. Click one to switch it on or off.' },
  { id: 'pet', chapter: 2, event: 'kill', need: 2, title: 'Fight with a pet',
    hint: 'Ember the fox has joined you. Pop two jellies together; Ember runs out to bite anything in sight.', touch: 'Pop two jellies; Ember runs out to bite anything in sight.',
    why: 'You carry one pet. Each fights its own way (biters, zappers, bombs, healers, dragons...). Level them up with banked crystals.' },

  // --- Enemies ---
  { id: 'mirror', chapter: 3, event: 'kill', target: 'mirror', need: 1, title: 'Beat a Mirror',
    hint: 'A Mirror holds a shield up front that bounces your shots back. Get behind it, or crack the glass with 4 hits.', touch: 'Get behind the Mirror, or crack its glass with 4 hits.',
    why: 'New enemy types join as the waves go on, each with its own trick: lobbed poison, orb fans, splitting, blinking, burrowing, stealing crystals...' },
  { id: 'bloater', chapter: 3, event: 'kill', target: 'bloater', need: 1, title: 'Beat a Bloater',
    hint: 'It keeps its distance and lobs poison where you are heading. Keep moving and dodge the puddles.', touch: 'Keep moving, dodge the puddles, and pop it.',
    why: 'Ranged enemies lead their shots, so changing direction is better than running in a straight line.' },
  { id: 'boss', chapter: 3, event: 'bossKill', need: 1, title: 'Beat a boss',
    hint: 'Mega Blobbo is here. Watch for the red ring before a slam, and dodge its orbs. At half health it throws up a shield: beat its minions to drop it.', touch: 'Dodge the red slam ring and its orbs. Beat the minions to drop its shield.',
    why: 'Bosses arrive every few waves with special moves and a signature attack. At half health they enrage. Beating one moves you to a new place.' },

  // --- The big picture (read, then Continue) ---
  { id: 'waves', chapter: 4, event: 'next', need: 1, read: true, title: 'Waves and score',
    hint: 'A real run is endless waves of monsters, each wave bigger than the last. Clearing a wave scores a bonus and heals you a little. One wave, then a boss; two waves, then a boss; and so on. Each boss is tougher than the last. Lose all your HP and the run ends (R restarts). Your best score and wave are saved.' },
  { id: 'hub', chapter: 4, event: 'next', need: 1, read: true, title: 'Between runs',
    hint: 'Banked crystals (T) stay on this device. On the start card, "Skills & Loadout" opens the hub: the skill tree (more HP, damage, slots...), power-up upgrades, your starting pet and pet levels. J opens the Gunsmith for rifle scopes and ammo, N the Dragon Den for dragon pets.' },
  { id: 'modes', chapter: 4, event: 'next', need: 1, read: true, title: 'Places to play',
    hint: 'Normal run: the resort sundeck, then a new place after each boss (some are water rooms where Shift dives). The Wilds (O): a huge open world with villages, quests and landmarks. The Labyrinth (K): three maze floors with spike traps. The Sandbox (B): spawn anything and try every weapon. M mutes, a gamepad works too.' },
]

export const createTutorial = () => ({ step: 0, progress: 0 })

export const tutorialDone = (state) => state.step >= TUTORIAL_STEPS.length
export const currentStep = (state) => TUTORIAL_STEPS[state.step] ?? null

// Feeds one event ({ type, amount?, target? }) into the tutorial; returns the new state and
// whether a step was just completed.
export function advanceTutorial(state, event) {
  const step = currentStep(state)
  if (!step || step.event !== event.type) return { state, completed: false }
  if (step.target && step.target !== event.target) return { state, completed: false }
  const progress = state.progress + (event.amount ?? 1)
  if (progress >= step.need) return { state: { step: state.step + 1, progress: 0 }, completed: true }
  return { state: { ...state, progress }, completed: false }
}

// Moves straight past the current step (the panel's Skip button, or a desktop-only step on touch).
export function skipTutorialStep(state) {
  if (tutorialDone(state)) return state
  return { step: state.step + 1, progress: 0 }
}
