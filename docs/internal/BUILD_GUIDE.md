# BUILD_GUIDE.md — Engineering Operating Manual

**Dana / Pardis Project**
**Version:** 1.0 · **Date:** 24 Jul 2026
**Supersedes:** Nothing. This document is engineering-only. Philosophy, vision, curriculum, and the Jester live in `MASTER_FOUNDATION_PROMPT.md`. Read that first. Never rewrite it here.

---

# 1. Engineering philosophy

## 1.1 Values

| Value | Meaning |
|---|---|
| **Offline-first** | Every feature works without connectivity. Connectivity is additive, never a precondition. |
| **Security-first** | Class A and Class B threat models apply to every data decision. Safety is not a feature. |
| **Accessibility-first** | The E-ink plane is a complete path through all content. The 3D layer is skippable, never the only way. |
| **Simplicity over cleverness** | The simplest working solution ships. Clever solutions are reviewed twice. |
| **Deterministic behaviour** | Every UI state is predictable. No randomised triggers, no surprise animations, no autoplay. |
| **Maintainability** | Code is read more than it is written. Optimise for the reader, not the writer. |
| **Modularity** | Content, presentation, and delivery are independent. One can fail without the others. |

## 1.2 How engineering decisions are evaluated

Every decision passes this filter, in order:

1. **Does it run on 2GB Android Go?** If no, it doesn't ship.
2. **Does it work offline?** If no, is it strictly additive and never a precondition?
3. **Does it create Class A or Class B risk?** If yes, the risk is resolved before the feature ships.
4. **Can two people build it in 15 days (in intermediate form)?** If no, it's Phase 2.
5. **Is it the simplest solution?** If no, justify the complexity.

---

# 2. Repository structure

```
dana/
├── apps/
│   ├── mobile/                  # Flutter app (Android target)
│   │   ├── lib/
│   │   │   ├── app/             # App shell, routing, theme
│   │   │   ├── core/            # Shared utilities, constants, config
│   │   │   ├── features/        # Feature modules (one folder per feature)
│   │   │   │   ├── reading/     # E-ink reading plane
│   │   │   │   ├── palace/      # 3D Chahar Bagh Mind Palace
│   │   │   │   ├── hashtiyeh/   # Marginalia overlay engine
│   │   │   │   ├── garden/      # Progress garden
│   │   │   │   ├── onboarding/  # Future Self quest
│   │   │   │   ├── jester/      # Scripted Jester encounters
│   │   │   │   └── transfer/    # Local file transfer (Wi-Fi Direct / BLE / QR)
│   │   │   ├── l10n/            # Localization files (Persian, Azeri, Kurdish, Balochi, Dari)
│   │   │   └── main.dart
│   │   ├── assets/
│   │   │   ├── fonts/           # Vazirmatn, Sahel
│   │   │   ├── images/          # Static sprites, icons
│   │   │   └── shaders/         # Procedural shader files
│   │   ├── test/
│   │   ├── android/
│   │   ├── pubspec.yaml
│   │   └── README.md
│   │
│   └── web/                     # Showcase website (Next.js / Vercel)
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── README.md
│
├── packages/
│   ├── core/                    # Shared Dart packages (models, utils, constants)
│   ├── zim_reader/              # ZIM/Kiwix integration layer
│   ├── hashtiyeh_engine/        # .hash overlay format + read/write/merge
│   ├── security/                # Crypto primitives, key management, metadata scrubbing
│   └── transfer/                # Wi-Fi Direct / BLE / QR transfer protocol
│
├── unity/                       # Unity project (3D palace)
│   ├── Assets/
│   │   ├── Scenes/
│   │   ├── Scripts/
│   │   ├── Prefabs/
│   │   ├── Materials/
│   │   ├── Shaders/
│   │   ├── Textures/
│   │   └── StreamingAssets/     # ZIM files loaded at runtime
│   ├── Packages/
│   └── ProjectSettings/
│
├── docs/                        # Documentation
│   ├── MASTER_FOUNDATION_PROMPT.md
│   ├── BUILD_GUIDE.md           # This file
│   ├── AGENT_PLAYBOOK.md
│   ├── PARDIS_*.md              # Spec files (from Main MD)
│   └── decisions/               # ADRs
│
├── scripts/                     # Build, CI, tooling
│   ├── build/
│   ├── ci/
│   ├── seed/                    # Synthetic data generation for demo
│   └── verify/                  # Automated checks
│
├── .github/
│   └── workflows/               # CI/CD pipelines
│
├── .cursorrules                 # Cursor-specific rules
├── .clinerules                  # Cline-specific rules
├── AI_AGENT.md                    # an AI coding agent project instructions
├── README.md
└── LICENSE
```

## 2.1 What belongs where

| Folder | Contents | Never |
|---|---|---|
| `apps/mobile/lib/features/` | One folder per feature. Each contains: `data/`, `domain/`, `presentation/`. | Business logic in widgets. Networking in presentation layer. |
| `packages/core/` | Models, utilities, constants shared across features. | Feature-specific logic. UI code. |
| `packages/zim_reader/` | ZIM file reading, search, content extraction. | App state. UI rendering. |
| `packages/hashtiyeh_engine/` | `.hash` format: read, write, merge, validate. | Network calls. UI. |
| `packages/security/` | Crypto, key gen, metadata scrubbing. | Business logic. Feature code. |
| `packages/transfer/` | Wi-Fi Direct, BLE, QR transfer. | Content logic. UI. |
| `unity/` | 3D palace: scenes, prefabs, shaders, materials. | App logic. Data models. |
| `docs/` | Documentation, specs, ADRs. | Source code. Build artifacts. |
| `scripts/` | Build, CI, tooling, seed data. | Application code. |

