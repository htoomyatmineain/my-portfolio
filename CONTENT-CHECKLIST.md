# Portfolio content to add later

The foundation intentionally omits missing assets and unconfirmed details. This is an owner checklist, not public website content.

- [x] About section media updated: `assets/hamriley.png` replaced with the looping video `assets/coding pixels.mp4` (`<figure class="portrait">`, full width on mobile/tablet, `460px` max on desktop).
- [x] Supplied ARES and ASEAN Explorer project images added.
- [x] Kinn Htout screenshot added to its project card.
- [x] A Yate Sitt screenshot added to its project card.
- [x] Verified live demo URLs (rechecked 2026-11-23) and scanned all four GitHub repos for tech stacks. Project cards now display role tags under the title, description + inline context hashtags, closed-by-default **Tech stacks** dropdowns with rounded pink pill badges, and primary/secondary **Live demo** / **View repository** buttons. `python verify.py` passes (HTML parse, unique IDs, anchors, local assets).
- [x] Added `#resume` section from CV (Summary, Education, Technical Skills, Professional Experience, Selected Projects, Leadership & Achievements) with a **Print / Save PDF** button (`#print-resume`) and `@media print` styles. No standalone downloadable PDF file is stored in the repo yet.
- [ ] Confirm confidence and direct coding experience for the technologies listed in the GitHub profile. No proficiency ratings are used.
- [x] MCPA Yangon responsibilities updated in `#resume` (`Working Group Member, MCPA — Tech & Education Committee (2026)`, 10th Anniversary events & job fairs); exact joining month/date still omitted.
- [ ] Confirm ParcelCare versus ParecelCare spelling. The experience entry uses a descriptive project name for now.
- [ ] Add original certificate files to a public assets directory when ready; participation is kept distinct from prizes. `certificate-preview.png` sits at the repo root but is not published in `assets/` or referenced by the page.
- [ ] Confirm official ASEAN Digital Awards category wording and update result when available. Removed the "Judging pending" badge from the Kinn Htout card; card currently shows "Myanmar representative" and "ASEAN Digital Awards 2027 · Digital Innovation".
- [ ] Add specific personal contributions, demos, technical decisions, and verified outcomes to future project case studies.

## Repo housekeeping

- Unused image assets referenced by nothing on the page: `assets/journey-*.png` (5 files: cavc, lets-tech, nasa-practice, nasa-space-apps, uit-hackathon), `assets/hero-face-source.png`, and `assets/hamriley.png` (replaced by `assets/coding pixels.mp4` in the About section). Delete or wire them in if needed.
- Dormant particle-portrait feature: `script.js` and `styles.css` contain `.particle-stage` code, and `assets/portrait-points.js` plus generator `make_portrait_points.py` exist on disk, but `index.html` has no `#portrait-particles` canvas and never loads the points file. `assets/portrait-points.js` is listed in both `.gitignore` and `.vercelignore`, so it would not ship even if referenced. (Separate from the active `"Hamriley.dev"` typewriter-to-particle hero intro in `script.js`.)
- `certificate-preview.png` (~1.2 MB, repo root) is gitignored and vercelignored; original certificates are not in `assets/` and are not referenced by the page.
- Local-only / ignored files confirmed present: `certificate-preview.png`, `assets/portrait-points.js`, `assets/hero-face-source.png`, `assets/journey-*.png`, `make_portrait_points.py`. `verify.py` and `CONTENT-CHECKLIST.md` are vercelignored.

## Content boundaries

- Keep freelance client identity, source code, and confidential business details private.
- Describe ARES as a prototype; do not claim validated navigation safety or image-processing scale.
- Keep the original NASA practice MVP separate from later Ember Atlas development.
- Next.js is described as agent-assisted project exposure, not a proficiency claim.
- Four main hackathons/buildathons (Let's Tech, UIT Innovative, Into the AI Ocean, NASA Space Apps), one practice round (NASA practice), and one awards submission (ASEAN Digital Awards); the ASEAN–Japan video competition is a separate finalist entry. Do not inflate the count.

## Current design

Apple-inspired light gray drafting sheet with vertical and horizontal construction sketch lines, `"Hamriley.dev"` typewriter intro morphing via particles into `"Htoo Myat Min Eain."` with a navbar drop, looping About video, project cards with inline context hashtags and collapsible pink-badge tech stacks, a printable `#resume` section, and reduced-motion support.
