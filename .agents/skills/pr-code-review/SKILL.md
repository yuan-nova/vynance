---
name: pr-code-review
description: Review a Vynance GitHub pull request against the BRD, linked ticket, CODING-GUIDELINES.md, DESIGN-SYSTEM.md and ADRs, verify every suspected issue before reporting it, and post the review to the PR automatically. Use this whenever the user asks to review, check, audit or look over a PR, pull request or diff — including when they just paste a github.com/.../pull/N link, give a PR number, or say "review my changes before merge". Optimized for very few false positives and only important, actionable comments.
---

# Pull Request Code Review

## What a good review looks like here

The goal is a review the author trusts. Every published comment should be something the author reads and agrees "yes, that's a real problem and I need to fix it." One wrong comment costs the author time and teaches them to skim every later comment, so **a false positive is worse than a missed nitpick**. Prefer three solid findings over ten mixed ones.

Concretely:
- Report defects and risks **introduced or materially worsened by this PR**, not pre-existing problems.
- Every finding names a concrete trigger and the evidence you checked.
- Unproven concerns become questions, not defect claims.
- Style preferences that aren't written in the project's guidelines are not findings.

## Project documents (Vynance)

| Document | Path | Use it for |
|---|---|---|
| BRD | `docs/BRD-Vynance.md` | Business processes PB-xx, business rules BR-xx, functional requirements FR-xx, UI requirements §12 |
| Coding guidelines | `docs/CODING-GUIDELINES.md` | Layering rules, `shared` package rules, validation, `any`, `useEffect`, money/date handling, testing |
| Design system | `docs/DESIGN-SYSTEM.md` (+ `docs/design-system/quick-rules.md`) | UI contracts `DS-*` — the only source of UI rules |
| Design decision rubric | `docs/design-system/DESIGN-DECISION-RUBRIC.md` | Whether a new UI pattern was justified (DS-GOV-02) |
| Theme contrast | `docs/THEME-CONTRAST.md`, `design/_source/contrast.py` | Token contrast evidence (DS-THEME-01) |
| ADRs | `docs/adr/` | Decisions already taken — a PR contradicting an accepted ADR without a new ADR is a finding |
| UI evidence | `docs/qa/<n>/README.md` or the PR body | DS-QA-01 evidence |
| Reference designs | `design/*.svg` | Visual intent only, not rules |

Write all review comments and the summary in **Bahasa Indonesia**, matching the project docs.

## Step 1 — Collect context

Gather everything before judging any code; most false positives come from reviewing a diff without knowing what it was meant to do or what already protects it.

Use the connected GitHub MCP tools for GitHub access (tool names vary by server; pick the ones that do the job described). If no GitHub MCP server is connected, use the `gh` CLI (`gh pr view`, `gh pr diff`, `gh api`). The user gives a PR URL, `owner/repo#N`, or a number; the default repository is `yuan-nova/vynance`.

1. **The PR**: title, body, base and head branch, head commit SHA, changed files, the diff, linked issues, the discussion, and existing review comments. Note the head SHA — the review is posted against it.

2. **Full files, not just the diff**: read changed files at the head ref, plus their callers, middleware, schemas and tests, and the same files at the base ref when you need to know whether a behavior is new. If a local checkout of the repo is available, reading and grepping there is faster; otherwise use the MCP file-contents and code-search tools.

3. **Ticket / task**: issues linked to the PR or mentioned in its body. If the PR references a Jira key and a Jira tool is available, read it there.

4. **BRD**: `docs/BRD-Vynance.md` (other `docs/BRD-*.md` files may exist for later features). Search it for the feature name, PB/BR/FR IDs, or domain terms from the PR title. Read only the sections relevant to this change.

5. **Coding guidelines**: read `docs/CODING-GUIDELINES.md`.

5a. **UI changes** (anything under `apps/web`, `packages/ui`, `design/`, or token files): also read `docs/DESIGN-SYSTEM.md` for the contracts the change touches, the PR's DS-QA-01 evidence, and any ADR the change relates to.

6. **CI status**: read the PR's check runs. Anything CI already enforces (lint, formatting, type checks, failing tests it reports) does not need a comment from you.

If a source can't be found, note it for the summary's limitations and continue — don't stall and don't invent its contents. When the BRD and ticket disagree, report the conflict as a question instead of picking one.

## Step 2 — Understand the change

Before hunting for problems, write yourself a short statement of what the PR is supposed to do, which acceptance criteria it claims to cover, and what existing behavior it changes. Check whether the PR description scopes anything out ("part 1 of 2", "follow-up PR for X") — work that is explicitly deferred is not a missing requirement.

## Step 3 — Look for candidate issues