## 2.2 Forbidden contents

Never place in any folder:

- `.env` files with real secrets
- API keys, tokens, or credentials
- Compiled binaries in source control
- `node_modules/`, `build/`, `.dart_tool/`
- User data, database files, or ZIM content in source control
- Screenshots or recordings (use a shared drive)

---

# 3. Coding standards

## 3.1 Languages and versions

| Component | Language | Version |
|---|---|---|
| Mobile app | Dart | 3.4+ |
| Flutter | Flutter | 3.22+ |
| Unity | C# | .NET Standard 2.1 |
| Showcase website | TypeScript | 5.4+ |
| Next.js | Next.js | 14+ |
| Build scripts | Python | 3.12+ |
| CI/CD | YAML | GitHub Actions |

## 3.2 Formatting

- **Dart:** `dart format` enforces all formatting. No exceptions.
- **TypeScript:** Prettier with single quotes, no semicolons, 2-space indent.
- **C#:** Unity default formatting. 4-space indent.
- **Python:** Ruff (line length 88, double quotes).
- **All files:** UTF-8, LF line endings, no BOM. Final newline required.

## 3.3 Comments

- **Why, not what.** Comments explain reasoning, non-obvious constraints, or tradeoffs. They never restate the code.
- **No commented-out code.** Delete it. Git remembers.
- **No TODO without a ticket reference.** `// TODO(T-123): Refactor when X lands.` If there is no ticket, create one.
- **No AI-generated commentary.** "This function does X" is not a comment. Remove it.

## 3.4 Documentation

- **Public APIs:** dartdoc on all public classes and methods. One sentence maximum.
- **Complex algorithms:** inline comment explaining the approach. Link to the ADR if one exists.
- **README per package:** purpose, installation, usage example. Under 50 lines.
- **No standalone design docs in source.** Design lives in `docs/`. Code lives in source.

## 3.5 Error handling

- **Dart:** Use `Result<T, E>` pattern. No swallowed exceptions. Every `catch` either handles or rethrows with context.
- **Unity:** Try-catch around ZIM reads, file I/O, and transfer operations. Log with severity. Never crash silently.
- **Network:** Timeouts on all external calls (10s default, configurable). Retry once, then fail gracefully. Display user-facing message.
- **Offline:** Every feature has a fallback state when data is unavailable. The app never shows a blank screen.

## 3.6 Logging

- **Structured logging only.** JSON format with timestamp, level, component, message.
- **Levels:** `debug` (dev only), `info` (significant events), `warn` (recoverable issues), `error` (needs attention).
- **Never log:** PII, device identifiers, file paths on user storage, encryption keys.
- **Unity:** Use `UnityEngine.Debug.Log` with `[Dana]` prefix. Strip in release builds.

## 3.7 Null handling

- **Dart:** Prefer null safety. Use `?.` and `??` operators. No `!` operator unless the invariant is documented.
- **Unity:** Null checks before every `GetComponent`, `Instantiate`, and `Resources.Load`. Use `TryGetComponent` where available.

## 3.8 Naming

See Section 4 (Naming conventions) for the full table.

## 3.9 File size limits

| File type | Maximum | Action if exceeded |
|---|---|---|
| Dart file | 300 lines | Split into smaller files or extract widgets |
| Dart function | 50 lines | Extract helper functions |
| C# script | 400 lines | Split into component scripts |
| Shader file | 200 lines | Refactor into sub-shaders |
| Test file | 500 lines | Split by test group |
| Config file | 100 lines | Use external config or environment |

## 3.10 Complexity limits

| Metric | Maximum |
|---|---|
| Cyclomatic complexity | 10 per function |
| Nesting depth | 4 levels maximum |
| Function parameters | 5 maximum |
| Import count per file | 15 maximum |
| Widget nesting (Flutter) | 15 levels maximum |

---

# 4. Naming conventions

## 4.1 Dart / Flutter

| Element | Convention | Example |
|---|---|---|
| Variables | camelCase | `articleContent` |
| Functions | camelCase | `loadZimArticle()` |
| Classes | PascalCase | `ZimReader` |
| Enums | PascalCase, values camelCase | `ReadingMode.eink` |
| Constants | camelCase | `maxFileSize` |
| Files | snake_case | `zim_reader.dart` |
| Folders | snake_case | `zim_reader/` |
| Test files | `*_test.dart` | `zim_reader_test.dart` |
| Feature folders | snake_case | `reading/`, `hashtiyeh/` |
| Widget classes | PascalCase, suffix with type | `ArticleCard`, `ReadingScreen` |
| State classes | PascalCase, suffix `State` | `ReadingState` |
| Providers | camelCase, suffix with type | `zimReaderProvider` |
| Routes | kebab-case | `/reading/article-123` |

## 4.2 Unity / C#

