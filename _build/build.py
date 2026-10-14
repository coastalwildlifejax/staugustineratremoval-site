#!/usr/bin/env python3
"""Generates every page of staugustineratremoval.com.

Shared header, form, footer and schema live here so all pages stay in sync.
Edit content below, then run:  python3 _build/build.py
Commit the generated .html files — Cloudflare Pages serves them as-is.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://staugustineratremoval.com"
PHONE_E164 = "+1-904-855-9490"
BIZ_ID = SITE + "/#business"

CHECK = '<svg viewBox="0 0 24 24" fill="#F7953A" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>'
PHONE_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#F7953A" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>'

AREAS = [
    {"slug": "downtown-st-augustine", "name": "Downtown St. Augustine",
     "blurb": "Historic District, Lincolnville &amp; Uptown — year-round rodent pressure and protection plans."},
    {"slug": "st-augustine-beach", "name": "St. Augustine Beach",
     "blurb": "Anastasia Island beach homes, condos &amp; vacation rentals — coast-grade exclusion."},
    {"slug": "ponte-vedra", "name": "Ponte Vedra",
     "blurb": "Ponte Vedra Beach, Sawgrass &amp; Nocatee — tile roof and complex roofline exclusion."},
]


def business(area_served=None):
    b = {
        "@type": "PestControl",
        "@id": BIZ_ID,
        "name": "St. Augustine Rat Removal",
        "alternateName": "Coastal Wildlife & Pest Control",
        "url": SITE + "/",
        "telephone": PHONE_E164,
        "logo": SITE + "/img/logo-og.png",
        "image": SITE + "/img/logo-og.png",
        "parentOrganization": {"@type": "Organization", "name": "Coastal Wildlife & Pest Control Services",
                               "url": "https://coastalwildlifeservices.com"},
        "areaServed": area_served or [
            {"@type": "City", "name": n} for n in
            ["St. Augustine, FL", "St. Augustine Beach, FL", "Ponte Vedra Beach, FL", "Nocatee, FL",
             "Vilano Beach, FL", "St. Johns, FL", "Palm Coast, FL"]
        ],
    }
    return b


def faq_schema(faqs):
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in faqs]}


def strip(html):
    import re
    return re.sub(r"<[^>]+>", "", html).replace("&amp;", "&")


def jsonld(graph):
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + "</script>"


def head(title, desc, path, og_title):
    url = SITE + path
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/img/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#2B2A2B">
<meta property="og:type" content="website">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{SITE}/img/logo-og.png">
<meta property="og:url" content="{url}">
<meta name="geo.region" content="US-FL">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">

<!-- Google Tag Manager: paste your GTM snippet here (fires Google Ads conversion on the 'lead_submit' dataLayer event) -->
"""


def header():
    return f"""<header class="top">
  <div class="wrap">
    <a class="brand" href="/">
      <img src="/img/logo-horizontal.svg" width="1140" height="324" alt="St. Augustine Rat Removal — a Coastal Wildlife company">
    </a>
    <a class="call js-tel" href="#">
      {PHONE_ICON}
      <span><small class="lbl">Call or text — local team</small><span class="num js-phone">Call Now</span></span>
    </a>
  </div>
</header>
"""


def crumbs(name):
    return f"""<nav class="crumbs" aria-label="Breadcrumb"><div class="wrap"><ol>
  <li><a href="/">St. Augustine Rat Removal</a></li>
  <li><span aria-current="page">{name}</span></li>
</ol></div></nav>
"""


def form_card(heading, sub):
    return f"""    <div class="card" id="quote">
      <div id="formWrap">
        <h2>{heading}</h2>
        <p class="sub">{sub}</p>
        <form id="leadForm" novalidate>
          <div class="row">
            <div class="field"><label for="first_name">First name</label><input id="first_name" name="first_name" autocomplete="given-name" required></div>
            <div class="field"><label for="last_name">Last name</label><input id="last_name" name="last_name" autocomplete="family-name" required></div>
          </div>
          <div class="row">
            <div class="field"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required></div>
            <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email"></div>
          </div>
          <div class="field"><label for="address">Service address</label><input id="address" name="address" autocomplete="street-address" placeholder="Street, city, ZIP" required></div>
          <div class="field">
            <label for="issue">What are you noticing?</label>
            <select id="issue" name="issue" required>
              <option value="">Select one</option>
              <option>Scratching / noises in attic or walls</option>
              <option>Saw a rat inside or outside</option>
              <option>Droppings or chewed items</option>
              <option>Chewed wires / insulation damage</option>
              <option>Need entry points sealed</option>
              <option>Interested in a protection plan</option>
              <option>Something else</option>
            </select>
          </div>
          <input class="hp" type="text" name="company_website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <label class="consent"><input type="checkbox" name="sms_consent" value="yes">I agree to receive calls and text messages from Coastal Wildlife &amp; Pest Control about my request. Msg &amp; data rates may apply. Reply STOP to opt out. Consent is not a condition of purchase.</label>
          <button class="btn btn-orange" type="submit" id="submitBtn">Get My Free Inspection</button>
          <p class="err" id="formErr">Please fill in your name, phone, address and issue.</p>
          <p class="fine">No obligation. We never sell your info.</p>
        </form>
      </div>
      <div class="thanks" id="thanks">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="#F7953A" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8z"/></svg>
        <h2>Got it — we're on it.</h2>
        <p class="sub">A specialist will call you shortly. Need us sooner?</p>
        <a class="btn btn-orange js-tel" href="#">Call <span class="js-phone">Now</span></a>
      </div>
    </div>
"""


