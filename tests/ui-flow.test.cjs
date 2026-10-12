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
    hidden:false,disabled:false,style:{},dataset:{},textContent:"",innerHTML:"",src:"",alt:"",
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
  "scene-title","scene-narrative","scene-chip","scene-number","scene-image","image-placeholder",
  "choices","step-fraction","progress-fill","route-trail","ending-title","ending-intro","ending-code",
  "journey-steps","confirm-actions","feedback-section","feedback-heading",
  "positive-text","improve-text","status-text","status-icon","brand-link"];
  const elements=Object.fromEntries(ids.map(id=>[id,makeElement()]));
  const slideElements=Array.from({length:3},()=>makeElement());
  const guidePicks=Array.from({length:3},(_,i)=>{
    const el=makeElement();el.dataset.guide=String(i);return el;
  });
  elements["status-text"].card=makeElement();
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

test("通關條件由劇本設定，僅 AAA、BBB 為暫定通關",()=>{
  assert.deepEqual(Array.from(story.passRoutes),["AAA","BBB"]);
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
    assert.equal(e["status-text"].textContent.includes("恭喜過關"),route==="AAA" || route==="BBB",route);
    assert.equal(e["status-text"].card.classList.contains("passed"),route==="AAA" || route==="BBB",route);
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

test("13 張圖片的檔名和劇本節點一致，可由圖片包補齊",()=>{
  for(const id of Object.keys(story.nodes))assert.match(id,/^(S0|[ABC]1|[ABC]{2}2)$/);
  assert.equal(Object.keys(story.nodes).length,13);
});
