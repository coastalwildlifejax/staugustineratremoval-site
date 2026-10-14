# staugustineratremoval.com

One-page lead funnel for Coastal Wildlife & Pest Control. Static HTML, no build step.

## Deploy
Cloudflare Pages is connected to this repo. Every push to `main` deploys to production automatically.
Pushes to any other branch get a preview URL.

## Config
Edit the `CONFIG` block near the bottom of `index.html`:
- `PHONE`: number shown and dialed on every call button
- `WEBHOOK_URL`: GoHighLevel workflow "Inbound Webhook" URL that receives form leads

## Tracking events (dataLayer)
- `lead_submit`: form submitted successfully
- `phone_click`: any call button tapped