def hero(eyebrow, h1, zipline, lead, checks, form_heading, form_sub, ghost_label="Get a Free Inspection"):
    items = "\n".join(f"        <li>{CHECK}{c}</li>" for c in checks)
    zl = f'\n      <p class="zip">{zipline}</p>' if zipline else ""
    return f"""<section class="hero">
  <div class="wrap grid">
    <div>
      <span class="eyebrow">{eyebrow}</span>
      <h1>{h1}</h1>{zl}
      <p class="lead">{lead}</p>
      <ul class="checks">
{items}
      </ul>
      <div class="hero-ctas">
        <a class="btn btn-orange js-tel" href="#">Call <span class="js-phone">Now</span></a>
        <a class="btn btn-ghost" href="#quote">{ghost_label}</a>
      </div>
    </div>

{form_card(form_heading, form_sub)}  </div>
</section>

<div class="trust">
  <div class="wrap">
    <span>✓ Locally owned — Northeast Florida</span>
    <span>✓ Licensed &amp; insured</span>
    <span>✓ Warrantied exclusion</span>
    <span>✓ Free inspections</span>
  </div>
</div>
"""


def faq_html(faqs, heading):
    items = "\n".join(f"      <details><summary>{q}</summary><p>{a}</p></details>" for q, a in faqs)
    return f"""<section class="block alt" id="faq">
  <div class="wrap">
    <div class="center"><h2>{heading}</h2></div>
    <div class="faq">
{items}
    </div>
  </div>
</section>
"""


def areas_html(heading, intro, exclude=None, include_home=False, alt=False):
    cards = []
    for a in AREAS:
        if a["slug"] == exclude:
            continue
        cards.append(f'      <a class="area" href="/{a["slug"]}/"><b>{a["name"]}</b><span>{a["blurb"]}</span><em>Rat removal in {a["name"]} →</em></a>')
    if include_home:
        cards.append('      <a class="area" href="/"><b>All of St. Augustine</b><span>St. Johns, World Golf Village, Vilano Beach, Palm Coast and the rest of St. Johns County.</span><em>St. Augustine rat removal →</em></a>')
    cls = "block alt" if alt else "block"
    return f"""<section class="{cls}">
  <div class="wrap">
    <div class="center"><h2>{heading}</h2><p>{intro}</p></div>
    <div class="areas">
{chr(10).join(cards)}
    </div>
  </div>
</section>
"""


def final(h2, p):
    return f"""<section class="final">
  <div class="wrap">
    <h2>{h2}</h2>
    <p>{p}</p>
    <div class="hero-ctas" style="justify-content:center">
      <a class="btn btn-orange js-tel" href="#">Call <span class="js-phone">Now</span></a>
      <a class="btn btn-ghost" href="#quote">Request a Callback</a>
    </div>
  </div>
</section>
"""


def footer():
    links = " ".join(f'<a href="/{a["slug"]}/">{a["name"]}</a>' for a in AREAS)
    return f"""<footer>
  <div class="wrap">
    <span>© <span id="yr"></span> St. Augustine Rat Removal · A Coastal Wildlife &amp; Pest Control company · <a class="js-tel" href="#"><span class="js-phone">Call</span></a></span>
    <nav class="links" aria-label="Service areas"><a href="/">St. Augustine</a> {links} <a href="https://coastalwildlifeservices.com">coastalwildlifeservices.com</a></nav>
  </div>
</footer>

<div class="mbar">
  <a class="btn btn-orange js-tel" href="#">📞 Call Now</a>
  <a class="btn btn-navy" href="#quote">Free Inspection</a>
</div>

<script src="/assets/site.js?v=2"></script>
</body>
</html>
"""


def tiles(items, numbered=False, cls="signs"):
    out = []
    for i, it in enumerate(items, 1):
        if numbered:
            out.append(f'      <div class="tile"><h3><span>{i}</span>{it[0]}</h3><p>{it[1]}</p></div>')
        else:
            out.append(f'      <div class="tile"><div class="ic">{it[0]}</div><h3>{it[1]}</h3><p>{it[2]}</p></div>')
    return f'    <div class="{cls}">\n' + "\n".join(out) + "\n    </div>"


def write(path, html):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(html)


# ---------------------------------------------------------------- Home page

