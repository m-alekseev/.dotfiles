---
description: "Use this skill when the user asks to review code, create a code review, or write review.md. Produces a structured Russian-language review document as both .md and .typ (Typst), with PDF via typst compile."
disable-model-invocation: true
---

# Code Review Skill

You are a code reviewer. When invoked, **before doing anything else**, ask the user:

> Is this a first-time review, or a re-review of a previously reviewed version? If re-review, provide the path to the previous `review.md` so findings can be compared: what was fixed, what remains open, and what new issues appeared.

- **First-time review:** proceed with the steps below and write `review.md`.
- **Re-review:** after reading the previous review and the new code, produce a re-review document with three sections: (1) what was fixed, (2) issues still open from the previous review, (3) new issues found in the rewritten code. Use item IDs from the previous review where applicable, and prefix new findings with `НОВ-N`. Do not use emoji — use plain text status labels (e.g. "Устранено", "Не исправлено", "Частично"). Include a summary table at the end. Name the output file `<name>-rereview.md`.

## Steps

1. Explore the project: list all files, read every source file in full.
2. Understand the architecture: data flow, entry points, external integrations.
3. **If the project contains `.py` files**, run static analysis using a temporary virtual environment:

   a. Check for existing virtual environments to avoid touching them:
      ```bash
      find . -maxdepth 2 -name "pyvenv.cfg" | sed 's|/pyvenv.cfg||'
      ```

   b. Create a temporary environment with a unique name:
      ```bash
      python3 -m venv .venv_review_tmp
      ```

   c. Install tools and project dependencies:
      ```bash
      .venv_review_tmp/bin/pip install --quiet ruff mypy
      # If requirements.txt or pyproject.toml exists, also install the project deps for mypy to resolve imports:
      # .venv_review_tmp/bin/pip install --quiet -r requirements.txt  (if present)
      # .venv_review_tmp/bin/pip install --quiet -e .  (if pyproject.toml present)
      ```

   d. Run the checks:
      ```bash
      .venv_review_tmp/bin/ruff check .
      .venv_review_tmp/bin/ruff format --check .
      .venv_review_tmp/bin/mypy . --ignore-missing-imports
      ```

   e. **Always** delete only `.venv_review_tmp` after checks, even if a check fails:
      ```bash
      rm -rf .venv_review_tmp
      ```

   **Hard constraints — never violate:**
   - Only `.venv_review_tmp` may ever be deleted. No other files or directories may be removed, moved, or modified.
   - Do not delete, overwrite, or modify any file that existed before the review started.
   - If `.venv_review_tmp` already exists before starting (leftover from a crashed previous run), delete it first and recreate it — do not reuse it.

   Incorporate tool output into the findings with specific error codes and line numbers.

4. Identify issues across all severity levels (see below), combining manual analysis with tool output.
5. Write `review.md` using the exact structure and format described below.

## Review structure

The file must start with this pandoc frontmatter (fill in the actual project title):

```
---
title: "Код-ревью: <Project Name>"
geometry: margin=2.5cm
fontsize: 12pt
colorlinks: true
header-includes:
  - \usepackage{fvextra}
  - \DefineVerbatimEnvironment{Highlighting}{Verbatim}{breaklines,commandchars=\\\{\}}
---
```

Then include the following sections in order:

### 1. Критические замечания

Issues that can cause data loss, security breach, infinite hang, or crash in production.
Each item:

```
## КРИТ-N — <Short title>

**Файл:** `filename`, line numbers if applicable

<Description of the problem with a code snippet>

**Риск:** what can go wrong  
**Рекомендация:** what to do instead (include corrected code snippet if helpful)

---
```

### 2. Значительные замечания

Issues that affect correctness, maintainability, or introduce hidden bugs.
Each item follows the same `## ЗАМ-N` format with **Риск:** and **Рекомендация:** fields.

### 3. Незначительные замечания

Style issues, typos, dead code, naming inconsistencies.
Each item follows the `## НЗ-N` format. **Риск:** may be omitted if the issue carries no runtime risk — just **Рекомендация:** is sufficient.

If a category has no findings, omit the section entirely.

## Severity criteria

| Уровень | Criteria |
|---|---|
| Критический | Security (secrets in code, disabled SSL, auth bypass), infinite loops, NameError / crash on bad path, data written to wrong destination |
| Значительный | Logic bugs (wrong dataset filtered, off-by-one in business logic), duplicate functions, dead branches, magic numbers for critical identifiers, repeated inefficient patterns |
| Незначительный | Typos in identifiers, commented-out debug code, invalid config format, unreachable statements, mixed naming languages, formatting violations (`ruff format --check`) |

## Style rules

- Write in Russian.
- Use backticks for all file names, function names, and code identifiers inline.
- Every finding must include the file name and ideally the line number.
- Every finding must have a concrete recommendation, not just "fix this".
- Do not invent issues — only report things actually present in the code.
- Do not report the same issue twice under different numbers.

## Producing the Typst file

**Do NOT include this section in `review.md`** — it is instruction for Claude only.

After writing `review.md`, always also write `<same-name>.typ`. The Typst file is the canonical source for PDF export.

### Page and text setup (always at the top)

```typst
#set page(margin: 2.5cm)
#set text(size: 12pt, lang: "ru")
#show link: set text(fill: blue)
#show raw: set text(size: 10pt)
```

### Title block

```typst
#align(center)[
  #text(size: 15pt, weight: "bold")[Код-ревью: <Project Name>]
]
#v(1em)
```

### Section headers

- Top-level category: `= Критические замечания`
- Finding: `== КРИТ-N --- <Short title>`  (three dashes for em-dash)

### Finding body

````typst
*Файл:* `filename`, строка N
*Риск:* ...
*Рекомендация:* ...

```python
code snippet
```
````

Use `*bold*` for bold labels. Inline code: backticks. Use `---` for em-dashes in text.

### Section dividers

Place `#line(length: 100%)` between findings and between major sections.

### Status table (re-review only)

```typst
#table(
  columns: (auto, 1fr, auto),
  stroke: 0.5pt,
  align: (left, left, left),
  table.header([*ID*], [*Описание*], [*Статус*]),
  [КРИТ-1], [description], [*Устранено*],
  [КРИТ-2], [description], [Не исправлено],
)
```

Bold `[*Устранено*]` for fixed items; plain `[Не исправлено]` for open ones.

### Summary table (small font, at the end)

```typst
#[
  #set text(size: 9pt)
  #table(
    columns: (auto, auto, auto, auto),
    stroke: 0.5pt,
    align: (left, left, left, left),
    table.header([*Категория*], [*Всего*], [*Устранено*], [*Остаётся*]),
    [Критические], [N], [N], [N],
    [Значительные], [N], [N], [N],
    [Незначительные], [N], [N], [N],
  )
]
```

## Producing a PDF

**Do NOT include this section in `review.md`** — these instructions are for Claude only.

If the user asks for a PDF, do both steps in order:

1. Write `<same-name>.typ` following the format described in "Producing the Typst file" above.
2. Run:

```bash
typst compile <name>.typ
```

This produces `<name>.pdf` in the same directory. No flags needed.
