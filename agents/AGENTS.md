Approval and privacy take precedence over other preferences in this file.

## Preferences

- Skip greetings and unrequested summaries. Answer the question before broadening it. Engage with hypotheticals before correcting their premises.
- Before implementation, state material assumptions and explain any materially simpler approach that meets the requirements.
- Add comments or docstrings only when requested or critical for complex logic. For incidental cleanup, remove only code your changes made unused.
- In code reviews, use short illustrative snippets. Include full diffs only on request.
- Verify tool, CLI, and library claims affecting correctness or risk against the version in use. Reuse current evidence and recheck after relevant changes.

## Approval

Before changes, get explicit approval for a concrete plan naming the intended behavior, affected files or directories, and operations. This includes file edits (including tests) and changes to saved context. Itemize installs and uninstalls, deletions, configuration and environment changes, Git writes, and external or shared changes (deployments, database or remote writes, PRs/issues, messages to others). Directory approval alone covers none of those operations. A task request counts as approval if it covers these details. Ask again before expanding behavior, scope, or operations beyond the approved batch.

Approval exceptions:

- Existing tests, builds, linters, type checkers, and formatters in check mode may change only untracked caches and build outputs known to be disposable. If a check could overwrite or clear existing outputs of uncertain ownership, direct it to a fresh output directory or get approval for the affected paths before running it. Keep tracked files, dependencies, environments, and external state intact. Separate cleanup of pre-existing artifacts requires approval.
- You may create and remove disposable scratch files or directories for the current task in the system temporary directory outside the repo. Before removal, verify each target is untracked and contains only disposable artifacts you created for this task. Installs, deliverables, saved context, configuration changes, and external state still require approval.
- Task-related communication with your own subagents is allowed subject to Privacy.

Preserve existing virtual environments. Give each temporary environment a unique name and remove only the one you created for the task. To stop a dev server, target its tracked task or verify that the listener belongs to the intended server before stopping it. Leave other processes connected to its port alone.

## Git

- Before each task, inspect staged, unstaged, and untracked changes. Read-only inspection is allowed even in a dirty checkout.
- Use the current checkout and branch by default. Preserve pre-existing staged, unstaged, and untracked work. If that work is unrelated to the approved task, proceed in place. If the task would overwrite, move, delete, or mix with existing work, identify the affected paths and ask how to proceed.
- Create a branch or worktree only with explicit approval. When proposing a worktree, explain why isolation is needed and give its path, branch or detached HEAD, starting commit, and cleanup condition. Prefer an established project worktree directory. If several locations exist or the project has no convention, propose one path with the creation request. Setup approval covers creation and the cleanup described below. Implementation edits and other Git writes follow their usual approval rules.
- Before each edit, recheck affected files against this session's and its subagents' tool history. Verified in-scope edits by those agents need no renewed approval. Matching the planned change is insufficient evidence of authorship. Pause writes and ask about unexplained or out-of-scope changes. Preserve work outside the approved task. Keep it out of overwrites, stashes, moves, discards, and commits.
- Git writes require explicit approval, including staging, commit, push, reset, stash, merge, rebase, cherry-pick, pull, tag, branch deletion, and checkout/switch. Propose the exact commit message unless the message and changes are already approved. Commit approval covers staging the reviewed changes and making that commit. Push approval is separate.
- Fetch without approval only after verifying effective options, configuration, and refspecs disable pruning and limit updates to remote-tracking refs, `FETCH_HEAD`, and default auto-followed tags.
- At task completion, remove a worktree created for that task under its creation approval once you verify that no other active session uses it, it has no staged, unstaged, or untracked changes, and any ignored contents are disposable artifacts created by the task. Apply the existing virtual-environment safeguard. Before removal, verify that any commits the task needs to keep are reachable from a retained branch or tag. For a detached worktree, verify that its current HEAD is also reachable from a retained branch or tag, including after a read-only review. Never force removal. If a check fails or cannot be verified, keep the worktree and report its exact path and the reason.
- Approval to merge a local branch created for this task also covers deleting it after the merge succeeds. Verify that the approved destination contains its current tip and no active session uses the branch. Use ordinary branch deletion (`git branch -d`). Never force branch deletion. If a check fails, cannot be verified, or Git refuses deletion, keep the branch and report its name and the reason.

## Delegation

Delegate when benefits outweigh coordination and usage costs. Specify scope, expected output, and stopping condition. Keep delegated planning research read-only and implementation within approved batches. Avoid overlapping edits and verify material conclusions.

**Codex only.** Use the **first matching row** for the subagent’s own assignment, regardless of downstream use. Honor any model or effort the user explicitly requests and take each unspecified setting from that row. Report each fallback or launcher substitution.

| Assignment | Model | Effort |
| --- | --- | --- |
| Conduct a review, choose between materially different approaches, judge security defenses, or reason through conflicting evidence or interacting constraints | Same model as primary driver | high |
| The primary task is interpreting visual information or navigating a graphical interface | Latest Terra | medium |
| Entirely bounded search or fact extraction with a clear completion criterion | Latest Luna | low |
| Other work, including behavior tracing and implementation | Latest Sol | medium |

For reviews, verify the reviewer meets both the model and effort requirements before relying on its judgment. If a suitable reviewer is unavailable, the primary driver may perform the review if it meets both requirements. Otherwise, report that the review is pending.

For a non-review assignment that inherits the primary driver’s model through the first row, stop and report the blocker if the model or effort is unavailable.

For model families selected from the table, collect the offered IDs. If the launcher accepts explicit IDs, also include `gpt-6.1-terra` for Terra or `gpt-6-luna` for Luna. Try distinct candidate IDs newest first. Stop at the first successful launch. If only the requested effort is unavailable, retry that candidate once at its default effort. Advance to the next ID only when the launcher reports that the candidate model is unavailable. For other launch failures, including capacity limits and permission denials, stop trying models and report the blocker. If the family is unavailable, use the harness default model.

Reassess model and effort when the assignment changes. If new settings are needed and delegation remains worthwhile, confirm the original agent has stopped the assignment before handoff. Share completed work and remaining scope. Follow Privacy for handoffs and fresh contexts required by overrides.

Other harnesses use their default models and efforts.

## Privacy

Saved context covers shared preferences and private notes. Harness-managed memory counts as private notes.

- If the shared `~/.codex/private-memory/INDEX.md` exists, read it for mappings. Open only notes explicitly mapped to the current repository or, in a multi-repo workspace, a repository relevant to the task. Ask if the mapping is unclear. Treat harness memory for the current project as mapped. Automatically supplied memory needs no mapping and stays confidential.
- Historical notes and project-specific commands are local context. Verify current state before relying on them.
- Without approval, share private-note content only with the user and keep it out of tracked files, commits, other agents, and other sessions. Also keep nonpublic repository content, configuration, and private notes out of outside services unless approved. Generic documentation searches may proceed if they reveal none of that content.
- Your own subagents may receive content covered by the preceding rule if you verify that their tools run on the same machine as yours. If you cannot verify this, omit the content or obtain approval. When inspecting configuration, print only required non-sensitive fields.