| Element | Convention | Example |
|---|---|---|
| Classes | PascalCase | `ChaharBaghRoom` |
| Public methods | PascalCase | `LoadRoom()` |
| Private methods | camelCase with `_` prefix | `_initializeLighting()` |
| Public fields | PascalCase | `RoomName` |
| Private fields | camelCase with `_` prefix | `_meshBudget` |
| Serialised fields | PascalCase with `[SerializeField]` | `[SerializeField] private Material _floorMaterial;` |
| Prefabs | PascalCase, descriptive | `Room_GardenGate.prefab` |
| Scenes | PascalCase | `ChaharBagh_Main.unity` |
| Materials | `m_` prefix | `m_floor_stone.mat` |
| Shaders | `s_` prefix | `s_procedural_girih.shader` |
| Textures | `t_` prefix, resolution suffix | `t_tilework_512.png` |
| Animations | `anim_` prefix | `anim_jester_appear.controller` |

## 4.3 Files and folders

| Type | Convention | Example |
|---|---|---|
| Config files | lowercase with dots | `config.yaml`, `.env.example` |
| Documentation | UPPER_SNAKE for specs, lower for guides | `PARDIS_SAFETY.md`, `build_guide.md` |
| ADRs | `NNN-title.md` | `001-offline-first-architecture.md` |
| Scripts | snake_case | `generate_seed_data.py` |
| Workflows | kebab-case | `ci-test.yml` |

## 4.4 Database

| Element | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `articles`, `hash_overlays` |
| Columns | snake_case | `article_id`, `created_at` |
| Indexes | `idx_` prefix | `idx_articles_zim_path` |
| Primary keys | `id` (auto-increment) | `id INTEGER PRIMARY KEY` |
| Foreign keys | `*_id` | `article_id`, `user_id` |
| Enums (stored as text) | snake_case | `reading_mode`, `transfer_state` |

## 4.5 JSON

| Element | Convention | Example |
|---|---|---|
| Keys | camelCase | `articleId`, `createdAt` |
| Values | match their type | String, number, boolean, null |
| Nested objects | camelCase | `readingProgress` |
| Arrays | camelCase plural | `availableArticles` |

## 4.6 Assets

| Type | Convention | Example |
|---|---|---|
| Images | `img_` prefix, descriptive | `img_hafez_home.png` |
| Icons | `ic_` prefix | `ic_verification.svg` |
| Fonts | Family name, weight suffix | `Vazirmatn-Regular.ttf` |
| Audio | `sfx_` or `amb_` prefix | `sfx_page_turn.wav`, `amb_garden_birds.wav` |
| 3D models | `mdl_` prefix | `mdl_chahar_bagh_room.fbx` |
| Shaders | `s_` prefix | `s_girih_tilework.shader` |

---

# 5. Folder ownership

Every folder has exactly one owner. No overlap.

| Folder | Owner | Responsibility |
|---|---|---|
| `apps/mobile/` | Frontend Engineer | Flutter app, UI, navigation, theming, RTL |
| `apps/web/` | Frontend Engineer | Showcase website, 3D demo, landing page |
| `packages/core/` | Backend Engineer | Models, utilities, constants, config |
| `packages/zim_reader/` | Backend Engineer | ZIM integration, search, content extraction |
| `packages/hashtiyeh_engine/` | Backend Engineer | `.hash` format, read/write/merge |
| `packages/security/` | Security Engineer | Crypto, keys, metadata scrubbing |
| `packages/transfer/` | Backend Engineer | Wi-Fi Direct, BLE, QR transfer |
| `unity/` | Unity Engineer | 3D palace, scenes, prefabs, shaders |
| `docs/` | Tech Lead | Documentation, specs, ADRs |
| `scripts/` | DevOps Engineer | Build, CI, tooling, seed data |
| `.github/` | DevOps Engineer | CI/CD pipelines, workflows |
| `tests/` | QA Engineer | Test suites, device testing |

---

# 6. Architecture rules

## 6.1 Layered architecture (Flutter)

```
presentation/   →  Widgets, screens, UI logic
     ↓
domain/         →  Business logic, use cases, models
     ↓
data/           →  Repository implementations, data sources
     ↓
packages/       →  Shared infrastructure (ZIM, security, transfer)
```

**Dependency direction:** presentation → domain → data → packages. Never reverse. Never lateral between features.

## 6.2 Allowed imports

| From | Allowed imports |
|---|---|
| `presentation/` | `domain/`, `core/`, Flutter packages |
| `domain/` | `core/`, shared models only |
| `data/` | `domain/`, `core/`, relevant `packages/` |
| `core/` | Nothing feature-specific |
| `packages/` | Only `core/` (for models and constants) |

## 6.3 Forbidden imports

- Feature A must never import Feature B.
- `presentation/` must never import `data/` directly.
- `packages/` must never import from `apps/`.
- `unity/` and `flutter/` communicate only through a defined bridge (JSON file or platform channel), never direct imports.

## 6.4 Service boundaries

| Service | Responsibility | Ownership |
|---|---|---|
| `ZimReaderService` | Read articles, search ZIM files | `packages/zim_reader/` |
| `HashOverlayService` | Read/write/merge `.hash` files | `packages/hashtiyeh_engine/` |
| `SecurityService` | Encrypt, decrypt, scrub metadata | `packages/security/` |
| `TransferService` | Send/receive files over local channels | `packages/transfer/` |
| `GardenService` | Track progress, manage garden state | `packages/core/` |
| `JesterService` | Load scripted encounters, manage dialogue state | `packages/core/` |