Review the diff, reading beyond it whenever needed (callers of changed functions, middleware, schemas, tests). Look across these dimensions, roughly in order of how much they usually matter:

- **Correctness & requirements** — business rules from the BRD/ticket applied wrongly, acceptance criteria not met, edge cases the requirements call out left unhandled.
- **Change impact** — broken callers, changed API/DB contracts, migrations that fail on existing data, changed shared utilities, concurrency/transaction problems, removed behavior someone relies on.
- **Security** — missing authn/authz on new paths, injection, secrets or sensitive data exposed, unsafe input handling, privilege escalation.
- **Data integrity** — partial writes, lost updates, wrong defaults on existing rows.
- **Performance** — N+1 queries, unbounded queries/loops, missing pagination, heavy work on hot paths — only with a realistic data size or call frequency in mind.
- **Guideline violations** — only rules actually written in `CODING-GUIDELINES.md`, and only when the violation has a real consequence. The rules most likely to have real consequences in Vynance:
  - a route or service touching `db`/Drizzle directly, or a repository calling a service (layering);
  - a repository query on family data without a `spaceId` filter (cross-family data leak — treat as Security);
  - money handled as `number`/float instead of `bigint` (data integrity);
  - writes that must be consistent (transaction + wallet balance + asset ledger) outside one `withTransaction`;
  - validation or business rules duplicated in `apps/*` instead of `packages/shared`, where the two copies can diverge;
  - a mutation that does not invalidate the queries it changes (stale balances on screen);
  - `any` or `useEffect` outside the allowed cases in §9.1 / §7.3.
- **Design-system violations** (UI PRs) — only contracts written in `DESIGN-SYSTEM.md`, cited by ID (e.g. `DS-TOUCH-01`). Per DS-GOV-01, only a contract violation or an unapproved exception is a finding; aesthetics are not. Contracts with the most real consequence: DS-THEME-01 (contrast), DS-TOUCH-01 (44 px), DS-COLOR-01 (meaning by color only), DS-MONEY-01 (truncated/unsigned amounts, privacy mode), DS-ACTION-03 (irreversible delete without confirmation), DS-STATE-01 (missing error/empty state), DS-FORM-01 (input font < 16 px, missing labels). A new UI pattern with no DS-GOV-02 rubric result is a **question**, not a defect.
- **Maintainability** — duplicated business logic or abstractions that will realistically cause divergent behavior.

At this stage, collect candidates freely. The filtering happens next.

## Step 4 — Try to disprove each candidate (the most important step)

For every candidate, switch roles: you are now the PR author defending the code. Actively search for the reason the finding is wrong:

- Is there a guard elsewhere — middleware, a decorator, validation at the API boundary, a DB constraint, a caller that already checks it?
- Does the framework already guarantee this (ORM parameterization, template auto-escaping, DI wiring that makes "dead" code live, transactions opened by the framework)?
- Was this behavior already there before the PR? Compare the file at the base ref with the head ref. If the PR didn't introduce or worsen it, drop it.
- Can the triggering input actually reach this code? Trace it from an entry point.
- Is it a requirement that this PR explicitly defers, or that the BRD doesn't actually state?
- Does an existing test already cover it? Where cheap and possible, run the relevant tests rather than reasoning about them.

Then classify:
- **Confirmed** — you traced a concrete trigger and found no safeguard. Publish as a finding.
- **Plausible but unproven** — real concern, but it depends on something you couldn't verify (runtime config, an external service, intent). Publish as a **question to the author**, never as a defect.
- **Refuted or speculative** — drop it silently.

If you can't write a specific "Trigger" line for a finding (see the format below), it is not confirmed.

### Common false-positive traps — check before publishing

- Flagging a "missing" check that exists one layer up or down.
- Flagging lint/format/type problems CI already catches. In Vynance this includes every rule in the table in `CODING-GUIDELINES.md` §13.3 (Biome, GritQL plugins, dependency-cruiser). Spend review effort on §13.4, the rules no tool checks. Exception: a new `biome-ignore`, a disabled rule in `biome.json` / `.dependency-cruiser.cjs`, or a skipped hook (`LEFTHOOK=0`) without a stated reason is a valid finding.
- Commenting on generated or vendored files (lockfiles, generated migrations/clients, `vendor/`, build output).
- "Missing tests" — only a finding when a confirmed P1/P2-risk path is untested, not as a general wish.
- "Could be slow" without a realistic data volume.
- Requiring something the BRD doesn't say, or that the PR explicitly leaves to a follow-up.
- Restating a point a human reviewer already raised in the existing comments.
- Calling something a guideline violation when the rule isn't in `CODING-GUIDELINES.md`, or a design violation when no `DS-*` contract states it.
- Flagging a deviation that an accepted ADR or a recorded DS-GOV-01 exception already allows.
- Treating the reference SVGs in `design/` as rules — they illustrate intent; `DESIGN-SYSTEM.md` is the rule.
- Flagging missing UI evidence when the PR doesn't change UI.

