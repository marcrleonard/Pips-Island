# Handoff notes for agents working on Pip's Island

Read README.md first for the quick start and file layout. This file covers what you need to keep working without
the original conversation: how the code fits together, the rules the art and performance depend on, decisions
the owner already made, and what's next.

## The project and the owner

- A browser game Marc is making for his 7-year-old daughter. Inspirations: *Puffin Rock* (gentle nature, kind
  characters) and *Brambletown*. Cozy, curious, never stressful: no fail states, no timers, no losing.
- Marc is a senior software engineer (Go, Python, JS, video infrastructure). He's technical and busy: keep replies
  short, batch work, skip needless questions and don't end with follow-up questions. He asked for fast iteration
  and light verification: one check for big features, none for small tweaks unless asked.
- Goals he stated: keep it extensible to other adventure stories, keep it reasonably portable to other engines,
  and voice every line (Fish Audio), automated.

## Build and run

```sh
python3 tools/build.py      # -> dist/pips-island.html (single file, ~175 KB)
python3 tools/watch.py      # rebuild on save + serve http://localhost:8000/pips-island.html
```

- Sources are plain scripts concatenated in the order of `tools/order.txt` inside one IIFE. Every file shares one
  scope. Function declarations hoist, but top-level `const`/`let` and code that runs at load must come after
  what it uses, so keep the order.
- The build embeds `story.json`, `script.json`, `cast.json` and `audio/manifest.json` as the constants `STORY`,
  `SCRIPT`, `CAST` and `AUDIO_MANIFEST`.
- `#day2` on the URL starts on Day 2 (testing shortcut, handled in `src/engine/boot.js`).
- The published game is a claude.ai artifact made from the bundled file. The audio files are not published with
  it yet, so the artifact uses browser voices.

## Architecture

**State.** One object `S` (created in `stories/pips-island/state.js` `init()`), holding the player, quests, NPCs,
scene, day, dialog and effects. `startDay2()` in `cove.js` rewrites it for Day 2. There is no save yet.

**Scenes.** `S.scene` is `'island'`, `'cave'` (the Burrow) or `'cove'` (Seagrass Cove).
- World sizes: island `W×H` = 2400×1800, cave `CW×CH` = 1600×1200, cove `VW×VH` = 1800×1200.
- `goTo(scene)` fades between scenes. `updateTrans` positions the player per entry point (in `burrow.js`).
- Each scene has its own walkable test (`walkable`, `caveWalkable`, `coveWalkable`), update and draw functions.

**Quests.** `story.json` `quests[]` gives order, day, owner (NPC id), HUD label and goal. Quest state lives in
`S.quests[id] = { state:'new'|'active'|'done', ...counters }`. The logic is in `stories/pips-island/quests.js`:
- `talk(npc)` (Day 1) and `talkDay2(npc)`.
- Bramble the Owl drip-feeds one hint at a time (`owl.hint.<quest>`), then reminders.
- Whoever is helped last that day adds `<speaker>.gotell`, sending Pip back to Bramble, whose end conversation
  triggers `startEnding()`, the end card and Day 2.
- **Early finds:** picking something up before its quest starts calls `earlyFind()` (in `cove.js`). Pip thinks out
  loud and the owner gets a "!" marker.
- NPC markers come from `npcMarker()` in `art-island.js`.

**Dialog and voices.** `speak(ids, after)` in `src/engine/dialog.js` takes one conversation id or a list. Lists are
concatenated, and falsy entries are skipped, so `speak(['hog.thanks', goTell('hog')])` works.
- Each line can show an item picture (`item: {k, n}`, art in `story.json` `items`).
- `voiceLine()` in `src/engine/audio.js` plays `audio/voice/<speaker>/<id>.mp3` if the manifest lists it, otherwise
  `speechSynthesis` with pitch and rate from `cast.json`.
- Never put spoken words in code. Add them to `script.json` with a new id and a `direction`.

**Pathfinding.** `src/engine/pathfinding.js`: grid A* (20 px cells) over the scene's walkable function, string-pulled
into waypoints, with steering around obstacles. Grids are cached per scene (the cave per dig stage). Clear them with
`for (const k in grids) delete grids[k]` when walkable areas change.

**Camera.** `update()` in `update.js` frames Pip between the HUD and the dialog card while someone is talking, and
eases smoothly. It can lean past world edges so the text box never covers Pip.

## The art style and its performance rules

Look: soft 2.5D. Rounded volumes lit from the upper left, long soft shadows to the lower right, a warm golden-hour
grade, faint paper grain, no outlines. Reference renders and the tuning lab are in `tools/art-lab/`
(`lab.html` = sliders, `speed.html` = real-time proof, `render.html` = still renderer). Marc approved this look. He
asked for **no depth of field** and **fog only in the rain mood**. Dusk (lantern light, fireflies) and rain are
planned as the evening and weather looks.

How it works (`src/render/style.js`):
- **Auto-shaded shapes.** Inside a sprite, `circ()` and `ell()` with a plain `#rrggbb` fill are drawn as lit volumes,
  so you get the look for free when drawing characters out of circles and ellipses. `rgba(...)` fills stay flat. In
  baked ground only small shapes (radius ≤ 26) are shaded, so land masses stay flat.
