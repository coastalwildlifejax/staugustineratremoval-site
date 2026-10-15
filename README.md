# staugustineratremoval.com

One-page lead funnel + area pages for St. Augustine Rat Removal (a Coastal Wildlife & Pest Control company).
Plain static HTML/CSS/JS in `public/`. No framework, no build step on Cloudflare.

## Deploy — Cloudflare Pages (same setup as jaxpestremoval)
Pages → Create → Connect to Git → `coastalwildlifejax/staugustineratremoval-site`
- Production branch: `main`
- Framework preset: **None**
- Build command: *(blank)*
- Build output directory: **`public`**

Every push to `main` deploys. Custom domains: `staugustineratremoval.com` + `www`.

## Editing pages
Page content lives in `_build/build.py`. Edit it, run `python3 _build/build.py` (writes into `public/`), commit.

## Config — `public/assets/site.js`
- `WEBHOOK_URL`: GoHighLevel "Inbound Webhook" trigger that receives form leads.
- Phone numbers are printed in the HTML (`PHONE_DISPLAY` / `TEL` in `_build/build.py`) so CallRail's swap.js can replace them.

## Tracking (dataLayer events)
- `lead_submit`: form submitted (with `service_area`)
- `phone_click`: any call button tapped
