# Shared preferences

- When inspecting configuration, print only the required non-sensitive fields. Do not print entire files that may contain credentials.
- When editing agent instructions, check the changed rules for ambiguity and contradictions with existing instructions.
- In code-review reports, use short illustrative snippets rather than full unified diffs. Show full diffs separately when requested.
- In README directory trees, annotate entries only when their purpose is not clear from the name.
- Preserve existing virtual environments. Use a uniquely named temporary environment for review tooling and clean up only the environment created for that task.
- When stopping a development server, identify its listener or tracked task. Do not kill every process with a connection to its port.

Current user instructions take precedence over these shared preferences. Project-specific commands and historical project notes are not global defaults.