- **`cached(key, x, y, box, fn, {shadow, h})`** draws a static prop once into its own image, then stamps it. Include
  any state that changes its look in the key (for example `'house'+S.quests.berry.state`).
- **`styled(x, y, box, fn, {key, fps, shadow, h})`** draws animated things. With `key`, the pose image is reused until
  the animation clock ticks (`fps`, default 15). Always pass a key for anything drawn every frame.
- **`shadow(x, y, rx, h)`** gives a contact shadow plus a directional cast shadow; `h` is how tall the object stands.
- **`bakedGround(key, w, h, drawFn, {transparent})`** draws a scene's still ground once into one image, capped at about
  12 megapixels for phone memory, with grain and grade applied. `blitGround` stamps the visible part. Keys include
  what changes the ground (`'island:'+S.day`, `'cave:'+digStage()`). `clearGround()` runs on new game and new day.
- **Cove layers.** A baked backdrop, then the live tide shoreline (wet sand that grows and shrinks), then a baked
  transparent top layer (dry sand, dock).
- **Cave darkness.** Drawn at half resolution each frame (`drawFog` in `burrow.js`).
- **`LOOK`** is set per scene in `draw()`: `LOOK_DAY` for island and cove, `LOOK_CAVE` with no grade.

Rules that keep it at 60 fps (measured about 16.7 ms a frame in every scene, desktop and phone sizes, in headless
Chrome without a GPU):
1. No full-screen blend modes, blur filters or per-pixel work every frame. Bake them.
2. Anything static goes into baked ground or a `cached` sprite.
3. Anything animated goes through `styled` with a `key`.
4. Big per-frame loops (thousands of strokes) belong in bakes, not frames.

## Testing recipe

Headless Chromium plus Playwright works in a sandbox. Expose state for tests by appending this after
`resize(); init(); requestAnimationFrame(frame);` in a copy of the built file:

```js
window.__d = { get S(){ return S; }, goTo, talk, setGoal, digStage, tideH, findPath, caveWalkable, startDay2 };
```

Then:
- Click `#start` to begin. Move Pip by setting `S.player.x/y` or calling `setGoal(x, y)`.
- Advance dialog by clicking `#dialog`. Read `#line` to check text.
- Set `S.npcs.forEach(n => n.near = true)` to stop characters auto-talking while you inspect.
- Measure frame time with a 90-frame `requestAnimationFrame` loop.

Gotcha: walking past an NPC starts a conversation and stops Pip by design. A test that walks across the map should
move NPCs away or pre-set `near`.

## Decisions already made (don't undo without asking)

- **Bramble:** never lists every task. He gives one hint at a time, says "come back any time", and the last friend
  helped says "go back and tell Bramble".
- **Early finds:** things can be collected before their quest starts. Pip comments and the owner gets a "!".
- **Dialog box:**
  - shows a picture of the item being discussed, with a ×count;
  - "Tap to continue" has a nudging arrow, which becomes a check on the last line;
  - the camera keeps Pip clear of the box.
- **Day 1 → Day 2:** after the lantern light show, Digby gives Pip a lantern and starts digging toward the sea. On Day 2
  his tunnel opens into Seagrass Cove.
- **Day 2 on the island:**
  - Mama Duck swims with the bigger ducklings;
  - Hazel has a picnic breakfast;
  - Grandpa Crab wears his shell;
  - Fern practises a sea song.
- **Glowcaps:** they must stand out (big, teal, bobbing, ground ring). Decorative cave plants are amber and pink
  sprigs, never mushrooms.
- **Tide pools:** cut-paper boulders. The tide is a wavy waterline creeping up the rocks, and Pip swims below it.
- **Wording:** "what a kind day" was cut as awkward. Keep the writing plain, warm and short. A 7-year-old hears it.

## What's next (rough priority)

1. **Voices:** pick Fish Audio voices per character, run `tools/fish_tts.py`, and publish the audio alongside the
   game, or switch to serving the `dist/` folder.
2. **Save progress:** at least which day you've reached, in `localStorage` with try/catch.
3. **Day 3, Puffin Isle:** Captain Puff's boat sails there (already teased in Day 2's ending).
4. **Evening looks:**
   - dusk grade for each day's picnic ending (a second baked ground with `LOOK_DUSK`, plus the lantern and window
     glows from `tools/art-lab/speed.html`);
   - rain as a weather day.
5. **Engine extraction:** move NPC homes and positions, scene layouts and HUD rows into story data, so a new story is
   mostly JSON plus scene art. Consider real ES modules instead of the shared-scope bundle.
6. **Hand-drawn art:** a hand-drawn Pip as a test. `drawOtter` is the single place to swap in an image or sprite sheet.

## Live artifacts (claude.ai, owner: Marc)

- Game: https://claude.ai/artifact/FgyngSp4wdZqYBNt8zHogM
- Art lab: https://claude.ai/artifact/W18kAtm8iX2dLwGotMe8wb
- Speed test: https://claude.ai/artifact/TNC2xjec7c8U9K4MtSsSDM
