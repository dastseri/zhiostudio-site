/* Vaishali Joshi concept — vanilla JS: reveal, header, keynote explorer,
   ORA guided practice, self-check, demo forms, AVA demo widget.
   Wellness-paced: soft motion only; respects prefers-reduced-motion. */
(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header shadow on scroll */
  var header = document.getElementById("siteHeader");
  if(header){
    window.addEventListener("scroll", function(){
      header.classList.toggle("scrolled", window.scrollY > 10);
    }, {passive:true});
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if(reduced || !("IntersectionObserver" in window)){
    revealEls.forEach(function(el){ el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, {threshold:0.08, rootMargin:"0px 0px 120px 0px"});
    revealEls.forEach(function(el){ io.observe(el); });
  }

  /* ---------- Keynote explorer: audience tabs + expandable cards ---------- */
  var tabs = document.querySelectorAll(".aud-tab");
  var talkCards = document.querySelectorAll(".talk-card");
  var audEmpty = document.getElementById("audEmpty");
  tabs.forEach(function(tab){
    tab.addEventListener("click", function(){
      tabs.forEach(function(t){ t.classList.remove("active"); t.setAttribute("aria-selected","false"); });
      tab.classList.add("active"); tab.setAttribute("aria-selected","true");
      var aud = tab.getAttribute("data-aud"), visible = 0;
      talkCards.forEach(function(card){
        var show = (aud === "all") || (card.getAttribute("data-aud") || "").split(" ").indexOf(aud) !== -1;
        card.classList.toggle("hide", !show);
        if(show) visible++;
      });
      if(audEmpty) audEmpty.hidden = visible > 0;
    });
  });
  talkCards.forEach(function(card){
    function toggle(){
      var open = card.classList.toggle("open");
      var tg = card.querySelector(".talk-toggle");
      if(tg) tg.textContent = open ? "Close" : "Read more";
    }
    card.addEventListener("click", function(e){
      if(e.target.closest("a")) return;
      toggle();
    });
    card.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); toggle(); }
    });
  });

  /* ---------- ORA guided practice — paced like a breath ---------- */
  var ORA = [
    {kicker:"Step one of three · ORA℠", title:"Observe",
     text:"Self-discovery first: identify the triggers behind stress, distraction and disconnection."},
    {kicker:"Step two of three · ORA℠", title:"Release",
     text:"Let go of the negativity and anxiety that hijack your response — swiftly, before they lead."},
    {kicker:"Step three of three · ORA℠", title:"Activate",
     text:"Channel your energy to the right intelligences at the right time — Vaishali's definition of mental agility."}
  ];
  var oraKicker = document.getElementById("oraKicker"),
      oraTitle  = document.getElementById("oraTitle"),
      oraText   = document.getElementById("oraText"),
      breath    = document.getElementById("breathCircle"),
      breathWord= document.getElementById("breathWord"),
      stepBtns  = document.querySelectorAll(".ora-step-btn"),
      beginBtn  = document.getElementById("oraBegin");
  var oraTimers = [];
  var oraOrbitApi = null; /* set by the art-direction orbit engine, when present */
  function oraClear(){ oraTimers.forEach(clearTimeout); oraTimers = []; }
  function oraLater(fn, ms){ oraTimers.push(setTimeout(fn, ms)); }
  function oraShow(i){
    oraKicker.textContent = ORA[i].kicker;
    oraTitle.textContent  = ORA[i].title;
    oraText.textContent   = ORA[i].text;
    stepBtns.forEach(function(b, bi){
      b.classList.toggle("active", bi === i);
      b.setAttribute("aria-selected", bi === i ? "true" : "false");
    });
    if(oraOrbitApi) oraOrbitApi.bringToFront(i);
  }
  function breathCycle(done){
    if(!breath){ done && done(); return; }
    if(reduced){ done && done(); return; }
    breathWord.textContent = "breathe in";
    breath.classList.remove("exhale"); breath.classList.add("inhale");
    oraLater(function(){
      breathWord.textContent = "breathe out";
      breath.classList.remove("inhale"); breath.classList.add("exhale");
    }, 4200);
    oraLater(function(){ done && done(); }, 8400);
  }
  function oraGuided(){
    oraClear();
    if(beginBtn){ beginBtn.textContent = "Begin again"; }
    oraShow(0);
    breathCycle(function(){
      oraShow(1);
      breathCycle(function(){
        oraShow(2);
        breathCycle(function(){
          oraKicker.textContent = "The practice";
          oraTitle.textContent  = "Three levers, held gently";
          oraText.textContent   = "Observe. Release. Activate. Three powerful mindset levers, applied continually — the heart of the ORA Experience℠ and of Vaishali's work with teams.";
          if(breathWord) breathWord.textContent = "breathe";
        });
      });
    });
  }
  stepBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      oraClear();
      if(breath){ breath.classList.remove("inhale","exhale"); }
      if(breathWord) breathWord.textContent = "breathe";
      oraShow(parseInt(btn.getAttribute("data-step"), 10));
    });
  });
  if(beginBtn) beginBtn.addEventListener("click", oraGuided);

  /* ---------- Self-check (ORA language only, no scores) ---------- */
  var BEGIN = {
    O:{title:"Begin with Observe", text:"Self-discovery first: identify the triggers behind stress, distraction and disconnection."},
    R:{title:"Begin with Release", text:"Let go of the negativity and anxiety that hijack your response — swiftly, before they lead."},
    A:{title:"Begin with Activate", text:"Channel your energy to the right intelligences at the right time — Vaishali's definition of mental agility."}
  };
  var scBtn = document.getElementById("scButton"),
      scQuiz = document.getElementById("scQuiz"),
      scResult = document.getElementById("scResult"),
      scAgain = document.getElementById("scAgain");
  if(scBtn){
    scBtn.addEventListener("click", function(){
      var counts = {O:0, R:0, A:0}, answered = 0;
      ["sc1","sc2","sc3"].forEach(function(name){
        var sel = document.querySelector('input[name="'+name+'"]:checked');
        if(sel){ counts[sel.value]++; answered++; }
      });
      if(answered < 3){
        scBtn.textContent = "Choose one answer for each question";
        return;
      }
      var best = "O";
      ["O","R","A"].forEach(function(k){ if(counts[k] > counts[best]) best = k; });
      document.getElementById("scResultTitle").textContent = BEGIN[best].title;
      document.getElementById("scResultText").textContent  = BEGIN[best].text;
      scQuiz.hidden = true;
      scResult.hidden = false;
      scResult.scrollIntoView({behavior: reduced ? "auto" : "smooth", block:"center"});
    });
  }
  if(scAgain){
    scAgain.addEventListener("click", function(){
      scResult.hidden = true;
      scQuiz.hidden = false;
      document.querySelectorAll('#scQuiz input[type="radio"]').forEach(function(r){ r.checked = false; });
      if(scBtn) scBtn.textContent = "See where to begin";
    });
  }

  /* ---------- Demo forms: success state, nothing is transmitted ---------- */
  document.querySelectorAll("form[data-demo]").forEach(function(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var box = form.querySelector(".form-success");
      if(box){
        box.classList.add("show");
        box.scrollIntoView({behavior: reduced ? "auto" : "smooth", block:"center"});
      }
      form.querySelectorAll("input").forEach(function(f){ f.value = ""; });
    });
  });

  /* ================= Art direction: tilt, parallax, ORA orbit, video ================= */
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ----- Gentle 3D tilt: keynote cards & photo frames (fine pointers only) ----- */
  if(finePointer && !reduced){
    document.querySelectorAll("[data-tilt]").forEach(function(el){
      el.classList.add("tilt");
      var maxDeg = el.offsetWidth > 480 ? 5 : 7.5, queued = null;
      el.addEventListener("pointermove", function(e){
        if(queued) return;
        queued = requestAnimationFrame(function(){
          queued = null;
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - .5;
          var py = (e.clientY - r.top) / r.height - .5;
          el.classList.add("live");
          el.style.setProperty("--ry", (px * maxDeg).toFixed(2) + "deg");
          el.style.setProperty("--rx", (-py * maxDeg).toFixed(2) + "deg");
        });
      });
      el.addEventListener("pointerleave", function(){
        el.classList.remove("live");
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });

    /* ----- Hero parallax: layers drift at different rates ----- */
    var plxEls = document.querySelectorAll("[data-plx]");
    if(plxEls.length){
      var pmx = 0, pmy = 0, plxQueued = false;
      function plxRender(){
        plxQueued = false;
        var sc = window.scrollY;
        plxEls.forEach(function(el){
          var parts = (el.getAttribute("data-plx") || "").split(",");
          var sf = parseFloat(parts[0]) || 0, pf = parseFloat(parts[1]) || 0;
          el.style.transform = "translate3d(" + (pmx * pf).toFixed(1) + "px," + (-sc * sf + pmy * pf).toFixed(1) + "px,0)";
        });
      }
      function plxQueue(){ if(!plxQueued){ plxQueued = true; requestAnimationFrame(plxRender); } }
      window.addEventListener("scroll", plxQueue, {passive:true});
      var heroSec = document.querySelector(".hero");
      if(heroSec){
        heroSec.addEventListener("pointermove", function(e){
          var r = heroSec.getBoundingClientRect();
          pmx = (e.clientX - r.left) / r.width - .5;
          pmy = (e.clientY - r.top) / r.height - .5;
          plxQueue();
        });
        heroSec.addEventListener("pointerleave", function(){ pmx = 0; pmy = 0; plxQueue(); });
      }
      plxEls.forEach(function(el){
        setTimeout(function(){ el.style.transition = "opacity .8s ease"; }, 1000);
      });
      plxRender();
    }
  }

  /* ----- ORA orbit: three levers on a slow 3D ring ----- */
  function makeOrbit(zone, onPick){
    var nodes = Array.prototype.slice.call(zone.querySelectorAll(".orbit-node"));
    if(!nodes.length) return null;
    var angle = Math.PI / 2, anim = null, lastInteract = 0, visible = true;
    function render(){
      var rx = zone.clientWidth * 0.40, ry = rx * 0.44;
      nodes.forEach(function(node, i){
        var a = angle + i * (Math.PI * 2 / 3);
        var s = Math.sin(a), depth = (s + 1) / 2;
        node.style.transform = "translate(-50%,-50%) translate(" + (Math.cos(a) * rx).toFixed(1) + "px," + (s * ry).toFixed(1) + "px) scale(" + (0.76 + 0.30 * depth).toFixed(3) + ")";
        node.style.opacity = (0.45 + 0.55 * depth).toFixed(2);
        node.style.zIndex = String(10 + Math.round(depth * 10));
        node.classList.toggle("front", s > 0.86);
      });
    }
    function bringToFront(i, instant){
      lastInteract = performance.now();
      var twoPi = Math.PI * 2;
      var want = Math.PI / 2 - i * (Math.PI * 2 / 3);
      var diff = (want - angle) % twoPi;
      if(diff > Math.PI) diff -= twoPi;
      if(diff < -Math.PI) diff += twoPi;
      if(instant || reduced){ angle += diff; anim = null; render(); return; }
      anim = {from: angle, to: angle + diff, start: performance.now(), dur: 900};
    }
    nodes.forEach(function(node, i){
      node.addEventListener("click", function(){ bringToFront(i); if(onPick) onPick(i); });
    });
    render();
    if(!reduced){
      if("IntersectionObserver" in window){
        new IntersectionObserver(function(en){ visible = en[0].isIntersecting; }, {threshold:0.05}).observe(zone);
      }
      var last = performance.now();
      (function loop(now){
        requestAnimationFrame(loop);
        var dt = Math.min(50, now - last); last = now;
        if(!visible || document.hidden) return;
        if(anim){
          var p = Math.min(1, (now - anim.start) / anim.dur);
          var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          angle = anim.from + (anim.to - anim.from) * e;
          if(p >= 1) anim = null;
        } else if(now - lastInteract > 6000){
          angle += dt * 0.00016; /* one slow revolution ≈ 39 seconds */
        }
        render();
      })(performance.now());
    }
    return {bringToFront: bringToFront};
  }

  var homeReadout = document.getElementById("homeOraReadout");
  document.querySelectorAll("[data-orbit]").forEach(function(zone){
    var onMethod = !!zone.closest(".ora-explorer");
    var api = makeOrbit(zone, function(i){
      if(onMethod){
        oraClear();
        if(breath){ breath.classList.remove("inhale", "exhale"); }
        if(breathWord) breathWord.textContent = "breathe";
        oraShow(i);
      } else if(homeReadout){
        homeReadout.innerHTML = "";
        var st = document.createElement("strong");
        st.textContent = ORA[i].title;
        homeReadout.appendChild(st);
        homeReadout.appendChild(document.createTextNode(ORA[i].text));
      }
    });
    if(onMethod) oraOrbitApi = api;
  });

  /* ----- Video facades: the player loads only when asked ----- */
  document.querySelectorAll(".vid").forEach(function(v){
    function play(){
      if(v.classList.contains("on")) return;
      var src = null;
      if(v.getAttribute("data-yt")){
        src = "https://www.youtube-nocookie.com/embed/" + v.getAttribute("data-yt") + "?autoplay=1&rel=0";
      } else if(v.getAttribute("data-vimeo")){
        src = "https://player.vimeo.com/video/" + v.getAttribute("data-vimeo") + "?h=" + (v.getAttribute("data-vimeo-h") || "") + "&autoplay=1&title=0&byline=0&portrait=0";
      }
      if(!src) return;
      v.classList.add("on");
      var f = document.createElement("iframe");
      f.src = src;
      f.title = v.getAttribute("aria-label") || "Video";
      f.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
      f.setAttribute("allowfullscreen", "");
      v.innerHTML = "";
      v.appendChild(f);
    }
    v.addEventListener("click", play);
    v.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); play(); }
    });
  });

  /* ---------- AVA booking-assistant demo (front-end only, scripted) ---------- */
  var panel = document.getElementById("avaPanel"), bubble = document.getElementById("avaBubble"),
      avaBody = document.getElementById("avaBody"), closeBtn = document.getElementById("avaClose");
  if(!panel || !bubble) return;

  var ANSWERS = {
    topics:"Vaishali's signature keynotes are: “From Adversity to Adventure” — building agile, energized mindsets in times of change; “Our Full Mind” — the human education needed for the future; and “Reclaiming the Mind Behind the Wheel” — a 20–30 minute journey into self-leadership. She also offers interactive workshops, panels, and emcee & facilitation for events. Would you like me to help you book one?",
    ora:"ORA℠ is Vaishali's proprietary method — three mindset levers: Observe (identify the triggers behind stress, distraction and disconnection), Release (let go of negativity and anxiety before they lead), and Activate (channel your energy to the right intelligences at the right time). Her ORA Experience℠ is a personalized 6-week journey built on it.",
    book:"You can book Vaishali through her booking page — the “Book Vaishali to Speak” button at the top of this page. To reply well, her team will want your event date, organization, audience size and the talk you're considering. I can capture those details on her booking line, 24/7, so nothing is missed.",
    price:"Speaking fees depend on the date, the format and the audience — Vaishali's team replies with the right figure once they have your event details. The kindest next step is the booking page, or a free consultation through her contact page.",
    ava:"I'm AVA — an AI receptionist by NexAIS. On a live booking line I answer every call 24/7, capture the complete booking details, confirm and follow up with callers by text and email, and hand urgent requests straight to a human. You can hear me answer on the live demo line: +1 (437) 529-0400. AVA can be added to Vaishali's booking line as a service of her own.",
    fallback:"Happy to help with Vaishali's keynotes, the ORA℠ method, the 6-week ORA Experience℠, or how to book her for your event. For anything else, her contact page reaches the team directly — and I keep the booking line answered, 24/7."
  };
  function addMsg(text, who){
    var d = document.createElement("div");
    d.className = "msg " + who; d.textContent = text;
    avaBody.appendChild(d); avaBody.scrollTop = avaBody.scrollHeight;
  }
  function answerFor(text){
    var t = text.toLowerCase();
    if(/ora|method|observe|release|activate|experience/.test(t)) return ANSWERS.ora;
    if(/topic|talk|keynote|speak about|subject/.test(t)) return ANSWERS.topics;
    if(/price|cost|fee|charge|budget/.test(t)) return ANSWERS.price;
    if(/\bava\b|receptionist|24\/7|after hours|answer/.test(t)) return ANSWERS.ava;
    if(/book|invite|reserve|hire|schedule/.test(t)) return ANSWERS.book;
    return ANSWERS.fallback;
  }
  var greeted = false;
  function openPanel(){
    panel.classList.add("open"); bubble.setAttribute("aria-expanded","true");
    if(!greeted){
      greeted = true;
      addMsg("Hello, I'm AVA — I keep Vaishali's booking line answered with care, 24/7. Ask me about her keynotes, the ORA℠ method, or how to book her for your event.","ava");
    }
  }
  function closePanel(){ panel.classList.remove("open"); bubble.setAttribute("aria-expanded","false"); }
  bubble.addEventListener("click", function(){
    panel.classList.contains("open") ? closePanel() : openPanel();
  });
  if(closeBtn) closeBtn.addEventListener("click", closePanel);
  document.querySelectorAll("[data-ava-open]").forEach(function(el){
    el.addEventListener("click", function(e){ e.preventDefault(); openPanel(); });
  });
  panel.querySelectorAll(".chip").forEach(function(chip){
    chip.addEventListener("click", function(){
      var q = chip.getAttribute("data-q");
      addMsg(q, "user");
      setTimeout(function(){ addMsg(answerFor(q), "ava"); }, 450);
    });
  });
  var input = document.getElementById("avaInput"), send = document.getElementById("avaSend");
  function sendTyped(){
    var v = (input.value || "").trim(); if(!v) return;
    input.value = ""; addMsg(v, "user");
    setTimeout(function(){ addMsg(answerFor(v), "ava"); }, 450);
  }
  if(send) send.addEventListener("click", sendTyped);
  if(input) input.addEventListener("keydown", function(e){
    if(e.key === "Enter"){ e.preventDefault(); sendTyped(); }
  });
})();
