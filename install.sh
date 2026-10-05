#!/usr/bin/env bash
# Installs (or updates) the NGO Core Upgrade agent from Git and registers its skills and
# custom agents with GitHub Copilot at the user level (~/.copilot/skills, ~/.copilot/agents),
# so they are available in every VS Code workspace and the Copilot CLI.
#
# Usage:
#   ./install.sh --repo https://github.com/<org>/ngo-core-upgrade.git
#   ./install.sh --dir "$HOME/NGO-Core-Upgrade"            # update existing clone
#   ./install.sh --dir "/path/to/unzipped" --skills-only   # register from a copy, no git
#   ./install.sh --dir "/path/to/copy" --skills-only --copilot-home /tmp/profile
#
# Options:
#   --repo <url>           Git URL to clone from
#   --dir <path>           Where to clone/find the agent (default: ~/NGO-Core-Upgrade)
#   --skills-only          Skip clone/update; only (re)register
#   --copilot-home <path>  Where to register (default: ~/.copilot)
#
# Re-run any time to update (idempotent).
set -euo pipefail

REPO_URL=""
INSTALL_DIR="$HOME/NGO-Core-Upgrade"
SKILLS_ONLY=0
COPILOT_HOME="$HOME/.copilot"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)         REPO_URL="$2"; shift 2 ;;
    --dir)          INSTALL_DIR="$2"; shift 2 ;;
    --copilot-home) COPILOT_HOME="$2"; shift 2 ;;
    --skills-only)  SKILLS_ONLY=1; shift ;;
    -h|--help)      grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

step() { printf '\033[36m==> %s\033[0m\n' "$1"; }

# 1. Clone or update
if [[ "$SKILLS_ONLY" -eq 0 ]]; then
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    step "Updating existing clone at $INSTALL_DIR"
    git -C "$INSTALL_DIR" pull --ff-only
  elif [[ -n "$REPO_URL" ]]; then
    step "Cloning $REPO_URL -> $INSTALL_DIR"
    git clone "$REPO_URL" "$INSTALL_DIR"
  elif [[ -d "$INSTALL_DIR" ]]; then
    step "No --repo given; using existing folder at $INSTALL_DIR (not a git clone)"
  else
    echo "No --repo provided and nothing found at $INSTALL_DIR. Pass --repo to clone." >&2
    exit 1
  fi
fi

# 2. Locate customization sources
SKILLS_SRC="$INSTALL_DIR/.github/skills"
AGENTS_SRC="$INSTALL_DIR/.github/agents"
[[ -d "$SKILLS_SRC" ]] || { echo "Skills not found at $SKILLS_SRC — is --dir correct?" >&2; exit 1; }

# 3. Register at the Copilot user level
SKILLS_DST="$COPILOT_HOME/skills"
AGENTS_DST="$COPILOT_HOME/agents"
mkdir -p "$SKILLS_DST" "$AGENTS_DST"

AGENT_ROOT="$(cd "$INSTALL_DIR" && pwd)"
STAMP_HEADER="<!-- NGO-INSTALL-STAMP -->"

# Prepend an install stamp (absolute agent root) after any YAML front matter, so relative
# links that break at the user level can still be resolved against the real install.
add_stamp() {
  local file="$1"
  grep -qF "$STAMP_HEADER" "$file" && return 0
  local note
  note="$STAMP_HEADER
> **Installed agent location:** \`$AGENT_ROOT\`
> This file was registered at the user level by \`install.sh\`. The relative links below
> may not resolve from here — resolve root \`AGENTS.md\` and every \`ingest/\`, \`orchestrator/\`, \`backend/\` and \`frontend/\`
> reference against the installed agent location above.
"
  local tmp; tmp="$(mktemp)"
  if head -1 "$file" | grep -q '^---$'; then
    # insert after the closing '---' of front matter (second '---')
    awk -v note="$note" '
      BEGIN{c=0}
      /^---$/{c++; print; if(c==2){print ""; print note} next}
      {print}
    ' "$file" > "$tmp"
  else
    { printf '%s\n\n' "$note"; cat "$file"; } > "$tmp"
  fi
  mv "$tmp" "$file"
}

step "Registering skills -> $SKILLS_DST"
for d in "$SKILLS_SRC"/*/; do
  [[ -d "$d" ]] || continue
  name="$(basename "$d")"
  rm -rf "${SKILLS_DST:?}/$name"
  cp -R "$d" "$SKILLS_DST/$name"
  add_stamp "$SKILLS_DST/$name/SKILL.md"
  echo "    + skill: $name"
done

if [[ -d "$AGENTS_SRC" ]]; then
  step "Registering custom agents -> $AGENTS_DST"
  for f in "$AGENTS_SRC"/*.agent.md; do
    [[ -f "$f" ]] || continue
    cp "$f" "$AGENTS_DST/$(basename "$f")"
    add_stamp "$AGENTS_DST/$(basename "$f")"
    echo "    + agent: $(basename "$f")"
  done
fi

echo
step "Done."
echo "The skills and agents are now available in every VS Code workspace and the Copilot CLI."
echo "Agent workflow + CLIs live at: $INSTALL_DIR"
echo "Next: open Copilot Chat (agent mode) and pick 'ngo-core-upgrade',"
echo "or just type e.g. 'Upgrade NGO Core packages to 9.2.1 for <client>'."
