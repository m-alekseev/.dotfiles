---
name: commit
description: Commit session-related files in one approval round; new branch from a base or current branch; optionally push and open an MR/PR
disable-model-invocation: true
---
Flags in $ARGUMENTS: `push`, `mr`, `here`, `base=<branch>`, `docs`. `mr` implies `push`.

1. Inspect (read-only): `git branch --show-current`, `git status -sb`, `git diff HEAD`, `git log -5 --format=%s`, `git remote -v`. Untracked files are listed but never included unless I say so.
2. Pick defaults, asking only if ambiguous:
   - Branch: `here` flag or already on a non-base branch → commit in place; otherwise new branch from `origin/<base>`.
   - Base: `base=` flag, otherwise master.
   - Push/MR: only with `push`/`mr` flags; otherwise offer them in the plan as "no".
3. Show ONE plan and wait for my approval before any git write:
   - branch (new name `type/short-slug`, or current)
   - base
   - files to include: only files related to the work done in this session. List every other changed or untracked file as "excluded".
   - conventional-commit message (`type(scope): subject`, body explaining why when non-obvious), matching the repo's recent style
   - push: yes/no; MR/PR: yes/no with title and description
   If changes split into unrelated groups, propose separate commits.
   I reply `ok` or edit any line; that one approval covers everything in the plan.
4. Execute the approved plan:
   - New branch: `git fetch origin`, `git switch -c <branch> origin/<base>` (working-tree changes carry over; if that conflicts, stop and report).
   - Unstage excluded files with `git restore --staged <path>`, stage approved files by explicit path (never `git add -A`), commit.
   - Push: `git push -u origin HEAD`.
   - MR/PR: forge from the remote URL — gitlab → `glab mr create --target-branch <base> --title ... --description ... --yes`; github → `gh pr create --base <base> --title ... --body ...`. Report the URL.
5. Only with the `docs` flag: check whether AGENTS.md/README need updates and report gaps only; make no edits.

Never add Claude/Anthropic attribution to commits or MR/PR text. Never create a worktree.