HOME_FAQ = [
    ("How much does rat removal cost?", "It depends on the size of the home and how many entry points need sealing. The inspection is free, and you get a clear, written price before we start."),
    ("Do you use poison?", "Not inside your home. Poisoned rats often die in walls and attics, causing odor problems. We remove them with trapping and stop new ones by sealing entry points."),
    ("How long does it take?", "Exclusion work is usually completed in a day or two, with trap checks over the following visits until activity stops."),
    ("Will they come back?", "Not through the areas we seal — that's what the warranty covers. Sealing entry points is the only permanent fix."),
    ("What areas do you serve?", 'All of St. Johns County, including <a href="/downtown-st-augustine/">Downtown St. Augustine</a>, <a href="/st-augustine-beach/">St. Augustine Beach</a>, <a href="/ponte-vedra/">Ponte Vedra</a>, Nocatee, Vilano Beach, World Golf Village, St. Johns and Palm Coast.'),
]


def build_home():
    body = hero(
        "St. Augustine &amp; St. Johns County",
        "Rats in the Attic? We Get Them Out — and Keep Them Out.",
        "",
        "Poison and snap traps don't fix a rat problem. Sealing the entry points does. We trap the rats, seal every gap they're using, and back the work with a warranty.",
        ["Free inspection — we find every entry point", "Trapping, exclusion &amp; sanitation by one local team",
         "Exclusion work backed by a written warranty", "Licensed &amp; insured in Florida"],
        "Book Your Free Rat Inspection", "Takes 30 seconds. A local specialist will call you back fast.")
    body += """
<section class="block">
  <div class="wrap">
    <div class="center">
      <h2>Signs You Have Rats</h2>
      <p>Roof rats are common across St. Augustine. If you're seeing any of these, they're already inside.</p>
    </div>
""" + tiles([
        ("🔊", "Scratching at night", "Running or scratching in the attic, ceiling or walls — usually after dark."),
        ("💩", "Droppings", "Dark, pellet-shaped droppings in the attic, garage, pantry or under sinks."),
        ("⚡", "Chewed wires", "Gnawed wiring, AC lines and insulation — a real fire and repair risk."),
        ("🐾", "Rub marks &amp; trails", "Greasy smudges along beams, pipes and entry points where they travel."),
        ("👃", "Odor", "A musky ammonia smell — or worse, a dead rat in a wall or attic."),
        ("🌴", "Activity in palms &amp; roofline", "Rats running along fences, palm trees, power lines or the roof edge."),
    ]) + """
  </div>
</section>

<section class="block alt">
  <div class="wrap">
    <div class="center">
      <h2>How We Solve It — For Good</h2>
      <p>Most companies stop at traps. That's why the rats come back. We fix the cause.</p>
    </div>
    <div class="steps">
      <div class="step"><h3>Inspect</h3><p>We walk the roofline, attic and foundation to find every entry point and show you exactly what we found.</p></div>
      <div class="step"><h3>Remove</h3><p>Strategic trapping to remove the rats already inside, with follow-up visits until activity stops.</p></div>
      <div class="step"><h3>Seal &amp; Protect</h3><p>Every gap gets sealed with rodent-proof materials — then we back that exclusion with a warranty.</p></div>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap why">
    <div>
      <h2>Why St. Augustine Homeowners Call Coastal</h2>
      <ul>
        <li><span style="font-size:1.4rem">🏠</span><div><b>Local, not a call center</b><span>Our technicians live and work in Northeast Florida.</span></div></li>
        <li><span style="font-size:1.4rem">🔒</span><div><b>Exclusion specialists</b><span>Sealing entry points is our core service — not an upsell.</span></div></li>
        <li><span style="font-size:1.4rem">📋</span><div><b>Straight answers</b><span>Photos of what we find and a clear price before any work starts.</span></div></li>
        <li><span style="font-size:1.4rem">🛡️</span><div><b>Warranty-backed</b><span>If rats get back in through sealed areas, we come back.</span></div></li>
      </ul>
    </div>
    <div class="callout">
      <div class="big">Free</div>
      <h3>Rat Inspection</h3>
      <p>Find out how they're getting in, what it'll take to fix, and what it costs — no pressure.</p>
      <a class="btn btn-orange" href="#quote">Book My Inspection</a>
    </div>
  </div>
</section>
""" + areas_html("Rat Removal Across St. Johns County",
                 "Every part of St. Augustine has its own rat problem. Here's what we see — and how we handle it — in the areas we're called to most.",
                 alt=True) \
        + faq_html(HOME_FAQ, "Common Questions").replace('class="block alt" id="faq"', 'class="block" id="faq"') \
        + final("Every Night You Wait, They Do More Damage.", "Get a free inspection and a clear plan today.")

    schema = jsonld([business(), {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "St. Augustine Rat Removal",
                                  "publisher": {"@id": BIZ_ID}}, faq_schema(HOME_FAQ)])
    html = head("St. Augustine Rat Removal | Rodent Exclusion &amp; Control",
                "Local St. Augustine rat removal. We trap the rats, seal every entry point, and back the exclusion with a warranty. Free inspection — call or request a callback.",
                "/", "St. Augustine Rat Removal — Rats Out. Entry Points Sealed.") \
        + schema + "\n</head>\n<body data-area=\"general\">\n\n" + header() + "\n" + body + "\n" + footer()
    write("index.html", html)


