# Tool Troubleshooting

## Inspect a failed bootstrap

1. Open the latest `runs/_bootstrap/<run-id>/tool-checks.json` and
   `tool-manifest.json`.
2. Look at each tool's `status` and `selectionReason`.
3. If a `developer-escalation.md` was written, follow its "required action".

## Status meanings

| Status | Meaning | Typical action |
|--------|---------|----------------|
| AVAILABLE | detected + validated | none |
| MISSING | not found, no auto-install | install the prerequisite manually |
| INSTALLATION_REQUIRED | will be installed on `tools bootstrap` | run bootstrap |
| INSTALLATION_BLOCKED | install failed (offline / creds / admin) | fix cause, re-run |
| VERSION_TOO_OLD | below minimum | upgrade the tool |
| VALIDATION_FAILED | version ok but smoke test failed | repair/reinstall |
| POLICY_BLOCKED | forbidden by policy or a disabled gate | adjust policy if approved |
| NOT_APPLICABLE | not needed for this repository | none |

## Common cases

- **.NET SDK / Node.js / Git missing:** these are system prerequisites. The agent
  will not auto-install them. Install per your platform, then re-run bootstrap.
- **`dotnet tool install` fails offline:** ensure `https://api.nuget.org/v3/index.json`
  is reachable, or configure an approved internal feed in
  `config/tool-installation-policy.yaml`.
- **Private feed 401 / NU1301:** credentials are unavailable to the agent. Configure
  them outside the agent (never in logs), then re-run.
- **Proxy / certificate errors:** configure the OS/runtime trust store per your org;
  the agent will not modify certificates.
- **ripgrep missing:** non-blocking; the `repository-search` wrapper falls back to
  `git grep`. Install ripgrep for speed if desired (user-local).

## Resume after manual installation

After installing the missing prerequisite, re-run:

```
node tools/upgrade-agent.js tools bootstrap
```

The bootstrap is idempotent — already-valid tools are not reinstalled. Once the
required capabilities resolve to `AVAILABLE`, the blocked workflow phase can resume.

## Verify the environment without side effects

```
node tools/upgrade-agent.js tools doctor
```

`doctor` performs no installation and no client modification.
