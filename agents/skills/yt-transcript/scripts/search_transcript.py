# /// script
# requires-python = ">=3.12"
# ///
import argparse
import re
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Search a timestamped transcript file")
    parser.add_argument("transcript", type=Path, help="Path to transcript .txt file")
    parser.add_argument("pattern", help="Regex pattern to search for (case-insensitive)")
    parser.add_argument("-C", "--context", type=int, default=0, help="Lines of context around each match")
    args = parser.parse_args()

    lines = args.transcript.read_text().splitlines()
    regex = re.compile(args.pattern, re.IGNORECASE)

    matched = {i for i, line in enumerate(lines) if regex.search(line)}
    if not matched:
        print("No matches", file=sys.stderr)
        sys.exit(1)

    to_print = set()
    for i in matched:
        for j in range(max(0, i - args.context), min(len(lines), i + args.context + 1)):
            to_print.add(j)

    prev = None
    for i in sorted(to_print):
        if prev is not None and i != prev + 1:
            print("--")
        marker = ">" if i in matched else " "
        print(f"{marker} {lines[i]}")
        prev = i


if __name__ == "__main__":
    main()