# ---------------------------------------------------------------- Location pages

def build_location(p):
    path = f"/{p['slug']}/"
    url = SITE + path
    body = crumbs(p["crumb"]) + "\n" + hero(p["eyebrow"], p["h1"], p["zipline"], p["lead"], p["checks"],
                                            p["form_heading"], "Takes 30 seconds. A local specialist will call you back fast.")

    why_paras = "\n".join(f"      <p>{x}</p>" for x in p["why"])
    aside = "\n".join(f"          <li>{x}</li>" for x in p["aside_items"])
    body += f"""
<section class="block">
  <div class="wrap split">
    <div class="prose">
      <h2>{p['why_h2']}</h2>
{why_paras}
    </div>
    <aside class="aside">
      <h3>{p['aside_h3']}</h3>
      <ul>
{aside}
      </ul>
    </aside>
  </div>
</section>

<section class="block alt">
  <div class="wrap">
    <div class="center">
      <h2>{p['entry_h2']}</h2>
      <p>{p['entry_intro']}</p>
    </div>
{tiles(p['entry'], numbered=True, cls='entry')}
  </div>
</section>
"""
    body += p["plan_html"]

    hoods = "\n".join(f"        <li>{n}<small>{s}</small></li>" if s else f"        <li>{n}</li>" for n, s in p["hoods"])
    body += f"""
<section class="block alt">
  <div class="wrap hoods">
    <div>
      <h2>{p['hoods_h2']}</h2>
      <p style="color:var(--muted);margin:0 0 22px">{p['hoods_intro']}</p>
      <ul class="hoodlist">
{hoods}
      </ul>
    </div>
    <iframe class="map" title="Map of {p['crumb']}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="https://maps.google.com/maps?q={p['map_q']}&amp;z={p['map_z']}&amp;output=embed"></iframe>
  </div>
</section>
"""
    body += faq_html(p["faq"], f"{p['crumb']} Rat Removal FAQ").replace('class="block alt" id="faq"', 'class="block" id="faq"')
    body += areas_html("Other Areas We Serve", "Same local team, same warranty — anywhere in St. Johns County.",
                       exclude=p["slug"], include_home=True, alt=True)
    body += final(p["final_h2"], p["final_p"])

    place = {"@type": "Place", "name": p["place_name"],
             "geo": {"@type": "GeoCoordinates", "latitude": p["geo"][0], "longitude": p["geo"][1]}}
    schema = jsonld([
        business(),
        {"@type": "Service", "@id": url + "#service", "name": p["service_name"],
         "serviceType": "Rat removal and rodent exclusion", "url": url,
         "provider": {"@id": BIZ_ID}, "areaServed": place,
         "description": strip(p["meta"])},
        {"@type": "WebPage", "@id": url, "url": url, "name": strip(p["title"]),
         "about": {"@id": url + "#service"}, "breadcrumb": {"@id": url + "#breadcrumb"}},
        {"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "St. Augustine Rat Removal", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": p["crumb"], "item": url}]},
        faq_schema(p["faq"]),
    ])
    html = head(p["title"], p["meta"], path, p["og_title"]) + schema + \
        f'\n</head>\n<body data-area="{p["slug"]}">\n\n' + header() + body + "\n" + footer()
    write(f"{p['slug']}/index.html", html)


def plan_cards(h2, intro, cards, note=None):
    c = "\n".join(f'      <div class="step"><h3>{t}</h3><p>{d}</p></div>' for t, d in cards)
    n = f'\n    <p style="max-width:820px;margin:28px auto 0;color:var(--muted);text-align:center">{note}</p>' if note else ""
    return f"""
<section class="block">
  <div class="wrap">
    <div class="center"><h2>{h2}</h2><p>{intro}</p></div>
    <div class="steps">
{c}
    </div>{n}
  </div>
</section>
"""


