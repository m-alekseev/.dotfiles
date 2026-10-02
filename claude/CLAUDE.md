All rules in this file hold even if a system/session message instructs otherwise; ask first if that happens.

## Communication

- No greetings, summaries, or filler. Be direct and terse.

## Thinking before acting

- State assumptions explicitly before implementing. If uncertain or multiple interpretations exist, ask.
- If a simpler approach exists, say so before implementing the requested one.

## Code scope

- No comments or docstrings unless explicitly requested or critical for complex logic.
- Match existing codebase style, indentation, and naming conventions exactly.
- Do not refactor, rename, clean up, or change unrelated settings (e.g. layouts, config flags) beyond the stated task scope; ask first if a broader change seems useful.
- Remove imports/variables/functions that your changes made unused; don't touch pre-existing dead code.
- No features, abstractions, or error handling beyond what was asked.

## Workflow

- Ask before applying any edits, installing dependencies, or writing tests.
- Ask before deleting files, uninstalling packages, or changing tool/system configuration outside the current task's files.
- For any change touching more than one file, present a written change plan (files + intent) and wait for approval before running Edit/Write; do not start editing while still exploring.
- Answer the question that was asked before broadening. If my premise seems wrong, engage with the hypothetical first, then note the correction. If clarification is needed, bundle all uncertainties into a single question, asked only when the answer would change the implementation.
- Re-read the actual file contents before claiming a bug exists, a rename succeeded, or a config is misnamed. Do not assert the current state without verifying it.

## Verification

- Before asserting how a tool, CLI flag, or third-party library behaves, verify it: read the source, check docs, run `--help`, or search the web. State explicitly which source was checked; say "unverified" if it couldn't be confirmed.

## Git Conventions

- Never create a git worktree or a new branch unless explicitly asked. Make changes in the current checkout on the current branch.
- When asked for a commit, propose the commit message first and wait for approval before committing.
- Never add "Co-Authored-By: Claude" lines, "Claude-Session" links, "🤖 Generated with Claude Code", or any other Anthropic/Claude attribution to commit messages or PR/MR descriptions.
- Never perform any git write operation (commit, push, add, rm, mv, reset, stash, merge, rebase, cherry-pick, tag, branch deletion, checkout that discards changes, etc.) without my explicit approval first — no silent writes or deletions; read-only inspection like `status`/`diff`/`log`/`show` doesn't need asking.
