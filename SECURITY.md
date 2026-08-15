# Security Policy

## Status

Dana is a hackathon prototype (UNESCO Youth Hackathon 2026). It is **not deployed to real at-risk users** and should not be treated as production-ready. Deployment to the populations it's designed for (youth in Iran/Afghanistan under internet blackout/censorship) is explicitly gated on:

- An independent security review of the course-trust and revocation design
- Field validation of the cross-device correlation surface
- A regional threat-model review by people with relevant expertise
- An NFP (NetFreedom Pioneers) or equivalent distribution partnership

See `Main MD/PARDIS_ROADMAP.md` (Phase 4) and `Main MD/PARDIS_COURSE_TRUST_DESIGN.md` in the project's planning docs for the full gating rationale.

## Reporting a Vulnerability

If you find a security issue in this repository:

1. **Do not open a public GitHub issue** for anything that could put a real user at risk if this project is later deployed.
2. Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) feature on this repo, if enabled.
3. If private reporting isn't available, contact a repository maintainer directly rather than filing a public issue.

## Scope

This is a client-side, offline-first web app with no backend, no accounts, and no server-side data collection. The most relevant risk categories are:

- Data persisted on-device (localStorage) that could expose a user if the device is seized or examined
- Supply-chain risk in dependencies (see Dependabot config)
- Any future addition of network calls, peer-to-peer transfer, or content-signing logic

Report anything in these categories even if the app isn't live yet — design-stage findings are still useful.