## Step 5 — Severity

Severity reflects impact if the issue happens, independent of how confident you are (confidence was already handled in Step 4). Weigh impact, likelihood, scope and recoverability.

| Level | Meaning | Examples |
|---|---|---|
| **P0 Critical** | Credible catastrophic consequence | Exploitable auth bypass on sensitive data, irreversible data loss, broad outage |
| **P1 High** | Serious, realistically reachable defect in critical functionality, security or data integrity | Unauthorized data modification, core workflow broken, data corruption, resource exhaustion under normal load, one family seeing another family's data, wallet balance drifting from its transactions |
| **P2 Medium** | Real defect with limited or conditional impact | Wrong behavior in a non-critical feature, realistic unhandled error, recoverable inconsistency, a guideline violation with real consequence, a DS contract violation that blocks or misleads users (text below 4.5:1, amount truncated, target < 44 px on a primary action) |
| **P3 Low** | Minor defect, low risk | Minor edge case, misleading log |

Matching a known vulnerability pattern isn't enough for P0/P1 — establish that it's exploitable given the safeguards you found. Style issues are never P1/P0.

## Step 6 — Consolidate and choose what to publish

- **One root cause, one finding.** If the same issue appears in several places, publish one finding listing every location.
- **Inline comments: P0–P2 confirmed findings.** Aim for at most ~5, but never drop a distinct P0/P1/P2 to hit that number.
- **P3**: one line each in the summary, not inline comments — they shouldn't compete for the author's attention.
- **Questions to the author**: listed in the summary, worded as questions with the consequence if the answer is "no".
- Pure suggestions (naming, refactoring with no defect) are omitted.

## Step 7 — Post the review

Post everything as **one GitHub review** through the GitHub MCP tools, so the author gets a single notification and the findings stay grouped. With the official GitHub MCP server that means: create a pending review on the head commit, add each inline comment to it, then submit it with the summary as the body. If the server only offers a one-shot "create review" tool, pass the comments and body in that single call.

Before posting:

- **Skip what's already there.** Check the existing review comments you collected in Step 1. If a finding (same file, same issue) was already raised by a human or by an earlier run of this skill, don't post it again. On a re-review after new commits, mention in the summary which earlier findings now look resolved.
- **Inline comments only on diff lines.** GitHub rejects inline comments on lines that aren't in the PR diff. Anchor each comment on the new-file line number (right side) of an added or context line in the diff. If a finding is about a line outside the diff — or spans several files with no single natural line — put it in the review body under a "Findings not attachable to a diff line" heading instead.
- **Repeated issues** (same root cause in several places): one comment on the most representative line, with an "Also at:" list of the other `path:line` locations.

Submit the review with the **COMMENT** event, never "Request changes" — it must not mechanically block the author (and GitHub refuses "Request changes" on your own PR). The merge recommendation is stated in the body.

If posting fails (auth, permissions, MCP not connected), show the user the complete prepared review in the chat and say clearly that it was **not** posted. Never claim a review was published unless the tool call succeeded.

### Comment body format

```
**[P1][Security] Short issue title**

**Issue:** what is wrong, in one or two sentences, referencing the exact code.
**Trigger:** the concrete input / state / call path that causes it.
**Evidence:** what you checked — e.g. "No auth middleware on this router (src/routes/index.ts:18); `updateOrder` doesn't compare `order.userId` to `req.user.id`."
**Impact:** the realistic consequence.
**Suggestion:** a specific fix or direction (a short code snippet if it helps).
```

Keep it short and technical. No praise, no filler, no generic advice like "handle errors properly".

## Step 8 — Summary (the review body)

```markdown
## Automated review summary

**Recommendation:** Block | Changes requested | Non-blocking feedback | No findings
**Requirement alignment:** Aligned | Partially aligned | Not aligned | Unable to verify — one line on why
**Design system:** Not a UI change | Compliant | Violations listed below | Unable to verify — one line on why (cite DS IDs checked)

| Critical | High | Medium | Low |
|---|---|---|---|
| n | n | n | n |

### Questions for the author
- ... (only if any)

### Minor (P3)
- `path:line` — one line each (only if any)

### Review limitations
- e.g. BRD section for this feature not found; integration tests not run.

_No findings does not mean the code is defect-free._
```

Recommendation rules: any P0/P1 → **Block**; any P2 → **Changes requested**; only P3/questions → **Non-blocking feedback**; nothing → **No findings**.

After posting, tell the user in the chat: the recommendation, the counts, a one-line title for each published finding, and the PR link.
