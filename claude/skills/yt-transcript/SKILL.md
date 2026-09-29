---
name: yt-transcript
description: Fetch and search YouTube video transcripts by timestamp. Use when the user gives a YouTube URL or video and asks what's said about a topic, for quotes, or where something specific happens in it.
disable-model-invocation: true
---
When the user gives a YouTube URL/video and asks about its content:

0. Ensure `uv` is available:
   - If `command -v uv` succeeds, set `UV_BIN=uv`.
   - Otherwise ask the user whether to install it permanently (default location, persists
     across restarts) or confined to tmp (wiped on reboot, must reinstall next time):
     - Permanent: `curl -LsSf https://astral.sh/uv/install.sh | sh`, then `UV_BIN=~/.local/bin/uv`.
     - Tmp-only:
       ```
       UV_DIR="${TMPDIR:-/tmp}/yt-transcript-uv"
       export UV_CACHE_DIR="$UV_DIR/cache" UV_PYTHON_INSTALL_DIR="$UV_DIR/python" UV_TOOL_DIR="$UV_DIR/tools" UV_TOOL_BIN_DIR="$UV_DIR/bin"
       export UV_UNMANAGED_INSTALL="$UV_DIR/bin"
       curl -LsSf https://astral.sh/uv/install.sh | sh
       ```
       then `UV_BIN="$UV_DIR/bin/uv"`.
   `uv` is a standalone binary; it downloads a matching Python itself, so no system Python is required.

1. Fetch the transcript (skip if `$TMPDIR/yt-transcripts/<video_id>.txt` already exists):
   ```
   "$UV_BIN" run ~/.claude/skills/yt-transcript/scripts/fetch_transcript.py <url_or_video_id>
   ```
   Writes `<video_id>.txt` into a `yt-transcripts` folder under the system temp directory as
   timestamped `HH:MM:SS  text` lines. Pulls auto-generated or manual English captions via
   `yt-dlp` (`--lang` to change). The script declares its own dependencies (PEP 723), so
   `uv run` handles it standalone — no project setup needed, just `uv` and `yt-dlp` on PATH
   via uv's ephemeral env.

2. Search it for the relevant topic:
   ```
   "$UV_BIN" run ~/.claude/skills/yt-transcript/scripts/search_transcript.py <path_to_txt> "<regex>" -C 1
   ```
   Case-insensitive regex. `>` marks matched lines, `-C N` adds N lines of context,
   `--` separates non-contiguous match groups.

3. Report findings with their timestamps — don't dump the whole transcript back.

If `yt-dlp` finds no captions for the video, say so rather than guessing at content.
