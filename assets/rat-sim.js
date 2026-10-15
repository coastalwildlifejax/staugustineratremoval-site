/* Rat entry simulator — "Unprotected vs Protected" cutaway animation.
   Mounts into any element with [data-ratsim]; data-scene="home" | "restaurant" sets the default.
   Pure SVG + requestAnimationFrame, no dependencies. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var W = 1200, H = 700;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- geometry helpers ---------- */
  function quad(p0, c, p1, steps) {
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, u = 1 - t;
      pts.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
    }
    return pts;
  }
  function cubic(p0, c1, c2, p1, steps) {
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, u = 1 - t;
      pts.push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1]
      ]);
    }
    return pts;
  }
  function cat() { var out = []; for (var i = 0; i < arguments.length; i++) out = out.concat(arguments[i]); return out; }
  function prep(pts) {
    var cum = [0];
    for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts: pts, cum: cum, len: cum[cum.length - 1] };
  }
  function at(path, d) {
    var pts = path.pts, cum = path.cum;
    if (d <= 0) return { x: pts[0][0], y: pts[0][1], a: Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) };
    if (d >= path.len) { var n = pts.length; return { x: pts[n - 1][0], y: pts[n - 1][1], a: Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]) }; }
    var i = 1; while (cum[i] < d) i++;
    var t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    var a = pts[i - 1], b = pts[i];
    return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, a: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  function inside(poly, x, y) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function angDiff(a, b) { var d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

  /* ---------- shared SVG defs ---------- */
  var DEFS =
    '<defs>' +
    '<linearGradient id="rsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE3EE"/><stop offset="1" stop-color="#F7F2EA"/></linearGradient>' +
    '<linearGradient id="rsSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A58C6E"/><stop offset="1" stop-color="#86705A"/></linearGradient>' +
    '<pattern id="rsDots" width="46" height="30" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="1.7" fill="#8C755E"/><circle cx="30" cy="22" r="2.3" fill="#927A62"/><circle cx="38" cy="6" r="1.1" fill="#7B6650"/></pattern>' +
    '<pattern id="rsShL" width="22" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(-30.6)"><rect width="22" height="11" fill="#5B524D"/><path d="M0 10.5H22M11 0V5.5M0 5.5H22M0 5.5V11M22 5.5V11" stroke="#463F3B" stroke-width="1"/></pattern>' +
    '<pattern id="rsShR" width="22" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(30.6)"><rect width="22" height="11" fill="#5B524D"/><path d="M0 10.5H22M11 0V5.5M0 5.5H22M0 5.5V11M22 5.5V11" stroke="#463F3B" stroke-width="1"/></pattern>' +
    '<pattern id="rsInsul" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#F3D79A"/><path d="M0 16Q4 5 8 16Q12 5 16 16" fill="#E9C47C"/></pattern>' +
    '<pattern id="rsMesh" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#AEB6BD"/><path d="M0 0L4 4M4 0L0 4" stroke="#5E666E" stroke-width=".7"/></pattern>' +
    '<pattern id="rsBrick" width="28" height="14" patternUnits="userSpaceOnUse"><rect width="28" height="14" fill="#B5674B"/><path d="M0 13.5H28M0 6.5H28M14 0V6.5M0 7V14M28 7V14" stroke="#9C5640" stroke-width="1.2"/></pattern>' +
    '<pattern id="rsTile" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#F1F4F5"/><path d="M0 19.5H20M19.5 0V20" stroke="#E1E6E9" stroke-width="1"/></pattern>' +
    '<filter id="rsBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>' +
    '</defs>';

  function sky(extra) {
    return '<rect width="1200" height="700" fill="url(#rsSky)"/>' +
      '<circle cx="1010" cy="190" r="40" fill="#FBE6C6"/><circle cx="1010" cy="190" r="28" fill="#F9D29A"/>' +
      '<g fill="#fff" opacity=".85"><ellipse cx="440" cy="176" rx="62" ry="14"/><ellipse cx="474" cy="164" rx="34" ry="15"/><ellipse cx="690" cy="160" rx="56" ry="12"/><ellipse cx="718" cy="151" rx="28" ry="12"/></g>' +
      (extra || "");
  }
  function ground() {
    return '<rect y="600" width="1200" height="100" fill="url(#rsSoil)"/><rect y="600" width="1200" height="100" fill="url(#rsDots)"/>' +
      '<rect y="592" width="1200" height="12" fill="#86AE63"/><rect y="592" width="1200" height="3" fill="#9CC277"/>';
  }
  function pole() {
    return '<rect x="1106" y="232" width="12" height="370" fill="#7B5B3E"/><rect x="1106" y="232" width="4" height="370" fill="#8E6C4C"/>' +
      '<rect x="1080" y="244" width="64" height="7" rx="2" fill="#6A4E35"/>' +
      '<g fill="#E9E4DA"><rect x="1086" y="236" width="6" height="9" rx="2"/><rect x="1132" y="236" width="6" height="9" rx="2"/></g>' +
      '<rect x="1098" y="300" width="28" height="34" rx="5" fill="#8F969C"/><rect x="1098" y="300" width="28" height="6" rx="3" fill="#7A8187"/>';
  }

  /* ---------- scenes ---------- */
  function roofR(x) { return 158 + (x - 600) * 0.5924; }
  function roofL(x) { return 158 + (600 - x) * 0.5924; }

  var SCENES = {
    home: {
      title: "Home",
      aria: "Cutaway illustration of a house showing how rats get in through the roof vent, soffit, AC line, dryer vent and crawlspace — and how sealing them keeps rats out.",
      art: function () {
        return sky('<g fill="#BCD0BA"><ellipse cx="70" cy="596" rx="110" ry="46"/><ellipse cx="1000" cy="594" rx="120" ry="50"/><ellipse cx="1170" cy="596" rx="80" ry="36"/></g>') +
          ground() +
          /* crawlspace + foundation */
          '<rect x="322" y="560" width="556" height="40" fill="#3E3732"/>' +
          '<g fill="#A1978C"><rect x="400" y="566" width="16" height="34"/><rect x="520" y="566" width="16" height="34"/><rect x="680" y="566" width="16" height="34"/><rect x="800" y="566" width="16" height="34"/></g>' +
          '<g fill="#B8AEA2"><rect x="322" y="560" width="14" height="40"/><rect x="864" y="560" width="14" height="40"/></g>' +
          '<path d="M322 573H336M322 587H336M864 573H878M864 587H878" stroke="#A0968A" stroke-width="1"/>' +
          '<rect x="864" y="575" width="14" height="13" fill="#221D1A"/>' +
          '<text x="600" y="590" class="rs-lbl rs-lbl-dark" text-anchor="middle">CRAWLSPACE</text>' +
          /* floor */
          '<rect x="322" y="550" width="556" height="12" fill="#B98D5E"/><path d="M322 556H878" stroke="#A47A4E" stroke-width="1"/>' +
          /* interior */
          '<rect x="336" y="330" width="528" height="220" fill="#FBF6EE"/><rect x="336" y="498" width="528" height="52" fill="#F3EADD"/><path d="M336 498H864" stroke="#E5D8C6" stroke-width="2"/>' +
          '<rect x="372" y="380" width="84" height="74" rx="2" fill="#CFE3EE" stroke="#C7B299" stroke-width="5"/><path d="M414 380V454M372 417H456" stroke="#C7B299" stroke-width="3"/>' +
          '<rect x="472" y="396" width="56" height="42" fill="#E9D9C2" stroke="#B59873" stroke-width="3"/><path d="M480 430L494 414L506 426L514 418L522 430Z" fill="#A9BFA4"/>' +
          '<rect x="402" y="508" width="146" height="34" rx="8" fill="#8FA3A8"/><rect x="412" y="490" width="126" height="26" rx="8" fill="#A3B6BA"/><rect x="396" y="500" width="14" height="44" rx="6" fill="#7F9398"/><rect x="540" y="500" width="14" height="44" rx="6" fill="#7F9398"/>' +
          '<rect x="568" y="468" width="3" height="80" fill="#6B5E57"/><path d="M556 470H583L577 446H562Z" fill="#F7C873"/><rect x="560" y="546" width="19" height="4" rx="2" fill="#6B5E57"/>' +
          '<rect x="596" y="330" width="8" height="112" fill="#E2D4C0"/>' +
          '<rect x="616" y="430" width="52" height="120" rx="4" fill="#E6EAED" stroke="#C5CCD2" stroke-width="2"/><path d="M616 472H668" stroke="#C5CCD2" stroke-width="2"/><rect x="658" y="446" width="3" height="18" rx="1" fill="#AEB6BD"/><rect x="658" y="480" width="3" height="24" rx="1" fill="#AEB6BD"/>' +
          '<rect x="690" y="372" width="164" height="34" rx="2" fill="#C9A77F"/><path d="M745 372V406M800 372V406" stroke="#B48F66" stroke-width="2"/>' +
          '<rect x="722" y="422" width="92" height="58" fill="#CFE3EE" stroke="#C7B299" stroke-width="4"/><path d="M768 422V480" stroke="#C7B299" stroke-width="3"/>' +
          '<rect x="684" y="508" width="172" height="42" fill="#D5C2A8"/><rect x="680" y="501" width="180" height="8" rx="1" fill="#6E625B"/><path d="M742 508V550M800 508V550M690 528H736M748 528H794M806 528H850" stroke="#C1AC8F" stroke-width="2"/>' +
          '<text x="466" y="364" class="rs-lbl" text-anchor="middle">LIVING ROOM</text><text x="770" y="362" class="rs-lbl" text-anchor="middle">KITCHEN</text>' +
          /* walls + ceiling */
          '<g fill="#D8C6AC"><rect x="322" y="322" width="14" height="238"/><rect x="864" y="322" width="14" height="238"/><rect x="322" y="322" width="556" height="10"/></g>' +
          '<rect x="322" y="476" width="14" height="10" fill="#3E3732"/>' +
          '<rect x="864" y="423" width="14" height="9" fill="#3E3732"/><rect x="878" y="418" width="11" height="18" rx="2" fill="#A9B0B6"/><rect x="878" y="432" width="11" height="3" fill="#6E767D"/>' +
          /* attic */
          '<polygon points="336,322 600,184 864,322" fill="#F0E4D0"/>' +
          '<path d="M600 190V322M470 254V322M730 254V322M600 322L470 254M600 322L730 254" stroke="#D6BC92" stroke-width="5"/>' +
          '<polygon points="352,322 368,306 832,306 848,322" fill="url(#rsInsul)"/>' +
          '<text x="600" y="296" class="rs-lbl" text-anchor="middle">ATTIC</text>' +
          /* roof */
          '<polygon points="282,346 600,156 600,176 300,352" fill="url(#rsShL)"/><polygon points="600,156 918,346 900,352 600,176" fill="url(#rsShR)"/>' +
          '<path d="M586 166L600 156L614 166" stroke="#3F3834" stroke-width="7" fill="none" stroke-linejoin="round"/>' +
          '<rect x="278" y="343" width="9" height="12" fill="#EDE5D8"/><rect x="913" y="343" width="9" height="12" fill="#EDE5D8"/>' +
          '<rect x="287" y="351" width="36" height="5" fill="#E6DCCB"/><rect x="304" y="349" width="13" height="7" fill="#221D1A"/>' +
          '<rect x="877" y="351" width="36" height="5" fill="#E6DCCB"/>' +
          '<rect x="744" y="232" width="32" height="20" rx="3" fill="#8F969C"/><rect x="740" y="227" width="40" height="7" rx="2" fill="#7A8187"/><rect x="746" y="245" width="13" height="6" fill="#221D1A"/>' +
          /* palm */
          '<path d="M120 600C140 520 190 420 280 332" stroke="#8B6B4A" stroke-width="17" fill="none" stroke-linecap="round"/>' +
          '<path d="M120 600C140 520 190 420 280 332" stroke="#715538" stroke-width="17" fill="none" stroke-dasharray="3 10"/>' +
          '<g fill="#4E7F45"><path d="M282 330Q330 318 322 350Q312 334 282 336Z"/><path d="M282 330Q340 288 384 306Q336 300 284 336Z"/><path d="M282 330Q300 270 350 250Q310 280 288 334Z"/>' +
          '<path d="M282 330Q262 268 214 252Q254 286 278 334Z"/><path d="M282 330Q226 300 176 318Q232 312 280 338Z"/><path d="M282 330Q236 340 214 382Q246 348 282 338Z"/></g>' +
          '<g fill="#5E9452"><path d="M282 330Q330 296 372 304Q330 304 286 334Z"/><path d="M282 330Q246 288 206 286Q246 300 280 334Z"/></g>' +
          '<circle cx="282" cy="334" r="7" fill="#7A5C3E"/>' +
          /* AC */
          '<rect x="222" y="597" width="84" height="5" rx="1" fill="#BDB5AA"/>' +
          '<rect x="228" y="554" width="70" height="44" rx="4" fill="#CDD2D6" stroke="#A8AFB5" stroke-width="2"/><circle cx="262" cy="575" r="15" fill="#A1A9B0"/><path d="M247 575H277M262 560V590M252 565L272 585M272 565L252 585" stroke="#8C949B" stroke-width="1.5"/>' +
          '<path d="M298 566H314V481H322" stroke="#33373B" stroke-width="5" fill="none" stroke-linejoin="round"/>' +
          /* downspout, shrub */
          '<rect x="896" y="339" width="24" height="8" rx="2" fill="#8D9499"/><path d="M900 344V590Q900 598 908 598H916" stroke="#8D9499" stroke-width="7" fill="none"/>' +
          '<g fill="#5E8C4C"><ellipse cx="955" cy="580" rx="36" ry="24"/><ellipse cx="992" cy="586" rx="28" ry="17"/></g><g fill="#6FA05A"><ellipse cx="946" cy="572" rx="18" ry="10"/><ellipse cx="990" cy="580" rx="12" ry="7"/></g>' +
          /* pole + service drop */
          pole() +
          '<path d="M1110 250Q1010 312 892 298" stroke="#2F3337" stroke-width="2.5" fill="none"/><rect x="888" y="288" width="5" height="44" fill="#6E7378"/>';
      },
      shield: [[272, 606], [272, 333], [600, 140], [928, 333], [928, 606]],
      entries: [
        { label: "Roof vent", problem: "Rats run power lines onto the roof and chew into roof vents.", fix: "Heavy-gauge steel vent guard",
          at: [760, 249], marker: [812, 206], nest: [690, 304],
          approach: cat([[1240, 596], [1114, 596]], [[1114, 560], [1114, 262]], quad([1110, 250], [1010, 312], [892, 298], 14), [[890, 312], [878, roofR(878) - 2]], [[840, roofR(840) - 2], [800, roofR(800) - 2], [770, roofR(770) - 2], [760, 249]]),
          inside: [[756, 262], [742, 288], [716, 304], [690, 304]] },
        { label: "Soffit & eave gaps", problem: "Palm fronds touching the roof are a bridge straight to soffit gaps.", fix: "Gaps sealed, palms trimmed back",
          at: [311, 350], marker: [214, 214], nest: [440, 304],
          approach: cat([[-40, 596], [116, 596]], cubic([120, 598], [140, 520], [190, 420], [276, 334], 16), [[300, 338], [311, 350]]),
          inside: [[326, 338], [350, 316], [390, 304], [440, 304]] },
        { label: "AC line penetration", problem: "The foam around AC lines gets chewed through in minutes.", fix: "Metal collar + exterior sealant",
          at: [324, 481], marker: [268, 446], nest: [384, 546],
          approach: [[-40, 596], [222, 596], [228, 588], [228, 552], [298, 552], [314, 552], [314, 492], [324, 481]],
          inside: [[340, 481], [346, 500], [346, 546], [384, 546]] },
        { label: "Dryer & bath vents", problem: "Downspouts are an easy climb to unscreened vents.", fix: "Rodent-proof vent cover",
          at: [880, 427], marker: [958, 410], nest: [790, 499],
          approach: [[1240, 596], [912, 596], [902, 588], [902, 440], [880, 427]],
          inside: [[862, 427], [852, 450], [852, 499], [790, 499]] },
        { label: "Crawlspace vents", problem: "Torn vent screens let Norway rats under the house.", fix: "Welded steel mesh",
          at: [873, 586], marker: [1040, 520], nest: [740, 592],
          approach: [[1240, 596], [884, 596], [873, 586]],
          inside: [[858, 590], [800, 592], [740, 592]] }
      ]
    },

    restaurant: {
      title: "Restaurant",
      aria: "Cutaway illustration of a restaurant showing how rats get in through the rooftop HVAC unit, utility lines, kitchen exhaust, back door and a broken sewer line — and how sealing them keeps rats out.",
      art: function () {
        return sky('<g fill="#D4DBE1"><rect x="10" y="420" width="120" height="180"/><rect x="138" y="468" width="96" height="132"/><rect x="960" y="396" width="104" height="204"/><rect x="1072" y="452" width="128" height="148"/></g>' +
          '<g fill="#E4E9ED"><rect x="30" y="440" width="16" height="20"/><rect x="62" y="440" width="16" height="20"/><rect x="94" y="440" width="16" height="20"/><rect x="30" y="480" width="16" height="20"/><rect x="94" y="480" width="16" height="20"/><rect x="980" y="420" width="16" height="20"/><rect x="1012" y="420" width="16" height="20"/><rect x="980" y="460" width="16" height="20"/><rect x="1028" y="500" width="16" height="20"/></g>') +
          ground() +
          '<rect y="592" width="372" height="12" fill="#8E8D89"/><rect x="908" y="592" width="292" height="12" fill="#CFC9C0"/>' +
          /* sewer main + lateral */
          '<rect x="150" y="656" width="1050" height="26" fill="#7C858E"/><rect x="150" y="660" width="1050" height="18" fill="#2C2F33"/><rect x="146" y="652" width="10" height="34" rx="2" fill="#6C747C"/>' +
          '<rect x="590" y="606" width="20" height="54" fill="#7C858E"/><rect x="595" y="606" width="10" height="56" fill="#2C2F33"/>' +
          '<path d="M588 628L596 632L590 637L598 641" stroke="#2C2F33" stroke-width="3" fill="none"/><path d="M612 626L604 631L611 637L603 642" stroke="#2C2F33" stroke-width="3" fill="none"/>' +
          '<text x="1146" y="694" class="rs-lbl rs-lbl-dark" text-anchor="end">SEWER LINE</text>' +
          /* slab */
          '<rect x="372" y="596" width="536" height="10" fill="#B7B2AC"/>' +
          /* interior */
          '<rect x="386" y="306" width="508" height="290" fill="#FBF7F1"/><rect x="386" y="306" width="248" height="290" fill="url(#rsTile)"/>' +
          '<path d="M396 330H520L506 372H410Z" fill="#C9CED2"/><rect x="386" y="342" width="14" height="14" fill="#B5BBC1"/><path d="M410 372H506" stroke="#A9B0B6" stroke-width="3"/>' +
          '<rect x="404" y="514" width="110" height="8" fill="#2F3337"/><rect x="404" y="522" width="110" height="68" rx="3" fill="#5E646A"/><rect x="414" y="536" width="90" height="40" rx="2" fill="#3E4246"/><rect x="430" y="530" width="58" height="3" rx="1" fill="#9AA2A9"/>' +
          '<g fill="#C9CED2"><rect x="540" y="530" width="88" height="6" rx="1"/><rect x="546" y="536" width="4" height="60"/><rect x="618" y="536" width="4" height="60"/><rect x="544" y="572" width="80" height="4"/></g>' +
          '<rect x="556" y="512" width="26" height="18" rx="2" fill="#D9A86C"/><rect x="588" y="518" width="18" height="12" rx="2" fill="#F3EDE3" stroke="#D6CCBE"/>' +
          '<g fill="#AEB6BD"><rect x="548" y="360" width="80" height="4"/><rect x="548" y="400" width="80" height="4"/><rect x="548" y="440" width="80" height="4"/><rect x="548" y="360" width="3" height="84"/><rect x="625" y="360" width="3" height="84"/></g>' +
          '<g fill="#D9A86C"><rect x="556" y="380" width="22" height="20"/><rect x="582" y="386" width="18" height="14"/><rect x="560" y="420" width="26" height="20"/></g><g fill="#C76B4E"><rect x="604" y="386" width="8" height="14" rx="2"/><rect x="614" y="386" width="8" height="14" rx="2"/><rect x="594" y="426" width="8" height="14" rx="2"/></g>' +
          '<rect x="592" y="593" width="16" height="4" fill="#3E4246"/>' +
          '<rect x="634" y="306" width="8" height="160" fill="#E2D4C0"/>' +
          '<rect x="676" y="396" width="94" height="62" rx="3" fill="#2F3337" stroke="#8B6B4E" stroke-width="3"/><path d="M690 414H740M690 428H756M690 442H730" stroke="#F7F2EA" stroke-width="2" opacity=".55"/>' +
          '<g stroke="#6B5E57" stroke-width="2"><path d="M720 306V378M830 306V378"/></g><g fill="#F7953A"><path d="M706 378H734L728 366H712Z"/><path d="M816 378H844L838 366H822Z"/></g>' +
          '<g fill="#8B6B4E"><rect x="680" y="530" width="84" height="6" rx="1"/><rect x="719" y="536" width="6" height="60"/><rect x="790" y="530" width="84" height="6" rx="1"/><rect x="829" y="536" width="6" height="60"/></g>' +
          '<g fill="#A88866"><path d="M664 548H684V596H680V566H668V596H664Z"/><path d="M760 548H780V596H776V566H764V596H760Z"/><path d="M774 548H794V596H790V566H778V596H774Z"/></g>' +
          '<text x="512" y="324" class="rs-lbl" text-anchor="middle">KITCHEN</text><text x="772" y="330" class="rs-lbl" text-anchor="middle">DINING ROOM</text>' +
          /* plenum + ceiling */
          '<rect x="386" y="254" width="508" height="46" fill="#ECE7E0"/><rect x="430" y="262" width="384" height="18" rx="3" fill="#C9CED2"/><path d="M470 262V280M530 262V280M590 262V280M650 262V280M710 262V280M770 262V280" stroke="#B5BBC1" stroke-width="1.5"/>' +
          '<rect x="386" y="300" width="508" height="6" fill="#DCD6CC"/><path d="M426 300V306M466 300V306M506 300V306M546 300V306M586 300V306M626 300V306M666 300V306M706 300V306M746 300V306M786 300V306M826 300V306M866 300V306" stroke="#C8C1B6" stroke-width="1"/>' +
          '<text x="460" y="294" class="rs-lbl" text-anchor="middle">CEILING SPACE</text>' +
          /* walls */
          '<rect x="372" y="254" width="14" height="342" fill="url(#rsBrick)"/><rect x="894" y="254" width="14" height="342" fill="url(#rsBrick)"/>' +
          '<rect x="894" y="430" width="14" height="140" fill="#BFDCEA"/><path d="M901 430V570" stroke="#E8F3F8" stroke-width="2"/>' +
          '<rect x="372" y="500" width="14" height="90" fill="#7E6249"/><rect x="372" y="590" width="14" height="6" fill="#221D1A"/>' +
          '<rect x="372" y="344" width="14" height="10" fill="#221D1A"/><rect x="360" y="340" width="12" height="18" rx="2" fill="#A9B0B6"/>' +
          '<rect x="894" y="279" width="14" height="10" fill="#221D1A"/>' +
          /* roof */
          '<rect x="372" y="236" width="536" height="18" fill="#8A8580"/><rect x="372" y="236" width="536" height="4" fill="#77726D"/>' +
          '<rect x="372" y="222" width="14" height="16" fill="#A8A29B"/><rect x="894" y="222" width="14" height="16" fill="#A8A29B"/>' +
          '<rect x="694" y="230" width="102" height="7" fill="#8A9097"/><rect x="700" y="190" width="90" height="42" rx="3" fill="#B4BBC1"/><rect x="720" y="182" width="50" height="9" rx="2" fill="#9AA2A9"/>' +
          '<path d="M712 200V224M722 200V224M732 200V224M742 200V224" stroke="#9AA2A9" stroke-width="2"/><circle cx="768" cy="211" r="12" fill="#9AA2A9"/><circle cx="768" cy="211" r="3" fill="#6E767D"/>' +
          '<rect x="786" y="231" width="10" height="6" fill="#221D1A"/>' +
          '<rect x="600" y="214" width="12" height="22" fill="#9AA2A9"/><rect x="596" y="210" width="20" height="6" rx="2" fill="#7A8187"/>' +
          /* exterior left: downspout, dumpster */
          '<rect x="346" y="236" width="14" height="6" rx="2" fill="#8D9499"/><path d="M352 240V590Q352 598 344 598H336" stroke="#8D9499" stroke-width="7" fill="none"/>' +
          '<path d="M154 540L296 540L288 524L162 524Z" fill="#30513F"/><rect x="160" y="540" width="130" height="52" rx="4" fill="#3F6B57"/><path d="M174 552V582M204 552V582M234 552V582M264 552V582" stroke="#355C4A" stroke-width="3"/>' +
          '<circle cx="178" cy="594" r="5" fill="#2F3337"/><circle cx="272" cy="594" r="5" fill="#2F3337"/>' +
          '<path d="M296 596C292 580 300 568 312 570C324 566 332 580 326 596Z" fill="#2F3337"/><path d="M308 570L312 562L316 570" stroke="#2F3337" stroke-width="3" fill="none"/>' +
          /* exterior right: sign, awning, conduit */
          '<rect x="908" y="300" width="12" height="6" fill="#6E767D"/><rect x="920" y="286" width="64" height="46" rx="5" fill="#2B2A2B"/><text x="952" y="315" text-anchor="middle" class="rs-sign">CAFÉ</text>' +
          '<path d="M908 404L994 420V438H908Z" fill="#DD7419"/><path d="M926 407V438M944 411V438M962 414V438M980 417V438" stroke="#F7F2EA" stroke-width="6" opacity=".85"/>' +
          '<path d="M922 598V284H908" stroke="#6E7378" stroke-width="6" fill="none" stroke-linejoin="round"/><rect x="928" y="478" width="20" height="28" rx="3" fill="#9AA2A9"/><circle cx="938" cy="490" r="6" fill="#E6EAED"/>' +
          pole() +
          '<path d="M1110 250Q1010 300 904 224" stroke="#2F3337" stroke-width="2.5" fill="none"/>';
      },
      shield: [[362, 606], [362, 208], [686, 208], [686, 170], [806, 170], [806, 208], [918, 208], [918, 606]],
      entries: [
        { label: "Rooftop HVAC unit", problem: "Rats run utility lines to the roof and slip under the HVAC curb.", fix: "Curb sealed with metal flashing",
          at: [792, 232], marker: [846, 150], nest: [700, 296],
          approach: cat([[1240, 596], [1114, 596], [1114, 262]], quad([1110, 250], [1010, 300], [904, 224], 14), [[890, 232], [840, 232], [800, 232], [792, 232]]),
          inside: [[786, 250], [776, 276], [752, 296], [700, 296]] },
        { label: "Utility line penetrations", problem: "Gaps where conduit and gas lines enter the wall.", fix: "Metal collar + sealant",
          at: [904, 284], marker: [1020, 250], nest: [830, 296],
          approach: [[1240, 596], [934, 596], [924, 586], [924, 296], [904, 284]],
          inside: [[886, 290], [866, 296], [830, 296]] },
        { label: "Kitchen exhaust vent", problem: "Grease-coated vents are a magnet — rats climb downspouts to reach them.", fix: "Steel vent guard",
          at: [372, 349], marker: [300, 300], nest: [592, 356],
          approach: [[-40, 596], [330, 596], [352, 588], [352, 362], [372, 349]],
          inside: [[396, 349], [470, 336], [530, 344], [560, 356], [592, 356]] },
        { label: "Back door gap", problem: "A missing door sweep leaves a gap rats squeeze under — right next to the dumpster.", fix: "Commercial door sweep",
          at: [378, 592], marker: [306, 498], nest: [528, 590],
          approach: [[214, 596], [300, 596], [340, 596], [378, 592]],
          inside: [[396, 590], [460, 590], [528, 590]] },
        { label: "Floor drain / sewer line", problem: "Norway rats travel sewer lines and push up through broken pipes and drains.", fix: "Line repaired + drain guard",
          at: [600, 612], marker: [700, 636], nest: [574, 590],
          approach: [[1240, 669], [640, 669], [604, 666], [600, 640], [600, 612]],
          inside: [[600, 600], [596, 590], [574, 590]] }
      ]
    }
  };

  /* ---------- rat sprite ---------- */
  var RAT =
    '<g class="rs-r">' +
    '<path class="rs-tail" d="M-14 2C-22 5-30 0-40 4" stroke="#B3978A" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
    '<ellipse class="rs-l1" cx="-7" cy="5.5" rx="3.4" ry="1.9" fill="#4B403A"/><ellipse class="rs-l2" cx="8" cy="5.5" rx="3.1" ry="1.8" fill="#4B403A"/>' +
    '<path d="M-15 1C-15-8-4-10 4-8C10-7 14-4 19.5 0C15 3 9 5 1 5.6C-8 6.2-15 5-15 1Z" fill="#6E625B"/>' +
    '<path d="M-12 3C-5 5 5 5 13 2.4C8 4.6 0 5.4-6 5Z" fill="#8C8079"/>' +
    '<ellipse cx="8.4" cy="-7.4" rx="3.5" ry="3.1" fill="#7D6F67"/><ellipse cx="8.7" cy="-7.2" rx="2" ry="1.7" fill="#D9A3A0"/>' +
    '<circle cx="13.6" cy="-2.6" r="1.25" fill="#16110F"/><circle cx="14" cy="-3" r=".42" fill="#fff"/>' +
    '<circle cx="19.6" cy="0" r="1.4" fill="#D98C8C"/>' +
    '<path d="M18 1L25 -1M18 1.4L25 2.6" stroke="#D8CFC9" stroke-width=".5"/>' +
    '</g>';

  /* ---------- component ---------- */
  function Sim(root) {
    this.root = root;
    this.sceneKey = SCENES[root.getAttribute("data-scene")] ? root.getAttribute("data-scene") : "home";
    this.mode = "open";
    this.rats = [];
    this.fx = [];
    this.blocked = 0;
    this.running = false;
    this.visible = false;
    this.last = 0;
    this.spawnT = 0;
    this.spawnIdx = 0;
    this.touched = false;
    this.ui();
    this.load(this.sceneKey);
    this.observe();
  }

  Sim.prototype.ui = function () {
    var r = this.root;
    r.innerHTML =
      '<div class="rs-controls">' +
      '  <div class="rs-seg" role="group" aria-label="Building type">' +
      '    <button type="button" data-scene="home">Home</button><button type="button" data-scene="restaurant">Restaurant</button>' +
      '  </div>' +
      '  <button type="button" class="rs-switch" role="switch" aria-checked="false">' +
      '    <span class="rs-switch-lbl rs-off">Unprotected</span><span class="rs-track"><span class="rs-knob"></span></span><span class="rs-switch-lbl rs-on">Protected</span>' +
      '  </button>' +
      '</div>' +
      '<div class="rs-body">' +
      '  <div class="rs-stage"><div class="rs-badge"></div><svg viewBox="80 125 1080 575" role="img" preserveAspectRatio="xMidYMid meet"></svg><div class="rs-toast" aria-live="polite"></div></div>' +
      '  <aside class="rs-panel">' +
      '    <div class="rs-stats">' +
      '      <div class="rs-stat rs-stat-in"><b class="rs-n-in">0</b><span>Rats inside</span></div>' +
      '      <div class="rs-stat rs-stat-bl"><b class="rs-n-bl">0</b><span>Blocked at barrier</span></div>' +
      '    </div>' +
      '    <h3 class="rs-ph">Entry points</h3>' +
      '    <ol class="rs-list"></ol>' +
      '    <a class="btn btn-orange rs-cta" href="#quote">Find my entry points — free</a>' +
      '  </aside>' +
      '</div>';
    this.svg = r.querySelector("svg");
    this.badge = r.querySelector(".rs-badge");
    this.toast = r.querySelector(".rs-toast");
    this.list = r.querySelector(".rs-list");
    this.nIn = r.querySelector(".rs-n-in");
    this.nBl = r.querySelector(".rs-n-bl");
    this.sw = r.querySelector(".rs-switch");
    var self = this;
    r.querySelectorAll(".rs-seg button").forEach(function (b) {
      b.addEventListener("click", function () { self.touched = true; self.load(b.getAttribute("data-scene")); });
    });
    this.sw.addEventListener("click", function () { self.touched = true; r.classList.remove("rs-hint"); self.setMode(self.mode === "open" ? "safe" : "open"); });
    // Nudge first-time viewers toward the switch
    setTimeout(function () { if (!self.touched) r.classList.add("rs-hint"); }, 7000);
  };

  Sim.prototype.load = function (key) {
    var sc = SCENES[key], self = this;
    this.sceneKey = key;
    this.scene = sc;
    this.rats = []; this.fx = []; this.blocked = 0; this.spawnT = 0; this.spawnIdx = 0;
    this.root.querySelectorAll(".rs-seg button").forEach(function (b) {
      var on = b.getAttribute("data-scene") === key;
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    this.svg.setAttribute("aria-label", sc.aria);
    this.svg.innerHTML = DEFS + '<g class="rs-art">' + sc.art() + '</g>' +
      '<g class="rs-shield"></g><g class="rs-seals"></g><g class="rs-fx"></g><g class="rs-rats"></g><g class="rs-marks"></g>';
    this.gShield = this.svg.querySelector(".rs-shield");
    this.gSeals = this.svg.querySelector(".rs-seals");
    this.gFx = this.svg.querySelector(".rs-fx");
    this.gRats = this.svg.querySelector(".rs-rats");
    this.gMarks = this.svg.querySelector(".rs-marks");

    // Barrier outline: soft glow + crisp line
    var pts = sc.shield.map(function (p) { return p.join(","); }).join(" ");
    el("polygon", { points: pts, class: "rs-sh-fill" }, this.gShield);
    el("polygon", { points: pts, class: "rs-sh-glow", filter: "url(#rsBlur)" }, this.gShield);
    el("polygon", { points: pts, class: "rs-sh-line", pathLength: "1" }, this.gShield);

    this.list.innerHTML = "";
    sc.entries.forEach(function (e, i) {
      e.ap = prep(e.approach);
      e.ip = prep(e.inside);
      // Where the barrier stops this route: first point inside the shield; underground routes stop at the entry seal
      e.stopD = e.ap.len;
      var startedOut = !inside(sc.shield, e.approach[0][0], e.approach[0][1]);
      if (startedOut) {
        for (var d = 0; d < e.ap.len; d += 2) {
          var p = at(e.ap, d);
          if (inside(sc.shield, p.x, p.y)) { e.stopD = Math.max(0, d - 10); break; }
        }
      }
      // Seal patch at the entry
      var s = el("g", { class: "rs-seal", transform: "translate(" + e.at[0] + "," + e.at[1] + ")" }, self.gSeals);
      var sr = el("rect", { x: -11, y: -8, width: 22, height: 16, rx: 3, fill: "url(#rsMesh)", stroke: "#DD7419", "stroke-width": 2.5 }, s);
      sr.style.transitionDelay = (0.5 + i * 0.14) + "s";
      // Open-hole pulse
      var h = el("g", { class: "rs-hole", transform: "translate(" + e.at[0] + "," + e.at[1] + ")" }, self.gSeals);
      el("circle", { r: 9, class: "rs-hole-ring" }, h);
      // Numbered marker + leader
      var m = el("g", { class: "rs-mark", "data-i": i }, self.gMarks);
      el("line", { x1: e.marker[0], y1: e.marker[1], x2: e.at[0], y2: e.at[1], class: "rs-lead" }, m);
      el("circle", { cx: e.marker[0], cy: e.marker[1], r: 15, class: "rs-mk" }, m);
      var t = el("text", { x: e.marker[0], y: e.marker[1] + 5, "text-anchor": "middle", class: "rs-mk-t" }, m);
      t.textContent = i + 1;
      e.markEl = m;
      var li = document.createElement("li");
      li.innerHTML = '<span class="rs-num">' + (i + 1) + '</span><div><b>' + e.label + '</b><small class="rs-pr">' + e.problem + '</small><small class="rs-fix">✓ ' + e.fix + '</small></div>';
      self.list.appendChild(li);
      e.li = li;
    });
    this.applyMode(true);
    this.updateStats();
    if (reduceMotion) this.staticFrame();
  };

  Sim.prototype.setMode = function (m) {
    if (m === this.mode) return;
    this.mode = m;
    this.applyMode(false);
    var self = this;
    if (m === "safe") {
      // Rats already inside get trapped out
      var n = 0;
      this.rats.forEach(function (r) {
        if (r.phase === "inside" || r.phase === "nest") { r.phase = "removed"; r.t = -n * 0.12; n++; }
        else if (r.phase === "approach" && r.d > r.e.stopD) { r.phase = "blocked"; r.t = 0; }
      });
      if (n) this.say(n + (n === 1 ? " rat" : " rats") + " inside removed by trapping. Every entry sealed.");
      else this.say("Every entry point sealed.");
    } else {
      this.say("Seals removed — entry points are open again.");
    }
    if (reduceMotion) this.staticFrame();
    this.updateStats();
  };

  Sim.prototype.applyMode = function (instant) {
    var safe = this.mode === "safe";
    this.root.classList.toggle("rs-safe", safe);
    this.root.classList.toggle("rs-instant", !!instant);
    var self = this;
    if (instant) requestAnimationFrame(function () { requestAnimationFrame(function () { self.root.classList.remove("rs-instant"); }); });
    this.sw.setAttribute("aria-checked", safe ? "true" : "false");
    var n = this.scene.entries.length;
    this.badge.innerHTML = safe
      ? '<i class="rs-dot"></i>Protected<span class="rs-bd"> · ' + n + ' of ' + n + ' entry points sealed</span>'
      : '<i class="rs-dot"></i>Unprotected<span class="rs-bd"> · ' + n + ' open entry points</span>';
  };

  Sim.prototype.say = function (msg) {
    var t = this.toast;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._tt);
    this._tt = setTimeout(function () { t.classList.remove("show"); }, 3200);
  };

  Sim.prototype.updateStats = function () {
    var n = 0;
    this.rats.forEach(function (r) { if (r.phase === "inside" || r.phase === "nest") n++; });
    this.nIn.textContent = n;
    this.nBl.textContent = this.blocked;
  };

  Sim.prototype.spawn = function () {
    var entries = this.scene.entries;
    // Shuffle-ish rotation so every entry gets used
    var e = entries[(this.spawnIdx * 3 + 1) % entries.length];
    this.spawnIdx++;
    var g = el("g", { class: "rs-rat" }, this.gRats);
    g.innerHTML = RAT;
    var r = {
      e: e, g: g, phase: "approach", d: 0, t: 0, op: 0,
      speed: 82 + Math.random() * 30, ang: 0, step: Math.random() * 6,
      body: g.firstChild, tail: g.querySelector(".rs-tail"), l1: g.querySelector(".rs-l1"), l2: g.querySelector(".rs-l2")
    };
    var p = at(e.ap, 0); r.x = p.x; r.y = p.y; r.ang = p.a;
    this.rats.push(r);
  };

  Sim.prototype.ring = function (x, y, cls) {
    var c = el("circle", { cx: x, cy: y, r: 6, class: cls }, this.gFx);
    this.fx.push({ el: c, t: 0 });
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

    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      var moving = this.rats.filter(function (r) { return r.phase === "approach" || r.phase === "retreat" || r.phase === "blocked"; }).length;
      if (moving < 7) this.spawn();
      this.spawnT = safe ? 0.85 : 1.05;
    }

    var nests = this.rats.filter(function (r) { return r.phase === "nest"; });
    if (nests.length > 12) { nests[0].phase = "removed"; nests[0].t = 0; }

    var changed = false;
    this.rats.forEach(function (r) {
      var e = r.e, p, moveSp = 0;
      r.t += dt;
      if (r.phase === "approach") {
        r.op = Math.min(1, r.op + dt * 3);
        r.d += r.speed * dt;
        var limit = safe ? e.stopD : e.ap.len;
        if (r.d >= limit) {
          r.d = limit;
          if (safe) { r.phase = "blocked"; r.t = 0; }
          else { r.phase = "inside"; r.d = 0; r.t = 0; self.ring(e.at[0], e.at[1], "rs-fx-bad"); self.flash(e); changed = true; }
        }
        p = at(e.ap, r.d); moveSp = r.speed;
      } else if (r.phase === "blocked") {
        p = at(e.ap, r.d);
        // Sniff at the barrier, then turn around
        p.x += Math.cos(p.a) * Math.sin(r.t * 22) * 1.4;
        p.y += Math.sin(p.a) * Math.sin(r.t * 22) * 1.4;
        if (r.t > 0.16 && !r.rung) { r.rung = true; self.ring(p.x, p.y, "rs-fx-good"); self.blocked++; self.flash(e); changed = true; }
        if (r.t > 0.75) { r.phase = "retreat"; r.t = 0; }
      } else if (r.phase === "retreat") {
        r.d -= r.speed * 1.25 * dt;
        if (r.d <= 0) { r.d = 0; r.op -= dt * 4; if (r.op <= 0) r.dead = true; }
        p = at(e.ap, r.d); p.a += Math.PI; moveSp = r.speed;
      } else if (r.phase === "inside") {
        r.d += r.speed * 0.8 * dt;
        if (r.d >= e.ip.len) { r.phase = "nest"; r.t = 0; r.home = { x: e.nest[0], y: e.nest[1] }; r.tx = r.home.x; r.wait = 0; changed = true; }
        p = at(e.ip, r.d); moveSp = r.speed;
      } else if (r.phase === "nest") {
        // Idle wander around the nest
        r.wait -= dt;
        if (r.wait <= 0 && Math.abs(r.tx - r.x) < 1) { r.tx = r.home.x + (Math.random() * 2 - 1) * 22; r.wait = 0.6 + Math.random() * 1.6; }
        var dx = r.tx - r.x, sp = 28;
        var mv = Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
        p = { x: r.x + mv, y: r.home.y, a: Math.abs(dx) > 0.5 ? (dx > 0 ? 0 : Math.PI) : r.ang };
        moveSp = Math.abs(dx) > 0.5 ? sp : 0;
      } else if (r.phase === "removed") {
        p = { x: r.x, y: r.y, a: r.ang };
        if (r.t > 0) { r.op -= dt * 2.2; r.scale = Math.max(0.2, (r.scale || 1) - dt * 1.4); if (r.op <= 0) { r.dead = true; changed = true; } }
      }
      if (!p) return;
      r.x = p.x; r.y = p.y;
      r.ang += angDiff(r.ang, p.a) * Math.min(1, dt * 12);
      self.draw(r, moveSp, dt);
    });

    this.rats = this.rats.filter(function (r) { if (r.dead) { r.g.remove(); } return !r.dead; });
    this.fx = this.fx.filter(function (f) {
      f.t += dt;
      var k = f.t / 0.7;
      f.el.setAttribute("r", 6 + k * 26);
      f.el.setAttribute("opacity", Math.max(0, 1 - k));
      if (k >= 1) { f.el.remove(); return false; }
      return true;
    });
    if (changed) this.updateStats();
    requestAnimationFrame(this.tick.bind(this));
  };

  Sim.prototype.draw = function (r, sp, dt) {
    r.step += sp * dt * 0.32;
    var flip = Math.cos(r.ang) < 0 ? -1 : 1, s = (r.scale || 1) * 1.15;
    r.g.setAttribute("transform", "translate(" + r.x.toFixed(1) + "," + r.y.toFixed(1) + ") rotate(" + (r.ang * 180 / Math.PI).toFixed(1) + ") scale(" + s.toFixed(2) + "," + (s * flip).toFixed(2) + ") translate(0,-6)");
    r.g.setAttribute("opacity", Math.max(0, Math.min(1, r.op)).toFixed(2));
    var k = sp ? Math.sin(r.step) * 1.8 : 0;
    r.l1.setAttribute("transform", "translate(" + k.toFixed(1) + ",0)");
    r.l2.setAttribute("transform", "translate(" + (-k).toFixed(1) + ",0)");
    r.body.setAttribute("transform", "translate(0," + (sp ? Math.abs(Math.sin(r.step)) * -0.8 : 0).toFixed(2) + ")");
    r.tail.setAttribute("transform", "rotate(" + (Math.sin(r.step * 0.5 + r.t) * 7).toFixed(1) + " -14 2)");
  };

  // Reduced motion: one still frame per mode
  Sim.prototype.staticFrame = function () {
    var self = this;
    this.gRats.innerHTML = ""; this.rats = [];
    var safe = this.mode === "safe";
    this.scene.entries.forEach(function (e) {
      var g = el("g", { class: "rs-rat" }, self.gRats); g.innerHTML = RAT;
      var r = { g: g, body: g.firstChild, tail: g.querySelector(".rs-tail"), l1: g.querySelector(".rs-l1"), l2: g.querySelector(".rs-l2"), op: 1, step: 0, t: 0 };
      var p = safe ? at(e.ap, e.stopD) : { x: e.nest[0], y: e.nest[1], a: 0 };
      r.x = p.x; r.y = p.y; r.ang = p.a; r.phase = safe ? "blocked" : "nest";
      self.draw(r, 0, 0);
      self.rats.push(r);
    });
    this.blocked = safe ? this.scene.entries.length : 0;
    this.updateStats();
  };

  Sim.prototype.observe = function () {
    var self = this;
    if (reduceMotion) return;
    var start = function () { if (!self.running && self.visible && !document.hidden) { self.running = true; self.last = 0; requestAnimationFrame(self.tick.bind(self)); } };
    var stop = function () { self.running = false; };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; self.visible ? start() : stop(); }, { threshold: 0.15 }).observe(this.root);
    } else { this.visible = true; start(); }
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  };

  document.querySelectorAll("[data-ratsim]").forEach(function (n) { new Sim(n); });
})();
