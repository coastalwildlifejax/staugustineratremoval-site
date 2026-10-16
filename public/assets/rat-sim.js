/* Rat entry simulator v2 — night-time cutaway, "Unprotected vs Protected".
   Mounts into [data-ratsim]; data-scene="home" | "restaurant" picks the default.
   Pure SVG + requestAnimationFrame, no dependencies. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var VB = { x: 80, y: 125, w: 1080, h: 575 };
  var ASPECT = VB.w / VB.h;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var C = { bad: "#F04438", good: "#F57C00", eye: "#FFC24D" };

  /* ---------- geometry ---------- */
  function quad(p0, c, p1, n) { var o = []; for (var i = 0; i <= n; i++) { var t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]); } return o; }
  function cubic(p0, c1, c2, p1, n) { var o = []; for (var i = 0; i <= n; i++) { var t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0], u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1]]); } return o; }
  function cat() { var o = []; for (var i = 0; i < arguments.length; i++) o = o.concat(arguments[i]); return o; }
  function prep(pts) { var cum = [0]; for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts: pts, cum: cum, len: cum[cum.length - 1] }; }
  function at(p, d) {
    var pts = p.pts, cum = p.cum, n = pts.length;
    if (d <= 0) return { x: pts[0][0], y: pts[0][1], a: Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) };
    if (d >= p.len) return { x: pts[n - 1][0], y: pts[n - 1][1], a: Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]) };
    var i = 1; while (cum[i] < d) i++;
    var t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1), a = pts[i - 1], b = pts[i];
    return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, a: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  function inside(poly, x, y) { var c = false; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) { var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function angDiff(a, b) { var d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function roofR(x) { return 158 + (x - 600) * 0.5924; }

  /* ---------- shared defs (night palette) ---------- */
  var DEFS =
    '<defs>' +
    '<linearGradient id="rsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#061631"/><stop offset=".55" stop-color="#0D2C5A"/><stop offset="1" stop-color="#1F477D"/></linearGradient>' +
    '<linearGradient id="rsSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F2620"/><stop offset="1" stop-color="#1C1713"/></linearGradient>' +
    '<linearGradient id="rsRoom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF2D9"/><stop offset="1" stop-color="#F2D3A0"/></linearGradient>' +
    '<linearGradient id="rsAttic" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3B5A"/><stop offset="1" stop-color="#3B4E70"/></linearGradient>' +
    '<linearGradient id="rsCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD58A" stop-opacity=".42"/><stop offset="1" stop-color="#FFD58A" stop-opacity="0"/></linearGradient>' +
    '<radialGradient id="rsGlow"><stop offset="0" stop-color="#FFD58A" stop-opacity=".55"/><stop offset="1" stop-color="#FFD58A" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="rsMoonGlow"><stop offset="0" stop-color="#F6EED6" stop-opacity=".35"/><stop offset="1" stop-color="#F6EED6" stop-opacity="0"/></radialGradient>' +
    '<pattern id="rsDots" width="46" height="30" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="1.7" fill="#3E322A"/><circle cx="30" cy="22" r="2.3" fill="#3A2F27"/><circle cx="38" cy="6" r="1.1" fill="#463830"/></pattern>' +
    '<pattern id="rsShL" width="22" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(-30.6)"><rect width="22" height="11" fill="#22304A"/><path d="M0 10.5H22M11 0V5.5M0 5.5H22M0 5.5V11M22 5.5V11" stroke="#17223A" stroke-width="1.2"/></pattern>' +
    '<pattern id="rsShR" width="22" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(30.6)"><rect width="22" height="11" fill="#22304A"/><path d="M0 10.5H22M11 0V5.5M0 5.5H22M0 5.5V11M22 5.5V11" stroke="#17223A" stroke-width="1.2"/></pattern>' +
    '<pattern id="rsInsul" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#A58A55"/><path d="M0 16Q4 5 8 16Q12 5 16 16" fill="#8F774A"/></pattern>' +
    '<pattern id="rsMesh" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#B8C2CC"/><path d="M0 0L4 4M4 0L0 4" stroke="#5E6A78" stroke-width=".7"/></pattern>' +
    '<pattern id="rsBrick" width="28" height="14" patternUnits="userSpaceOnUse"><rect width="28" height="14" fill="#7A3F2C"/><path d="M0 13.5H28M0 6.5H28M14 0V6.5M0 7V14M28 7V14" stroke="#5C2E20" stroke-width="1.2"/></pattern>' +
    '<pattern id="rsTile" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#FBF1DF"/><path d="M0 19.5H20M19.5 0V20" stroke="#EAD9BC" stroke-width="1"/></pattern>' +
    '<filter id="rsBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>' +
    '<filter id="rsSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>' +
    '</defs>';

  function sky(extra) {
    return '<rect width="1300" height="760" x="-50" y="-30" fill="url(#rsSky)"/><g class="rs-stars"></g>' +
      '<circle cx="1000" cy="246" r="90" fill="url(#rsMoonGlow)"/><circle cx="1000" cy="246" r="26" fill="#F6EED6"/><circle cx="992" cy="239" r="5" fill="#E6DCC0"/><circle cx="1009" cy="254" r="3.5" fill="#E6DCC0"/>' +
      '<g fill="#1B3B6A" opacity=".75"><ellipse cx="440" cy="178" rx="64" ry="12"/><ellipse cx="474" cy="167" rx="34" ry="13"/><ellipse cx="690" cy="160" rx="56" ry="10"/></g>' +
      (extra || "");
  }
  function ground(grass) {
    return '<rect x="-50" y="600" width="1300" height="130" fill="url(#rsSoil)"/><rect x="-50" y="600" width="1300" height="130" fill="url(#rsDots)"/>' +
      (grass === false ? "" : '<rect x="-50" y="592" width="1300" height="12" fill="#1C4430"/><rect x="-50" y="592" width="1300" height="3" fill="#2B5E43"/>');
  }
  function pole() {
    return '<rect x="1106" y="232" width="12" height="370" fill="#33281F"/><rect x="1106" y="232" width="4" height="370" fill="#45372B"/>' +
      '<rect x="1080" y="244" width="64" height="7" rx="2" fill="#2A2119"/><g fill="#C9D2E3"><rect x="1086" y="236" width="6" height="9" rx="2"/><rect x="1132" y="236" width="6" height="9" rx="2"/></g>' +
      '<rect x="1098" y="300" width="28" height="34" rx="5" fill="#5D6B85"/><rect x="1098" y="300" width="28" height="6" rx="3" fill="#4A5670"/>';
  }

  /* ---------- scenes ---------- */
  var SCENES = {
    home: {
      aria: "Night-time cutaway of a house showing how rats get in through the roof vent, soffit, AC line, dryer vent and crawlspace — and how sealing them keeps rats out.",
      intro: { box: [150, 236, 430], text: "11:40 PM — a roof rat climbs the palm toward a gap in the soffit." },
      wireY: 297,
      art: function () {
        return sky('<g fill="#0A2246"><ellipse cx="70" cy="598" rx="120" ry="52"/><ellipse cx="1010" cy="596" rx="130" ry="56"/><ellipse cx="1180" cy="598" rx="90" ry="40"/></g>') +
          ground() +
          /* porch light cone (behind house) */
          '<polygon points="884,378 940,600 1040,600" fill="url(#rsCone)"/>' +
          /* crawlspace */
          '<rect x="322" y="560" width="556" height="40" fill="#0B1830"/>' +
          '<g fill="#30415E"><rect x="400" y="566" width="16" height="34"/><rect x="520" y="566" width="16" height="34"/><rect x="680" y="566" width="16" height="34"/><rect x="800" y="566" width="16" height="34"/></g>' +
          '<g fill="#22324D"><rect x="322" y="560" width="14" height="40"/><rect x="864" y="560" width="14" height="40"/></g>' +
          '<rect x="864" y="575" width="14" height="13" fill="#03070F"/>' +
          '<text x="600" y="590" class="rs-lbl" fill="#5D7396" text-anchor="middle">CRAWLSPACE</text>' +
          /* floor */
          '<rect x="322" y="550" width="556" height="12" fill="#22324D"/>' +
          /* lit interior */
          '<rect x="336" y="330" width="528" height="220" fill="url(#rsRoom)"/><rect x="336" y="498" width="528" height="52" fill="#EDCB98" opacity=".55"/>' +
          '<rect x="372" y="380" width="84" height="74" rx="2" fill="#16325C" stroke="#8C6B45" stroke-width="5"/><path d="M414 380V454M372 417H456" stroke="#8C6B45" stroke-width="3"/><circle cx="440" cy="396" r="5" fill="#F6EED6" opacity=".8"/>' +
          '<rect x="472" y="396" width="56" height="42" fill="#E8D2A8" stroke="#8C6B45" stroke-width="3"/><path d="M480 430L494 414L506 426L514 418L522 430Z" fill="#7E9A78"/>' +
          '<rect x="402" y="508" width="146" height="34" rx="8" fill="#4F6D7A"/><rect x="412" y="490" width="126" height="26" rx="8" fill="#5E7F8D"/><rect x="396" y="500" width="14" height="44" rx="6" fill="#456270"/><rect x="540" y="500" width="14" height="44" rx="6" fill="#456270"/>' +
          '<circle cx="570" cy="462" r="95" fill="url(#rsGlow)"/>' +
          '<rect x="568" y="468" width="3" height="80" fill="#4A3B2E"/><path d="M556 470H583L577 446H562Z" fill="#FFD27A"/><rect x="560" y="546" width="19" height="4" rx="2" fill="#4A3B2E"/>' +
          '<rect x="596" y="330" width="8" height="112" fill="#E2C08C"/>' +
          '<rect x="616" y="430" width="52" height="120" rx="4" fill="#F3EFE7" stroke="#CFC6B6" stroke-width="2"/><path d="M616 472H668" stroke="#CFC6B6" stroke-width="2"/><rect x="658" y="446" width="3" height="18" rx="1" fill="#AEB6BD"/><rect x="658" y="480" width="3" height="24" rx="1" fill="#AEB6BD"/>' +
          '<rect x="690" y="372" width="164" height="34" rx="2" fill="#A9784A"/><path d="M745 372V406M800 372V406" stroke="#8E6339" stroke-width="2"/>' +
          '<rect x="722" y="422" width="92" height="58" fill="#16325C" stroke="#8C6B45" stroke-width="4"/><path d="M768 422V480" stroke="#8C6B45" stroke-width="3"/>' +
          '<rect x="684" y="508" width="172" height="42" fill="#C79D6A"/><rect x="680" y="501" width="180" height="8" rx="1" fill="#3B3F46"/><path d="M742 508V550M800 508V550M690 528H736M748 528H794M806 528H850" stroke="#B0885A" stroke-width="2"/>' +
          '<text x="466" y="364" class="rs-lbl" fill="#B08A55" text-anchor="middle">LIVING ROOM</text><text x="770" y="362" class="rs-lbl" fill="#B08A55" text-anchor="middle">KITCHEN</text>' +
          /* walls + ceiling (section poché) */
          '<g fill="#22324D"><rect x="322" y="322" width="14" height="238"/><rect x="864" y="322" width="14" height="238"/><rect x="322" y="322" width="556" height="10"/></g>' +
          '<rect x="322" y="476" width="14" height="10" fill="#03070F"/>' +
          '<rect x="864" y="423" width="14" height="9" fill="#03070F"/><rect x="878" y="418" width="11" height="18" rx="2" fill="#7D8A9B"/>' +
          /* porch light */
          '<rect x="878" y="362" width="10" height="18" rx="2" fill="#2B3442"/><circle cx="886" cy="376" r="4" fill="#FFE2A8"/><circle cx="886" cy="376" r="14" fill="#FFD27A" opacity=".35" filter="url(#rsSoft)"/>' +
          /* attic */
          '<polygon points="336,322 600,184 864,322" fill="url(#rsAttic)"/>' +
          '<path d="M600 190V322M470 254V322M730 254V322M600 322L470 254M600 322L730 254" stroke="#4F6489" stroke-width="5"/>' +
          '<polygon points="352,322 368,306 832,306 848,322" fill="url(#rsInsul)"/>' +
          '<path d="M372 298Q486 290 600 298T828 298" stroke="#D9AE52" stroke-width="2" fill="none"/>' +
          '<text x="600" y="282" class="rs-lbl" fill="#7E95BC" text-anchor="middle">ATTIC</text>' +
          /* roof */
          '<polygon points="282,346 600,156 600,176 300,352" fill="url(#rsShL)"/><polygon points="600,156 918,346 900,352 600,176" fill="url(#rsShR)"/>' +
          '<path d="M282 346L600 156L918 346" stroke="#7E95BC" stroke-width="1.5" fill="none" opacity=".55"/>' +
          '<path d="M586 166L600 156L614 166" stroke="#0E1729" stroke-width="7" fill="none" stroke-linejoin="round"/>' +
          '<rect x="278" y="343" width="9" height="12" fill="#C9D3DF"/><rect x="913" y="343" width="9" height="12" fill="#C9D3DF"/>' +
          '<rect x="287" y="351" width="36" height="5" fill="#AFBBCB"/><rect x="304" y="349" width="13" height="7" fill="#03070F"/><rect x="877" y="351" width="36" height="5" fill="#AFBBCB"/>' +
          '<rect x="744" y="232" width="32" height="20" rx="3" fill="#6E7B8F"/><rect x="740" y="227" width="40" height="7" rx="2" fill="#8D9AAE"/><rect x="746" y="245" width="13" height="6" fill="#03070F"/>' +
          '<rect x="470" y="206" width="26" height="46" fill="#3B4A63"/><rect x="466" y="200" width="34" height="8" fill="#4A5A75"/>' +
          /* palm */
          '<path d="M120 600C140 520 190 420 280 332" stroke="#4A3B2E" stroke-width="17" fill="none" stroke-linecap="round"/>' +
          '<path d="M120 600C140 520 190 420 280 332" stroke="#3A2E24" stroke-width="17" fill="none" stroke-dasharray="3 10"/>' +
          '<g fill="#1E4733"><path d="M282 330Q330 318 322 350Q312 334 282 336Z"/><path d="M282 330Q340 288 384 306Q336 300 284 336Z"/><path d="M282 330Q300 270 350 250Q310 280 288 334Z"/>' +
          '<path d="M282 330Q262 268 214 252Q254 286 278 334Z"/><path d="M282 330Q226 300 176 318Q232 312 280 338Z"/><path d="M282 330Q236 340 214 382Q246 348 282 338Z"/></g>' +
          '<g fill="#2A6045"><path d="M282 330Q330 296 372 304Q330 304 286 334Z"/><path d="M282 330Q246 288 206 286Q246 300 280 334Z"/></g><circle cx="282" cy="334" r="7" fill="#3A2E24"/>' +
          /* AC */
          '<rect x="222" y="597" width="84" height="5" rx="1" fill="#3C4656"/>' +
          '<rect x="228" y="554" width="70" height="44" rx="4" fill="#6F7C8C" stroke="#5C6878" stroke-width="2"/><circle cx="262" cy="575" r="15" fill="#556171"/><path d="M247 575H277M262 560V590M252 565L272 585M272 565L252 585" stroke="#4A5566" stroke-width="1.5"/>' +
          '<path d="M298 566H314V481H322" stroke="#0B1220" stroke-width="5" fill="none" stroke-linejoin="round"/>' +
          /* gutter, downspout, shrub */
          '<rect x="896" y="339" width="24" height="8" rx="2" fill="#7D8A9B"/><path d="M900 344V590Q900 598 908 598H916" stroke="#7D8A9B" stroke-width="7" fill="none"/>' +
          '<g fill="#1C4330"><ellipse cx="955" cy="580" rx="36" ry="24"/><ellipse cx="992" cy="586" rx="28" ry="17"/></g><g fill="#2A5E43"><ellipse cx="946" cy="572" rx="18" ry="10"/><ellipse cx="990" cy="580" rx="12" ry="7"/></g>' +
          pole() +
          '<path d="M1110 250Q1010 312 892 298" stroke="#02060D" stroke-width="2.5" fill="none"/><rect x="888" y="288" width="5" height="44" fill="#5D6B85"/>';
      },
      shield: [[272, 606], [272, 333], [600, 140], [928, 333], [928, 606]],
      entries: [
        { label: "Roof vent", problem: "Rats run power lines onto the roof and chew into roof vents.", fix: "Heavy-gauge steel vent guard",
          at: [760, 249], marker: [812, 206], nest: [690, 304], zone: "attic",
          approach: cat([[1240, 596], [1114, 596]], [[1114, 560], [1114, 262]], quad([1110, 250], [1010, 312], [892, 298], 14), [[890, 312], [878, roofR(878) - 2]], [[840, roofR(840) - 2], [800, roofR(800) - 2], [770, roofR(770) - 2], [760, 249]]),
          inside: [[756, 262], [742, 288], [716, 304], [690, 304]] },
        { label: "Soffit & eave gaps", problem: "Palm fronds touching the roof are a bridge straight to soffit gaps.", fix: "Gaps sealed, palms trimmed back",
          at: [311, 350], marker: [214, 214], nest: [440, 304], zone: "attic",
          approach: cat([[-40, 596], [116, 596]], cubic([120, 598], [140, 520], [190, 420], [276, 334], 16), [[300, 338], [311, 350]]),
          inside: [[326, 338], [350, 316], [390, 304], [440, 304]] },
        { label: "AC line penetration", problem: "The foam around AC lines gets chewed through in minutes.", fix: "Metal collar + exterior sealant",
          at: [324, 481], marker: [268, 446], nest: [384, 546], zone: "living",
          approach: [[-40, 596], [222, 596], [228, 588], [228, 552], [298, 552], [314, 552], [314, 492], [324, 481]],
          inside: [[340, 481], [346, 500], [346, 546], [384, 546]] },
        { label: "Dryer & bath vents", problem: "Downspouts are an easy climb to unscreened vents.", fix: "Rodent-proof vent cover",
          at: [880, 427], marker: [958, 410], nest: [790, 499], zone: "kitchen",
          approach: [[1240, 596], [912, 596], [902, 588], [902, 440], [880, 427]],
          inside: [[862, 427], [852, 450], [852, 499], [790, 499]] },
        { label: "Crawlspace vents", problem: "Torn vent screens let Norway rats under the house.", fix: "Welded steel mesh",
          at: [873, 586], marker: [1040, 520], nest: [740, 592], zone: "crawl",
          approach: [[1240, 596], [884, 596], [873, 586]],
          inside: [[858, 590], [800, 592], [740, 592]] }
      ],
      events: {
        attic: [["Chewed wiring in the attic", "spark"], ["Insulation torn up for a nest", "drop"], ["Droppings piling up in the attic", "drop"]],
        living: [["Gnawing heard inside the wall", "drop"], ["Droppings behind the sofa", "drop"]],
        kitchen: [["Droppings on the kitchen counter", "drop"], ["Chewed into the pantry", "drop"]],
        crawl: [["Ductwork torn in the crawlspace", "drop"], ["Nest under the floor", "drop"]]
      }
    },

    restaurant: {
      aria: "Night-time cutaway of a restaurant showing how rats get in through the rooftop HVAC unit, utility lines, kitchen exhaust, back door and a broken sewer line — and how sealing them keeps rats out.",
      intro: { box: [140, 400, 430], text: "12:15 AM — rats leave the dumpster and head for the gap under the back door." },
      wireY: 288,
      art: function () {
        var wins = "";
        [[30, 440], [62, 440], [94, 440], [30, 480], [94, 480], [62, 520], [158, 490], [190, 520], [980, 420], [1012, 420], [980, 460], [1028, 500], [1090, 470], [1122, 470], [1154, 510], [1090, 540]].forEach(function (w, i) {
          wins += '<rect class="rs-win" style="animation-delay:' + (i * 0.7 % 5).toFixed(1) + 's" x="' + w[0] + '" y="' + w[1] + '" width="16" height="20" fill="#FFD27A" opacity="' + (i % 3 ? .75 : .25) + '"/>';
        });
        return sky('<g fill="#0A2246"><rect x="10" y="420" width="120" height="180"/><rect x="138" y="468" width="96" height="132"/><rect x="960" y="396" width="104" height="204"/><rect x="1072" y="452" width="128" height="148"/></g>' + wins) +
          ground(false) +
          '<rect x="-50" y="592" width="422" height="12" fill="#2A3240"/><rect x="908" y="592" width="342" height="12" fill="#4A5568"/>' +
          /* streetlight */
          '<polygon points="196,316 120,600 330,600" fill="url(#rsCone)"/>' +
          '<rect x="108" y="300" width="8" height="300" fill="#2B3442"/><path d="M112 304Q140 292 192 304" stroke="#2B3442" stroke-width="6" fill="none"/><rect x="180" y="302" width="30" height="8" rx="3" fill="#3B4659"/><ellipse cx="195" cy="311" rx="12" ry="3" fill="#FFE2A8"/>' +
          /* sewer */
          '<rect x="150" y="656" width="1100" height="26" fill="#4A5568"/><rect x="150" y="660" width="1100" height="18" fill="#03070F"/><rect x="146" y="652" width="10" height="34" rx="2" fill="#3B4659"/>' +
          '<rect x="590" y="606" width="20" height="54" fill="#4A5568"/><rect x="595" y="606" width="10" height="56" fill="#03070F"/>' +
          '<path d="M588 628L596 632L590 637L598 641" stroke="#03070F" stroke-width="3" fill="none"/><path d="M612 626L604 631L611 637L603 642" stroke="#03070F" stroke-width="3" fill="none"/>' +
          '<text x="1146" y="694" class="rs-lbl" fill="#6B5A4C" text-anchor="end">SEWER LINE</text>' +
          '<rect x="372" y="596" width="536" height="10" fill="#22324D"/>' +
          /* lit interior */
          '<rect x="386" y="306" width="508" height="290" fill="url(#rsRoom)"/><rect x="386" y="306" width="248" height="290" fill="url(#rsTile)"/>' +
          '<path d="M396 330H520L506 372H410Z" fill="#AEB8C6"/><rect x="386" y="342" width="14" height="14" fill="#94A0B0"/><path d="M410 372H506" stroke="#8C99AA" stroke-width="3"/>' +
          '<rect x="404" y="514" width="110" height="8" fill="#1B2230"/><rect x="404" y="522" width="110" height="68" rx="3" fill="#3B4250"/><rect x="414" y="536" width="90" height="40" rx="2" fill="#252B36"/><rect x="430" y="530" width="58" height="3" rx="1" fill="#8C99AA"/>' +
          '<g fill="#AEB8C6"><rect x="540" y="530" width="88" height="6" rx="1"/><rect x="546" y="536" width="4" height="60"/><rect x="618" y="536" width="4" height="60"/><rect x="544" y="572" width="80" height="4"/></g>' +
          '<rect x="556" y="512" width="26" height="18" rx="2" fill="#C98B4A"/><rect x="588" y="518" width="18" height="12" rx="2" fill="#FFF7EA" stroke="#D9C9AE"/>' +
          '<g fill="#8C99AA"><rect x="548" y="360" width="80" height="4"/><rect x="548" y="400" width="80" height="4"/><rect x="548" y="440" width="80" height="4"/><rect x="548" y="360" width="3" height="84"/><rect x="625" y="360" width="3" height="84"/></g>' +
          '<g fill="#C98B4A"><rect x="556" y="380" width="22" height="20"/><rect x="582" y="386" width="18" height="14"/><rect x="560" y="420" width="26" height="20"/></g><g fill="#B4533A"><rect x="604" y="386" width="8" height="14" rx="2"/><rect x="614" y="386" width="8" height="14" rx="2"/><rect x="594" y="426" width="8" height="14" rx="2"/></g>' +
          '<rect x="592" y="593" width="16" height="4" fill="#1B2230"/>' +
          '<rect x="634" y="306" width="8" height="160" fill="#E2C08C"/>' +
          '<rect x="676" y="396" width="94" height="62" rx="3" fill="#1B2433" stroke="#8C6B45" stroke-width="3"/><path d="M690 414H740M690 428H756M690 442H730" stroke="#FFF2D9" stroke-width="2" opacity=".6"/>' +
          '<circle cx="720" cy="390" r="70" fill="url(#rsGlow)"/><circle cx="830" cy="390" r="70" fill="url(#rsGlow)"/>' +
          '<g stroke="#4A3B2E" stroke-width="2"><path d="M720 306V378M830 306V378"/></g><g fill="#F57C00"><path d="M706 378H734L728 366H712Z"/><path d="M816 378H844L838 366H822Z"/></g>' +
          '<g fill="#7A5638"><rect x="680" y="530" width="84" height="6" rx="1"/><rect x="719" y="536" width="6" height="60"/><rect x="790" y="530" width="84" height="6" rx="1"/><rect x="829" y="536" width="6" height="60"/></g>' +
          '<g fill="#8C6A48"><path d="M664 548H684V596H680V566H668V596H664Z"/><path d="M760 548H780V596H776V566H764V596H760Z"/><path d="M774 548H794V596H790V566H778V596H774Z"/></g>' +
          '<text x="512" y="324" class="rs-lbl" fill="#B08A55" text-anchor="middle">KITCHEN</text><text x="772" y="330" class="rs-lbl" fill="#B08A55" text-anchor="middle">DINING ROOM</text>' +
          /* plenum */
          '<rect x="386" y="254" width="508" height="46" fill="#22324D"/><rect x="430" y="262" width="384" height="18" rx="3" fill="#5D6B85"/><path d="M470 262V280M530 262V280M590 262V280M650 262V280M710 262V280M770 262V280" stroke="#4A5670" stroke-width="1.5"/>' +
          '<path d="M396 288Q520 294 640 288T884 288" stroke="#D9AE52" stroke-width="2" fill="none"/>' +
          '<rect x="386" y="300" width="508" height="6" fill="#D9CDB5"/>' +
          '<text x="470" y="296" class="rs-lbl" fill="#7E95BC" text-anchor="middle">CEILING SPACE</text>' +
          /* walls */
          '<rect x="372" y="254" width="14" height="342" fill="url(#rsBrick)"/><rect x="894" y="254" width="14" height="342" fill="url(#rsBrick)"/>' +
          '<rect x="894" y="430" width="14" height="140" fill="#FFDFA3"/><rect x="908" y="430" width="40" height="140" fill="url(#rsCone)" opacity=".5"/>' +
          '<rect x="372" y="500" width="14" height="90" fill="#5A4330"/><rect x="372" y="590" width="14" height="6" fill="#03070F"/>' +
          '<rect x="372" y="344" width="14" height="10" fill="#03070F"/><rect x="360" y="340" width="12" height="18" rx="2" fill="#8C99AA"/>' +
          '<rect x="894" y="279" width="14" height="10" fill="#03070F"/>' +
          /* roof */
          '<rect x="372" y="236" width="536" height="18" fill="#3A475E"/><rect x="372" y="236" width="536" height="3" fill="#7E95BC" opacity=".5"/>' +
          '<rect x="372" y="222" width="14" height="16" fill="#4A5568"/><rect x="894" y="222" width="14" height="16" fill="#4A5568"/>' +
          '<rect x="694" y="230" width="102" height="7" fill="#4A5670"/><rect x="700" y="190" width="90" height="42" rx="3" fill="#7D8A9B"/><rect x="720" y="182" width="50" height="9" rx="2" fill="#6E7B8F"/>' +
          '<path d="M712 200V224M722 200V224M732 200V224M742 200V224" stroke="#6E7B8F" stroke-width="2"/><circle cx="768" cy="211" r="12" fill="#6E7B8F"/><circle cx="768" cy="211" r="3" fill="#4A5670"/>' +
          '<rect x="786" y="231" width="10" height="6" fill="#03070F"/>' +
          '<rect x="600" y="214" width="12" height="22" fill="#6E7B8F"/><rect x="596" y="210" width="20" height="6" rx="2" fill="#5D6B85"/>' +
          /* exterior left */
          '<rect x="346" y="236" width="14" height="6" rx="2" fill="#7D8A9B"/><path d="M352 240V590Q352 598 344 598H336" stroke="#7D8A9B" stroke-width="7" fill="none"/>' +
          '<path d="M154 540L296 540L288 524L162 524Z" fill="#173B2E"/><rect x="160" y="540" width="130" height="52" rx="4" fill="#1E4A3A"/><path d="M174 552V582M204 552V582M234 552V582M264 552V582" stroke="#173B2E" stroke-width="3"/>' +
          '<circle cx="178" cy="594" r="5" fill="#0B1220"/><circle cx="272" cy="594" r="5" fill="#0B1220"/>' +
          '<path d="M296 596C292 580 300 568 312 570C324 566 332 580 326 596Z" fill="#0F1726"/>' +
          /* exterior right: neon sign, awning, conduit */
          '<rect x="908" y="300" width="12" height="6" fill="#4A5670"/><rect x="920" y="286" width="64" height="46" rx="5" fill="#0B1220"/>' +
          '<text x="952" y="315" text-anchor="middle" class="rs-sign" fill="#F57C00" filter="url(#rsSoft)">CAFÉ</text><text x="952" y="315" text-anchor="middle" class="rs-sign" fill="#FFB866">CAFÉ</text>' +
          '<path d="M908 404L994 420V438H908Z" fill="#F57C00"/><path d="M926 407V438M944 411V438M962 414V438M980 417V438" stroke="#FFE9C9" stroke-width="6" opacity=".7"/>' +
          '<path d="M922 598V284H908" stroke="#5D6B85" stroke-width="6" fill="none" stroke-linejoin="round"/><rect x="928" y="478" width="20" height="28" rx="3" fill="#7D8A9B"/><circle cx="938" cy="490" r="6" fill="#C9D2E3"/>' +
          pole() +
          '<path d="M1110 250Q1010 300 904 224" stroke="#02060D" stroke-width="2.5" fill="none"/>';
      },
      shield: [[362, 606], [362, 208], [686, 208], [686, 170], [806, 170], [806, 208], [918, 208], [918, 606]],
      entries: [
        { label: "Rooftop HVAC unit", problem: "Rats run utility lines to the roof and slip under the HVAC curb.", fix: "Curb sealed with metal flashing",
          at: [792, 232], marker: [652, 162], nest: [700, 296], zone: "plenum",
          approach: cat([[1240, 596], [1114, 596], [1114, 262]], quad([1110, 250], [1010, 300], [904, 224], 14), [[890, 232], [840, 232], [800, 232], [792, 232]]),
          inside: [[786, 250], [776, 276], [752, 296], [700, 296]] },
        { label: "Utility line penetrations", problem: "Gaps where conduit and gas lines enter the wall.", fix: "Metal collar + sealant",
          at: [904, 284], marker: [1020, 250], nest: [830, 296], zone: "plenum",
          approach: [[1240, 596], [934, 596], [924, 586], [924, 296], [904, 284]],
          inside: [[886, 290], [866, 296], [830, 296]] },
        { label: "Kitchen exhaust vent", problem: "Grease-coated vents are a magnet — rats climb downspouts to reach them.", fix: "Steel vent guard",
          at: [372, 349], marker: [300, 300], nest: [592, 356], zone: "kitchen",
          approach: [[-40, 596], [330, 596], [352, 588], [352, 362], [372, 349]],
          inside: [[396, 349], [470, 336], [530, 344], [560, 356], [592, 356]] },
        { label: "Back door gap", problem: "A missing door sweep leaves a gap rats squeeze under — right next to the dumpster.", fix: "Commercial door sweep",
          at: [378, 592], marker: [306, 498], nest: [528, 590], zone: "kitchen",
          approach: [[214, 596], [300, 596], [340, 596], [378, 592]],
          inside: [[396, 590], [460, 590], [528, 590]] },
        { label: "Floor drain / sewer line", problem: "Norway rats travel sewer lines and push up through broken pipes and drains.", fix: "Line repaired + drain guard",
          at: [600, 612], marker: [700, 636], nest: [574, 590], zone: "kitchen",
          approach: [[1240, 669], [640, 669], [604, 666], [600, 640], [600, 612]],
          inside: [[600, 600], [596, 590], [574, 590]] }
      ],
      events: {
        plenum: [["Chewed wiring above the ceiling", "spark"], ["Ceiling tiles stained", "drop"]],
        kitchen: [["Droppings near the prep line — health code risk", "drop"], ["Food packaging gnawed open", "drop"], ["Droppings behind the range", "drop"]]
      }
    }
  };

  /* ---------- rat sprite (night: lighter fur + glowing eyes) ---------- */
  var RAT =
    '<g class="rs-r">' +
    '<path class="rs-tail" d="M-14 2C-22 5-30 0-40 4" stroke="#B9A396" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
    '<ellipse class="rs-l1" cx="-7" cy="5.5" rx="3.4" ry="1.9" fill="#4B403A"/><ellipse class="rs-l2" cx="8" cy="5.5" rx="3.1" ry="1.8" fill="#4B403A"/>' +
    '<path d="M-15 1C-15-8-4-10 4-8C10-7 14-4 19.5 0C15 3 9 5 1 5.6C-8 6.2-15 5-15 1Z" fill="#857870"/>' +
    '<path d="M-14-2C-10-8 0-9.4 6-7.6C1-6.6-8-5.2-14-2Z" fill="#A69990" opacity=".6"/>' +
    '<path d="M-12 3C-5 5 5 5 13 2.4C8 4.6 0 5.4-6 5Z" fill="#A0948C"/>' +
    '<ellipse cx="8.4" cy="-7.4" rx="3.5" ry="3.1" fill="#8F8279"/><ellipse cx="8.7" cy="-7.2" rx="2" ry="1.7" fill="#E1A9A5"/>' +
    '<circle cx="13.6" cy="-2.6" r="3.4" fill="' + C.eye + '" opacity=".35"/><circle cx="13.6" cy="-2.6" r="1.4" fill="#FFE7AE"/>' +
    '<circle cx="19.6" cy="0" r="1.4" fill="#E39A9A"/>' +
    '<path d="M18 1L25 -1M18 1.4L25 2.6" stroke="#E3DAD3" stroke-width=".5"/>' +
    '</g>';
  var TRAP = '<g class="rs-trap"><rect x="-13" y="-4" width="26" height="8" rx="1.5" fill="#C9A06A" stroke="#7A5638"/><path d="M-8 -4V-10H8V-4" stroke="#C9D2E3" stroke-width="1.6" fill="none"/></g>';
  var MOON_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5z" fill="currentColor"/></svg>';

  /* ---------- component ---------- */
  function Sim(root) {
    this.root = root;
    this.sceneKey = SCENES[root.getAttribute("data-scene")] ? root.getAttribute("data-scene") : "home";
    this.mode = "open";
    this.touched = false;
    this.introDone = false;
    this.ui();
    this.load(this.sceneKey);
    this.observe();
  }

  Sim.prototype.ui = function () {
    var r = this.root, self = this;
    r.innerHTML =
      '<div class="rs-controls">' +
      '  <div class="rs-seg" role="group" aria-label="Building type"><button type="button" data-scene="home">Home</button><button type="button" data-scene="restaurant">Restaurant</button></div>' +
      '  <button type="button" class="rs-switch" role="switch" aria-checked="false"><span class="rs-switch-lbl rs-off">Unprotected</span><span class="rs-track"><span class="rs-knob"></span></span><span class="rs-switch-lbl rs-on">Protected</span></button>' +
      '</div>' +
      '<div class="rs-body">' +
      '  <div class="rs-stage">' +
      '    <svg viewBox="' + [VB.x, VB.y, VB.w, VB.h].join(" ") + '" role="img" preserveAspectRatio="xMidYMid meet"></svg>' +
      '    <div class="rs-badge"></div><div class="rs-clock">' + MOON_ICON + '<span></span></div>' +
      '    <div class="rs-caption" aria-live="polite"></div>' +
      '    <ul class="rs-feed" aria-live="polite"></ul>' +
      '    <div class="rs-card" hidden><button type="button" class="rs-card-x" aria-label="Back to full view">✕</button><b></b><p class="rs-card-pr"></p><p class="rs-card-fix"></p></div>' +
      '    <div class="rs-toast" aria-live="polite"></div>' +
      '  </div>' +
      '  <aside class="rs-panel">' +
      '    <div class="rs-stats">' +
      '      <div class="rs-stat rs-stat-in"><b class="rs-n-in">0</b><span>Rats inside</span></div>' +
      '      <div class="rs-stat rs-stat-dm"><b class="rs-n-dm">0</b><span>Damage events</span></div>' +
      '      <div class="rs-stat rs-stat-bl"><b class="rs-n-bl">0</b><span>Blocked</span></div>' +
      '    </div>' +
      '    <h3 class="rs-ph">Entry points <small>tap to explore</small></h3>' +
      '    <ol class="rs-list"></ol>' +
      '    <a class="btn btn-orange rs-cta" href="#quote">Find my entry points — free</a>' +
      '  </aside>' +
      '</div>';
    this.svg = r.querySelector("svg");
    this.badge = r.querySelector(".rs-badge");
    this.clockEl = r.querySelector(".rs-clock span");
    this.caption = r.querySelector(".rs-caption");
    this.feed = r.querySelector(".rs-feed");
    this.card = r.querySelector(".rs-card");
    this.toast = r.querySelector(".rs-toast");
    this.list = r.querySelector(".rs-list");
    this.nIn = r.querySelector(".rs-n-in"); this.nDm = r.querySelector(".rs-n-dm"); this.nBl = r.querySelector(".rs-n-bl");
    this.sw = r.querySelector(".rs-switch");
    r.querySelectorAll(".rs-seg button").forEach(function (b) { b.addEventListener("click", function () { self.interact(); self.load(b.getAttribute("data-scene")); }); });
    this.sw.addEventListener("click", function () { self.interact(); self.setMode(self.mode === "open" ? "safe" : "open"); });
    this.card.querySelector(".rs-card-x").addEventListener("click", function () { self.focus(null); });
    setTimeout(function () { if (!self.touched) r.classList.add("rs-hint"); }, 9000);
  };

  Sim.prototype.interact = function () {
    this.touched = true;
    this.root.classList.remove("rs-hint");
    if (!this.introDone) this.endIntro(true);
  };

  Sim.prototype.load = function (key) {
    var sc = SCENES[key], self = this;
    this.sceneKey = key; this.scene = sc;
    this.rats = []; this.fx = []; this.decals = [];
    this.blocked = 0; this.damage = 0; this.spawnT = 0; this.spawnIdx = 0;
    this.eventT = 4; this.breedT = 10; this.blockMsg = 0;
    this.clock = 23 * 60 + 40; this.night = 1; this.safeNights = 0;
    this.cam = { x: VB.x, y: VB.y, w: VB.w }; this.camTo = null;
    this.focused = null; this.card.hidden = true;
    this.feed.innerHTML = "";
    this.root.querySelectorAll(".rs-seg button").forEach(function (b) { var on = b.getAttribute("data-scene") === key; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    this.svg.setAttribute("aria-label", sc.aria);
    this.svg.innerHTML = DEFS + '<g class="rs-art">' + sc.art() + '</g>' +
      '<g class="rs-decals"></g><g class="rs-shield"></g><g class="rs-seals"></g><g class="rs-fx"></g><g class="rs-rats"></g><g class="rs-marks"></g>';
    this.gDecals = this.svg.querySelector(".rs-decals");
    this.gShield = this.svg.querySelector(".rs-shield");
    this.gSeals = this.svg.querySelector(".rs-seals");
    this.gFx = this.svg.querySelector(".rs-fx");
    this.gRats = this.svg.querySelector(".rs-rats");
    this.gMarks = this.svg.querySelector(".rs-marks");

    // Stars
    var gs = this.svg.querySelector(".rs-stars");
    for (var i = 0; i < 70; i++) {
      var sx = 80 + Math.random() * 1080, sy = 128 + Math.random() * 260;
      var st = el("circle", { cx: sx.toFixed(1), cy: sy.toFixed(1), r: (Math.random() * 1.1 + .4).toFixed(2), fill: "#fff", class: "rs-star" }, gs);
      st.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
      st.style.opacity = (0.35 + Math.random() * 0.6).toFixed(2);
    }

    // Barrier
    var pts = sc.shield.map(function (p) { return p.join(","); }).join(" ");
    el("polygon", { points: pts, class: "rs-sh-fill", fill: C.good, opacity: 0 }, this.gShield);
    el("polygon", { points: pts, class: "rs-sh-glow", filter: "url(#rsBlur)", fill: "none", stroke: C.good, "stroke-width": 18, opacity: 0 }, this.gShield);
    el("polygon", { points: pts, class: "rs-sh-line", pathLength: "1", fill: "none", stroke: C.good, "stroke-width": 4, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, this.gShield);
    el("polygon", { points: pts, class: "rs-sh-sweep", pathLength: "1", fill: "none", stroke: "#FFE2B8", "stroke-width": 5, "stroke-dasharray": ".05 .95", opacity: 0 }, this.gShield);

    this.list.innerHTML = "";
    sc.entries.forEach(function (e, i) {
      e.i = i;
      e.ap = prep(e.approach); e.ip = prep(e.inside);
      e.stopD = e.ap.len;
      if (!inside(sc.shield, e.approach[0][0], e.approach[0][1])) {
        for (var d = 0; d < e.ap.len; d += 2) { var p = at(e.ap, d); if (inside(sc.shield, p.x, p.y)) { e.stopD = Math.max(0, d - 10); break; } }
      }
      var s = el("g", { class: "rs-seal", transform: "translate(" + e.at[0] + "," + e.at[1] + ")" }, self.gSeals);
      var sr = el("rect", { x: -11, y: -8, width: 22, height: 16, rx: 3, fill: "url(#rsMesh)", stroke: C.good, "stroke-width": 2.5 }, s);
      sr.style.transitionDelay = (0.6 + i * 0.16) + "s";
      var h = el("g", { class: "rs-hole", transform: "translate(" + e.at[0] + "," + e.at[1] + ")" }, self.gSeals);
      el("circle", { r: 9, class: "rs-hole-ring", fill: "none", stroke: C.bad, "stroke-width": 2.5 }, h);
      var m = el("g", { class: "rs-mark", tabindex: "0", role: "button", "aria-label": "Entry point " + (i + 1) + ": " + e.label }, self.gMarks);
      el("line", { x1: e.marker[0], y1: e.marker[1], x2: e.at[0], y2: e.at[1], class: "rs-lead", stroke: C.bad, "stroke-width": 1.5, "stroke-dasharray": "4 4" }, m);
      el("circle", { cx: e.marker[0], cy: e.marker[1], r: 22, class: "rs-mk-halo", fill: C.bad, opacity: .18 }, m);
      el("circle", { cx: e.marker[0], cy: e.marker[1], r: 15, class: "rs-mk", fill: C.bad, stroke: "#fff", "stroke-width": 3 }, m);
      var t = el("text", { x: e.marker[0], y: e.marker[1] + 5, "text-anchor": "middle", class: "rs-mk-t", fill: "#fff", "font-size": 14, "font-weight": 800, "font-family": "Inter,system-ui,sans-serif" }, m);
      t.textContent = i + 1;
      m.addEventListener("click", function () { self.interact(); self.focus(e); });
      m.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); self.interact(); self.focus(e); } });
      e.markEl = m;
      var li = document.createElement("li");
      li.innerHTML = '<button type="button"><span class="rs-num">' + (i + 1) + '</span><span class="rs-li"><b>' + e.label + '</b><small class="rs-pr">' + e.problem + '</small><small class="rs-fix">✓ ' + e.fix + '</small></span></button>';
      li.querySelector("button").addEventListener("click", function () { self.interact(); self.focus(self.focused === e ? null : e); });
      self.list.appendChild(li);
      e.li = li;
    });
    this.applyMode(true);
    this.setCam(VB.x, VB.y, VB.w);
    this.updateStats(); this.updateClock();
    if (reduceMotion) { this.introDone = true; this.staticFrame(); }
    else if (!this.introDone && this.visible) this.startIntro();
  };

  /* ---------- camera ---------- */
  Sim.prototype.setCam = function (x, y, w) {
    this.cam = { x: x, y: y, w: w };
    this.svg.setAttribute("viewBox", x.toFixed(1) + " " + y.toFixed(1) + " " + w.toFixed(1) + " " + (w / ASPECT).toFixed(1));
  };
  Sim.prototype.moveCam = function (x, y, w, dur) {
    this.camTo = { from: { x: this.cam.x, y: this.cam.y, w: this.cam.w }, to: { x: x, y: y, w: w }, t: 0, dur: dur || 1 };
  };
  Sim.prototype.boxAround = function (cx, cy, w) {
    var h = w / ASPECT;
    return { x: Math.max(VB.x, Math.min(VB.x + VB.w - w, cx - w / 2)), y: Math.max(VB.y, Math.min(VB.y + VB.h - h, cy - h / 2)), w: w };
  };

  Sim.prototype.focus = function (e) {
    var self = this;
    this.focused = e;
    this.root.classList.toggle("rs-focus", !!e);
    this.scene.entries.forEach(function (x) { x.li.classList.toggle("sel", x === e); x.markEl.classList.toggle("sel", x === e); });
    if (!e) { this.card.hidden = true; this.moveCam(VB.x, VB.y, VB.w, 0.9); return; }
    var b = this.boxAround(e.at[0], e.at[1] + 20, 460);
    this.moveCam(b.x, b.y, b.w, 0.9);
    this.card.querySelector("b").textContent = (e.i + 1) + ". " + e.label;
    this.card.querySelector(".rs-card-pr").textContent = e.problem;
    this.card.querySelector(".rs-card-fix").textContent = "✓ How we seal it: " + e.fix;
    this.card.hidden = false;
    // Make sure a rat is heading for this entry so there's something to watch
    if (!this.rats.some(function (r) { return r.e === e && r.phase === "approach"; })) this.spawn(e, 0.55);
  };

  /* ---------- intro ---------- */
  Sim.prototype.startIntro = function () {
    if (this.introDone || this.introOn) return;
    this.introOn = true;
    var ib = this.scene.intro, self = this;
    var b = this.boxAround(ib.box[0] + ib.box[2] / 2, ib.box[1] + ib.box[2] / ASPECT / 2, ib.box[2]);
    this.setCam(b.x, b.y, b.w);
    // Put a rat on the featured route, already on its way
    var e = this.sceneKey === "home" ? this.scene.entries[1] : this.scene.entries[3];
    this.spawn(e, 0.35);
    this.cap(ib.text);
    this._it1 = setTimeout(function () { self.moveCam(VB.x, VB.y, VB.w, 2.2); }, 2600);
    this._it2 = setTimeout(function () { self.cap("Every gap is an open door. Rats test them all — every night."); }, 4700);
    this._it3 = setTimeout(function () { self.endIntro(false); }, 8200);
  };
  Sim.prototype.endIntro = function (skip) {
    this.introDone = true; this.introOn = false;
    clearTimeout(this._it1); clearTimeout(this._it2); clearTimeout(this._it3);
    this.caption.classList.remove("show");
    if (skip && !this.focused) this.moveCam(VB.x, VB.y, VB.w, 0.8);
    if (!skip && !this.touched) this.cap("Flip the switch to Protected ↗", 4000);
  };
  Sim.prototype.cap = function (txt, ms) {
    var c = this.caption; c.textContent = txt; c.classList.add("show");
    clearTimeout(this._ct);
    if (ms) this._ct = setTimeout(function () { c.classList.remove("show"); }, ms);
  };

  /* ---------- modes ---------- */
  Sim.prototype.setMode = function (m) {
    if (m === this.mode) return;
    this.mode = m;
    this.applyMode(false);
    var self = this, n = 0;
    if (m === "safe") {
      this.safeNights = 0;
      this.rats.forEach(function (r) {
        if (r.phase === "inside" || r.phase === "nest") { r.phase = "trapped"; r.t = -0.35 - n * 0.14; n++; }
        else if (r.phase === "approach" && r.d > r.e.stopD) { r.phase = "blocked"; r.t = 0; }
      });
      // Sanitation: droppings fade out
      this.decals.forEach(function (d, i) { d.style.transitionDelay = (1 + i * 0.01) + "s"; d.classList.add("gone"); });
      setTimeout(function () { self.gDecals.innerHTML = ""; self.decals = []; }, 2600);
      this.say(n ? n + (n === 1 ? " rat" : " rats") + " trapped out · droppings sanitized · every entry sealed" : "Every entry point sealed");
      this.log("Exclusion complete — " + this.scene.entries.length + " entry points sealed", "good");
    } else {
      this.say("Seals removed — every entry point is open again");
      this.log("Entry points open — rats are probing", "bad");
    }
    if (reduceMotion) this.staticFrame();
    this.updateStats(); this.updateClock();
  };

  Sim.prototype.applyMode = function (instant) {
    var safe = this.mode === "safe", self = this, n = this.scene.entries.length;
    this.root.classList.toggle("rs-safe", safe);
    this.root.classList.toggle("rs-instant", !!instant);
    if (instant) requestAnimationFrame(function () { requestAnimationFrame(function () { self.root.classList.remove("rs-instant"); }); });
    this.sw.setAttribute("aria-checked", safe ? "true" : "false");
    this.badge.innerHTML = safe ? '<i class="rs-dot"></i>Protected<span class="rs-bd"> · ' + n + '/' + n + ' entries sealed</span>' : '<i class="rs-dot"></i>Unprotected<span class="rs-bd"> · ' + n + ' open entry points</span>';
  };

  Sim.prototype.say = function (msg) {
    var t = this.toast; t.textContent = msg; t.classList.add("show");
    clearTimeout(this._tt); this._tt = setTimeout(function () { t.classList.remove("show"); }, 3400);
  };
  Sim.prototype.log = function (msg, kind) {
    var li = document.createElement("li");
    li.className = kind || "bad";
    li.textContent = msg;
    this.feed.insertBefore(li, this.feed.firstChild);
    while (this.feed.children.length > 2) this.feed.removeChild(this.feed.lastChild);
    setTimeout(function () { li.classList.add("old"); }, 4200);
  };

  Sim.prototype.updateStats = function () {
    var n = 0;
    this.rats.forEach(function (r) { if (r.phase === "inside" || r.phase === "nest") n++; });
    this.nIn.textContent = n; this.nDm.textContent = this.damage; this.nBl.textContent = this.blocked;
  };
  Sim.prototype.updateClock = function () {
    var m = Math.floor(this.clock) % 1440, h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "PM" : "AM", h12 = h % 12 || 12;
    var t = h12 + ":" + (mm < 10 ? "0" : "") + mm + " " + ap;
    this.clockEl.innerHTML = this.mode === "safe" ? "Night " + this.night + " · " + t + "<i> · rat-free</i>" : "Night " + this.night + " · " + t;
  };

  /* ---------- rats ---------- */
  Sim.prototype.spawn = function (e, startFrac) {
    var entries = this.scene.entries;
    if (!e) { e = entries[(this.spawnIdx * 3 + 1) % entries.length]; this.spawnIdx++; }
    var g = el("g", { class: "rs-rat" }, this.gRats); g.innerHTML = RAT;
    var r = { e: e, g: g, phase: "approach", d: 0, t: 0, op: 0, speed: 82 + Math.random() * 30, ang: 0, step: Math.random() * 6, size: 1,
      body: g.firstChild, tail: g.querySelector(".rs-tail"), l1: g.querySelector(".rs-l1"), l2: g.querySelector(".rs-l2") };
    if (startFrac) { r.d = Math.min(e.stopD, e.ap.len) * startFrac; r.op = 1; }
    var p = at(e.ap, r.d); r.x = p.x; r.y = p.y; r.ang = p.a;
    this.rats.push(r);
    return r;
  };
  Sim.prototype.pup = function () {
    var nests = this.rats.filter(function (r) { return r.phase === "nest"; });
    if (nests.length < 2 || nests.length > 15) return false;
    var mom = pick(nests);
    var g = el("g", { class: "rs-rat" }, this.gRats); g.innerHTML = RAT;
    var r = { e: mom.e, g: g, phase: "nest", d: 0, t: 0, op: 0, speed: 60, ang: 0, step: 0, size: 0.62,
      body: g.firstChild, tail: g.querySelector(".rs-tail"), l1: g.querySelector(".rs-l1"), l2: g.querySelector(".rs-l2"),
      x: mom.x, y: mom.home.y, home: mom.home, tx: mom.x + 10, wait: 0 };
    this.rats.push(r);
    return true;
  };

  Sim.prototype.ring = function (x, y, color, r0, r1) {
    var c = el("circle", { cx: x, cy: y, r: r0 || 6, fill: "none", stroke: color, "stroke-width": 3 }, this.gFx);
    this.fx.push({ el: c, t: 0, r0: r0 || 6, r1: r1 || 32, kind: "ring" });
  };
  Sim.prototype.xmark = function (x, y) {
    var g = el("g", { transform: "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")" }, this.gFx);
    el("circle", { r: 9, fill: C.good }, g);
    el("path", { d: "M-4 -4L4 4M4 -4L-4 4", stroke: "#061631", "stroke-width": 2.6, "stroke-linecap": "round" }, g);
    this.fx.push({ el: g, t: 0, kind: "pop", x: x, y: y });
  };
  Sim.prototype.spark = function (x, y) {
    var g = el("g", { transform: "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")" }, this.gFx);
    el("circle", { r: 10, fill: "#FFE27A", opacity: .5, filter: "url(#rsSoft)" }, g);
    el("path", { d: "M0 -11L3 -3L11 -2L4 2L6 10L0 5L-6 10L-4 2L-11 -2L-3 -3Z", fill: "#FFE9A8" }, g);
    this.fx.push({ el: g, t: 0, kind: "pop", x: x, y: y });
  };
  Sim.prototype.droppings = function (x, y) {
    for (var i = 0; i < 4; i++) {
      if (this.decals.length > 90) break;
      var d = el("ellipse", { cx: (x + (Math.random() * 2 - 1) * 14).toFixed(1), cy: (y + 1 + Math.random() * 2).toFixed(1), rx: 1.7, ry: 1, fill: "#2A1C13", class: "rs-drop" }, this.gDecals);
      d.setAttribute("transform", "rotate(" + (Math.random() * 60 - 30).toFixed(0) + " " + d.getAttribute("cx") + " " + d.getAttribute("cy") + ")");
      this.decals.push(d);
    }
  };

  Sim.prototype.flash = function (e) {
    e.li.classList.remove("hit"); void e.li.offsetWidth; e.li.classList.add("hit");
    e.markEl.classList.remove("hit"); void e.markEl.getBBox(); e.markEl.classList.add("hit");
  };

  Sim.prototype.tick = function (now) {
    if (!this.running) return;
    var dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    var self = this, safe = this.mode === "safe";

    // Camera tween
    if (this.camTo) {
      var ct = this.camTo; ct.t += dt / ct.dur; var k = ease(Math.min(1, ct.t));
      this.setCam(ct.from.x + (ct.to.x - ct.from.x) * k, ct.from.y + (ct.to.y - ct.from.y) * k, ct.from.w + (ct.to.w - ct.from.w) * k);
      if (ct.t >= 1) this.camTo = null;
    }

    // Night clock: 10 sim-minutes per second; nights run 11:40 PM → 5:30 AM
    var prev = this.clock;
    this.clock += dt * 10;
    if (Math.floor(this.clock) !== Math.floor(prev)) {
      var m = Math.floor(this.clock) % 1440;
      if (m === 330) { this.night++; this.clock = 23 * 60 + 40; if (safe) this.safeNights++; }
      this.updateClock();
    }

    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      var moving = this.rats.filter(function (r) { return r.phase === "approach" || r.phase === "retreat" || r.phase === "blocked"; }).length;
      if (moving < 7) this.spawn();
      this.spawnT = safe ? 0.85 : 1.05;
    }

    var changed = false;
    if (!safe) {
      // Damage events from rats living inside
      this.eventT -= dt;
      var residents = this.rats.filter(function (r) { return r.phase === "nest"; });
      if (this.eventT <= 0 && residents.length) {
        var rr = pick(residents), evs = this.scene.events[rr.e.zone], ev = pick(evs);
        this.damage++; changed = true;
        this.log(ev[0], "bad");
        if (ev[1] === "spark") this.spark(rr.x, this.scene.wireY); else this.droppings(rr.x, rr.home.y + 5);
        this.eventT = Math.max(1.6, 4.2 - residents.length * 0.18);
      }
      // Breeding
      this.breedT -= dt;
      if (this.breedT <= 0) {
        if (this.pup()) { this.log("New litter born inside — population growing", "bad"); changed = true; }
        this.breedT = 9;
      }
    }

    this.rats.forEach(function (r) {
      var e = r.e, p, sp = 0;
      r.t += dt;
      if (r.phase === "approach") {
        r.op = Math.min(1, r.op + dt * 3);
        r.d += r.speed * dt;
        var limit = safe ? e.stopD : e.ap.len;
        if (r.d >= limit) {
          r.d = limit;
          if (safe) { r.phase = "blocked"; r.t = 0; }
          else { r.phase = "inside"; r.d = 0; r.t = 0; self.ring(e.at[0], e.at[1], C.bad); self.flash(e); changed = true; }
        }
        p = at(e.ap, r.d); sp = r.speed;
      } else if (r.phase === "blocked") {
        p = at(e.ap, r.d);
        var hop = r.t < 0.3 ? Math.sin(r.t / 0.3 * Math.PI) * 7 : 0;
        p.x -= Math.cos(p.a) * hop * 0.8; p.y -= Math.sin(p.a) * hop * 0.8 + hop * 0.6;
        if (!r.rung) {
          r.rung = true; self.blocked++; changed = true;
          self.ring(p.x, p.y, C.good, 8, 36); self.xmark(p.x, p.y - 16); self.flash(e);
          if (++self.blockMsg % 4 === 1) self.log("Rat turned away at the " + e.label.toLowerCase(), "good");
        }
        if (r.t > 0.75) { r.phase = "retreat"; r.t = 0; }
      } else if (r.phase === "retreat") {
        r.d -= r.speed * 1.3 * dt;
        if (r.d <= 0) { r.d = 0; r.op -= dt * 4; if (r.op <= 0) r.dead = true; }
        p = at(e.ap, r.d); p.a += Math.PI; sp = r.speed;
      } else if (r.phase === "inside") {
        r.d += r.speed * 0.8 * dt;
        if (r.d >= e.ip.len) { r.phase = "nest"; r.t = 0; r.home = { x: e.nest[0], y: e.nest[1] }; r.tx = r.home.x; r.wait = 0; changed = true; }
        p = at(e.ip, r.d); sp = r.speed;
      } else if (r.phase === "nest") {
        r.op = Math.min(1, r.op + dt * 2);
        r.wait -= dt;
        if (r.wait <= 0 && Math.abs(r.tx - r.x) < 1) { r.tx = r.home.x + (Math.random() * 2 - 1) * 24; r.wait = 0.6 + Math.random() * 1.6; }
        var dx = r.tx - r.x, v = 30;
        p = { x: r.x + Math.sign(dx) * Math.min(Math.abs(dx), v * dt), y: r.home.y, a: Math.abs(dx) > 0.5 ? (dx > 0 ? 0 : Math.PI) : r.ang };
        sp = Math.abs(dx) > 0.5 ? v : 0;
      } else if (r.phase === "trapped") {
        p = { x: r.x, y: r.y, a: r.ang };
        if (r.t > 0 && !r.trap) {
          r.trap = el("g", { transform: "translate(" + r.x.toFixed(1) + "," + (r.y + 2).toFixed(1) + ")" }, self.gFx);
          r.trap.innerHTML = TRAP;
          self.ring(r.x, r.y - 4, C.good, 4, 22);
        }
        if (r.t > 0.35) { r.op -= dt * 2.4; r.size = Math.max(0.3, r.size - dt * 1.2); }
        if (r.t > 1.4) { if (r.trap) r.trap.remove(); r.dead = true; changed = true; }
      }
      if (!p) return;
      r.x = p.x; r.y = p.y;
      r.ang += angDiff(r.ang, p.a) * Math.min(1, dt * 12);
      self.draw(r, sp, dt);
    });

    this.rats = this.rats.filter(function (r) { if (r.dead) r.g.remove(); return !r.dead; });
    this.fx = this.fx.filter(function (f) {
      f.t += dt;
      var k = f.t / 0.75;
      if (f.kind === "ring") { f.el.setAttribute("r", (f.r0 + k * (f.r1 - f.r0)).toFixed(1)); f.el.setAttribute("opacity", Math.max(0, 1 - k).toFixed(2)); }
      else { f.el.setAttribute("transform", "translate(" + f.x.toFixed(1) + "," + (f.y - k * 10).toFixed(1) + ") scale(" + (0.6 + Math.min(1, k * 4) * 0.4).toFixed(2) + ")"); f.el.setAttribute("opacity", Math.max(0, 1 - Math.max(0, k - 0.4) / 0.6).toFixed(2)); }
      if (k >= 1) { f.el.remove(); return false; }
      return true;
    });
    if (changed) this.updateStats();
    requestAnimationFrame(this.tick.bind(this));
  };

  Sim.prototype.draw = function (r, sp, dt) {
    r.step += sp * dt * 0.32;
    var flip = Math.cos(r.ang) < 0 ? -1 : 1, s = r.size * 1.2;
    r.g.setAttribute("transform", "translate(" + r.x.toFixed(1) + "," + r.y.toFixed(1) + ") rotate(" + (r.ang * 180 / Math.PI).toFixed(1) + ") scale(" + s.toFixed(2) + "," + (s * flip).toFixed(2) + ") translate(0,-6)");
    r.g.setAttribute("opacity", Math.max(0, Math.min(1, r.op)).toFixed(2));
    var k = sp ? Math.sin(r.step) * 1.8 : 0;
    r.l1.setAttribute("transform", "translate(" + k.toFixed(1) + ",0)");
    r.l2.setAttribute("transform", "translate(" + (-k).toFixed(1) + ",0)");
    r.body.setAttribute("transform", "translate(0," + (sp ? Math.abs(Math.sin(r.step)) * -0.8 : 0).toFixed(2) + ")");
    r.tail.setAttribute("transform", "rotate(" + (Math.sin(r.step * 0.5 + r.t) * 7).toFixed(1) + " -14 2)");
  };

  Sim.prototype.staticFrame = function () {
    var self = this, safe = this.mode === "safe";
    this.gRats.innerHTML = ""; this.rats = [];
    this.scene.entries.forEach(function (e) {
      var g = el("g", { class: "rs-rat" }, self.gRats); g.innerHTML = RAT;
      var r = { g: g, body: g.firstChild, tail: g.querySelector(".rs-tail"), l1: g.querySelector(".rs-l1"), l2: g.querySelector(".rs-l2"), op: 1, step: 0, t: 0, size: 1 };
      var p = safe ? at(e.ap, e.stopD) : { x: e.nest[0], y: e.nest[1], a: 0 };
      r.x = p.x; r.y = p.y; r.ang = p.a; r.phase = safe ? "blocked" : "nest";
      self.draw(r, 0, 0); self.rats.push(r);
    });
    this.blocked = safe ? this.scene.entries.length : 0;
    this.updateStats();
  };

  Sim.prototype.observe = function () {
    var self = this;
    if (reduceMotion) return;
    var start = function () {
      if (!self.running && self.visible && !document.hidden) {
        self.running = true; self.last = 0;
        if (!self.introDone) self.startIntro();
        requestAnimationFrame(self.tick.bind(self));
      }
    };
    var stop = function () { self.running = false; };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; self.visible ? start() : stop(); }, { threshold: 0.35 }).observe(this.root.querySelector(".rs-stage"));
    } else { this.visible = true; start(); }
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  };

  document.querySelectorAll("[data-ratsim]").forEach(function (n) { new Sim(n); });
})();
