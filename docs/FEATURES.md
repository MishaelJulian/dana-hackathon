# Dana — Feature Tour

Dana (دانا, "wise" or "knowing") is an offline-first Persian learning app shaped as a 3D Mind Palace: a walkable courtyard where each room holds a course. Inside, children read real curated Persian articles in a dedicated e-ink mode, get tested by a character who is confidently, catchably wrong, and watch a garden grow as proof of what they've done.

Screenshots below are taken directly from the running alpha build, not mockups.

## 00: General / Onboarding

A fully client-side web app: Vite build, vanilla JavaScript, no framework. No server, no accounts, no login. Anonymous by design, not by shortcut, because a named account is a liability on a device that could be seized. Persian and English toggle freely, right-to-left and left-to-right both handled properly, dark mode included, all of it saved locally. Onboarding runs as an eight-step "Future Self" story that builds the child's first Mind Palace room.

## 10: Reading / E-ink

![E-ink reading mode — Alpha Stage](../assets/screenshots/reading.png)

*Dana's e-ink reading view. Alpha Stage.*

A high-contrast, monochrome mode built for right-to-left Persian text, on the low-end, sometimes-cracked screens this hardware actually has. That's a legibility decision, not a decorative one. Content today is curated Persian articles. The honest gap: real Persian Wikipedia content, delivered through a ZIM file and a Service Worker (`openzim/javascript-libzim`), is prototyped at small scale, not yet integrated at the full 2.1GB target.

## 20: Palace / 3D

![The Mind Palace — Alpha Stage](../assets/screenshots/palace-2.png)

*Dana's 3D Chahar Bagh courtyard, low-poly and instanced. Alpha Stage.*

A low-poly, procedurally laid-out Chahar Bagh courtyard, rendered in Three.js with instanced meshes to keep the draw-call budget inside what a budget Android GPU can carry, a bloom pass for warmth, and an automatic pause when the tab goes hidden to save battery. Rooms map to courses. Walking between them replaces a file list with a place.

## 30: Jester / Verification

As of the Alpha build, the Jester is a heuristic chatbot, not model-driven, on purpose. A live model is a possible network dependency and a moderation risk, and neither belongs on a device that may have no internet and no adult in the room. Live AI is planned for a future release. He states a confident, false claim tied to the article just read. The child checks it against the text and catches him. This isn't a media-literacy feature bolted onto the app — it's the app's mechanic.

## 40: Hashtiyeh

Offline, peer-to-peer margin notes: text, corrections, questions, an optional sketch, attached to a passage. Export and import both run through QR codes, generated with `qrcode`, scanned with `jsQR`, at error-correction level Q rather than the maximum level H — a deliberate choice matching the real risk on this hardware: a scratched screen, a cheap camera, a code printed and handed around until it's a little worn. No pairing, no Bluetooth handshake, no network, ever. Audio is left out entirely, a safety call: a voice recording is a biometric identifier, and that's a liability on a device that could be seized.

## 50: Garden

A visible, discrete state tied to what a child has completed: their own evidence of progress, shown as growth rather than counted as a percentage.

## 60: Offline Delivery & Sync

The app runs fully offline after the first load, cached by a Service Worker. Distribution beyond a direct download is scoped, not solved. NetFreedom Pioneers' Toosheh satellite service is the most credible path found for reaching a phone with no connection at all — that conversation is open, not closed.

## Roadmap

- Offline PWA — live, current form.
- Android APK — in progress, via Capacitor, with native NFC/BLE local transfer and deeper 3D work planned.
- Live AI Jester — planned for a future release, replacing the current heuristic version.
- Full ZIM/Kiwix integration at the 2.1GB Persian Wikipedia target.

Full context: written proposal submitted to the UNESCO MIL Youth Hackathon 2026.
