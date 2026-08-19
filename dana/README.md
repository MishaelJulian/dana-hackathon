# Dana | دانا

**Offline-first, culturally-rooted knowledge sanctuary for youth in blockaded regions**

Rah-āmuz — راه‌آموز ("path-teacher")

## Quick start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

## Project structure

```
dana/
├── index.html              # App shell
├── public/                 # Static assets
│   ├── css/                # Stylesheets
│   │   ├── main.css        # Global styles
│   │   ├── rtl.css         # RTL support
│   │   ├── eink.css        # E-ink reading mode
│   │   └── palace.css      # 3D palace styles
│   ├── fonts/              # Vazirmatn, Sahel
│   ├── icons/              # App icons
│   └── zim/                # ZIM files (not in repo)
├── src/
│   ├── core/               # App bootstrap, router
│   │   ├── app.js          # Main application
│   │   └── router.js       # Client-side routing
│   └── features/           # Feature modules
│       ├── reading/        # E-ink reading plane
│       ├── palace/         # 3D Chahar Bagh
│       ├── hashtiyeh/      # Marginalia engine
│       ├── garden/         # Progress garden
│       ├── jester/         # AI character
│       ├── transfer/       # Local file transfer
│       └── onboarding/     # Future Self quest
├── docs/                   # Documentation
└── scripts/                # Build tooling

# Agent workflow docs (MASTER_FOUNDATION_PROMPT.md, BUILD_GUIDE.md,
# AGENT_PLAYBOOK.md) live in ../docs/internal/ at the repo root — kept
# out of this tree since they're not part of the app itself.
```

## ZIM files

This app reads content from ZIM files (offline Wikipedia archives).

To use with real content:

1. Download a Persian Wikipedia ZIM from [download.kiwix.org](https://download.kiwix.org)
2. Place it in `public/zim/wikipedia_fa_mini.zim`
3. Restart the dev server

## Architecture

- **Frontend:** Vanilla JavaScript (ES modules)
- **Build:** Vite
- **Content:** ZIM/Kiwix (offline Wikipedia)
- **Offline:** Service Workers
- **3D:** Three.js (planned)

## Safety

This project operates under Class A (state threat) and Class B (child protection) safety models. See [`../docs/internal/MASTER_FOUNDATION_PROMPT.md`](../docs/internal/MASTER_FOUNDATION_PROMPT.md) for full constraints.

**No deployment to at-risk users from a hackathon prototype.**

## License

TBD — project is in hackathon phase.
