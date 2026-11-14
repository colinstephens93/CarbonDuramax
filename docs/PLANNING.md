# Planning Playbook — CarbonDuramax

Standing instructions for the planning agent (Claude) that produces a milestone spec package for Buckley's audit and the owner's approval (D-037). Read this file at the start of every planning run. The repo's governing docs (PLAN.md, DECISIONS.md, OPEN_ITEMS.md) and the prior specs in docs/specs/ are your constitution and your style guide.

## Roles

- **Owner** (the human): states what they want, approves the finished spec. Nothing reaches the owner until Buckley has audited it.
- **You** (planning agent, Claude): research → draft spec → independent QA → revise. You produce the complete spec package in the repo. You do not build code, do not merge, and do not present to the owner directly.
- **Buckley** (product owner): sets direction and standards, audits your package (spot-recomputes the decisive numbers, samples the sources, checks plan/decision compliance), presents it to the owner, and — after the build — verifies and ships. Buckley's audit is a real gate, not a rubber stamp: expect findings back.
- **Antigravity orchestrator**: builds approved specs under docs/ORCHESTRATOR.md. Not part of your run.

## Invocation

The owner (or Buckley) gives you one line naming the work, e.g.: "Plan Milestone 8: <topic>. Follow docs/PLANNING.md." If the topic is ambiguous, ask ONE question with options before starting.

## Model and token economy

Same rule as the orchestrator playbook: standard/mid tier for research sweeps and source gathering; the QA pass on a mid or standard tier is fine too. Escalate to the top tier for the spec drafting itself when the engineering judgment is heavy (geometry stacks, model equations, interface decisions) and for adjudicating QA findings that conflict. Token discipline: read each governing doc once and work from notes; targeted searches over full-file dumps; narrow research questions; batch numeric verification into single script runs.

## The pipeline

1. **Frame.** Read PLAN.md (milestone sequence, exit-criteria style), DECISIONS.md (every decision touching your topic — cite the numbers you rely on), OPEN_ITEMS.md (items your milestone closes or depends on), and the most recent prior spec in full (format, rigor, section structure). Also read the shipped code your spec will touch or freeze — a spec written against imagined code fails audit.
2. **Research (only if the topic needs facts).** Every external fact carries a named source and a confidence grade, following the survey format in docs/research/ (see L7-verified-data-survey.md for the standard: value as published, original units, source kind, verdict per item — including honest "not published" verdicts). Research goes in docs/research/ on your planning branch. Never let an unsourced or single-weak-source number carry a design decision without flagging it as such in the spec.
3. **Draft the spec** at docs/specs/<file>.md on branch `plan/<slug>`, matching the house format of the prior specs:
   - Header: branch name for the build, plan reference, what the milestone is, non-goals.
   - Numbered sections: the change/deliverables in full technical detail; parameter/value tables with provenance; computation sections with derivations shown; UI text verbatim where the app displays it; docs deliverables; frozen vs changed file lists; tests (numbered, each with the failure it catches); acceptance criteria written so Buckley can execute them from a fresh clone; handoff section.
   - A **pre-build self-check appendix**: the spec's key numbers computed by YOU before drafting finishes (prototype the equations, recompute the geometry across the full operating range including endpoints, check clearances against swept volumes) — with the actual measured values recorded in the spec. A spec whose numbers were never run is not finished.
   - If the milestone changes the plan or a prior decision, draft the DECISIONS.md entry and PLAN.md revision IN the spec as build deliverables (anti-drift rule) — do not edit those files yourself on the planning branch unless Buckley asks.
4. **Independent QA.** A separate agent/session (not the drafting context) reviews the draft: recomputes every number in the self-check appendix independently; checks the spec against the shipped code (frozen lists, test names, file paths, interface shapes — grep, don't assume); hunts contradictions, untestable claims, and tests that cannot fail; grades each finding blocker / should-fix / nit. Research-vs-code conflicts are findings, not things to silently resolve.
5. **Revise.** Fix every blocker and should-fix in the draft; record nits. One more QA pass if any blocker existed. The QA report (findings + dispositions) is committed alongside the spec as docs/specs/<file>-QA.md or an appendix — Buckley's audit starts from it.
6. **Handoff.** Push branch `plan/<slug>` containing: the spec, the QA record, and any research files. End with a summary in chat: what the milestone does, the decisive measured numbers, what QA caught and changed, and anything you flagged as uncertain. The owner relays one line to Buckley ("<topic> plan is pushed").

## Standing rules

- **House style is not optional.** If a prior spec solved a formatting or contract problem, reuse its solution. Match section depth to the M5–M7 specs.
- **Freeze discipline starts with you.** Every spec names what may change and what may not, file by file. If you find the build will need a file you froze, that's a spec design problem to solve on paper, not a note to the builder.
- **Honesty over completeness.** A smaller spec whose numbers are all measured beats a grand one with plausible values. Label placeholders as placeholders; refuse values that would fake precision (wrong measurement definition, single weak source) and say why in the spec.
- **Tests must be able to fail.** For each test, name the regression it catches. A claim in the spec with no test and no acceptance step is a finding against your own draft.
- **Verify before retrying.** A tool reporting an error does not prove the action failed; check actual state (branch refs, file contents) before repeating a state-changing action.
- **Ask once, clearly.** Blockers for the owner come as one question with options and your recommendation.

## Stop conditions (stop, report plainly, wait)

- The topic contradicts PLAN.md or a recorded decision and no amendment path is obvious.
- Research cannot support a load-bearing value and no honest placeholder design exists.
- The shipped code differs from what the topic assumes, materially.
- QA and drafting disagree on a number neither can resolve from sources or code.
