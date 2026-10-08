---
name: commit
description: Commit session-related files with an approved message, on a new branch from a chosen base or on the current branch; optionally push and open an MR
disable-model-invocation: true
---
1. Inspect (read-only): `git branch --show-current`, `git status`, `git diff`, `git diff --staged`, `git log -8 --format=%s`. Untracked files are listed but never included unless I say so.
2. Ask (one question): 
   - new branch or commit on the current branch (recommend a new branch if the current one is master/the base)
   - base branch, options: master first, then other likely branches (the current branch, recent remote branches). Used as the new branch's source and as the MR target.
3. Propose, then wait for my approval before any git write:
   - branch name (`type/short-slug`), only if creating a new branch
   - files to include: only files related to the work done in this session (files you edited or created for the task). List every other changed or untracked file separately as "excluded" so I can add any back.
   - conventional-commit message (`type(scope): subject`, body explaining why when non-obvious), matching the repo's recent style
   If changes split into unrelated groups, propose separate commits.
4. After approval:
   - New branch: `git fetch origin`, `git switch -c <branch> origin/<base>` (working-tree changes carry over; if that conflicts, stop and report).
   - Current branch: no switching.
   Unstage excluded files with `git restore --staged <path>`, stage the approved files by explicit path (never `git add -A`), commit.
5. Ask: push? If yes, `git push -u origin HEAD`.
6. Ask: create MR? If yes, propose the MR title and description, wait for approval, then `glab mr create --target-branch <base> --title ... --description ... --yes`. Report the MR URL.
7. Check whether AGENTS.md/README need updates for these changes and report gaps only; make no edits.

Never add Claude/Anthropic attribution to commits or MR text. Never create a worktree.
