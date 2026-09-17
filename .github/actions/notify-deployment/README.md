# `notify-deployment`

Composite action that posts a deployment **start**, **result** or **alert** to
Microsoft Teams (and optionally email) through the deployment notifications API.

It replaces the four `notify-*` jobs that were copy-pasted into every deploying
repo. Because it runs as a *step*, it reads the workflow run's own context, so
the repository, links, actor, start time and duration no longer have to be
passed in — in a single-job pipeline you write three lines of real input.

```yaml
- uses: kevit-io/grwt-api-node-deployment-notifications/.github/actions/notify-deployment@main
  with:
    type: start
    environment: production
    api_url: ${{ secrets.DEPLOY_BOT_API_URL }}
    team_id: ${{ secrets.DEVELOPERS_TEAMS_TEAM_ID }}
    channel_id: ${{ secrets.DEVELOPERS_TEAMS_CHANNEL_ID }}
```

The calling job needs `permissions: id-token: write` — the action mints the
GitHub OIDC token the API authenticates with.

## Inputs

| Input | Required | Default |
|---|---|---|
| `api_url` | yes | — |
| `team_id` | yes | — |
| `channel_id` | yes | — |
| `type` | yes | — (`start` \| `finish` \| `alert`) |
| `environment` | yes | — |
| `status` | no | `success` (`success` \| `fail`) |
| `thread_id` | no | `''` — required in practice for `finish` |
| `duration_seconds` | no | measured from the start step, else `0` |
| `error_message` | no | `''` |
| `logs_link` | no | `''` |
| `email_ids` | no | `''` — no email when empty |
| `fail_on_error` | no | `false` |
| `repo_name` | no | `github.repository` |
| `repo_link` | no | the repository URL |
| `trigger_by` | no | `github.actor` |
| `action_link` | no | this Actions run |
| `trigger_title` | no | `Deploy <tag> to <env>`, or the commit subject |
| `trigger_link` | no | the release page for a tag, else the commit page |
| `start_time` | no | now, or now minus `duration_seconds` for a result |

Outputs: `thread_id` (from a `start`) and `http_status`.

`api_url` doubles as the OIDC audience, so it must match the API's
`GH_OIDC_AUDIENCE` **exactly** — a trailing slash on one side makes every call
fail with 401.

## Pattern A — one deploy job

Start and finish in the same job. The action remembers when the start ran, so
no `record start time` or `calc-duration` steps are needed.

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    env:
      NOTIFY_ENV: ${{ needs.parse.outputs.environment }}
    steps:
      - id: notify-start
        uses: kevit-io/grwt-api-node-deployment-notifications/.github/actions/notify-deployment@main
        with:
          type: start
          environment: ${{ env.NOTIFY_ENV }}
          email_ids: ${{ env.NOTIFY_ENV == 'production' && vars.PM_EMAIL || '' }}
          api_url: ${{ secrets.DEPLOY_BOT_API_URL }}
          team_id: ${{ secrets.DEVELOPERS_TEAMS_TEAM_ID }}
          channel_id: ${{ secrets.DEVELOPERS_TEAMS_CHANNEL_ID }}

      # ... build and deploy steps ...

      - if: always()
        uses: kevit-io/grwt-api-node-deployment-notifications/.github/actions/notify-deployment@main
        with:
          type: finish
          status: ${{ job.status == 'success' && 'success' || 'fail' }}
          thread_id: ${{ steps.notify-start.outputs.thread_id }}
          environment: ${{ env.NOTIFY_ENV }}
          email_ids: ${{ env.NOTIFY_ENV == 'production' && vars.PM_EMAIL || '' }}
          api_url: ${{ secrets.DEPLOY_BOT_API_URL }}
          team_id: ${{ secrets.DEVELOPERS_TEAMS_TEAM_ID }}
          channel_id: ${{ secrets.DEVELOPERS_TEAMS_CHANNEL_ID }}

      - if: failure()
        uses: kevit-io/grwt-api-node-deployment-notifications/.github/actions/notify-deployment@main
        with:
          type: alert
          status: fail
          environment: ${{ env.NOTIFY_ENV }}
          error_message: "🚨 ${{ env.NOTIFY_ENV }} DEPLOYMENT FAILED - Immediate attention required"
          api_url: ${{ secrets.DEPLOY_BOT_API_URL }}
          team_id: ${{ secrets.DEVOPS_TEAMS_TEAM_ID }}
          channel_id: ${{ secrets.DEVOPS_TEAMS_CHANNEL_ID }}
