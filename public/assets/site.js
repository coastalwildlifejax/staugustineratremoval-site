/* ===== CONFIG — shared by every page ===== */
// Phone numbers are printed in the HTML (see _build/build.py) so CallRail's swap.js can replace them
// with the tracking number. Don't set them from JS — that would overwrite CallRail's swap.
var CONFIG = {
  WEBHOOK_URL: "https://services.leadconnectorhq.com/hooks/9j3BmGLLNFju0BVKEoGH/webhook-trigger/ea517280-3569-42e4-969e-2f72fb1cd490"  // GoHighLevel workflow "Inbound Webhook" trigger URL
};
/* ========================================= */

(function(){
  // Whatever number is on the page (CallRail's tracking number once swapped)
  function phone(){ var el = document.querySelector(".js-phone"); return el ? el.textContent : "us"; }
  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();

  // Persist ad-click attribution so it survives page reloads
  var q = new URLSearchParams(location.search), keys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","gbraid","wbraid","fbclid"];
  keys.forEach(function(k){ var v=q.get(k); if(v){ try{ localStorage.setItem("sarr_"+k,v); }catch(e){} } });
  function attr(k){ var v=q.get(k); if(v) return v; try{ return localStorage.getItem("sarr_"+k)||""; }catch(e){ return ""; } }

  // Track phone clicks as a conversion event
  window.dataLayer = window.dataLayer || [];
  document.querySelectorAll(".js-tel").forEach(function(a){ a.addEventListener("click",function(){ dataLayer.push({event:"phone_click", service_area: document.body.dataset.area || "general"}); }); });

  var form = document.getElementById("leadForm");
  if (!form) return;
  var err = document.getElementById("formErr"), btn = document.getElementById("submitBtn");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    err.style.display = "none";
    var f = new FormData(form);
    if (f.get("company_website")) return;                     // honeypot: bot
    var phone = (f.get("phone")||"").replace(/\D/g,"");
    if (!f.get("first_name") || !f.get("last_name") || phone.length < 10 || !f.get("address") || !f.get("issue")) {
      err.textContent = "Please fill in your name, phone, address and issue.";
      err.style.display = "block"; return;
    }
    var payload = {
      first_name: f.get("first_name"), last_name: f.get("last_name"),
      phone: "+1" + phone.slice(-10), email: f.get("email") || "",
      address: f.get("address"), issue: f.get("issue"),
      sms_consent: f.get("sms_consent") === "yes",
      service_area: document.body.dataset.area || "general",
      source: "staugustineratremoval.com", landing_page: location.href, referrer: document.referrer
    };
    keys.forEach(function(k){ payload[k] = attr(k); });

    if (!CONFIG.WEBHOOK_URL) { err.textContent = "Online booking isn't live yet. Please call " + phone() + "."; err.style.display = "block"; return; }
    btn.disabled = true; btn.textContent = "Sending…";
    // Form-encoded + no-cors avoids a CORS preflight, which GHL webhooks don't answer
    fetch(CONFIG.WEBHOOK_URL, { method:"POST", mode:"no-cors", body: new URLSearchParams(payload) })
      .then(function(){
        dataLayer.push({event:"lead_submit", service_area: payload.service_area});
        document.getElementById("formWrap").style.display = "none";
        document.getElementById("thanks").style.display = "block";
      })
      .catch(function(){
        btn.disabled = false; btn.textContent = "Get My Free Inspection";
        err.textContent = "Something went wrong. Please call " + phone() + ".";
        err.style.display = "block";
      });
  });
})();
