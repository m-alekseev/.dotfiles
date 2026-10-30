# /// script
# requires-python = ">=3.12"
# dependencies = ["yt-dlp"]
# ///
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

TRANSCRIPTS_DIR = Path(tempfile.gettempdir()) / "yt-transcripts"


def extract_video_id(url_or_id: str) -> str:
    match = re.search(r"(?:v=|youtu\.be/)([\w-]{11})", url_or_id)
    return match.group(1) if match else url_or_id


def fmt_timestamp(ms: int) -> str:
    total_seconds = ms // 1000
    h, rem = divmod(total_seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def json3_to_lines(json3_path: Path) -> list[str]:
    data = json.loads(json3_path.read_text())
    lines = []
    for event in data.get("events", []):
        segs = event.get("segs")
        if not segs:
            continue
        text = "".join(seg.get("utf8", "") for seg in segs).strip()
        if not text or text == "\n":
            continue
        lines.append(f"{fmt_timestamp(event.get('tStartMs', 0))}  {text}")
    return lines


def main():
    parser = argparse.ArgumentParser(description="Download a YouTube transcript as timestamped text")
    parser.add_argument("video", help="YouTube URL or video ID")
    parser.add_argument("--lang", default="en", help="Subtitle language (default: en)")
    args = parser.parse_args()

    video_id = extract_video_id(args.video)
    url = f"https://www.youtube.com/watch?v={video_id}"

    TRANSCRIPTS_DIR.mkdir(exist_ok=True)

    subprocess.run(
        [
            "yt-dlp",
            "--skip-download",
            "--write-auto-sub",
            "--write-sub",
            "--sub-lang",
            args.lang,
            "--sub-format",
            "json3",
            "-o",
            str(TRANSCRIPTS_DIR / "%(id)s.%(ext)s"),
            url,
        ],
        check=True,
    )

    json3_path = TRANSCRIPTS_DIR / f"{video_id}.{args.lang}.json3"
    if not json3_path.exists():
        print(f"No subtitles found at {json3_path}", file=sys.stderr)
        sys.exit(1)

    lines = json3_to_lines(json3_path)
    out_path = TRANSCRIPTS_DIR / f"{video_id}.txt"
    out_path.write_text("\n".join(lines) + "\n")
    json3_path.unlink()

    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
