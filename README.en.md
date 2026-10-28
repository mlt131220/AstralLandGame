<p align="center">
  <img src="public/og.jpg" alt="Astral Land" width="760">
</p>

<h1 align="center">Astral Land</h1>

<p align="center">
  Run a four-season farm in your browser: grow crops, fish, explore the mines, celebrate festivals,<br>
  and rebuild the valley together with sixteen neighbours.<br>
  No install needed. Play on desktop, phone or gamepad, even offline.
</p>

<p align="center"><a href="README.md">中文</a> | English</p>

---

## About the game

A letter arrives from Astral Valley: an overgrown farm is now yours to look after. Clear the land, plant, water, harvest and ship your crops. Meet the townsfolk and join their festivals. Forage in the woods and head down into the mines. Then, together with the villagers, repair the sluice gate, the Woods Bridge, the waystation and the greenhouse, and get the old windmill on the highland turning again. When the main story ends, write the life you want in the wish book and keep on farming.

The game uses the [Three.js](https://threejs.org/) WebGPU renderer: low-poly 3D, an isometric 45-degree camera, and a wooden parchment-style UI.

## Features

- **Four-season farming**: 28 crops; clear, plant, water, harvest and ship. Copper-tier hoes and watering cans charge up to work several tiles at once, and sprinklers and the greenhouse let the farm keep growing.
- **A living world**: a day and night cycle with street lamps that light up at dusk; raindrops splash on the soil and ripple across the river; snow in winter and thunderstorms on summer nights.
- **16 villagers**: each has their own schedule, gift tastes and three friendship events. Talk, give gifts and take on their requests.
- **8 festivals**: the Flower Fair, Riverside Fishing Day, Long Day Picnic, Firefly Lantern Night, Field Market, Harvest Helping Day, Snow Craft Fair and Hearthside Thanks Night, each with its own mini-game.
- **Adventure**: a fishing mini-game, foraging in the woods and wetland, a 30-floor mine (Mossy Shallows, Old Iron Mine, Frost Crystal Depths) with 3 boss fights, and three weapon types: sword, spear and bow.
- **Farm life**: chickens, ducks, rabbits, cows, sheep and goats; more than ten processing machines such as the furnace, drying rack and jam pot; over twenty dishes to cook. Decorate your home, change outfits, and adopt a cat or a dog.
- **Rebuild the valley**: a 24-chapter main story in which you complete five public works with the villagers (sluice gate, Woods Bridge, waystation, greenhouse and windmill), then hold the windmill ceremony and the long-table feast.
- **Play anywhere**: runs straight in the browser; supports phone touch controls (tap where to go, tap what to use), gamepads and offline play; Chinese and English.

## Screenshots

| | |
| --- | --- |
| ![Farm](docs/images/farm.jpg) | ![Summer storm](docs/images/storm.jpg) |
| A well-established farm | A summer thunderstorm: raindrops splash and the pond ripples |
| ![Town at night](docs/images/town-night.jpg) | ![Firefly Lantern Night](docs/images/festival.jpg) |
| Street lamps in town after dark | The Firefly Lantern Night festival: lanterns on the river |
| ![Mine](docs/images/mine.jpg) | ![Windmill](docs/images/windmill.jpg) |
| The Frost Crystal Depths | The rebuilt windmill and its ceremony |
| ![Villagers](docs/images/menu.jpg) | ![Phone](docs/images/phone.jpg) |
| The villagers page in the menu | Touch controls on a phone in landscape |

## Getting started

### Browser requirements

The game needs a browser with **WebGPU**:

- Desktop: the latest Chrome or Edge (recommended), or Safari 26 and later. Firefox has WebGPU enabled on some platforms only.
- Phones and tablets: the latest Chrome on Android, or Safari 26 and later on iPhone and iPad. Please play in landscape.
- Hardware acceleration must be turned on in the browser. If the game can't start, the title screen tells you whether the browser lacks WebGPU, the graphics card couldn't be used, or loading failed.

### Saves and privacy

- No account is needed. Saves live only in your own browser and are written every 30 seconds, when you change area and when you go to sleep. You can export a save file from the pause menu and import it on the title screen.
- After the first visit, the game downloads its full asset pack into the browser cache in the background, so you can play offline afterwards.
- The game collects no personal data. See the [privacy notice](public/privacy-en.html).

### Test saves

To jump straight into mid- and late-game content, use the saves in this repository: click Play on the title screen, then "Import save file" below the save list, and pick one of these files. The game has 3 save slots, and an import takes an empty one.

| Save | What's in it |
| --- | --- |
| [`summer-firefly-night.json`](public/saves/summer-firefly-night.json) | Year 1, Summer 22: the Firefly Lantern Night festival (opens at 18:00 on the riverbank) |
| [`mine-floor-25.json`](public/saves/mine-floor-25.json) | Year 2, Spring 15: the mine is explored to floor 29, the lift reaches floor 25, and the floor-30 boss is still waiting |
| [`windmill-ceremony.json`](public/saves/windmill-ceremony.json) | Year 2, Spring 23: the windmill is rebuilt and its ceremony is held on the highland today (entry 10:00–17:00) |
| [`full-farm.json`](public/saves/full-farm.json) | A farm packed with crops, machines and animals, for performance testing |

## Controls

| Action | Keyboard and mouse | Gamepad (Xbox layout) | Phone touch |
| --- | --- | --- | --- |
| Move | WASD, Shift to sprint | Left stick / D-pad, RT to sprint | Tap the ground to walk there; hold and drag to walk toward your finger |
| Use tool or item | Left mouse button (hold to charge) | A (hold to charge) | Tap a crop, rock, tree or other target to walk over and use it; hold on a nearby target to charge |
| Interact (talk, doors, shops) | F | X | Tap a person, door, counter or machine |
| Walk to a tile | Right-click the tile | — | Tap the ground |
| Pick hotbar slot | Number keys 1–0 | LB / RB | Tap a hotbar slot |
| Eat | E | — | Select food, then tap "Eat" |
| Roll | Space | LT | "Roll" button |
| Menus | B bag, K skills, L quests, P villagers, N farm, C crafting, M map | Y bag, Back map | "Menu" button |
| Camera | Q / R rotate 90°, mouse wheel to zoom | Right stick | Pinch to zoom, rotate buttons |
| Pause | Esc | Start | "Pause" button |

Press H in game (or open Controls from the pause menu) to see these at any time.

## Development

### Requirements

- [Node.js](https://nodejs.org/) 23.6 or later (the tests run TypeScript files directly with Node)
- [pnpm](https://pnpm.io/) 10
- A browser with WebGPU

### Commands

```bash
pnpm install      # install dependencies
pnpm dev          # dev server at http://localhost:5173
pnpm test         # rule and content checks (9 test suites)
pnpm build        # type-check and production build into dist/
pnpm preview      # preview the production build at http://localhost:4173
```

### Project layout

```text
src/
  core/       Domain layer: state, rules, quests, combat, save migration (no Three.js or DOM, so it runs in Node tests)
  content/    Content data: crops, items, villagers, quests, festivals, and the i18n dictionaries
  render/     Three.js WebGPU rendering: scenes, models, character animation, weather particles
  ui/         Vue 3 interface: HUD, menus, dialogue, shops, festival mini-games
  platform/   Browser platform: saves, offline pack, audio, gamepad, touch, settings
  game.ts     Main game loop and input
public/       Runtime assets (models, icons, audio, font), the service worker, privacy notices, test saves
scripts/      Dev scripts (translation check)
docs/         Screenshots and the asset licence ledger
```

### Tests

`pnpm test` covers farming and economy rules, whether every quest chain can be completed, save round-trips and migration, offline-pack updates and rollback, and complete English translations. When a translation check fails, `node scripts/i18n-scan.mjs` lists missing entries, unused keys and Chinese literals left in source.

Debugging: add `?perf` to the URL (not needed in dev mode) and use `astral()` in the browser console to read and change the game state, for example `astral().s.min = 1080` to set the clock to 18:00.

### Localization

All UI text goes through `t('area.name', params)` (`src/core/i18n.ts`). Chinese strings live in `src/content/i18n/zh.json` and English in `en.json`, both with the same keys; English for content data is keyed by id under `src/content/i18n/en/`. New text must be added in both languages, or `pnpm test` fails.

## Build and deploy

`pnpm build` produces static files in `dist/` that any static host can serve (GitHub Pages, Cloudflare Pages, Netlify, Nginx and so on):

- Serve over **HTTPS**: WebGPU and service workers both require a secure context.
- Deploy at the domain root, since assets use absolute `/assets/...` paths.
- Don't cache `sw.js` or `offline-manifest.json` for long; everything else is content-hashed and can be cached long-term.
- The build writes an offline-pack manifest (about 1,700 files, 120 MB) that players download in the background after their first visit. After you publish a new version, players switch to it the next time they open the page, and a page that's already open never mixes old and new assets.

## Art and audio assets

- All models, textures, audio and the font the game needs at runtime are in `public/assets`, so a fresh clone builds and runs.
- The project's own models (buildings, crops, tools, creatures, furniture and more) were generated procedurally with Blender scripts; third-party assets come from Kenney and OpenGameArt.
- The source and licence of every asset is recorded in [`docs/ASSET_LEDGER.md`](docs/ASSET_LEDGER.md).

## Credits

- [Kenney](https://kenney.nl/): 3D models and UI art for scenery, characters, pets and icons (CC0)
- Music and sound effects by SubspaceAudio, Zane Little, cynicmusic, Yoiyami, trex0n, tinyworlds and others on [OpenGameArt](https://opengameart.org/) (CC0)
- [LXGW WenKai](https://github.com/lxgw/LxgwWenKai): UI font (SIL Open Font License 1.1)
- [Three.js](https://threejs.org/), [Vue](https://vuejs.org/), [Vite](https://vite.dev/)

## License

- Code and the project's own assets: [MIT](LICENSE)
- Third-party assets keep their own licences: Kenney and OpenGameArt assets are CC0 1.0, and the LXGW WenKai font is SIL OFL 1.1.
