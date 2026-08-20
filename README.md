# Dana | دانا

**An Offline 3D Mind Palace for Persian Media Literacy**

> Dana (دانا, "wise") is an offline app for children cut off by Iran's blackout, built as a walkable 3D Mind Palace. Children cross a Chahar Bagh, a Persian courtyard rendered in Three.js with girih tilework and muqarnas detail, light enough for a $100 Android phone with 2GB RAM. Six rooms hold six courses, opening a real Persian article and a scripted Jester who states confident false claims a child must catch. Everything runs offline after first load: no account, no server, no login.

Status: Alpha prototype, working demo
Offline PWA — live · Android APK — in progress

[![CodeQL](https://github.com/MishaelJulian/dana-hackathon/workflows/CodeQL/badge.svg)](https://github.com/MishaelJulian/dana-hackathon/actions/workflows/codeql.yml)
[![License: TBD](https://img.shields.io/badge/license-TBD-lightgrey)](#license)

Live demo:

| | |
|---|---|
| ![The Mind Palace — Alpha Stage](assets/screenshots/palace-2.png) | ![E-ink reading mode — Alpha Stage](assets/screenshots/article.png) |
| *Chahar Bagh courtyard — Alpha Stage* | *E-ink reading mode — Alpha Stage* |

## Quick start

```bash
cd dana
npm install
npm run dev
# http://localhost:3000
```

Full feature tour: [`docs/FEATURES.md`](docs/FEATURES.md)

## Dev / CLI reference

No CLI — Dana is a client-side web app (Vite + vanilla JavaScript, no framework). Standard scripts, run from `dana/`:

```bash
npm run dev      # dev server
npm run build    # production build
```

See [`dana/README.md`](dana/README.md) for project structure and ZIM/Kiwix setup.

## License

TBD — project is in hackathon phase.
