# Project documentation

This folder is the project's single source of truth. **Read these before doing any work on this project — human or AI.**

| File | What it is |
| --- | --- |
| `PLAN.md` | The approved project plan (v2.1): scope, locked decisions, milestones with exit criteria, asset contract, placeholder config, performance model, verification rules, risks. |
| `DECISIONS.md` | The decision log. Every settled choice, dated, with its reasoning. |
| `OPEN_ITEMS.md` | Unresolved questions and data still to source. |

## The anti-drift rule

Work follows `PLAN.md`. If something needs to change:

1. Add a dated entry to `DECISIONS.md` explaining what changed and why.
2. Revise `PLAN.md` to match.
3. Both changes land in the **same pull request**.

A change that exists only in a chat conversation does not exist. A change that exists only in code does not exist. If the code and the plan disagree, the plan is right until it is formally revised.
