/* 經彩青春Do｜三次選擇．先確認、再看回饋 */
(() => {
  "use strict";
  const story = window.STORY_DATA;
  const find = (id) => document.getElementById(id);
  const dom = {
    intro:find("intro"),game:find("game"),ending:find("ending"),
    reset:find("header-reset"),start:find("start-btn"),back:find("back-btn"),
    again:find("again-btn"),rethink:find("rethink-btn"),confirm:find("confirm-btn"),
    sceneTitle:find("scene-title"),sceneText:find("scene-narrative"),
    sceneChip:find("scene-chip"),sceneNumber:find("scene-number"),
    sceneImage:find("scene-image"),imagePlaceholder:find("image-placeholder"),
    choices:find("choices"),step:find("step-fraction"),fill:find("progress-fill"),trail:find("route-trail"),
    endingTitle:find("ending-title"),endingIntro:find("ending-intro"),
    code:find("ending-code"),journey:find("journey-steps"),
    confirmActions:find("confirm-actions"),feedbackSection:find("feedback-section"),feedbackHeading:find("feedback-heading"),
    positive:find("positive-text"),improve:find("improve-text"),status:find("status-text"),statusIcon:find("status-icon")
  };
  if (!story || !story.nodes || !story.endings) {
    const message = document.querySelector(".guide-intro");
    if (message) message.textContent = "遊戲內容暫時無法讀取，請稍後再試。";
    dom.start.disabled = true;
    return;
  }

  const han = {A:"甲",B:"乙",C:"丙"};
  const toHan = (code) => String(code).replace(/[ABC]/g,(letter)=>han[letter]);
  const passRoutes = new Set(story.passRoutes || []); // 暫定規則由劇本資料設定
  let trail = [];
  let current = story.start;
  let finished = null;
  let confirmed = false;

  const escapeHtml = (text) => String(text).replace(/[&<>"']/g,(char)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
  function show(view) {
    for(const name of ["intro","game","ending"]) dom[name].hidden = name !== view;
    dom.reset.hidden = view === "intro";
    if(typeof window.scrollTo === "function") window.scrollTo({top:0,behavior:"instant"});
  }
  function focus(element){
    if (element && typeof element.focus === "function") element.focus({preventScroll:true});
  }
  function cover() {
    trail = [];
    current = story.start;
    finished = null;
    confirmed = false;
    show("intro");
  }
  function start() {
    trail = [];
    current = story.start;
    finished = null;
    confirmed = false;
    renderScene();
  }
  function changePicture(sceneId) {
    const image = dom.sceneImage;
    image.hidden = true;
    dom.imagePlaceholder.hidden = false;
    image.alt = "樂樂和同學在「" + story.nodes[sceneId].title + "」情境中的插圖";
    image.dataset.scene = sceneId;
    image.onload = () => {
      if(image.dataset.scene === sceneId && current === sceneId) {
        image.hidden = false;
        dom.imagePlaceholder.hidden = true;
      }
    };
    image.onerror = () => {
      if(image.dataset.scene === sceneId) {
        image.hidden = true;
        dom.imagePlaceholder.hidden = false;
      }
    };
    image.src = "./images/" + sceneId + ".webp";
  }
  function renderScene() {
    const node = story.nodes[current];
    if (!node) throw new Error("找不到情境：" + current);
    const stepNumber = trail.length + 1;
    if(stepNumber < 1 || stepNumber > 3) throw new Error("選擇次數不正確");
    dom.sceneChip.textContent = "情境 " + stepNumber;
    dom.sceneNumber.textContent = String(stepNumber);
    dom.sceneTitle.textContent = node.title;
    dom.sceneText.textContent = node.scene;
    dom.step.innerHTML = String(stepNumber).padStart(2,"0") + " <span>/ 03</span>";
    dom.fill.style.width = (stepNumber / 3 * 100) + "%";
    dom.back.disabled = !trail.length;
    dom.trail.textContent = trail.length ? "你選了：" + trail.map(item=>han[item.letter]).join(" → ") : "從這裡開始";
    dom.choices.innerHTML = ["A","B","C"].map((letter)=>{
      const choice = node.choices[letter];
      return '<button class="option" type="button" data-choice="'+letter+'" aria-label="選項'+han[letter]+'，'+escapeHtml(choice.label)+'，'+escapeHtml(choice.text)+'">'+
        '<span class="option-letter" aria-hidden="true">'+han[letter]+'</span>'+
        '<span class="option-body"><strong class="option-label">'+escapeHtml(choice.label)+'：</strong><span class="option-dialogue">'+escapeHtml(choice.text)+'</span></span>'+
        '<span class="option-arrow" aria-hidden="true">→</span></button>';
    }).join("");
    changePicture(current);
    show("game");
    focus(dom.sceneTitle);
  }
  function choose(letter) {
    if(dom.game.hidden || !(letter in han)) return;
    const option = story.nodes[current].choices[letter];
    if(!option) return;
    trail.push({from:current,letter,label:option.label});
    if(story.endings[option.next]) {
      finished = option.next;
      confirmed = false;
      renderEnding();
    } else if (story.nodes[option.next]) {
      current = option.next;
      renderScene();
    } else throw new Error("找不到下一個情境：" + option.next);
  }
  function renderEnding(){
    const ending=story.endings[finished];
    if(!ending || trail.length!==3) throw new Error("結局內容或選擇次數不正確");
    dom.code.textContent = "路徑 "+toHan(finished);
    dom.code.dataset.route = finished;
    dom.journey.innerHTML = ending.steps.map(text=>"<li>"+escapeHtml(text)+"</li>").join("");
    dom.positive.textContent = ending.positive;
    dom.improve.textContent = ending.improve;
    dom.confirmActions.hidden = confirmed;
    dom.feedbackSection.hidden = !confirmed;
    dom.endingIntro.textContent = confirmed ? "看看你做得好的地方，還有哪些地方可以做得更好。" : "先看看自己的三次選擇。想清楚後，再按下確定選擇。";
    const passed = passRoutes.has(finished);
    const statusCard = dom.status.closest(".feedback-card");
    statusCard.classList.toggle("passed", passed);
    statusCard.classList.toggle("retry", !passed);
    dom.statusIcon.textContent = passed ? "✓" : "↗";
    dom.status.textContent = passed ?
      "恭喜過關！這條路徑目前設定為通關。也記得看看可以改進的地方。" :
      "這次還沒過關。可以再玩一次，試試不同的回答。";
    show("ending");
    focus(confirmed ? dom.feedbackHeading : dom.endingTitle);
  }
  function rethink() {
    if(!finished || confirmed || trail.length!==3) return;
    const previous=trail.pop();
    current=previous.from;
    finished=null;
    confirmed=false;
    renderScene();
  }
  function confirm(){
    if(!finished || confirmed || trail.length!==3) return;
    confirmed=true;
    dom.confirmActions.hidden=true;
    dom.feedbackSection.hidden=false;
    dom.endingIntro.textContent="看看你做得好的地方，還有哪些地方可以做得更好。";
    dom.feedbackSection.scrollIntoView({behavior:"smooth",block:"start"});
    focus(dom.feedbackHeading);
  }

  // 首頁遊戲教學：自動輪播，亦可手動切換；減少動態模式不自動播放。
  const guideSlides = Array.from(document.querySelectorAll("[data-guide-slide]"));
  const guidePicks = Array.from(document.querySelectorAll("[data-guide]"));
  let guideIndex=0;
  function setGuide(index){
    if(index<0 || index>=guideSlides.length) return;
    guideIndex=index;
    guideSlides.forEach((slide,i)=>{
      const active=i===index;
      slide.classList.toggle("is-active",active);
      slide.setAttribute("aria-hidden",String(!active));
      const animated=slide.querySelector(".guide-read");
      if(animated) animated.classList.toggle("is-animated",active);
    });
    guidePicks.forEach((pick,i)=>{
      pick.classList.toggle("is-active",i===index);
      pick.setAttribute("aria-pressed",String(i===index));
    });
  }
  guidePicks.forEach((pick)=>pick.addEventListener("click",()=>setGuide(Number(pick.dataset.guide))));
  setGuide(0);
  const prefersLessMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if(!prefersLessMotion && guideSlides.length===3) {
    window.setInterval(()=>{if(!dom.intro.hidden) setGuide((guideIndex+1)%3)},4500);
  }
  dom.start.addEventListener("click",start);
  dom.reset.addEventListener("click",cover);
  dom.again.addEventListener("click",cover);
  dom.back.addEventListener("click",()=>{
    if(!trail.length)return;
    const previous=trail.pop();
    current=previous.from;
    finished=null;
    confirmed=false;
    renderScene();
  });
  dom.rethink.addEventListener("click",rethink);
  dom.confirm.addEventListener("click",confirm);
  find("brand-link").addEventListener("click",(event)=>{event.preventDefault();cover()});
  dom.choices.addEventListener("click",(event)=>{
    const button=event.target.closest("button[data-choice]");
    if(button && dom.choices.contains(button)) choose(button.dataset.choice);
  });
  document.addEventListener("keydown",(event)=>{
    if(dom.game.hidden || event.altKey || event.ctrlKey || event.metaKey || event.repeat)return;
    const tag=event.target.tagName;
    if(["INPUT","TEXTAREA","SELECT"].includes(tag) || event.target.isContentEditable)return;
    const letter=event.key.toUpperCase();
    if(letter in han){event.preventDefault();choose(letter)}
  });
  cover();
})();
