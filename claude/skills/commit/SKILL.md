---
name: commit
description: Review staged changes, split into logical commits, propose messages before committing
disable-model-invocation: true
---
Run `git status` and `git diff --staged`.
Group changes into logically separate commits.
For each: propose a conventional-commit message (type(scope): subject + body explaining why).
Do NOT commit until I approve. Never create a worktree or branch.
After approval, check whether AGENTS.md/README need updates for these changes and report gaps.