DOWNTOWN = {
    "slug": "downtown-st-augustine",
    "crumb": "Downtown St. Augustine",
    "title": "Downtown St. Augustine Rat Removal &amp; Rodent Prevention",
    "og_title": "Rat Removal &amp; Rodent Protection in Downtown St. Augustine",
    "meta": "Downtown St. Augustine has constant rat pressure. We remove rats, seal historic homes carefully, and keep them out with a protection plan. Free inspection.",
    "service_name": "Rat Removal & Rodent Protection in Downtown St. Augustine",
    "place_name": "Downtown St. Augustine, FL 32084",
    "geo": (29.8925, -81.3130),
    "eyebrow": "Historic District · Lincolnville · Uptown",
    "h1": "Rat Removal &amp; Rodent Protection in Downtown St. Augustine",
    "zipline": "Serving 32084 — from the Castillo to Lincolnville",
    "lead": "Downtown isn't a one-time rat problem. It's a neighborhood with constant rodent pressure, and we're called here on a regular basis. The homes that stay rat-free aren't the ones that got trapped once — they're the ones that got sealed and stay protected.",
    "checks": ["Rodent protection plans built for downtown's year-round pressure",
               "Exclusion that respects historic homes — low-profile, color-matched",
               "Free inspection with photos of every entry point",
               "Licensed &amp; insured — local Coastal team"],
    "form_heading": "Book a Free Downtown Rat Inspection",
    "why_h2": "Why Downtown St. Augustine Has So Many Rats",
    "why": [
        "Rats need three things: food, water and shelter. Downtown St. Augustine packs all three into a few square blocks. Restaurants and bars line St. George Street and the bayfront, dumpsters and grease bins sit in narrow alleys, and the Matanzas River and the city's storm drains supply water and cover. Rats from those commercial blocks don't stay there — they move house to house along fences, power lines, palms and shared walls.",
        "Then there's the housing. Downtown has some of the oldest buildings in the country — coquina and tabby walls, wood-frame Victorians in Lincolnville, homes raised on piers over open crawlspaces, and generations of additions where old construction meets new. Every seam, settling crack and rotted board is a potential entry point, and a rat only needs a gap about the size of a quarter.",
        "That's why, downtown, <strong>removal alone rarely holds</strong>. Trap the rats out of one house and the population next door moves in. The cost-effective approach is to seal the house properly once, then keep it protected with scheduled monitoring — catching new pressure on the outside before it becomes another attic full of rats.",
    ],
    "aside_h3": "What drives downtown rat pressure",
    "aside_items": ["Restaurant and dumpster density on the tourist blocks",
                    "Old masonry, crawlspaces and settling gaps",
                    "Tight lots — rats travel roof to roof",
                    "Bayfront, marsh edges and storm drains",
                    "Overgrown courtyards, palms and vines",
                    "B&amp;Bs and vacation rentals with irregular occupancy"],
    "entry_h2": "Where Rats Get Into Historic Downtown Homes",
    "entry_intro": "Older homes don't fail in the same places as new construction. These are the entry points we find most often in the 32084 historic neighborhoods.",
    "entry": [
        ("Crawlspaces &amp; pier foundations", "Raised homes in Lincolnville and the Historic District often have open or poorly screened crawlspaces. Rats nest underneath and climb in through plumbing chases and gaps in the floor."),
        ("Roof-to-wall joints &amp; dormers", "Decades of additions leave gaps where rooflines meet walls, around dormers and along fascia that has rotted or pulled away."),
        ("Coquina, tabby &amp; brick gaps", "Mortar erodes and old masonry settles. Gaps around utility lines, old vents and where masonry meets wood framing are common."),
        ("Gable &amp; soffit vents", "Original wood vents and screens break down in salt air. A torn screen behind a decorative vent is an open door to the attic."),
        ("Chimneys &amp; old flues", "Uncapped or abandoned chimneys and flues are direct routes into attics and wall voids."),
        ("Overhanging branches, vines &amp; lines", "On tight downtown lots, branches, vines and overhead lines touch your roof — and rats use them to cross over from next door."),
    ],
    "plan_html": """
<section class="block">
  <div class="wrap">
    <div class="center">
      <h2>Why Protection Beats Repeat Clean-Ups Downtown</h2>
      <p>Downtown homeowners who only call when they hear scratching end up paying for the same problem over and over. Here's how the two approaches compare.</p>
    </div>
    <div class="tablewrap">
    <table class="compare">
      <thead><tr><th></th><th>Reactive: trap when you hear them</th><th class="win">Seal once + protection plan</th></tr></thead>
      <tbody>
        <tr><td>What you pay for</td><td>Trapping every time rats get back in, plus damage and clean-up each round</td><td class="win">One-time exclusion, then predictable scheduled service</td></tr>
        <tr><td>Damage risk</td><td>Chewed wiring, soiled insulation and odor before you notice</td><td class="win">New activity caught outside, before rats reach the attic</td></tr>
        <tr><td>Neighborhood pressure</td><td>New rats move in from surrounding properties</td><td class="win">Sealed house, monitored perimeter, re-checked after storms</td></tr>
        <tr><td>Historic home</td><td>Repeated disruption to the house</td><td class="win">Sealed once with low-profile, color-matched materials</td></tr>
      </tbody>
    </table>
    </div>
  </div>
</section>
""" + plan_cards(
        "What's in a Downtown Rodent Protection Plan",
        "Three parts, one goal: rats stay outside.",
        [("Seal", "Full exclusion of every entry point, using materials and methods suited to historic construction."),
         ("Monitor", "Scheduled visits to inspect the exterior, check monitoring stations and catch new activity early."),
         ("Maintain", "We re-check seals after storms and as the house settles, and close new gaps before rats find them.")],
        "<strong>Historic homes:</strong> exterior changes in St. Augustine's historic districts can fall under the city's historic preservation review. Our exclusion work is designed to be low-profile and minimally invasive — and if a repair goes beyond sealing, we'll tell you before any work starts. "
        "<strong>Own a restaurant, inn or shop downtown?</strong> Ask about a commercial protection plan."),
    "hoods_h2": "Downtown Neighborhoods We Serve",
    "hoods_intro": "Our technicians are in the 32084 neighborhoods regularly — we know the alleys, the lot lines and the houses that share walls.",
    "hoods": [("Historic District", "St. George St, Aviles St &amp; the Plaza"),
              ("Lincolnville", "Victorian homes south of King St"),
              ("Uptown / San Marco Ave", "North of the Castillo"),
              ("Abbott Tract", "Bayfront homes north of the fort"),
              ("Model Land Company District", "Around Flagler College"),
              ("Nelmar Terrace", ""),
              ("Fullerwood", ""),
              ("West Augustine", "")],
    "map_q": "Historic+Downtown+St.+Augustine,+FL+32084", "map_z": 14,
    "faq": [
        ("Why do rats keep coming back to my downtown St. Augustine home?",
         "Because the pressure around you never goes away. Restaurants, dumpsters, old buildings and tight lots support a large rat population, so trapping the rats inside only makes room for the next ones. The fix is sealing every entry point and keeping the house protected."),
        ("Is a rodent protection plan worth it downtown?",
         "For most downtown homes, yes. One attic infestation can mean chewed wiring, contaminated insulation and odor clean-up. A protection plan catches new activity on the outside — before rats get established — at a predictable cost."),
        ("Will exclusion work damage my historic home?",
         "No. We use low-profile, color-matched materials and methods suited to older construction. If a gap needs carpentry or masonry repair, we'll show you photos and explain the options first."),
        ("Can you protect my downtown restaurant, inn or vacation rental?",
         "Yes. We service commercial and short-term rental properties downtown. A rodent sighting at a B&amp;B or rental turns into a bad review fast, so we set those properties up on scheduled protection."),
        ("Do I have roof rats or Norway rats?",
         "Downtown has both. Roof rats climb — they're the ones in attics and running along power lines. Norway rats burrow — they show up in crawlspaces, along foundations and near the bayfront and drains. Treatment differs, which is why the inspection matters."),
    ],
    "final_h2": "Downtown Rats Don't Take a Season Off.",
    "final_p": "Get a free inspection and a protection plan built for your block.",
}