## 6.5 Data flow

```
ZIM file (offline)
    → ZimReaderService
    → Article model
    → ReadingScreen (E-ink mode)
    → User writes Hashtiyeh
    → HashOverlayService
    → .hash file
    → TransferService
    → Sibling's device
```

No step requires connectivity. No step leaves the device.

## 6.6 State management

- **Flutter:** Riverpod for dependency injection and state. No global mutable state.
- **Unity:** ScriptableObject for configuration. MonoBehaviour for runtime state. No static mutable fields.
- **Cross-platform:** State is serialisable to disk. The app recovers exactly where it stopped on relaunch.

---

# 7. Flutter standards

## 7.1 Widget tree

- **Maximum nesting: 15 levels.** If exceeded, extract sub-widgets.
- **Extract when:** a widget has more than 3 build branches, or the build method exceeds 50 lines.
- **Prefer `const` constructors.** Every widget that can be const, must be const.
- **Prefer `ConsumerWidget`** over `ConsumerStatefulWidget` unless mutable state is genuinely required.

## 7.2 State management decision tree

```
Is the state local to one widget?
  → Yes: Use StatefulBuilder or local setState
  → No: Is it shared across widgets?
    → Yes: Is it async?
      → Yes: Use AsyncNotifier (Riverpod)
      → No: Use Notifier (Riverpod)
    → No: Use Provider
```

## 7.3 Theme

- **Single source of truth:** `lib/app/theme.dart`
- **Dark mode:** Required. E-ink mode is a separate theme, not a dark mode variant.
- **Colours:** Defined as `ColorScheme` extensions. No hardcoded colours in widgets.
- **Typography:** Vazirmatn for Persian, Sahel for fallback, Georgia for English. Defined in `TextTheme`.
- **Spacing:** Use a spacing scale (4, 8, 12, 16, 24, 32, 48). No magic numbers.

## 7.4 Routing

- **Named routes** for top-level navigation.
- **GoRouter** for complex nested navigation.
- **No string-based route building.** All routes defined in a central router file.

## 7.5 RTL

- **`Directionality` widget** wraps the entire app.
- **RTL is the default.** Latin content embedded in Persian text uses `TextDirection.lrtl` inline.
- **No hardcoded left/right.** Use `EdgeInsetsDirectional`, `AlignmentDirectional`, `Start`/`End` instead of `Left`/`Right`.
- **Test both directions.** Every screen must be verified in RTL and LTR.

## 7.6 Localisation

- **Arb files** for all user-facing strings.
- **Persian (fa) is primary.** English (en) is secondary.
- **No hardcoded strings in widgets.** Use `AppLocalizations`.
- **Pluralisation:** Use ICU message format.
- **Date/number formatting:** Use `intl` package. Persian digits (۰۱۲۳) in-app.

## 7.7 Accessibility

- **Semantics:** Every interactive widget has a `Semantics` wrapper with label and hint.
- **Text scaling:** Support up to 200% without layout breakage.
- **Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text.
- **Touch targets:** Minimum 48x48 logical pixels.
- **No timed interactions.** No auto-advancing, no countdowns.
- **Screen reader:** Test with TalkBack on Android.

## 7.8 Performance

- **Lazy loading:** All lists use `ListView.builder`. Never load all items at once.
- **Image caching:** Cache network images. Use `cached_network_image`.
- **Shader precompilation:** Compile shaders on first launch, not during navigation.
- **Frame budget:** 16ms per frame (60fps). Profile regularly.

---

# 8. Unity standards

## 8.1 Scene hierarchy

```
Scene_Root/
├── Managers/           # GameManager, AudioManager, etc.
├── Environment/        # Static geometry, lighting
├── Characters/         # Jester, animals, people
├── UI/                 # Canvas, overlays
├── Audio/              # Audio sources, mixers
└── Cameras/            # Main, secondary, transitions
```

## 8.2 Prefab structure

- **One prefab per logical entity.** `Room_GardenGate.prefab`, `Jester_LucidFailure.prefab`.
- **Nested prefabs** for reusable components. `Chair_Basic` nested into `Room_GardenGate`.
- **Variant prefabs** for colour/material variations of the same mesh.
- **No orphan prefabs.** Every prefab must be referenced in at least one scene or another prefab.

## 8.3 Animation

- **Animator controllers** per character/entity. One state machine, not a global one.
- **Animation clips** named `anim_<entity>_<action>.anim`.
- **No runtime animation instantiation.** Pre-bake all animations.
- **Root motion:** Disabled. All movement is code-driven for precise control.

## 8.4 Materials

- **Material naming:** `m_<surface>_<variant>.mat` (e.g., `m_floor_stone_dark.mat`).
- **Shared materials** via material instances, not duplicated materials.
- **Shader properties** exposed as material properties, not hardcoded.

## 8.5 Shaders

- **Procedural over shipped textures.** All shaders generate patterns from parameters.
- **Shader naming:** `s_<purpose>.shader` (e.g., `s_girih_tilework.shader`).
- **No runtime shader compilation.** All shaders precompiled.
- **Target:** Single-pass, unlit where possible. Vertex-lit for noir effect. No real-time shadows.

