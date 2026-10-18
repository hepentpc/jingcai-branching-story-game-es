"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const load = (filename) => fs.readFileSync(path.join(__dirname, "..", filename), "utf8");
const storyScope = {window:{}};
vm.runInNewContext(load("data/story.js"),storyScope);
const story = storyScope.window.STORY_DATA;
const code = load("assets/app.js");
const letters = ["A","B","C"];

function makeElement() {
  const classes = new Set();
  return {
    hidden:false,disabled:false,style:{},dataset:{},textContent:"",innerHTML:"",src:"",alt:"",readyState:0,currentTime:0,muted:false,
    handlers:{},attributes:{},isContentEditable:false,
    classList:{
      toggle(name,desired) {if(desired===undefined)desired=!classes.has(name);if(desired)classes.add(name);else classes.delete(name);return desired},
      contains(name){return classes.has(name)}
    },
    addEventListener(type,handler){this.handlers[type]=handler},
    setAttribute(name,value){this.attributes[name]=value},
    closest(){return this.card},
    focus(){this.focused=true},
    scrollIntoView(){this.scrolled=true},
    querySelector(){return null},
    contains(){return true}
  };
}
function gameHarness(){
  const ids=["intro","game","ending","header-reset","start-btn","back-btn","again-btn","rethink-btn","confirm-btn",
  "scene-title","scene-narrative","scene-chip","scene-number","scene-image","scene-video","image-placeholder",
  "choices","step-fraction","progress-fill","route-trail","ending-title","ending-intro","ending-code",
  "journey-steps","confirm-actions","feedback-section","feedback-heading",
  "positive-text","improve-text","status-text","status-icon","brand-link"];
  const elements=Object.fromEntries(ids.map(id=>[id,makeElement()]));
  const slideElements=Array.from({length:3},()=>makeElement());
  const guidePicks=Array.from({length:3},(_,i)=>{
    const el=makeElement();el.dataset.guide=String(i);return el;
  });
  elements["status-text"].card=makeElement();
  const video = elements["scene-video"];
  video.pauseCalls=0;video.playCalls=0;
  video.pause=()=>{video.pauseCalls++};
  video.play=()=>{video.playCalls++;return Promise.resolve()};
  video.loadCalls=0;
  video.load=()=>{video.loadCalls++};
  const document={
    handlers:{},
    getElementById(id){assert.ok(elements[id],"missing mocked element "+id);return elements[id]},
    querySelectorAll(q){
      if(q==="[data-guide-slide]")return slideElements;
      if(q==="[data-guide]")return guidePicks;
      return [];
    },
    addEventListener(type,handler){this.handlers[type]=handler}
  };
  const window={
    STORY_DATA:story,scrollTo(){},
    setInterval(){},
    matchMedia(){return {matches:true}}
  };
  vm.runInNewContext(code,{window,document,console},{filename:"assets/app.js"});
  const click=(id)=>elements[id].handlers.click();
  const choose=(letter)=>document.handlers.keydown({
    key:letter,altKey:false,ctrlKey:false,metaKey:false,repeat:false,
    target:{tagName:"BODY",isContentEditable:false},
    preventDefault(){}
  });
  return {elements,click,choose,guidePicks,slideElements};
}

test("通關條件由劇本設定，僅 ABA、BCB 為 PDF 指定成功通關",()=>{
  assert.deepEqual(Array.from(story.passRoutes),["ABA","BCB"]);
});

test("首頁教學可手動切換，開始按鈕帶到情境一",()=>{
  const g=gameHarness();
  assert.equal(g.elements.intro.hidden,false);
  assert.equal(g.elements.game.hidden,true);
  g.guidePicks[2].handlers.click();
  assert.equal(g.slideElements[2].attributes["aria-hidden"],"false");
  g.click("start-btn");
  assert.equal(g.elements.intro.hidden,true);
  assert.equal(g.elements.game.hidden,false);
  assert.equal(g.elements["scene-title"].textContent,story.nodes.S0.title);
  assert.equal(g.elements["scene-image"].src,"./images/S0.webp");
});

test("27 條完整路徑：先確認選擇、再顯示三區回饋",()=>{
  for(const a of letters)for(const b of letters)for(const c of letters){
    const route=a+b+c;
    const g=gameHarness(),e=g.elements;
    g.click("start-btn");
    [a,b,c].forEach(letter=>g.choose(letter));
    assert.equal(e.ending.hidden,false,route);
    assert.equal(e["confirm-actions"].hidden,false,route);
    assert.equal(e["feedback-section"].hidden,true,route);
    assert.equal(e["ending-code"].dataset.route,route);
    assert.ok(e["journey-steps"].innerHTML.includes("<li>"),route);
    g.click("confirm-btn");
    assert.equal(e["confirm-actions"].hidden,true,route);
    assert.equal(e["feedback-section"].hidden,false,route);
    assert.equal(e["positive-text"].textContent,story.endings[route].positive,route);
    assert.equal(e["improve-text"].textContent,story.endings[route].improve,route);
    assert.equal(e["status-text"].textContent.includes("恭喜過關"),route==="ABA" || route==="BCB",route);
    assert.equal(e["status-text"].card.classList.contains("passed"),route==="ABA" || route==="BCB",route);
    g.click("again-btn");
    assert.equal(e.intro.hidden,false,route+" again must return cover");
    assert.equal(e.game.hidden,true,route);
  }
});