BEACH = {
    "slug": "st-augustine-beach",
    "crumb": "St. Augustine Beach",
    "title": "St. Augustine Beach Rat Removal &amp; Rodent Control",
    "og_title": "Rat Removal in St. Augustine Beach &amp; Anastasia Island",
    "meta": "Rats in a St. Augustine Beach home or rental? We remove them, seal the gaps salt air and storms open up, and protect rentals between guests. Free inspection.",
    "service_name": "Rat Removal in St. Augustine Beach & Anastasia Island",
    "place_name": "St. Augustine Beach, FL 32080",
    "geo": (29.8506, -81.2650),
    "eyebrow": "St. Augustine Beach · Anastasia Island · Crescent Beach",
    "h1": "Rat Removal in St. Augustine Beach &amp; Anastasia Island",
    "zipline": "Serving 32080 — from Davis Shores to Crescent Beach",
    "lead": "Beach homes take a beating. Salt air, sun and storms open up gaps that roof rats find fast. Whether it's your full-time home or a rental between guests, we get the rats out, seal what the coast has opened up, and keep it that way.",
    "checks": ["Corrosion-resistant exclusion materials built for the coast",
               "Rental-friendly scheduling between guest stays",
               "Post-storm roofline and soffit checks",
               "Licensed &amp; insured — local Coastal team"],
    "form_heading": "Book a Free Beach Rat Inspection",
    "why_h2": "Why Rats Move Into Beach Homes on Anastasia Island",
    "why": [
        "Most people picture rats downtown, not at the beach. But roof rats thrive on Anastasia Island. Sabal palms, sea grapes, wax myrtle and dune vegetation give them food and cover right up against the house — and the palms that frame so many beach homes double as a ladder to the roofline.",
        "The coast is also hard on houses. Salt air corrodes metal screens and fasteners, sun breaks down sealants, and every tropical storm loosens soffits, fascia and roof vents. Gaps that weren't there last year are there now, and a rat only needs one.",
        "Then there are the homes themselves. Raised and stilt homes, open storage under the living space, outdoor showers and condos with shared walls all create easy access. And at the many <strong>vacation rentals along A1A</strong>, weeks of vacancy let rats settle in undisturbed — until a guest hears them at 2 a.m.",
    ],
    "aside_h3": "What we see on the island",
    "aside_items": ["Palms and sea grapes touching the roof",
                    "Corroded vent and soffit screens",
                    "Storm-loosened fascia and roof vents",
                    "Open space under raised homes",
                    "Pool equipment, outdoor kitchens and grills",
                    "Vacant weeks at rentals and second homes"],
    "entry_h2": "Where Rats Get Into St. Augustine Beach Homes",
    "entry_intro": "Coastal homes fail in coastal ways. These are the entry points we find most often on Anastasia Island.",
    "entry": [
        ("Soffits &amp; fascia", "Wind-driven rain and storms separate soffit panels and rot fascia boards. It's one of the most common attic entries we find on the island."),
        ("Roof, gable &amp; ridge vents", "Salt air eats through light aluminum screen. We replace it with heavier, corrosion-resistant material."),
        ("Under raised homes", "Pilings, plumbing chases and floor penetrations under stilt homes give rats a sheltered route up into the walls."),
        ("Garage door seals", "Sun-dried, cracked garage seals leave a gap at the corners — enough for a rat to squeeze under."),
        ("AC lines &amp; utility penetrations", "Where AC lines, cable and plumbing enter the house, the original foam or sealant rarely survives coastal weather."),
        ("Palms &amp; vegetation", "Fronds and sea grapes touching the roof are a bridge. We'll tell you exactly what to trim and how far back."),
    ],
    "plan_html": plan_cards(
        "Built for Beach Homes, Rentals &amp; Second Homes",
        "Different properties on the island need different plans.",
        [("Full-time residents", "Remove the rats, seal with coast-grade materials, and get a post-storm check so new gaps get closed before rats find them."),
         ("Vacation rentals", "We schedule work between guest stays, coordinate with your property manager, and keep the property protected so a rodent never shows up in a review."),
         ("Second homes", "Away for months? Vacant homes are where rats settle in. A protection plan keeps someone checking while you're gone.")],
        "<strong>After a named storm,</strong> book a roofline check. Storms loosen soffits and vents at the same time they push rats out of damaged areas looking for shelter."),
    "hoods_h2": "St. Augustine Beach &amp; Anastasia Island Areas We Serve",
    "hoods_intro": "From the Bridge of Lions to Crescent Beach, our technicians cover the whole island.",
    "hoods": [("City of St. Augustine Beach", "A1A Beach Blvd &amp; the pier"),
              ("Davis Shores", "Across the Bridge of Lions"),
              ("Lighthouse area", "Around the St. Augustine Lighthouse"),
              ("Anastasia State Park area", "Pope Rd &amp; A1A"),
              ("Sea Colony", ""),
              ("Coquina Gables", ""),
              ("Butler Beach", ""),
              ("Crescent Beach", "")],
    "map_q": "St.+Augustine+Beach,+FL+32080", "map_z": 13,
    "faq": [
        ("Do roof rats really live at the beach?",
         "Yes. Roof rats are excellent climbers and do well in coastal vegetation — palms, sea grapes and dense dune plants. On Anastasia Island they commonly end up in attics, soffits and the space under raised homes."),
        ("Can you work around my rental's guest schedule?",
         "Yes. Send us your calendar or connect us with your property manager, and we'll schedule the inspection, trapping and exclusion between stays."),
        ("Why do rats show up after a hurricane or tropical storm?",
         "Storms loosen soffits and lift roof vents, and they push rats out of flooded or damaged areas. Both happen at once — displaced rats looking for shelter, and new gaps in your roofline."),
        ("What materials do you use near the ocean?",
         "Corrosion-resistant materials — heavy-gauge mesh, metal flashing and exterior-rated sealants — so the seal doesn't fail after one salty season."),
        ("Do you service beachfront condos?",
         "Yes. In condos, rats often travel through shared walls and utility chases, so we look at your unit and the building's common entry points. We can coordinate with your HOA or management company."),
    ],
    "final_h2": "Don't Let Rats Ruin Beach Season.",
    "final_p": "Free inspection anywhere on Anastasia Island.",
}