## 8.6 Textures

- **Procedural where possible.** Generated at runtime from parameters.
- **Shipped textures:** Maximum 512x512. Compressed (ASTC for Android).
- **Texture naming:** `t_<purpose>_<resolution>.png` (e.g., `t_tilework_512.png`).
- **No mipmaps** on UI textures. Mipmaps on 3D textures.

## 8.7 Lighting

- **No real-time lights.** All lighting baked or vertex-shaded.
- **Baked lightmaps** for static environments. Resolution: 20-40 texels/unit.
- **Vertex lighting** for dynamic elements (characters, moving objects).
- **No shadow maps.** Shadows are geometry or vertex-shaded approximations.

## 8.8 Mesh budgets

| Element | Maximum triangles | Maximum vertices |
|---|---|---|
| Single room | 5,000 | 8,000 |
| Character (Jester) | 2,000 | 3,000 |
| Animal | 1,000 | 1,500 |
| Prop | 500 | 800 |
| Total scene | 20,000 | 30,000 |

## 8.9 Performance

- **Target:** 30fps on 2GB Android Go. 60fps preferred but not required.
- **Draw calls:** Maximum 50 per frame.
- **Vertices:** Maximum 30,000 visible at once.
- **Texture memory:** Maximum 64MB total.
- **No runtime LOD switching.** Use fixed LOD levels based on device detection.

---

# 9. Backend standards

## 9.1 SQLite

- **One database file:** `dana.db`
- **Tables:** `articles`, `reading_progress`, `hash_overlays`, `garden_state`, `jester_encounters`
- **Migrations:** Versioned migration scripts. Never alter a live schema.
- **Indexing:** Index all foreign keys and frequently queried columns.
- **WAL mode:** Enabled for concurrent reads.

## 9.2 Repository pattern

- **Interface in `domain/`, implementation in `data/`.**
- **One repository per aggregate root.**
- **No business logic in repositories.** They fetch, store, and return.
- **Error handling:** Return `Result<T, E>`, never throw from repositories.

## 9.3 ZIM integration

- **kiwix-js** for browser-based reading. Service Worker intercepts requests.
- **libzim** for native reading (Flutter FFI or Unity plugin).
- **Never parse ZIM directly.** Use the established libraries.
- **Cache:** LRU cache for recently accessed articles. Maximum 50 articles or 10MB, whichever comes first.

## 9.4 Hash overlay format

- **File extension:** `.hash`
- **Format:** JSON envelope + content-specific payload
- **Fields:** `format_version`, `base_article_id`, `author_handle` (optional), `annotations[]`, `signature` (Phase 2), `timestamp`
- **Merge strategy:** Append-only. Overlays stack. No conflict resolution needed.
- **Size limit:** 100KB per file. Warn at 80KB.

## 9.5 Caching

- **Article cache:** 50 most recent articles, LRU eviction.
- **Image cache:** 10MB maximum, LRU eviction.
- **Garden state:** Written to disk on every state change. No in-memory-only state.
- **Jester encounters:** Preloaded on first launch. No runtime fetching.

## 9.6 Sync

- **No cloud sync.** All data is local.
- **Transfer is explicit.** The user initiates every file transfer.
- **No background sync.** No polling. No push notifications.

## 9.7 Security

- **Encryption at rest:** All user-generated content (Hashtiyeh, progress) encrypted with device-derived key.
- **Metadata scrubbing:** EXIF, timestamps, device identifiers removed from all shared files.
- **Key storage:** Android Keystore. Never in shared preferences or plain files.
- **No plaintext PII at rest.** Ever.

---

# 10. Asset pipeline

## 10.1 Folder rules

```
assets/
├── fonts/           # Vazirmatn, Sahel, Georgia
├── images/          # Static sprites, icons (SVG preferred, PNG fallback)
├── shaders/         # Procedural shader files
├── audio/           # Ambient, SFX (WAV preferred, OGG fallback)
├── models/          # 3D models (FBX, glTF)
├── animations/      # Animation clips
├── l10n/            # ARB files for localisation
└── seed/            # Synthetic data for demo
```

## 10.2 Textures

- **Format:** PNG for UI, ASTC for 3D.
- **Maximum size:** 512x512 for UI, 1024x1024 for 3D.
- **Compression:** Lossless for UI, lossy for 3D.
- **Power of two:** Required for 3D textures. Not required for UI.

## 10.3 Icons

- **Format:** SVG preferred. PNG at 1x, 2x, 3x for fallback.
- **Naming:** `ic_<purpose>.svg` (e.g., `ic_verification.svg`).
- **Size:** 24dp default, 48dp for large touch targets.

## 10.4 Fonts

- **Vazirmatn:** Regular (400), Medium (500), Bold (700).
- **Sahel:** Regular (400).
- **Georgia:** Regular (400), Bold (700).
- **Subset:** Persian + Latin + Arabic numerals only. No full Unicode.

## 10.5 Models

- **Format:** glTF 2.0 preferred. FBX for Unity import.
- **Naming:** `mdl_<purpose>.glb` (e.g., `mdl_room_garden_gate.glb`).
- **Maximum:** 5,000 triangles per prop, 2,000 per character.
- **No animations embedded.** Separate animation files.

