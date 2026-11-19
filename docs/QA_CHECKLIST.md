# Boxophone public-release QA checklist

## Branding & repository

- [x] Uses bundled official unified Buildiful® header logo supplied with this release.
- [x] Uses bundled official unified Buildiful® favicon files (ICO, 32 px, 16 px, Apple touch) referenced by both app and privacy pages.
- [x] Does not include or reference the yellow Boxophone promotional artwork as an app favicon.
- [x] Includes `.gitignore` and `.nojekyll`.
- [x] MIT source license and explicit trademark exclusion.
- [x] Project comments, metadata, README, filenames, and public-facing UI have no campaign schedule references or numbered release identifiers.
- [x] No secrets, API keys, package dependencies, or third-party sound samples.

## Consent & privacy

- [x] GA4 script is only dynamically loaded after affirmative consent.
- [x] Declining Analytics does not disable music or export.
- [x] Opt-in preference shared across same-origin Buildiful tools.
- [x] Footer Analytics settings lets visitor revisit consent.
- [x] No raw notes, audio, MIDI messages, filenames, or MIDI device names are sent to GA4 events.
- [x] Browser storage is limited to local preferences and analytics consent.

## Browser smoke tests

- [ ] Audition the Grand Piano timbre with headphones on real hardware. Violin and Alto Saxophone are unavailable in this release.
- [ ] Check actual two Korg nanoKEY2 controllers, hotplug, physical sustain, split mapping and swap in Chrome on macOS.
- [ ] Check latency and touch/glissando behavior on an iPhone/iPad and Android device.
- [ ] Check Desktop Chrome and Edge, Firefox keyboard/touch, Safari keyboard/touch.
- [ ] Export `.mid` and open it in at least one external MIDI editor.
- [ ] Check all assets resolve and production Google Analytics consent states on the deployed domain.

The unchecked device tests require physical hardware and cannot be certified from a headless browser environment.

## Updated computer keyboard acceptance tests

- [ ] Number `4` followed by `C` plays C4; `4` followed by `A` plays A4.
- [ ] A, B, C, D, E, F, G each play distinct, correct natural notes in the selected octave.
- [ ] Number keys 1–7 and the numeric keypad select octaves; the visible range label updates.
- [ ] Held and simultaneously pressed letter keys stop cleanly on key release or window blur.
- [ ] Keyboard shortcuts do not trigger while a select, input or editable control has focus.
- [ ] Mouse and touch continue to play white and black keys; sustain still works.
- [ ] At least two USB MIDI keyboards work, and any additional keyboards use their original note pitches.
- [ ] Check enlarged typography and controls at desktop, tablet and narrow mobile widths.

## Automated validation performed for this package

- [x] Chromium DOM interaction test: `4` + `C` → C4, `4` + `A` → A4, `5` + `G` → G5, `1` + `B` → B1, `7` + `F` → F7.
- [x] Help opens and closes and the removed introductory text is absent.
- [x] Responsive layout inspected at 1440, 768, 390 and 320 CSS pixels without document-level horizontal overflow.
- [x] JavaScript syntax checks pass for the application, audio and MIDI modules.
- [x] Simulated MIDI test: three connected devices; distinct offsets for the first two and unchanged pitches for the third.
- [x] Public text audit finds no campaign branding or numbered release references.

These are automated checks. Real instrument sound, hardware MIDI permissions and
mobile touch latency still require manual checks on the intended devices.

## Instrument availability and repository link

- [x] Violin and Alto Saxophone visible but natively disabled, with a clear “Coming soon” label.
- [x] Keyboard, saved preferences and code paths cannot select disabled instruments.
- [x] MIDI export remains Piano (GM program 0).
- [x] Footer GitHub link targets `https://github.com/Buildiful/boxophone`.
