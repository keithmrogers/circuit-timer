# Circuit Timer

Strength circuits for a tablet. Each move shows a drawing and a big countdown, beeps at 3-2-1, and says the next move out loud. Moves done one side at a time get a "Switch sides" call halfway. No accounts, nothing to set up.

## Routines
Pick one on the start screen. The app remembers the last one used; `?routine=<id>` opens a specific one (handy for a home-screen shortcut each).

| id | Routine | Moves | Timing |
|---|---|---|---|
| `kids` | My Strength Circuit: bodyweight, floor OK | squats, wall push-ups, glute bridges, bear crawl, plank, step-back lunges, flamingo balance | 30/40 s work, 20 s rest, 1-3 rounds, ~15 min for 2 |
| `chair-counter` | Chair & Counter Strength: no floor, easy on the lower back, long rests | sit-to-stand, counter push-ups, seated shoulder press, side leg raises, band pull-aparts, counter kickbacks, seated march, calf raises | 30/40 s work, 30 s rest, 2 min between rounds, 1-3 rounds, ~23 min for 2 |

Each matches a printable poster. To add a routine, write a `Routine` in `src/routines.ts` and add it to `ROUTINES`; the timings, rest drawing, colors and move list all come from there.

## On the tablet
Open the page in Safari (iPad) or Chrome (Android) and use **Share → Add to Home Screen**. It then opens full screen like an app. The screen stays awake during a workout where the browser allows it (Screen Wake Lock). Sound needs the first tap on **Start**, and the mute switch off on an iPad.

## Run it
Requires Node 22.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # browser tests (Playwright, fake clock, so a full workout runs in seconds)
```

Routines, moves and drawings are in `src/routines.ts`; `src/plan.ts` turns a routine into the timed phases.

## Releasing
Same flow as scavenger-v2. A release is one click, and you only merge the homelab PR.

1. Merge what you want to ship to `main` and let `ci` go green.
2. Actions -> **release** -> **Run workflow**, keep "Use workflow from: main", pick the bump (`minor` is the default), and run it.
3. The workflow checks `ci` passed for that commit, builds and pushes `ghcr.io/keithmrogers/circuit-timer:<tag>`, creates the tag, and opens a PR on `keithmrogers/homelab` titled `circuit-timer: bump to <tag>`.
4. Merge the homelab PR when you are ready. Nothing deploys until you merge.

If a job fails, open the run and use "Re-run failed jobs". Re-running the whole workflow after the tag exists fails by design. The scripts are in `.github/scripts/`; `.github/scripts/test.sh` checks them locally (CI runs it too).

### First release
The homelab job edits an existing `image: ghcr.io/keithmrogers/circuit-timer:v...` line in `stacks/circuit-timer/compose.yaml`, so the stack has to exist first:

1. Run the first release (it makes `v0.1.0`). The homelab job warns or fails because the stack isn't there yet; the image and tag are already done.
2. Add `stacks/circuit-timer/compose.yaml` to homelab from `deploy/compose.example.yaml`, pointing at `v0.1.0`, and put it behind your reverse proxy like the scavenger stack.
3. From then on each release opens the bump PR.

The image is private on ghcr.io by default, like scavenger-v2's. The homelab needs the same pull access it already uses for scavenger.

### Token
The homelab PR uses a `HOMELAB_TOKEN` repository secret: a fine-grained token, resource owner `keithmrogers`, only the `homelab` repo, **Contents** and **Pull requests** read and write. Follow scavenger-v2's README, "One-time token setup", naming it `circuit-timer release` and adding it here under Settings -> Secrets and variables -> Actions. (GitHub doesn't show an existing token's value again, so it's a new token rather than a copy of scavenger's.) Without it, a release still tags and pushes the image and the run shows the manual step.

## Image
`Dockerfile` builds the pages and serves them from unprivileged nginx on port 8080. `GET /health` returns `ok`.
