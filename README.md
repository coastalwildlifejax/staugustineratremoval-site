# staugustineratremoval.com

One-page lead funnel for Coastal Wildlife & Pest Control. Static HTML, no build step.

## Deploy
Cloudflare (Workers static assets) is connected to this repo. Every push to `main` deploys to production automatically.
- Build command: (blank)
- Deploy command: `npx wrangler deploy` (reads `wrangler.jsonc`; files listed in `.assetsignore` are not published)

## Editing pages
Page content lives in `_build/build.py`. Edit it, run `python3 _build/build.py`, commit the generated HTML.

## Config
Edit the `CONFIG` block near the bottom of `index.html`:
- `PHONE`: number shown and dialed on every call button
- `WEBHOOK_URL`: GoHighLevel workflow "Inbound Webhook" URL that receives form leads

## Tracking events (dataLayer)
- `lead_submit`: form submitted successfully
- `phone_click`: any call button tapped
