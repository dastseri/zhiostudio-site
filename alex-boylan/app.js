/* Alex Boylan redesign — vanilla JS: nav, parallax, tilt, reveal, counters, forms, AVA demo */
(function(){
  "use strict";

  /* Mobile nav */
  var burger=document.querySelector(".burger"), menu=document.getElementById("mobileMenu");
  if(burger&&menu){
    burger.addEventListener("click",function(){
      var open=menu.classList.toggle("open");
      burger.setAttribute("aria-expanded",open?"true":"false");
    });
    menu.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){menu.classList.remove("open");burger.setAttribute("aria-expanded","false");});});
  }

  /* Parallax hero image */
  var px=document.querySelector("[data-parallax]");
  if(px&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    var ticking=false;
    window.addEventListener("scroll",function(){
      if(!ticking){window.requestAnimationFrame(function(){
        var y=window.scrollY;
        if(y<900){px.style.transform="translateY("+(y*0.12)+"px) scale(1.06)";}
        ticking=false;
      });ticking=true;}
    },{passive:true});
  }

  /* 3D tilt cards */
  if(window.matchMedia("(hover:hover)").matches){
    document.querySelectorAll("[data-tilt]").forEach(function(card){
      card.classList.add("tilt");
      card.addEventListener("mousemove",function(e){
        var r=card.getBoundingClientRect();
        var x=(e.clientX-r.left)/r.width-0.5, y=(e.clientY-r.top)/r.height-0.5;
        card.style.setProperty("--ry",(x*9)+"deg");
        card.style.setProperty("--rx",(-y*9)+"deg");
      });
      card.addEventListener("mouseleave",function(){card.style.setProperty("--rx","0deg");card.style.setProperty("--ry","0deg");});
    });
  }

  /* Scroll reveal */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target);}});
  },{threshold:0.08,rootMargin:"0px 0px 140px 0px"});
  document.querySelectorAll(".reveal").forEach(function(el){io.observe(el);});

  /* Animated counters */
  function animateCount(el){
    var target=parseFloat(el.getAttribute("data-count")), suffix=el.getAttribute("data-suffix")||"";
    var dur=1400, start=null;
    function step(ts){
      if(!start)start=ts;
      var p=Math.min((ts-start)/dur,1), eased=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*eased)+suffix;
      if(p<1)window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  var cio=new IntersectionObserver(function(entries){
    entries.forEach(function(en){if(en.isIntersecting){animateCount(en.target);cio.unobserve(en.target);}});
  },{threshold:0.4});
  document.querySelectorAll("[data-count]").forEach(function(el){cio.observe(el);});

  /* Front-end demo forms: success state, nothing is transmitted */
  document.querySelectorAll("form[data-demo]").forEach(function(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var box=form.querySelector(".form-success");
      if(box){box.classList.add("show");box.scrollIntoView({behavior:"smooth",block:"center"});}
      form.querySelectorAll("input,select,textarea").forEach(function(f){if(f.type!=="submit")f.value="";});
    });
  });

  /* ---------- AVA booking-assistant demo (front-end only, scripted) ---------- */
  var panel=document.getElementById("avaPanel"), bubble=document.getElementById("avaBubble"),
      body=document.getElementById("avaBody"), closeBtn=document.getElementById("avaClose");
  if(!panel||!bubble) return;

  /* On pages without the full widget, the bubble links to the Speaking page widget. */
  if(bubble.getAttribute("data-mode")==="link"){ return; }

  var ANSWERS={
    topics:"Alex speaks on turning a journey into a career: dreaming bigger, resilience through change, building a personal brand, and how students can land their dream job before graduation. Want me to check a date for your campus?",
    price:"Speaking fees depend on the date, audience size and format — that's exactly what the booking form on this page captures. Share those four details and Alex's team can respond with a tailored quote. No ballpark guessing from me!",
    book:"You can invite Alex right here: use the booking form on this page (event date, organization, audience size, budget range) and the team will follow up. I can also answer questions 24/7 while you decide.",
    travel:"Yes — Alex has filmed in 60+ countries and circumnavigated the globe 5+ times, so campus travel is very much his natural habitat. Add your location in the booking form and the team will confirm logistics.",
    fallback:"Great question. I can help with speaking topics, booking steps, dates and fees — or type a topic below. For anything else, the booking form reaches Alex's team directly."
  };
  function addMsg(text,who){
    var d=document.createElement("div");d.className="msg "+who;d.textContent=text;body.appendChild(d);body.scrollTop=body.scrollHeight;
  }
  function answerFor(text){
    var t=text.toLowerCase();
    if(/topic|talk|speak about|subject/.test(t))return ANSWERS.topics;
    if(/price|cost|fee|budget|charge/.test(t))return ANSWERS.price;
    if(/book|invite|reserve|hire/.test(t))return ANSWERS.book;
    if(/travel|come to|location|far/.test(t))return ANSWERS.travel;
    return ANSWERS.fallback;
  }
  var greeted=false;
  function openPanel(){
    panel.classList.add("open");bubble.setAttribute("aria-expanded","true");
    if(!greeted){greeted=true;addMsg("Hi, I'm AVA — Alex's booking assistant. I answer and qualify speaking enquiries 24/7. Ask me about topics, fees, or how to book Alex for your campus.","ava");}
    if(window.location.hash==="#ava-assistant"){/* opened via anchor */}
  }
  function closePanel(){panel.classList.remove("open");bubble.setAttribute("aria-expanded","false");}
  bubble.addEventListener("click",function(){panel.classList.contains("open")?closePanel():openPanel();});
  if(closeBtn)closeBtn.addEventListener("click",closePanel);
  document.querySelectorAll("[data-ava-open]").forEach(function(el){el.addEventListener("click",function(e){e.preventDefault();openPanel();});});
  panel.querySelectorAll(".chip").forEach(function(chip){
    chip.addEventListener("click",function(){
      var q=chip.getAttribute("data-q");addMsg(q,"user");
      window.setTimeout(function(){addMsg(answerFor(q),"ava");},450);
    });
  });
  var input=document.getElementById("avaInput"), send=document.getElementById("avaSend");
  function sendTyped(){
    var v=(input.value||"").trim();if(!v)return;input.value="";addMsg(v,"user");
    window.setTimeout(function(){addMsg(answerFor(v),"ava");},450);
  }
  if(send)send.addEventListener("click",sendTyped);
  if(input)input.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();sendTyped();}});
  if(window.location.hash==="#ava-assistant"){openPanel();}
})();
