# Azure Study Hub

An interactive study platform for Microsoft Azure administration and **AZ-104: Microsoft Azure Administrator** exam preparation.

Learn → Visualize → Review → Practice → Analyze → Repeat.

| Area | What's in it |
| --- | --- |
| Dashboard | Readiness score, per-domain progress, weak/strong topics, recent activity, recommended next topic, exam history |
| Study Topics | 35 topics organized by the AZ-104 skills outline — overview, key concepts, how it works, exam tips, common mistakes, comparisons, diagram, flashcards, practice and mastery on one page |
| Visual Learning | 17 interactive SVG diagrams with clickable components and step-by-step walkthroughs |
| Comparison Center | 12 side-by-side guides (RBAC vs Policy, Service vs Private Endpoint, LB vs App Gateway, …) |
| Flashcards | 118 cards in 11 decks, flip/shuffle/keyboard shortcuts, Know It / Needs Review tracking |
| Practice Questions | 177 original questions (single, multi, scenario, ordering, matching, case study) with explanations for the correct answer **and every distractor** |
| Practice Exams | Timed simulation weighted by domain, question map, flag for review, results by domain/topic, full review |
| Service Explorer | 38 Azure services with purpose, security, networking, pricing model, exam relevance |
| Quick Reference | 15 printable cheat sheets (ports, RBAC roles, NSG defaults, storage tiers, …) |
| Search | Ctrl/⌘ + K across topics, services, diagrams, comparisons, cheat sheets, flashcards and questions |
| Study Progress | Weak-areas dashboard with one-click targeted practice, flashcard mastery, streak calendar, export/import |

> Azure Study Hub is an independent learning resource and is not affiliated with or endorsed by Microsoft. Microsoft Azure, Microsoft Learn, and related product names are trademarks of Microsoft. Practice questions are original and are not real exam questions.

## Getting started

Requires Node.js 22+ (CI uses Node 24).

```bash
npm install
npm run dev               # http://localhost:5173/azure_study_hub/
npm test                  # unit tests (Vitest)
npm run validate:content  # schema + cross-reference validation (add -- --min to enforce seed minimums)
npm run build             # type-check + production build to dist/
npm run preview           # serve the production build
```

## Architecture

```
content/                 Educational content as JSON — no UI code
  objectives.json        AZ-104 domains, weights and skills (the organizing framework)
  topics/*.json          Study topics (one array per domain)
  questions/*.json       Practice questions; case-studies.json holds shared case-study text
  flashcards/*.json      Flashcards (deck is a field on each card)
  diagrams/*.json        Interactive diagram nodes, edges, groups and walkthrough steps
  comparisons/*.json     Comparison tables
  quickref/*.json        Cheat sheets
  services/*.json        Service Explorer entries
src/
  content/schema.ts      Zod schemas — the single source of truth for content shape and types
  content/build.ts       Parses + indexes content and checks cross-references (shared by app and CLI)
  content/index.ts       Browser loader (import.meta.glob) and selectors
  progress/              Progress types, store (Zustand), storage repository, pure analytics
  lib/                   Grading, session/exam selection, search, dates
  components/            Layout, UI primitives, question renderer, explanation panel, diagram canvas, flashcards
  features/<area>/       Route-level pages (lazy-loaded)
scripts/validate-content.ts
```

- **Content is data.** Every page renders from `content/`. Updating the exam outline, adding questions or fixing a fact never requires touching components.
- **Validation is strict.** `npm run validate:content` checks every file against the Zod schemas *and* referential integrity: topics → diagrams/services/comparisons, questions → topics/services/objectives/case studies. Each choice question must explain every incorrect option; ordering/matching questions must explain every item. CI runs it on every PR.
- **Progress is local, but swappable.** The store talks only to a `ProgressRepository` (`src/progress/storage.ts`). `LocalStorageRepository` is the default; a cloud-backed implementation with authentication can replace it without UI changes. Stored progress is versioned with a `migrate()` hook.
- **Routing** uses `HashRouter` so deep links work on GitHub Pages without server rewrites.

## Visual design, icons and fonts

- **Styling** follows Microsoft's [Fluent 2](https://fluent2.microsoft.design/) design language (the open-source, MIT-licensed system used across Microsoft products): Fluent neutral and brand color tokens, 4–8 px corner radii, Fluent elevation shadows and semibold type ramp. Tokens live in `src/index.css`.
- **Fonts:** the stack prefers **Segoe UI Variable / Segoe UI** as a *system* font (present on Windows and wherever Office is installed) and falls back to the platform UI font. Segoe UI is proprietary and isn't licensed for web hosting, so no font files are bundled.
- **Official Azure icons:** `public/azure-icons/` contains a curated subset of the [Azure architecture icons](https://learn.microsoft.com/azure/architecture/icons/) and [Microsoft Entra architecture icons](https://learn.microsoft.com/entra/architecture/architecture-icons). Microsoft permits their use in architecture diagrams, training materials and documentation. Content references them as `"icon": "azure:<key>"` (keys in `src/content/azureIcons.ts`). Usage rules this project follows and the validator partly enforces:
  - an icon only represents the Microsoft product it was designed for, with that product's name shown next to it — so study topics, domains and navigation use generic icons, and `validate:content` rejects Azure icons on topics;
  - icons are never cropped, flipped, rotated, recolored or distorted;
  - no Microsoft icon or logo represents Azure Study Hub itself — the app keeps its own mark and the non-affiliation disclaimer.

## Adding or updating content

1. Edit or add JSON under `content/`. Your editor can follow the shapes in `src/content/schema.ts`.
2. Run `npm run validate:content` and fix anything it reports.
3. Run `npm run dev` and check the page.

### Question example

```json
{
  "id": "nw-999",
  "domain": "networking",
  "objectiveId": "secure-vnet-access",
  "topic": "nsg-asg",
  "services": ["network-security-groups"],
  "difficulty": "exam",
  "questionType": "scenario",
  "scenario": "You administer an Azure subscription that contains…",
  "question": "What should you configure?",
  "options": [{ "id": "a", "text": "…" }, { "id": "b", "text": "…" }],
  "correctAnswer": "b",
  "explanation": "Why b satisfies the scenario…",
  "incorrectAnswerExplanations": { "a": "Why a doesn't…" },
  "examTakeaway": "One-line principle to remember.",
  "relatedTopics": ["nsg-asg"],
  "documentationLinks": [{ "title": "…", "url": "https://learn.microsoft.com/…" }],
  "versionNote": "Optional: flag anything version-sensitive."
}
```

`correctAnswer` is an option id (single/scenario), an array of ids (multi), ids in order (ordering) or an `{ optionId: targetId }` map with `matchTargets` (matching). After adding several choice questions, `node scripts/rebalance-options.mjs` reshuffles option order so correct answers stay evenly spread across A–D.

### Accuracy guidelines

- Write original questions that test the skills in Microsoft's published outline. Never copy exam dumps or real exam items.
- Link official documentation (learn.microsoft.com) for every topic and question.
- Don't state prices or volatile limits as fact. Use `versionNote` on anything that changes often (SKUs, retirements, tier features).
- Update `content/objectives.json` when Microsoft revises the skills measured.

## Deployment

`.github/workflows/deploy.yml` validates content, runs tests and builds on every pull request. On pushes to `master` it also deploys `dist/` to **GitHub Pages**.

One-time setup: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**. The site is served at `https://<owner>.github.io/<repo>/`. The build sets the Vite `base` from the repository name.
