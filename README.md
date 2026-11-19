# Boxophone — Browser Musical Instrument Studio

**Boxophone by Buildiful®** is a free, ad-free, open-source musical instrument app that runs in your browser. It brings the essentials of the Raspberry Pi Boxophone experience to computers, tablets, and phones.

**Live functionality:** Grand Piano (Violin and Alto Saxophone are displayed but disabled until their timbres are ready), dynamic MIDI velocity, mouse/touch/computer-keyboard input, Web MIDI input with independently transposed first and second controllers (plus additional class-compliant devices), sustain, volume, a small practice challenge, demo playback, note recording and Standard MIDI File export.

No account, install, package manager, server, API key, remote sound library, or audio upload is needed. Synthesis is local Web Audio; exported files are generated locally.

## Quick start

Open `index.html` to use keyboard, mouse, or touch inputs (Google Analytics will not load from a local `file://` URL). For USB MIDI, use a secure origin (GitHub Pages over HTTPS, or `http://localhost`). For local preview, from the extracted folder run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. For the best USB MIDI experience, use the current desktop Chrome or Edge and click **Connect MIDI**, then allow permission. Safari supports the other inputs but does not natively support Web MIDI. USB MIDI is not guaranteed on mobile browsers. Connect devices **to the computer or compatible device hosting the browser**, not to the hosting server.

## USB MIDI controllers

The MIDI section assigns the first connected controller as **Low** and the second as **High**. The default ranges are C3 and C5, respectively, matching the common factory C3 start of the nanoKEY2. Adjust the two ranges to suit the connected keyboards. **Swap low / high controllers** reverses the assignments. Each incoming note retains its original MIDI note number for reliable note-off even when octaves are changed. Korg's physical OCT buttons shift the MIDI notes independently of this app, so either approach works.

Use **Independent octave ranges** to turn this transpose mapping on or off. With independent ranges off, the app plays each incoming MIDI note at its original pitch.

**Note:** These settings are for note ranges, not channel/port routing. You can also use one nanoKEY2 or other class-compliant USB MIDI controllers. The first two inputs get configurable octave assignments; further MIDI keyboards use their original pitches. No System Exclusive permissions are requested.

## Computer keyboard

- Press number keys `1`–`7` (or the numeric keypad) to choose the octave. For example, `4` selects octave 4.
- Press `A`, `B`, `C`, `D`, `E`, `F`, or `G` to play that natural note at the chosen octave. For example, `4` then `C` plays C4, while `4` then `A` plays A4. Hold a letter to sustain its note and release it to stop.
- Press `[` and `]` to step down or up one octave. Hold `Space` for sustain, or use the on-screen Sustain toggle.
- Mouse and touch play all white and black keys, including sharps and flats. Multi-touch is supported; dragging from one key to another changes pitch. Two octaves are shown on larger screens and one octave on phones.
- The octave choice is intentionally limited to `1`–`7`, covering the practical piano register while keeping A–G playable as real MIDI notes.
- **All notes off** stops any stuck notes immediately. These shortcuts are disabled when typing in input fields or selecting menu items.

The browser edition currently offers **Grand Piano only**. Violin and Alto Saxophone are deliberately greyed out and unavailable until each has a convincingly distinct timbre. Grand Piano uses custom procedural Web Audio synthesis rather than the Pi edition's FluidSynth + FluidR3 sound bank and supports polyphony. Sound quality, latency, and MIDI permissions depend on device and browser; please test with the intended speakers and controllers before an event or public performance.

## MIDI recording

Click **Record**, play the notes, then click **Stop** and **Export MIDI**. The exported `.mid` is a valid Standard MIDI File (format 0) with note on/off messages, sustain, and the General MIDI program change for Piano (0). This exports editable MIDI events, **not audio**. Timing resolution is 480 PPQ at 120 BPM. The file can be opened in compatible DAWs and music-notation tools; exact timbre depends on that program's synthesizer.

## Mini practice

Choose from the public-domain melodies Twinkle, Twinkle, Little Star; Ode to Joy; or Frère Jacques. Play the displayed target note in order to advance. You can practice with either a computer keyboard, mouse/touch, or a MIDI controller. Practice progress is session-only.

## Deployment (GitHub Pages)

No build step required. Commit this folder's **contents** as the root of a standalone `boxophone` repository, choose **Settings → Pages → Deploy from a branch → main / (root)**, and wait for Pages publication. The expected project site for a repository in the Buildiful GitHub organization is `https://buildiful.github.io/boxophone/` when project Pages is enabled. Alternatively, copy this entire folder into an existing Pages site as `/boxophone/`.

The footer’s GitHub link points to `https://github.com/Buildiful/boxophone`. Keep `.nojekyll`, and avoid placing the entire release ZIP itself in the public repository. Updating the application does not require running a Node build system.

### Brand assets

The site references the **existing official Buildiful® logo and unified favicon set** from `https://buildiful.github.io/assets/`, verified against the official homepage repository. This means the official image stays synchronized with existing tools, but requires that published Buildiful site to remain available. If a fully self-contained deployment is desired, download those five files from the Buildiful homepage `assets/` directory and replace their absolute URLs in `index.html` with paths under this repository's `assets/`. See `docs/BRAND_ASSETS.md`. The dedicated Boxophone tool icon in `assets/` is part of this pack.

## Analytics and privacy

The shared GA4 measurement ID `G-TG14RBXLTF` is configured with an **explicit opt-in** banner. Declining Analytics prevents `gtag.js` from loading. The browser stores the visitor's choice (and a timestamp) across paths on the same origin. With consent, only coarse interactions are tracked, never raw note sequences, recording content, or hardware identifiers. See [privacy.html](privacy.html) and `docs/QA_CHECKLIST.md`.

## Project files

- `index.html`, `styles.css` — responsive UI.
- `src/audio.js` — custom Web Audio instrument synthesizer (no soundfont dependencies).
- `src/midi.js` — multi-input Web MIDI access, note/CC mapping, hot-plug handling.
- `src/recorder.js` — in-browser Standard MIDI File export.
- `src/app.js` — UI, computer/touch controls, demo, practice.
- `buildiful-analytics-consent.js` — permission-first GA4 integration.
- `assets/boxophone-tool-icon.svg`, `assets/boxophone-tool-icon-256.png` — editable and raster tool icons.
- `privacy.html`, `LICENSE`, `TRADEMARKS.md`, `CONTRIBUTING.md`, `docs/QA_CHECKLIST.md` — public-release documents.

## License

The original source code and original Boxophone tool icon are MIT licensed. The Buildiful® name, official logo, and trademarks are excluded from this license. See `LICENSE` and `TRADEMARKS.md`.

Built by Buildiful®.
