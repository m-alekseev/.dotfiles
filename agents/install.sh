#!/usr/bin/env bash
set -eu

DOTFILES="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

targets=(
  "$HOME/.claude/CLAUDE.md"
  "$HOME/.claude-work/CLAUDE.md"
  "$HOME/.codex/AGENTS.md"
)
sources=(
  "$DOTFILES/agents/AGENTS.md"
  "$DOTFILES/agents/AGENTS.md"
  "$DOTFILES/agents/AGENTS.md"
)

for name in commit code-review yt-transcript; do
  for directory in "$HOME/.claude/skills" "$HOME/.claude-work/skills" "$HOME/.agents/skills"; do
    targets+=("$directory/$name")
    sources+=("$DOTFILES/agents/skills/$name")
  done
done

for target in "${targets[@]}"; do
  if [[ -e "$target" && ! -L "$target" ]]; then
    printf 'Refusing to replace existing file or directory: %s\n' "$target" >&2
    exit 1
  fi
done

for ((i = 0; i < ${#targets[@]}; i++)); do
  mkdir -p "$(dirname "${targets[$i]}")"
  ln -sfn "${sources[$i]}" "${targets[$i]}"
done
