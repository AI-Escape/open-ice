#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"
: "${GITHUB_SERVER_URL:?GITHUB_SERVER_URL is required}"
: "${GITHUB_SHA:?GITHUB_SHA is required}"
: "${SERVICE_NAME:?SERVICE_NAME is required}"
: "${SERVICE_URL:?SERVICE_URL is required}"
: "${DEPLOY_NOTES:?DEPLOY_NOTES is required}"

short_sha="${GITHUB_SHA:0:7}"
tag="prod-${GITHUB_SHA}"
release_name="Production deploy ${short_sha}"
run_url="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
commit_url="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA}"
service_key="$(printf '%s' "${SERVICE_NAME}" |
  tr '[:upper:]' '[:lower:]' |
  tr -c '[:alnum:]' '-')"

workdir="$(mktemp -d)"
trap 'rm -rf "${workdir}"' EXIT

body_file="${workdir}/body.md"
block_file="${workdir}/${service_key}.md"

if gh release view "${tag}" --json body --jq .body >"${body_file}" 2>/dev/null; then
  release_exists="true"
else
  release_exists="false"
  cat >"${body_file}" <<EOF
# ${release_name}

Canonical production release for commit [\`${short_sha}\`](${commit_url}).

This release is created only after a production deploy workflow succeeds.
Rerunning a deploy updates this release instead of creating a duplicate.
EOF
fi

cat >"${block_file}" <<EOF
<!-- prod-release:service:${service_key}:start -->
## ${SERVICE_NAME}

- Production SHA: [\`${GITHUB_SHA}\`](${commit_url})
- Service URL: ${SERVICE_URL}
- Deploy run: ${run_url}
- Deploy notes: ${DEPLOY_NOTES}
<!-- prod-release:service:${service_key}:end -->
EOF

START_MARKER="<!-- prod-release:service:${service_key}:start -->" \
END_MARKER="<!-- prod-release:service:${service_key}:end -->" \
BLOCK_FILE="${block_file}" \
BODY_FILE="${body_file}" \
perl -0pi -e '
  use strict;
  use warnings;

  my $start = $ENV{"START_MARKER"};
  my $end = $ENV{"END_MARKER"};
  my $block_file = $ENV{"BLOCK_FILE"};
  open(my $fh, "<", $block_file) or die "cannot open block: $!";
  local $/;
  my $block = <$fh>;
  close($fh);

  if (index($_, $start) >= 0 && index($_, $end) >= 0) {
    s/\Q$start\E.*?\Q$end\E/$block/s;
  } else {
    s/\s*\z/\n\n$block/s;
  }
' "${body_file}"

if [[ "${release_exists}" == "true" ]]; then
  gh release edit "${tag}" \
    --title "${release_name}" \
    --notes-file "${body_file}"
else
  gh release create "${tag}" \
    --target "${GITHUB_SHA}" \
    --title "${release_name}" \
    --notes-file "${body_file}"
fi
