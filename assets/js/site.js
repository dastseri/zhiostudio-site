/* ZhioStudio — data-driven site logic.
   Everything renders from data/content.json. Also owns the order tray,
   the sample info panel and the email checkout. The 3D showroom
   (showroom.js) plugs in through window.ZS. */
(function () {
  "use strict";

  var ZS = (window.ZS = {
    data: null,
    pkgs: {},          // id -> package
    tray: new Map(),   // id -> qty
    currentSample: null,
    mode: "3d",         // "3d" | "flat"
  });

  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var money = function (n) { return "$" + Number(n).toLocaleString("en-CA"); };
  var perLabel = function (p) { return p.period === "mo" ? "/mo" : "one-time"; };
  var priceHTML = function (p) {
    return (p.priceNote ? esc(p.priceNote) + " " : "") + money(p.price) +
      (p.period === "mo" ? " <small>/ month</small>" : " <small>one-time</small>");
  };

  /* ---------------- Tray ---------------- */
  function trayQty() { var n = 0; ZS.tray.forEach(function (q) { n += q; }); return n; }

  function addToTray(id, qty) {
    if (!ZS.pkgs[id]) return;
    ZS.tray.set(id, (ZS.tray.get(id) || 0) + (qty || 1));
    renderTray();
  }
  ZS.addToTray = addToTray;

  function setQty(id, q) {
    if (q <= 0) ZS.tray.delete(id); else ZS.tray.set(id, q);
    renderTray();
  }

  function totals() {
    var once = 0, mo = 0;
    ZS.tray.forEach(function (q, id) {
      var p = ZS.pkgs[id]; if (!p) return;
      if (p.period === "mo") mo += p.price * q; else once += p.price * q;
    });
    return {
      once: once, onceHST: once * 0.13, onceTotal: once * 1.13,
      mo: mo, moHST: mo * 0.13, moTotal: mo * 1.13,
    };
  }

  function orderLines() {
    var lines = [];
    ZS.tray.forEach(function (q, id) {
      var p = ZS.pkgs[id]; if (!p) return;
      lines.push({
        name: p.name, qty: q, unit: p.price, period: p.period,
        note: p.priceNote || "", total: p.price * q,
      });
    });
    return lines;
  }

  function orderSummaryText() {
    var t = totals(), out = [];
    orderLines().forEach(function (l) {
      out.push("• " + l.name + " × " + l.qty + " — " +
        (l.note ? l.note + " " : "") + money(l.unit) +
        (l.period === "mo" ? "/mo" : " one-time") + " = " + money(l.total) +
        (l.period === "mo" ? "/mo" : ""));
    });
    if (t.once > 0) {
      out.push("");
      out.push("One-time subtotal: " + money(t.once));
      out.push("HST (13%): " + money(Math.round(t.onceHST)));
      out.push("One-time total: " + money(Math.round(t.onceTotal)));
    }
    if (t.mo > 0) {
      out.push("");
      out.push("Monthly subtotal: " + money(t.mo) + "/mo");
      out.push("HST (13%): " + money(Math.round(t.moHST)) + "/mo");
      out.push("Monthly total: " + money(Math.round(t.moTotal)) + "/mo");
    }
    out.push("");
    out.push("All prices CAD. Monthly plans are billed monthly.");
    return out.join("\n");
  }

  function renderTray() {
    $("#tray-count").textContent = trayQty();
    var box = $("#tray-items");
    if (!ZS.tray.size) {
      box.innerHTML = '<p class="tray-empty">Your tray is empty.<br/>Select a film in the showroom, or add a service above.</p>';
    } else {
      box.innerHTML = orderLines().map(function (l) {
        var id = ZS.data.packages.find(function (p) { return p.name === l.name; }).id;
        return '<div class="line-item">' +
          '<div class="li-main"><div class="li-name">' + esc(l.name) + '</div>' +
          '<div class="li-sub">' + (l.note ? esc(l.note) + " " : "") + money(l.unit) + (l.period === "mo" ? " / month" : " · one-time") + '</div></div>' +
          '<span class="qty"><button type="button" data-dec="' + id + '" aria-label="Decrease">−</button><b>' + l.qty + '</b><button type="button" data-inc="' + id + '" aria-label="Increase">+</button></span>' +
          '<span class="li-price">' + money(l.total) + (l.period === "mo" ? "/mo" : "") + '</span>' +
          '<button class="li-remove" type="button" data-remove="' + id + '" aria-label="Remove">×</button></div>';
      }).join("");
      box.querySelectorAll("[data-inc]").forEach(function (b) { b.addEventListener("click", function () { setQty(b.dataset.inc, (ZS.tray.get(b.dataset.inc) || 0) + 1); }); });
      box.querySelectorAll("[data-dec]").forEach(function (b) { b.addEventListener("click", function () { setQty(b.dataset.dec, (ZS.tray.get(b.dataset.dec) || 0) - 1); }); });
      box.querySelectorAll("[data-remove]").forEach(function (b) { b.addEventListener("click", function () { setQty(b.dataset.remove, 0); }); });
    }
    var t = totals(), rows = "";
    if (t.once > 0) {
      rows += '<div class="row"><span>One-time subtotal</span><span>' + money(t.once) + '</span></div>' +
        '<div class="row dim"><span>HST (13%)</span><span>' + money(Math.round(t.onceHST)) + '</span></div>' +
        '<div class="row grand"><span>Due one-time</span><span>' + money(Math.round(t.onceTotal)) + '</span></div>';
    }
    if (t.mo > 0) {
      rows += '<div class="row"><span>Monthly subtotal</span><span>' + money(t.mo) + '/mo</span></div>' +
        '<div class="row dim"><span>HST (13%)</span><span>' + money(Math.round(t.moHST)) + '/mo</span></div>' +
        '<div class="row grand"><span>Due monthly</span><span>' + money(Math.round(t.moTotal)) + '/mo</span></div>';
    }
    $("#tray-totals").innerHTML = rows;
    $("#checkout-open").disabled = !ZS.tray.size;
    $("#checkout-open").style.opacity = ZS.tray.size ? "1" : ".5";
  }

  function openTray() { $("#tray").classList.add("open"); $("#scrim").hidden = false; }
  function closeTray() { $("#tray").classList.remove("open"); $("#scrim").hidden = true; }
  ZS.openTray = openTray;

  /* ---------------- Sample panel ---------------- */
  function openSample(sample, opts) {
    opts = opts || {};
    ZS.currentSample = sample;
    var pkg = ZS.pkgs[sample.anchorPackage];
    $("#panel-cat").textContent = sample.category;
    $("#panel-title").textContent = sample.title;
    $("#panel-blurb").textContent = sample.blurb;
    $("#panel-anchor-text").textContent = sample.anchorText;
    $("#panel-sets").textContent = sample.priceAnchor || "Or build a set: 3 films — $597 · Full menu of 12 — $1,797";
    var demoBtn = $("#panel-demo");
    if (sample.link) { demoBtn.hidden = false; demoBtn.href = sample.link; }
    else { demoBtn.hidden = true; demoBtn.removeAttribute("href"); }
    var sel = $("#panel-select");
    sel.textContent = pkg ? ("Select — " + pkg.name + " · " + money(pkg.price) + (pkg.period === "mo" ? "/mo" : "")) : "Select this package";
    sel.onclick = function () {
      addToTray(sample.anchorPackage, 1);
      sel.textContent = "Added to your tray ✓";
      setTimeout(function () { if (ZS.currentSample === sample) sel.textContent = pkg ? ("Select — " + pkg.name + " · " + money(pkg.price) + (pkg.period === "mo" ? "/mo" : "")) : "Select"; }, 1500);
    };
    var media = $("#panel-media"), vid = $("#panel-video"), soundBtn = $("#panel-sound");
    if (ZS.mode === "flat") {
      if (sample.video) {
        media.hidden = false;
        vid.poster = sample.poster; vid.src = sample.video;
        vid.muted = false; vid.play().catch(function () {});
      } else {
        media.hidden = true; vid.removeAttribute("src"); vid.load();
      }
      soundBtn.hidden = true;
    } else {
      media.hidden = true; vid.removeAttribute("src"); vid.load();
      soundBtn.hidden = !sample.video;
      soundBtn.textContent = "Sound: off";
      soundBtn.onclick = function () {
        if (window.ZSShowroom) {
          var on = window.ZSShowroom.toggleSound();
          soundBtn.textContent = on ? "Sound: on" : "Sound: off";
        }
      };
    }
    $("#sample-panel").hidden = false;
  }
  ZS.openSample = openSample;

  function closeSample() {
    $("#sample-panel").hidden = true;
    var vid = $("#panel-video");
    vid.pause(); vid.removeAttribute("src"); vid.load();
    ZS.currentSample = null;
    if (window.ZSShowroom) window.ZSShowroom.unfocus();
  }
  ZS.closeSample = closeSample;

  ZS.enableFallback = function () {
    ZS.mode = "flat";
    $("#gl-wrap").style.display = "none";
    $("#showroom-hint").style.display = "none";
    $(".hero-copy").style.display = "none";
    $("#fallback-grid").hidden = false;
  };

  /* ---------------- Rendering ---------------- */
  function render(d) {
    var s = d.settings, c = s.colors || {}, root = document.documentElement.style;
    if (c.accent) root.setProperty("--gold", c.accent);
    if (c.accentSoft) root.setProperty("--gold-soft", c.accentSoft);
    if (c.bg) root.setProperty("--bg", c.bg);
    if (c.panel) root.setProperty("--panel", c.panel);
    if (c.ink) root.setProperty("--ink", c.ink);
    if (c.muted) root.setProperty("--muted", c.muted);

    $("#brand-logo").src = s.logo;
    $("#brand-name").textContent = s.brandName;
    $("#brand-suffix").textContent = s.brandSuffix;
    $("#footer-line").textContent = s.tagline + " · " + s.city;

    $("#hero-eyebrow").textContent = d.hero.eyebrow;
    $("#hero-headline").textContent = d.hero.headline;
    $("#hero-subline").textContent = d.hero.subline;
    $("#hero-primary").textContent = d.hero.primaryCta;
    $("#hero-secondary").textContent = d.hero.secondaryCta;
    $("#showroom-hint").textContent = d.hero.hint;

    /* Fallback grid */
    $("#grid").innerHTML = d.samples.map(function (sm) {
      return '<button class="work-card" type="button" data-sample="' + sm.id + '">' +
        '<img loading="lazy" src="' + esc(sm.poster) + '" alt="' + esc(sm.title) + ' — sample film poster" />' +
        '<span class="wc-body"><span class="wc-cat">' + esc(sm.category) + '</span>' +
        '<span class="wc-title" style="display:block">' + esc(sm.title) + '</span></span></button>';
    }).join("");
    document.querySelectorAll("[data-sample]").forEach(function (el) {
      el.addEventListener("click", function () {
        var sm = d.samples.find(function (x) { return x.id === el.dataset.sample; });
        if (sm) openSample(sm);
      });
    });

    /* Services */
    $("#services-cards").innerHTML = d.services.map(function (sv) {
      return '<article class="card"><h3>' + esc(sv.title) + '</h3><p>' + esc(sv.text) + '</p></article>';
    }).join("");

    /* Pricing, grouped in first-seen order */
    var groups = [], byGroup = {};
    d.packages.forEach(function (p) {
      if (!byGroup[p.group]) { byGroup[p.group] = []; groups.push(p.group); }
      byGroup[p.group].push(p);
    });
    $("#pricing-groups").innerHTML = groups.map(function (g) {
      return '<div class="price-group"><h3>' + esc(g) + '</h3><div class="price-cards">' +
        byGroup[g].map(function (p) {
          return '<article class="price-card' + (p.featured ? " featured" : "") + '">' +
            (p.featured ? '<span class="price-flag">Most complete</span>' : "") +
            '<h4>' + esc(p.name) + '</h4>' +
            '<p class="price">' + priceHTML(p) + '</p>' +
            '<p class="blurb">' + esc(p.blurb) + '</p>' +
            '<ul>' + p.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + '</ul>' +
            '<button class="btn ' + (p.featured ? "btn-gold" : "btn-ghost") + '" type="button" data-add="' + p.id + '">Add to order</button></article>';
        }).join("") + "</div></div>";
    }).join("");
    $("#terms").textContent = d.terms;
    document.querySelectorAll("[data-add]").forEach(function (b) {
      b.addEventListener("click", function () { addToTray(b.dataset.add, 1); openTray(); });
    });

    /* Tray quick-add list */
    $("#tray-add-list").innerHTML = d.packages.map(function (p) {
      return '<div class="add-row"><span>' + esc(p.name) + ' <span class="add-price">' +
        (p.priceNote ? esc(p.priceNote) + " " : "") + money(p.price) + (p.period === "mo" ? "/mo" : "") +
        '</span></span><button class="btn btn-sm btn-ghost" type="button" data-add="' + p.id + '">Add</button></div>';
    }).join("");
    document.querySelectorAll("#tray-add-list [data-add]").forEach(function (b) {
      b.addEventListener("click", function () { addToTray(b.dataset.add, 1); });
    });

    /* About / family / contact / footer */
    $("#about-heading").textContent = d.about.heading;
    $("#about-text").textContent = d.about.text;
    $("#family-cards").innerHTML = d.family.map(function (f) {
      var ext = /^https?:/.test(f.url);
      return '<article class="card"><h3>' + esc(f.name) + '</h3><p>' + esc(f.text) + '</p>' +
        '<a class="card-link" href="' + esc(f.url) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + '>Visit ' + esc(f.name) + ' →</a></article>';
    }).join("");
    $("#contact-heading").textContent = d.contact.heading;
    $("#contact-text").textContent = d.contact.text;
    var em = $("#contact-email");
    em.href = "mailto:" + d.contact.email; em.textContent = "Email — " + d.contact.email;
    $("#contact-ig").href = d.contact.instagram;
    $("#contact-tt").href = d.contact.tiktok;
    $("#footer-links").innerHTML =
      '<a href="' + esc(d.contact.instagram) + '" target="_blank" rel="noopener">Instagram</a>' +
      '<a href="' + esc(d.contact.tiktok) + '" target="_blank" rel="noopener">TikTok</a>' +
      d.family.filter(function (f) { return /^https?:/.test(f.url); }).map(function (f) {
        return '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.name) + '</a>';
      }).join("") +
      '<a href="mailto:' + esc(d.contact.email) + '">' + esc(d.contact.email) + '</a>' +
      '<a href="admin/">Admin</a>';

    renderTray();
  }

  /* ---------------- Checkout ---------------- */
  var lastRef = null;
  function setupCheckout() {
    $("#checkout-open").addEventListener("click", function () {
      if (!ZS.tray.size) return;
      closeTray();
      $("#checkout-summary").textContent = orderSummaryText();
      $("#checkout-form").hidden = false;
      $("#checkout-done").hidden = true;
      $("#checkout-modal").hidden = false;
    });
    $("#checkout-close").addEventListener("click", function () { $("#checkout-modal").hidden = true; });
    $("#done-close").addEventListener("click", function () { $("#checkout-modal").hidden = true; });
    $("#checkout-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(ev.target);
      lastRef = "ZS-" + Date.now().toString(36).toUpperCase().slice(-4) + Math.floor(Math.random() * 90 + 10);
      var body =
        "ZhioStudio order request — " + lastRef + "\n\n" +
        "Name: " + fd.get("name") + "\n" +
        "Business: " + fd.get("business") + "\n" +
        "Phone: " + (fd.get("phone") || "—") + "\n" +
        "Email: " + fd.get("email") + "\n\n" +
        "ORDER\n" + orderSummaryText() + "\n\n" +
        "Notes: " + (fd.get("notes") || "—") + "\n";
      var mailto = "mailto:" + ZS.data.contact.email +
        "?subject=" + encodeURIComponent("ZhioStudio order request " + lastRef + " — " + fd.get("business")) +
        "&body=" + encodeURIComponent(body);
      $("#done-ref").textContent = lastRef;
      var de = $("#done-email");
      de.href = "mailto:" + ZS.data.contact.email; de.textContent = ZS.data.contact.email;
      $("#checkout-form").hidden = true;
      $("#checkout-done").hidden = false;
      window.location.href = mailto;
    });
  }

  /* ---------------- Wire up ---------------- */
  function init() {
    $("#tray-fab").addEventListener("click", openTray);
    $("#tray-close").addEventListener("click", closeTray);
    $("#scrim").addEventListener("click", closeTray);
    $("#header-order-btn").addEventListener("click", openTray);
    $("#panel-close").addEventListener("click", closeSample);
    $("#nav-toggle").addEventListener("click", function () {
      var nav = $("#site-nav"), open = nav.classList.toggle("open");
      this.setAttribute("aria-expanded", open);
    });
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      a.addEventListener("click", function () { $("#site-nav").classList.remove("open"); });
    });
    setupCheckout();

    fetch("data/content.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("content " + r.status); return r.json(); })
      .then(function (d) {
        ZS.data = d;
        d.packages.forEach(function (p) { ZS.pkgs[p.id] = p; });
        render(d);
        var hp = $("#hero-primary");
        if (hp) hp.addEventListener("click", openTray);
        document.dispatchEvent(new CustomEvent("zs-ready", { detail: d }));
      })
      .catch(function (err) {
        console.error(err);
        var g = $("#fallback-grid");
        g.hidden = false;
        g.querySelector(".fallback-head p").textContent =
          "The showroom could not load its content file. Please serve this site over HTTP (for example: python3 -m http.server) — or email zhiostutio@gmail.com and we will help right away.";
        $("#gl-wrap").style.display = "none";
        $(".hero-copy").style.display = "none";
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