PONTE_VEDRA = {
    "slug": "ponte-vedra",
    "crumb": "Ponte Vedra",
    "title": "Ponte Vedra Rat Removal | Tile Roof Rodent Exclusion",
    "og_title": "Rat Removal in Ponte Vedra Beach, Sawgrass &amp; Nocatee",
    "meta": "Rat removal for Ponte Vedra Beach, Sawgrass, Marsh Landing and Nocatee homes. Tile roof exclusion, clean careful work and warrantied results. Free inspection.",
    "service_name": "Rat Removal in Ponte Vedra Beach",
    "place_name": "Ponte Vedra Beach, FL 32082",
    "geo": (30.2397, -81.3856),
    "eyebrow": "Ponte Vedra Beach · Sawgrass · Nocatee",
    "h1": "Rat Removal in Ponte Vedra Beach",
    "zipline": "Serving 32082 &amp; 32081 — from Old Ponte Vedra to Nocatee",
    "lead": "Ponte Vedra homes are beautiful — and complicated. Barrel tile roofs, multi-level rooflines and mature landscaping give roof rats plenty of ways in. We find every one of them and seal it right, without leaving a mess behind.",
    "checks": ["Tile roof eave closures and complex roofline exclusion",
               "Careful work — we protect your home and landscaping",
               "Photo report of every entry point we find",
               "Licensed &amp; insured — local Coastal team"],
    "form_heading": "Book a Free Ponte Vedra Rat Inspection",
    "why_h2": "Why Rats Are a Problem in Ponte Vedra Homes",
    "why": [
        "Ponte Vedra's landscaping is part of what makes it Ponte Vedra — mature oaks, palms, ligustrum and podocarpus hedges, and homes set along golf courses, lagoons and the Intracoastal. To a roof rat, that's ideal habitat: dense cover, water, fruit and seed, and branches that reach the roof.",
        "The homes add to it. <strong>Barrel tile roofs</strong> are the big one — the open ends of the tiles along the eaves create protected channels that rats nest in and use to reach the attic. Add multi-level rooflines, dormers, chimney chases and long runs of soffit, and a typical Ponte Vedra home simply has more potential entry points than an average house.",
        "Newer homes aren't immune. In Nocatee and the newer sections of Ponte Vedra, we often find construction gaps — around AC line sets, garage door corners, roof-to-wall transitions and dryer vents — that were never sealed when the home was built.",
    ],
    "aside_h3": "Ponte Vedra pressure points",
    "aside_items": ["Barrel and S-tile roof eaves",
                    "Complex, multi-level rooflines",
                    "Golf course, lagoon and marsh edges",
                    "Mature oaks and palms over the roof",
                    "Pool cages, lanais and outdoor kitchens",
                    "Bird feeders, citrus and pet food outdoors"],
    "entry_h2": "Where Rats Get Into Ponte Vedra Homes",
    "entry_intro": "Bigger, more detailed homes mean more places to check. These are the entry points we find most often in 32082 and 32081.",
    "entry": [
        ("Tile roof eaves", "Open tile ends at the eave — with no bird stop or eave closure — are one of the most common rat entries in Ponte Vedra. We install closures that seal them without changing the roof's look."),
        ("Roof-to-wall transitions", "Where a lower roof meets a second-story wall, flashing gaps give rats direct access to the attic."),
        ("Garage doors", "Large garage doors with worn corner seals and side gaps are a ground-level way in — especially on side-load garages."),
        ("AC line sets &amp; penetrations", "The line set from your AC to the house is often sealed with expanding foam, which rats chew straight through."),
        ("Chimney chases &amp; roof vents", "Chimney caps, dryer vents, bath fans and ridge vents all need to be checked and properly screened."),
        ("Soffits &amp; dormers", "Long soffit runs and dormer returns hide gaps you'd never see from the ground. We inspect them up close."),
    ],
    "plan_html": plan_cards(
        "What Ponte Vedra Homeowners Can Expect",
        "A higher-value home deserves a more thorough job.",
        [("Detailed inspection", "Roof, attic, soffits and foundation, with a photo report so you see exactly what we found — no guessing."),
         ("Careful, clean work", "We protect your home and landscaping while we work, keep exclusion out of sight, and leave the site clean."),
         ("Sanitation if needed", "If rats have been in the attic, we can remove droppings and contaminated insulation and sanitize the space.")],
        "<strong>HOA and gated communities:</strong> exclusion materials are low-profile and color-matched to stay out of sight. We can coordinate access and scheduling with your HOA or property manager."),
    "hoods_h2": "Ponte Vedra Neighborhoods We Serve",
    "hoods_intro": "From the oceanfront to the Intracoastal, we cover Ponte Vedra Beach and Nocatee.",
    "hoods": [("Old Ponte Vedra", "Along Ponte Vedra Blvd"),
              ("Sawgrass Country Club", ""),
              ("Sawgrass Players Club", "Around TPC Sawgrass"),
              ("Marsh Landing", ""),
              ("The Plantation", ""),
              ("Palm Valley", "Along the Intracoastal"),
              ("South Ponte Vedra Beach", "A1A toward Guana"),
              ("Nocatee", "32081")],
    "map_q": "Ponte+Vedra+Beach,+FL+32082", "map_z": 12,
    "faq": [
        ("Why do rats get into tile roofs?",
         "Barrel and S-tiles leave an open channel at the eave. Unless the roof has bird stops or eave closures, rats use those channels for shelter and as a protected path to gaps in the roof deck and attic."),
        ("Can you seal a tile roof without damaging it?",
         "Yes. Eave closures go in at the edge of the roof, and we work carefully around tile. If we find cracked or loose tile, we'll document it with photos so your roofer can address it."),
        ("I live in a newer home in Nocatee — why do I have rats?",
         "New construction often leaves gaps around AC line sets, garage doors and roof-to-wall transitions. Nocatee's ponds, preserves and landscaping also support plenty of rats. Sealing those builder gaps solves most cases."),
        ("Will the work be visible from the street?",
         "We use low-profile, color-matched materials designed to blend in with the home. Most exclusion work isn't noticeable from the ground."),
        ("Do you work with HOAs and property managers?",
         "Yes. We can coordinate access and scheduling with HOAs, property managers and gated communities across Ponte Vedra."),
    ],
    "final_h2": "Protect the Home You've Invested In.",
    "final_p": "Free inspection anywhere in Ponte Vedra Beach, Sawgrass and Nocatee.",
}


def build_sitemap():
    urls = ["/"] + [f"/{a['slug']}/" for a in AREAS]
    items = "\n".join(f"  <url><loc>{SITE}{u}</loc></url>" for u in urls)
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{items}\n</urlset>\n')


if __name__ == "__main__":
    build_home()
    for page in (DOWNTOWN, BEACH, PONTE_VEDRA):
        build_location(page)
    build_sitemap()
    print("built:", ", ".join(["/"] + [f"/{a['slug']}/" for a in AREAS]))