```

## Pattern B — multi-job pipeline

**A step's `if: failure()` only sees its own job.** In a pipeline where
`build-and-push` and `deploy-k8s` are separate jobs, a step in `deploy-k8s`
never runs when `build-and-push` fails — which is exactly when the alert
matters most. Put the result notification in one final job instead:

```yaml
  notify-result:
    needs: [parse-tag, notify-start, build-and-push, deploy-k8s]
    if: always()
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    env:
      NOTIFY_ENV: ${{ needs.parse-tag.outputs.env }}
      OK: ${{ needs.build-and-push.result == 'success' && needs.deploy-k8s.result == 'success' }}
    steps:
      - uses: kevit-io/grwt-api-node-deployment-notifications/.github/actions/notify-deployment@main
        with:
          type: finish
          status: ${{ env.OK == 'true' && 'success' || 'fail' }}
          thread_id: ${{ needs.notify-start.outputs.thread_id }}
          duration_seconds: ${{ needs.deploy-k8s.outputs.duration }}
          environment: ${{ env.NOTIFY_ENV }}
          api_url: ${{ secrets.DEPLOY_BOT_API_URL }}
          team_id: ${{ secrets.DEVELOPERS_TEAMS_TEAM_ID }}
          channel_id: ${{ secrets.DEVELOPERS_TEAMS_CHANNEL_ID }}

      - if: env.OK != 'true'
        uses: kevit-io/grwt-api-node-deployment-notifications/.github/actions/notify-deployment@main
        with:
          type: alert
          status: fail
          environment: ${{ env.NOTIFY_ENV }}
          error_message: "🚨 ${{ env.NOTIFY_ENV }} DEPLOYMENT FAILED - Immediate attention required"
          api_url: ${{ secrets.DEPLOY_BOT_API_URL }}
          team_id: ${{ secrets.DEVOPS_TEAMS_TEAM_ID }}
          channel_id: ${{ secrets.DEVOPS_TEAMS_CHANNEL_ID }}
```

`notify-start` stays a job here only because its `thread_id` has to cross job
boundaries. It can call the reusable workflow, or be a one-step job using this
action.

## Behaviour worth knowing

- **A missing thread never loses a result.** A `finish` with an empty
  `thread_id` is posted as a standalone `alert` rather than rejected, so a
  failed start notification cannot silently swallow the failure report.
- **Failures never break your deploy.** A failed API call is an error
  annotation, not a failed job, unless you set `fail_on_error: true`. The
  reusable workflow sets it for `start` only, where a missing thread ID affects
  what follows. The same applies when a required value arrives empty because an
  upstream job failed: the notification is skipped with an error annotation
  rather than taking the run down with it. A malformed `type` or `status` is an
  authoring mistake and always fails.
- **Payloads are built with `jq`, not string interpolation.** A commit message
  containing a quote, a newline or `$(...)` is escaped into a JSON string
  instead of being pasted into a shell script.
- **`start_time` comes from the run, not the commit.** The old workflows passed
  `github.event.head_commit.timestamp`, which on a tag pushed days after the
  commit put the card's start time days away from the measured duration.

## Known limitation

The API rejects `durationInSeconds: 0` — [`deploy.controller.ts`][c] checks
required fields for falsiness, so `0` reads as absent and returns HTTP 400.
That is the common failure path: when an earlier job fails, the deploy job
never sets its duration output and `0` is what gets sent. Until the controller
distinguishes `0` from missing, those notifications are rejected — the action
now reports it as an error annotation rather than swallowing it.

[c]: ../../../src/components/deploy/deploy.controller.ts

## Relationship to the reusable workflow

[`reusable-notify-deployment.yml`](../../workflows/reusable-notify-deployment.yml)
is now a thin wrapper around this action, so the repos already calling it keep
working with no change and there is one implementation to maintain. Its
`repo_name`, `repo_link`, `trigger_by`, `trigger_title`, `trigger_link`,
`action_link` and `start_time` inputs are now optional.
