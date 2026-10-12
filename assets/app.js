/* 經彩青春 GO｜三次選擇、完整分支跳轉與個別回饋 */
(() => {
  "use strict";
  const story = window.STORY_DATA;
  const byId = (id) => document.getElementById(id);
  const dom = {
    intro: byId("intro"), game: byId("game"), ending: byId("ending"),
    reset: byId("header-reset"), start: byId("start-btn"),
    back: byId("back-btn"), again: byId("again-btn"), revise: byId("revise-btn"),
    sceneTitle: byId("scene-title"), sceneText: byId("scene-narrative"),
    sceneChip: byId("scene-chip"), sceneNumber: byId("scene-number"),
    choices: byId("choices"), step: byId("step-fraction"),
    fill: byId("progress-fill"), trail: byId("route-trail"),
    endingTitle: byId("ending-title"), code: byId("ending-code"),
    journey: byId("journey-steps"), positive: byId("positive-text"),
    improve: byId("improve-text")
  };
  if (!story || !story.nodes || !story.endings) {
    document.querySelector(".intro-lead").textContent = "遊戲資料無法載入，請確認 data/story.js 是否存在。";
    dom.start.disabled = true;
    return;
  }

  // trail 裡的項目只記錄實際操作，不以對錯或分數評判。
  let trail = [];
  let current = story.start;
  let finished = null;

  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  function show(view) {
    for (const name of ["intro", "game", "ending"]) dom[name].hidden = name !== view;
    dom.reset.hidden = view === "intro";
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function focusHeading(element) {
    if (element && typeof element.focus === "function") element.focus({ preventScroll: true });
  }

  function welcome() {
    trail = [];
    current = story.start;
    finished = null;
    show("intro");
  }

  function start() {
    trail = [];
    current = story.start;
    finished = null;
    renderScene();
  }

  function renderScene() {
    const node = story.nodes[current];
    if (!node) throw new Error("找不到情境：" + current);
    const stage = trail.length + 1;
    if (stage < 1 || stage > 3) throw new Error("情境步數不正確：" + stage);

    dom.sceneChip.textContent = "情境 " + String(stage).padStart(2, "0");
    dom.sceneNumber.textContent = String(stage).padStart(2, "0");
    dom.sceneTitle.textContent = node.title;
    dom.sceneText.textContent = node.scene;
    dom.step.innerHTML = String(stage).padStart(2, "0") + " <span>/ 03</span>";
    dom.fill.style.width = (stage / 3 * 100) + "%";
    dom.back.disabled = trail.length === 0;
    dom.trail.textContent = trail.length ? ("目前選擇：" + trail.map((item) => item.letter).join(" → ")) : "故事的第一步";
    dom.choices.innerHTML = ["A", "B", "C"].map((letter) => {
      const option = node.choices[letter];
      return '<button class="option" type="button" data-choice="' + letter + '" aria-label="選項 ' + letter + '：' +
        escapeHtml(option.label) + '，' + escapeHtml(option.text) + '">' +
        '<span class="option-letter" aria-hidden="true">' + letter + '</span>' +
        '<span class="option-body"><strong class="option-label">' + escapeHtml(option.label) + '：</strong>' +
        '<span class="option-dialogue">' + escapeHtml(option.text) + '</span></span>' +
        '<span class="option-arrow" aria-hidden="true">↗</span></button>';
    }).join("");
    show("game");
    focusHeading(dom.sceneTitle);
  }

  function choose(letter) {
    if (dom.game.hidden || !["A", "B", "C"].includes(letter)) return;
    const option = story.nodes[current].choices[letter];
    if (!option) return;
    trail.push({ from: current, letter, label: option.label });
    const target = option.next;
    if (story.endings[target]) {
      finished = target;
      renderEnding();
    } else if (story.nodes[target]) {
      current = target;
      renderScene();
    } else {
      throw new Error("找不到跳轉目標：" + target);
    }
  }

  function renderEnding() {
    const outcome = story.endings[finished];
    if (!outcome || trail.length !== 3) throw new Error("結局資料或選擇次數有誤");
    dom.code.textContent = "路徑 " + finished;
    dom.journey.innerHTML = outcome.steps.map((text) => "<li>" + escapeHtml(text) + "</li>").join("");
    dom.positive.textContent = outcome.positive;
    dom.improve.textContent = outcome.improve;
    show("ending");
    focusHeading(dom.endingTitle);
  }

  function goBack() {
    if (trail.length === 0) return;
    const previous = trail.pop();
    current = previous.from;
    finished = null;
    renderScene();
  }

  dom.start.addEventListener("click", start);
  dom.again.addEventListener("click", start);
  dom.reset.addEventListener("click", welcome);
  dom.back.addEventListener("click", goBack);
  dom.revise.addEventListener("click", goBack);
  byId("brand-link").addEventListener("click", (event) => {
    event.preventDefault();
    welcome();
  });
  dom.choices.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-choice]");
    if (button && dom.choices.contains(button)) choose(button.dataset.choice);
  });
  document.addEventListener("keydown", (event) => {
    if (dom.game.hidden || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const tag = event.target.tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || event.target.isContentEditable) return;
    const letter = event.key.toUpperCase();
    if (["A", "B", "C"].includes(letter)) {
      event.preventDefault();
      choose(letter);
    }
  });
  welcome();
})();