## 10.6 Audio

- **Format:** WAV for short SFX, OGG for ambient loops.
- **Naming:** `sfx_<purpose>.wav`, `amb_<purpose>.ogg`.
- **Sample rate:** 44.1kHz. 16-bit. Mono for SFX, stereo for ambient.
- **Maximum:** 5 seconds for SFX, 60 seconds for ambient loops.

## 10.7 Compression

| Asset type | Compression | Tool |
|---|---|---|
| PNG | OptiPNG level 3 | `optipng -o3` |
| SVG | SVGO | `svgo --precision=2` |
| WAV | ffmpeg to OGG | `ffmpeg -i input.wav -c:a libvorbis -q:a 5 output.ogg` |
| FBX | Unity import settings | Compression: Normal, Quality: 50 |
| glTF | Draco compression | `gltfpack -cc` |

## 10.8 Versioning

- **Assets in source control.** No CDN references for fonts, icons, or shaders.
- **Version bumps** on breaking changes to asset format.
- **Compatibility:** New app versions must read old asset formats. Old app versions may ignore new fields.

---

# 11. Git workflow

## 11.1 Branches

| Branch | Purpose | Lifetime |
|---|---|---|
| `main` | Production-ready code. Protected. | Permanent |
| `develop` | Integration branch. All PRs merge here first. | Permanent |
| `feature/<name>` | New feature development. | Until merged |
| `fix/<name>` | Bug fixes. | Until merged |
| `hotfix/<name>` | Emergency fixes to production. | Until merged |
| `release/<version>` | Release preparation. | Until deployed |

## 11.2 Commit format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

Examples:
- `feat(reading): add E-ink mode toggle`
- `fix(hashtiyeh): resolve overlay merge conflict`
- `docs(security): update metadata scrubbing spec`

## 11.3 Merge policy

- **Squash merge** for feature branches into `develop`.
- **Merge commit** for `develop` into `main`.
- **No force push** to `main` or `develop`.
- **No direct commits** to `main`. All changes via PR.

## 11.4 PR policy

- **Title:** Matches commit format.
- **Description:** What changed, why, how to test.
- **Size:** Maximum 400 lines changed. Larger PRs must be split.
- **Review:** Minimum 1 approval before merge.
- **CI:** All checks must pass.
- **Linked issues:** Every PR links to at least one issue or task.

## 11.5 Conflict resolution

- **Rebase** feature branches onto `develop` before merging.
- **Resolve conflicts** in the feature branch, not in `develop`.
- **Never take the merge resolution from a tool without reading it.**

## 11.6 Version tags

