/* 經彩青春Do｜國小版：三次選擇、先確認再回饋、關卡認證 */
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
    sceneImage:find("scene-image"),sceneVideo:find("scene-video"),imagePlaceholder:find("image-placeholder"),
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

  const displayLabels = {A:"A",B:"B",C:"C"};
  const displayRoute = (code) => String(code);
  // 保留國小版劇本原有通關條件（目前為 ABA、BCB）。
  const passRoutes = new Set(story.passRoutes || []);
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
    if(view !== "game" && dom.sceneVideo && typeof dom.sceneVideo.pause === "function") dom.sceneVideo.pause();
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
  // 第一幕沿用影片、載入失敗時顯示 S0.webp；其他情境繼續使用節點圖片。
  function showSceneMedia(sceneId) {
    const image = dom.sceneImage;
    const video = dom.sceneVideo;
    const firstScene = sceneId === story.start;
    if(typeof video.pause === "function") video.pause();
    video.hidden = true;
    image.hidden = true;
    dom.imagePlaceholder.hidden = false;
    image.alt = "樂樂和同學在「" + story.nodes[sceneId].title + "」情境中的插圖";
    image.dataset.scene = sceneId;
    image.onload = () => {
      if(image.dataset.scene === sceneId && current === sceneId && video.hidden) {
        image.hidden = false;
        dom.imagePlaceholder.hidden = true;
      }
    };
    image.onerror = () => {
      if(image.dataset.scene === sceneId && video.hidden) {
        image.hidden = true;
        dom.imagePlaceholder.hidden = false;
      }
    };
    image.src = "./images/" + sceneId + ".webp";
    if(firstScene){
      video.muted = true;
      if(video.readyState >= 1){
        try{video.currentTime = 0;}catch(error){/* 尚未能定位至開頭時維持正常播放 */}
      }
      if(video.readyState < 2 && typeof video.load === "function") {
        video.preload = "auto";
        video.load();
      }
      activateFirstVideo();
    }
  }
  function activateFirstVideo(){
    const video = dom.sceneVideo;
    if(current !== story.start || dom.game.hidden || video.readyState < 2) return;
    video.hidden = false;
    dom.sceneImage.hidden = true;
    dom.imagePlaceholder.hidden = true;
    if(typeof video.play === "function"){
      const started = video.play();
      if(started && typeof started.catch === "function") started.catch(()=>{/* 若被瀏覽器阻擋，可按播放鍵 */});
    }
  }
  dom.sceneVideo.addEventListener("loadeddata",activateFirstVideo);
  dom.sceneVideo.addEventListener("error",()=>{
    dom.sceneVideo.hidden = true;
    if(current === story.start && dom.sceneImage.complete && dom.sceneImage.naturalWidth > 0){
      dom.sceneImage.hidden = false;
      dom.imagePlaceholder.hidden = true;
    }
  });
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
    dom.trail.textContent = trail.length ? "你選了：" + trail.map(item=>displayLabels[item.letter]).join(" → ") : "從這裡開始";
    dom.choices.innerHTML = ["A","B","C"].map((letter)=>{
      const choice = node.choices[letter];
      const optionText = choice.text.replace(/^「|」$/g, "");
      return '<button class="option" type="button" data-choice="'+letter+'" aria-label="選項'+displayLabels[letter]+'，'+escapeHtml(choice.label)+'，'+escapeHtml(optionText)+'">'+
        '<span class="option-letter" aria-hidden="true">'+displayLabels[letter]+'</span>'+
        '<span class="option-body"><strong class="option-label">'+escapeHtml(choice.label)+'：</strong><span class="option-dialogue">'+escapeHtml(optionText)+'</span></span>'+
        '<span class="option-arrow" aria-hidden="true">→</span></button>';
    }).join("");
    show("game");
    showSceneMedia(current);
    focus(dom.sceneTitle);
  }
  function choose(letter) {
    if(dom.game.hidden || !(letter in displayLabels)) return;
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
    dom.code.textContent = "路徑 "+displayRoute(finished);
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
    // 將第三卡改成關卡認證，與「做得好的地方／可以改進的地方」明確區別。
    const statusHeading = statusCard.querySelector("h3");
    if(statusHeading) statusHeading.textContent = "關卡認證";
    dom.statusIcon.textContent = passed ? "★" : "↻";
    dom.status.style.whiteSpace = "pre-line";
    dom.status.textContent = passed ?
      "恭喜你成功通關！\n獲得【經彩青春Do密碼】2599，意義：愛我久久" :
      "沒有過關，繼續加油，\n重新開啟另一個旅程，\n獲得通關密碼！";
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
    if(letter in displayLabels){event.preventDefault();choose(letter)}
  });
  cover();
})();
