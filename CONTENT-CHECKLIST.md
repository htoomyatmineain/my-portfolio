# Portfolio content to add later

The foundation intentionally omits missing assets and unconfirmed details. This is an owner checklist, not public website content.

- [x] Profile photo added to the About section.
- [x] Supplied ARES and ASEAN Explorer project images added.
- [x] Kinn Htout screenshot added to its project card.
- [x] A Yate Sitt screenshot added to its project card.
- [x] Verified live demo URLs (rechecked 2026-11-23). All four project cards link to live demos; each URL checked and reachable: kinn-htout, ares-martian-survival-map, a-yate-sitt, asean-explorer-two. `python verify.py` also passes (HTML parse, unique IDs, anchors, local assets).
- [ ] Resume PDF. No download button is shown until a file exists.
- [ ] Confirm confidence and direct coding experience for the technologies listed in the GitHub profile. No proficiency ratings are used.
- [ ] MCPA Yangon joining date and responsibilities. Only the confirmed membership title is shown.
- [ ] Confirm ParcelCare versus ParecelCare spelling. The experience entry uses a descriptive project name for now.
- [ ] Add original certificate files to a public assets directory when ready; participation is kept distinct from prizes. `certificate-preview.png` sits at the repo root but is not published in `assets/` or referenced by the page.
- [ ] Confirm official ASEAN Digital Awards category wording and update pending judging result when available. Page currently shows "ASEAN Digital Awards 2027 · Digital Innovation" with judging pending.
- [ ] Add specific personal contributions, demos, technical decisions, and verified outcomes to future project case studies.

## Repo housekeeping

- Unused image assets referenced by nothing on the page: `assets/journey-*.png` (5 files, ~10.1 MB total: cavc, lets-tech, nasa-practice, nasa-space-apps, uit-hackathon) and `assets/hero-face-source.png` (~0.8 MB). Delete or wire them into the Journey section. `styles.css` already has `.timeline.journey-cards .journey-image` rules and `script.js` paginates the timeline, so wiring images only needs markup (and optional `loading="lazy"`).
- Dormant particle-portrait feature: `script.js` and `styles.css` contain `.particle-stage` code, and `assets/portrait-points.js` plus generator `make_portrait_points.py` exist on disk, but `index.html` has no `#portrait-particles` canvas and never loads the points file. `assets/portrait-points.js` is listed in both `.gitignore` and `.vercelignore`, so it would not ship even if referenced. Remove the dead code, or finish wiring the feature and un-ignore the data file.
- `certificate-preview.png` (~1.2 MB, repo root) is gitignored and vercelignored; original certificates are not in `assets/` and are not referenced by the page.
- Local-only / ignored files confirmed present: `certificate-preview.png`, `assets/portrait-points.js`, `assets/hero-face-source.png`, `assets/journey-*.png`, `make_portrait_points.py`. `verify.py` and `CONTENT-CHECKLIST.md` are vercelignored.

## Content boundaries

- Keep freelance client identity, source code, and confidential business details private.
- Describe ARES as a prototype; do not claim validated navigation safety or image-processing scale.
- Keep the original NASA practice MVP separate from later Ember Atlas development.
- Next.js is described as agent-assisted project exposure, not a proficiency claim.
- Four main hackathons/buildathons (Let's Tech, UIT Innovative, Into the AI Ocean, NASA Space Apps), one practice round (NASA practice), and one awards submission (ASEAN Digital Awards); the ASEAN–Japan video competition is a separate finalist entry. Do not inflate the count.

## Current design

Apple-inspired light gray, large typography, generous whitespace, restrained color in conceptual project artwork, subtle entrance animations, and reduced-motion support.
