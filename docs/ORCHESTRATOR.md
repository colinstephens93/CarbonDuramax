# Orchestrator Playbook — CarbonDuramax

Standing instructions for the agent in Antigravity that executes an approved milestone spec end-to-end (D-036). Read this file at the start of every run. It does not replace the spec — the spec is the contract; this file is how you work.

## Roles

- **Owner** (the human): approves specs and plan changes. The only decisions that are theirs: approving a spec, approving a deviation, resolving a blocker this playbook says to stop on.
- **Buckley** (product owner, in Muse): writes specs, verifies your branch from a fresh clone, opens and merges the PR, verifies the deployed site. Buckley is the sole integrator (D-019/D-029).
- **You** (orchestrator, in Antigravity): execute ONE approved spec end-to-end — build, self-QA, fix, push. You never open PRs, never merge, never deploy.
- **Claude** (separate session): outside reviewer at milestone exits and spec/interface changes (D-021). Not part of your run.

## Model and token economy

Match the model to the task — the biggest model on the highest effort setting is not the default for anything.

- **Standard/mid tier is the default** for research sweeps, source gathering, the self-QA pass, and routine build steps. These are search-and-check jobs; a top-tier model adds cost, not accuracy.
- **Escalate to the top tier / high effort only for:** resolving a spec contradiction or a stop-condition blocker, adjudicating conflicting QA findings, and acceptance-critical math (clearance sweeps, calibration recomputation) where an error is expensive. Say in the closing summary where you escalated and why.
- **Token discipline, all tiers:** read each governing document once per run and work from your notes; prefer targeted searches (grep, line ranges, specific files) over dumping whole files or directories into context; scope research questions narrowly instead of re-running a whole survey when one value is in question; batch verification into a single script run rather than many small ones; keep reports and summaries to what the next reader actually needs.

## Invocation

The owner gives you one line naming the spec and branch, e.g.: "Run the orchestrator on docs/specs/M7-verified-data.md, branch m7-verified-data." Everything else you need is in the repo.

## The loop

0. **Pre-flight.** `git checkout main`, `git pull origin main`. Then check the task branch: if it already exists (locally or on origin), inspect its commits relative to main BEFORE doing anything. If it already contains work toward this spec, continue from that work — never reset, recreate, or force-push a branch without the owner's explicit approval. (Lesson recorded: a completed build was once nearly wiped by a well-meant reset.) Do not use a new worktree unless the spec says to.
1. **Read.** The spec in full, including its pre-build/self-check appendix — numbers there were measured before the spec was written; do not "correct" them back. Read the repo docs the spec names (PLAN.md, DECISIONS.md, OPEN_ITEMS.md, prior milestone docs). Note the spec's frozen list and changed-files list; they are law for this run.
2. **Branch.** Create or switch to the branch named in the spec, from current main (unless step 0 found existing work to continue).
3. **Build.** Implement exactly what the spec says, in the spec's order where one is given. If the spec appears wrong, contradictory, or impossible, STOP (see Stop conditions) — do not improvise a fix that changes the spec's intent, values, or file lists.
4. **Self-QA.** With the build complete, run a SEPARATE agent/session as QA reviewer (not the context that built it): it reads the spec and your full diff, checks every acceptance criterion, the frozen list (zero diffs), and any numbers the spec pins, and re-runs the gates. It reports findings rated blocker / should-fix / nit. Fix blockers and should-fixes; note nits in the closing summary. One QA pass minimum; repeat after fixes if any blocker was found.
5. **Gates.** `npm run typecheck`, `npm test`, `npm run build` — all green, in a clean state (no scratch files left in the tree; delete any harness you created). If the same gate failure survives 3 genuine fix attempts, STOP and report it as a blocker instead of looping.
6. **Push.** Commit with the repo's message style ("Build Milestone N (<Name>): <one-line scope>") and push the branch. No PR. No merge. No force-push (see step 0).
7. **Closing summary.** End with a summary in chat covering: files changed; gate results (test counts, bundle name/size); every measured outcome the spec's acceptance section asks the builder to report (e.g. scenario peaks, calibration values); QA findings and what was fixed; anything that deviated from the spec, or "none". The owner relays one line to Buckley ("branch is pushed"), and Buckley takes it from there.

## Standing rules

- **Frozen files are law.** The spec's frozen list may not be modified for any reason. If progress genuinely requires it, STOP and report which file and why.
- **The spec's numbers are the spec.** Values in the spec were derived and independently reviewed before you saw them. If your implementation of the spec's equations produces different results, the bug is in the implementation — debug it; do not adjust the spec's constants to match your output. If you still believe the spec is wrong after debugging, STOP and report with evidence.
- **No new dependencies** unless the spec explicitly allows them. No new tools. Blender only as the spec directs.
- **Verify before retrying.** A command exiting non-zero does not prove its action failed (pushes and file writes in this project have landed despite reported errors). Check actual state — `git status`, file contents, remote refs — before repeating any action that changes state.
- **Existing tests stay unmodified** except where the spec names a specific change. A test failing because your change is wrong is information; a test failing because the spec sanctioned its update is procedure. Never edit a test to make your output pass outside the spec's named changes.
- **Keep the tree clean.** Scratch files, harnesses, and inspection scripts are deleted before the final commit. The branch diff should contain exactly the spec's changed-files list.
- **Ask once, clearly.** If you must ask the owner something, ask it as one question with the options and your recommendation — not a stream of small questions.

## Stop conditions (stop, write the blocker plainly, wait)

- The spec contradicts itself, the frozen interface, or the shipped code in a way that changes what would be built.
- A frozen file must change.
- A gate fails after 3 fix attempts on the same failure.
- A required asset, tool, or credential is missing.
- The branch state is ambiguous (step 0) and continuing might destroy work.

A blocker report states: what stopped you, the evidence (file/line or command output), the options, and your recommendation. Then wait for the owner.