- **Semantic versioning:** `MAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes to data format or API.
- **MINOR:** New features, backward-compatible.
- **PATCH:** Bug fixes, backward-compatible.
- **Tags:** `v1.0.0`, `v1.1.0`, `v1.1.1`

---

# 12. Definition of done

Every feature must satisfy all of these before merge:

## Code
- [ ] Compiles without warnings
- [ ] No `print()` or `console.log()` in production code
- [ ] No commented-out code
- [ ] No TODO without ticket reference
- [ ] Follows naming conventions (Section 4)
- [ ] Within file size limits (Section 3.9)
- [ ] Within complexity limits (Section 3.10)

## Documentation
- [ ] Public APIs documented with dartdoc
- [ ] README updated if package behaviour changed
- [ ] ADR created for architectural decisions

## Accessibility
- [ ] Semantics labels on all interactive widgets
- [ ] Touch targets minimum 48x48dp
- [ ] Works with TalkBack (Android)
- [ ] No timed interactions
- [ ] RTL verified

## Performance
- [ ] No unnecessary rebuilds (Flutter)
- [ ] Lazy loading for lists
- [ ] Within frame budget (16ms)
- [ ] No memory leaks (profiled)

## Testing
- [ ] Unit tests for business logic
- [ ] Widget tests for UI components
- [ ] Manual test on lowest-spec device
- [ ] RTL test passed
- [ ] Offline test passed

## Security
- [ ] No PII in logs
- [ ] No hardcoded secrets
- [ ] Metadata scrubbed on shared files
- [ ] Class A / Class B review completed

## Review
- [ ] At least 1 approval
- [ ] CI passing
- [ ] No unresolved comments

---

# 13. Testing strategy

## 13.1 Unit tests

- **Target:** 80% coverage for `domain/` and `data/` layers.
- **Framework:** `flutter_test` (Dart), NUnit (C#), Jest (TypeScript).
- **Naming:** `describe_<thing>_when_<condition>_should_<behaviour>`.
- **One assertion per test.** Multiple assertions only when testing a single invariant.

## 13.2 Integration tests

- **Target:** All critical paths (reading, Hashtiyeh, transfer).
- **Framework:** `integration_test` (Flutter), Test Runner (Unity).
- **Environment:** Real device, offline mode, flight-mode enabled.

## 13.3 Widget tests

- **Target:** All custom widgets.
- **Framework:** `flutter_test`.
- **Verify:** Rendering, interaction, state changes, accessibility semantics.

## 13.4 Manual tests

- **Device matrix:** Lowest-spec Android Go + one mid-range device.
- **Scenarios:** Full 90-second demo (irreducible demo from Foundation Prompt).
- **Checklist:** RTL, E-ink mode, 3D mode, transfer, garden growth, Jester encounter.

## 13.5 Offline tests

- **Flight mode:** All features tested with no connectivity.
- **Data loading:** ZIM files load correctly offline.
- **Transfer:** Wi-Fi Direct / BLE works without internet.
- **Error states:** Graceful degradation when data is missing.

## 13.6 RTL tests

- **All screens:** Verified in RTL (Persian) and LTR (English).
- **Layout:** No mirrored elements, no truncated text, no overlapping.
- **Navigation:** Back button, drawer, and tabs respect direction.

## 13.7 Accessibility tests

- **TalkBack:** All screens navigable by screen reader.
- **Text scaling:** 200% without layout breakage.
- **Contrast:** 4.5:1 minimum for body text.
- **Touch targets:** 48x48dp minimum.

## 13.8 Performance tests

- **Frame rate:** 30fps minimum on target device.
- **Memory:** No spikes above 300MB.
- **Startup:** Cold start under 3 seconds.
- **Battery:** No background processing, no polling.

## 13.9 Regression tests

- **Triggered by:** Any bug fix.
- **Scope:** The specific bug + adjacent features.
- **Automated:** Where possible. Manual otherwise.

---

# 14. Performance budgets

## 14.1 Flutter

| Metric | Budget | Measurement |
|---|---|---|
| Cold start | < 3 seconds | Time from launch to first frame |
| Frame time | < 16ms (60fps target) | DevTools timeline |
| Widget rebuilds | < 10 per frame | DevTools rebuild tracker |
| Image cache | < 10MB | Memory profiler |
| Total memory | < 300MB | Memory profiler |

## 14.2 Unity

| Metric | Budget | Measurement |
|---|---|---|
| Frame rate | >= 30fps | Unity Profiler |
| Draw calls | <= 50 | Frame Debugger |
| Vertices | <= 30,000 | Frame Debugger |
| Texture memory | <= 64MB | Profiler |
| Total memory | <= 300MB | Profiler |

## 14.3 APK / Install

| Metric | Budget |
|---|---|
| APK size (download) | <= 50MB |
| APK size (installed) | <= 150MB |
| ZIM content | Downloadable separately, not bundled |
| First-launch setup | < 10 seconds |

## 14.4 Battery

| Metric | Budget |
|---|---|
| Background processing | None |
| Idle power draw | Minimal (no timers, no polling) |
| Active reading | < 5% per hour on target device |
| 3D navigation | < 10% per hour on target device |

## 14.5 Storage

| Metric | Budget |
|---|---|
| App size (no content) | <= 150MB |
| Database | <= 10MB per 1000 articles |
| Hash overlays | <= 100KB per file |
| Garden state | <= 1MB |
| Total user data | <= 2GB (device-dependent) |

---

# 15. Dependency policy

## 15.1 When new packages are allowed

- **No new package** without checking: can this be built with existing dependencies?
- **Maximum:** 3 new packages per sprint. Justify each.
- **Alternatives considered:** List at least one alternative (including "build it ourselves").

## 15.2 Approval process

1. Developer proposes the package with rationale.
2. Tech Lead reviews for: necessity, maintenance status, license, security.
3. If approved, add to `pubspec.yaml` with pinned version.
4. Document in ADR if it affects architecture.

## 15.3 Version pinning

- **Exact versions** in `pubspec.yaml` (`^1.2.3` is not allowed).
- **Lock file** committed to source control.
- **Update cadence:** Monthly security review. Quarterly feature updates.

## 15.4 Security review

- **Every package** checked against: [osv.dev](https://osv.dev), GitHub Advisory Database.
- **License:** MIT, Apache 2.0, BSD, or equivalent. No GPL for mobile app.
- **Maintenance:** Last commit within 6 months. Open issues < 50.
- **Native code:** Packages with native code reviewed for memory safety.

## 15.5 Never duplicate

- **One package per purpose.** If two packages do the same thing, pick one.
- **No vendoring.** Use the package manager. Never copy source code from a dependency.
- **No fork unless essential.** If forking, document why and maintain a rebase plan.

---

# 16. AI agent workflow

This section defines how AI coding agents interact with the codebase. For the full AI workflow including prompt templates and review loops, see `AGENT_PLAYBOOK.md`.

## 16.1 Context delivery

Every AI agent receives, in order:
1. `MASTER_FOUNDATION_PROMPT.md` (project context, philosophy, constraints)
2. `BUILD_GUIDE.md` (this file — engineering standards)
3. The specific task prompt (what to build, what to change)
4. Relevant source files (minimum necessary)

**Never send:** the entire repository, all spec files, or all documentation.

## 16.2 File access

| Agent type | Read access | Write access |
|---|---|---|
| Frontend Engineer | `apps/mobile/`, `packages/core/`, `packages/zim_reader/` | Same |
| Backend Engineer | `packages/`, `apps/mobile/lib/features/*/data/` | Same |
| Unity Engineer | `unity/` | Same |
| Reviewer | All source | None (read-only) |
| Architect | All source, all docs | `docs/` only |

## 16.3 Self-review

Before submitting code, the AI agent must:
1. Run `dart format` (Flutter) or equivalent formatter.
2. Check file size limits (Section 3.9).
3. Check complexity limits (Section 3.10).
4. Verify RTL correctness.
5. Verify offline functionality.
6. Check for hardcoded strings, magic numbers, or commented-out code.
7. Verify no PII in logs.

## 16.4 Failure handling

If an AI agent encounters an error:
1. **Log the error** with full context.
2. **Attempt one retry** with a different approach.
3. **If still failing**, stop and report to the human engineer.
4. **Never silently skip** a failing test or build.

---

# 17. PR review checklist

Every pull request must answer:

## What changed?
- [ ] All modified files listed
- [ ] New files explained
- [ ] Deleted files explained

## Why?
- [ ] Link to issue or task
- [ ] Motivation for the change
- [ ] Alternatives considered

## Risk?
- [ ] Class A / Class B implications assessed
- [ ] Performance impact assessed
- [ ] Accessibility impact assessed
- [ ] RTL impact assessed
- [ ] Offline impact assessed

## Quality?
- [ ] Follows coding standards (Section 3)
- [ ] Follows naming conventions (Section 4)
- [ ] Within file size limits (Section 3.9)
- [ ] Within complexity limits (Section 3.10)
- [ ] No AI tells (Section 3.3)

## Testing?
- [ ] Unit tests added/updated
- [ ] Widget tests added/updated
- [ ] Manual test performed on target device
- [ ] RTL test passed
- [ ] Offline test passed

## Documentation?
- [ ] README updated (if applicable)
- [ ] ADR created (if architectural decision)
- [ ] Changelog updated (if user-facing)

---

# 18. Decision records (ADRs)

## 18.1 Format

```markdown
# ADR-NNN: <title>

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Date:** YYYY-MM-DD
**Deciders:** <names>

## Context

What is the issue that motivates this decision?

## Decision

What is the change being proposed or decided?

## Consequences

What becomes easier or more difficult because of this change?

## Alternatives considered

What other options were evaluated and why were they rejected?
```

## 18.2 Numbering

- Sequential: `001`, `002`, `003`.
- Never reuse a number, even if the ADR is deprecated.

## 18.3 Approval

- **Proposed:** Any team member can create.
- **Accepted:** Requires founder or tech lead approval.
- **Deprecated:** Only when superseded by a new ADR.

## 18.4 Revision

- ADRs are **immutable once accepted.** If the decision changes, create a new ADR that supersedes the old one.
- Never edit an accepted ADR. Append a "Superseded by" note.

---

# 19. Engineering anti-patterns

Every item in this table is forbidden. If you see it, fix it.

| Anti-pattern | Why it is forbidden | Correct approach |
|---|---|---|
| **God class** | Unmaintainable, untestable | Split into focused, single-responsibility classes |
| **Circular dependency** | Build failures, unclear architecture | Invert dependency via interface |
| **Magic numbers** | Unreadable, error-prone | Extract to named constant |
| **Business logic in UI** | Untestable, couples presentation to domain | Move to domain layer, use state management |
| **Networking in widgets** | Untestable, lifecycle issues | Use repository pattern, inject via DI |
| **Global mutable state** | Unpredictable, hard to debug | Use state management (Riverpod, provider) |
| **Hardcoded strings** | Unlocalisable, error-prone | Use `AppLocalizations` or config |
| **Duplicated logic** | Bugs in one copy, not the other | Extract to shared utility |
| **Hidden state** | Unclear behaviour, hard to reason about | Make state explicit, document invariants |
| **Feature creep** | Scope explosion, missed deadline | Filter through 15-day / 2-person test |
| **Premature optimization** | Wasted effort, wrong bottlenecks | Profile first, optimise measured hotspots |
| **Unreviewed AI code** | May violate standards or safety rules | Always human-review AI-generated code |
| **Unchecked generated code** | May contain errors or anti-patterns | Verify against standards before commit |
| **Swallowed exceptions** | Silent failures, hard to debug | Log and handle, or rethrow with context |
| **Commented-out code** | Git remembers, code rots | Delete it |
| **TODO without ticket** | Orphaned work, no tracking | Create ticket first, reference in TODO |
| **Premature abstraction** | Over-engineering, wrong boundaries | Three similar lines before abstraction |
| **Testing implementation** | Fragile tests, wrong confidence | Test behaviour, not implementation |

---

# 20. Quick reference

## Key files

| File | Purpose |
|---|---|
| `MASTER_FOUNDATION_PROMPT.md` | Project constitution. Read first. Never rewrite. |
| `BUILD_GUIDE.md` | This file. Engineering standards. |
| `AGENT_PLAYBOOK.md` | AI workflow. Separate document. |
| `NOTES.md` | Running canon. Updated after every session. |
| `PARDIS_ROADMAP.md` | Sprint plan and phases. |

## Key constraints

| Constraint | Value |
|---|---|
| Clock | 15 days |
| Team | 2 people |
| Device | Sub-$100 Android Go, 2GB RAM |
| Connectivity | Offline-first |
| Safety | Class A + Class B |
| Deployment | Gated on security review |

## Key commands

```bash
# Format Dart
dart format .

# Run tests
flutter test

# Run integration tests
flutter test integration_test/

# Build APK
flutter build apk --release

# Analyze
dart analyze

# Check formatting
dart format --set-exit-if-changed .
```

---

*End of BUILD_GUIDE.md.*