test("完成後尚未確認，可以返回第三次選擇",()=>{
  const g=gameHarness(),e=g.elements;
  g.click("start-btn");
  ["A","B","A"].forEach(letter=>g.choose(letter));
  assert.equal(e["ending-code"].dataset.route,"ABA");
  g.click("rethink-btn");
  assert.equal(e.game.hidden,false);
  assert.equal(e["scene-title"].textContent,story.nodes.AB2.title);
  g.choose("B");
  assert.equal(e["ending-code"].dataset.route,"ABB");
  assert.equal(e["feedback-section"].hidden,true);
});

test("確認選擇後只能看回饋或回封面，沒有再次修改的按鈕",()=>{
  const html=load("index.html");
  assert.ok(html.includes('id="rethink-btn"'));
  assert.ok(html.includes('id="confirm-btn"'));
  assert.ok(!html.includes('id="revise-btn"'));
  assert.ok(html.includes("月經友善行動"));
  assert.ok(html.includes("經彩青春"));
  assert.ok(html.includes("Do"));
  assert.ok(!html.includes("ABOUT EMPATHY"));
  assert.ok(!html.includes("STORY NO."));
  assert.ok(!html.includes("月經友善 · 國小版"));
  const g=gameHarness();
  g.click("start-btn");
  ["B","B","B"].forEach(letter=>g.choose(letter));
  g.click("confirm-btn");
  assert.equal(g.elements["rethink-btn"].closest(),undefined);
  assert.equal(g.elements["confirm-actions"].hidden,true);
});


test("遊戲教學、三個選項與結局路徑皆顯示 ABC",()=>{
  const html=load("index.html");
  assert.ok(html.includes('<div class="guide-choice">A</div>'));
  assert.ok(html.includes('<div class="guide-choice active">B <span>✓</span></div>'));
  assert.ok(html.includes('<div class="guide-choice">C</div>'));
  assert.ok(!html.includes('class="guide-choice">甲'));
  const g=gameHarness(), e=g.elements;
  g.click("start-btn");
  for(const letter of ["A","B","C"]){
    assert.ok(e["choices"].innerHTML.includes('data-choice="'+letter+'"'),"missing choice "+letter);
    assert.ok(e["choices"].innerHTML.includes('class="option-letter" aria-hidden="true">'+letter+'</span>'),"wrong displayed choice "+letter);
  }
  g.choose("A");
  assert.equal(e["route-trail"].textContent,"你選了：A");
  g.choose("B");
  g.choose("C");
  assert.equal(e["ending-code"].textContent,"路徑 ABC");
  assert.equal(e["ending-code"].dataset.route,"ABC");
});

test("重新開始保留回封面行為，並清除上一輪的選擇",()=>{
  const html=load("index.html");
  assert.match(html, /id="header-reset" hidden>重新開始/);
  assert.ok(!html.includes('id="header-reset" hidden>回到封面'));
  const g=gameHarness(), e=g.elements;
  g.click("start-btn");
  g.choose("B");
  assert.equal(e["scene-title"].textContent,story.nodes.B1.title);
  g.click("header-reset");
  assert.equal(e.intro.hidden,false);
  assert.equal(e.game.hidden,true);
  assert.equal(e["header-reset"].hidden,true);
  g.click("start-btn");
  assert.equal(e["scene-title"].textContent,story.nodes.S0.title);
  assert.equal(e["route-trail"].textContent,"從這裡開始");
  ["A","A","A"].forEach(letter=>g.choose(letter));
  g.click("header-reset");
  assert.equal(e.intro.hidden,false,"Restart from confirmation must go to cover");
  g.click("start-btn");
  assert.equal(e["scene-title"].textContent,story.nodes.S0.title);
});


test("S0 改為十秒影片，並保留原圖作為影片未載入時的備援",()=>{
  const html=load("index.html");
  assert.ok(html.includes('id="scene-video"'));
  assert.ok(html.includes('src="./gemini_generated_video_9aa4eba3.mp4"'));
  assert.ok(html.includes('poster="./images/S0.webp"'));
  assert.ok(html.includes('muted loop playsinline controls preload="none"'));
  const g=gameHarness(),e=g.elements;
  g.click("start-btn");
  assert.equal(e["scene-video"].hidden,true,"影片未準備好時應維持原圖");
  assert.equal(e["scene-image"].src,"./images/S0.webp");
  e["scene-video"].readyState=4;
  e["scene-video"].handlers.loadeddata();
  assert.equal(e["scene-video"].hidden,false,"影片就緒後應顯示影片");
  assert.equal(e["scene-image"].hidden,true,"影片就緒後應隱藏圖片");
  assert.equal(e["scene-video"].playCalls,1,"第一幕自動播放");
  g.choose("A");
  assert.equal(e["scene-video"].hidden,true,"離開第一幕應隱藏影片");
  assert.ok(e["scene-video"].pauseCalls>=1,"離開第一幕時應停止播放");
  assert.equal(e["scene-image"].src,"./images/A1.webp","其他情境顯示自己的圖片");
  g.click("back-btn");
  assert.equal(e["scene-video"].hidden,false,"回第一幕應重新顯示影片");
  assert.equal(e["scene-video"].playCalls,2,"回第一幕應重新播放");
  g.click("header-reset");
  assert.equal(e.intro.hidden,false);
  assert.ok(e["scene-video"].pauseCalls>=2,"返回封面應停止影片");
});

test("13 張圖片的檔名和劇本節點一致，可由圖片包補齊",()=>{
  for(const id of Object.keys(story.nodes))assert.match(id,/^(S0|[ABC]1|[ABC]{2}2)$/);
  assert.equal(Object.keys(story.nodes).length,13);
});
