"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const read = name => fs.readFileSync(path.resolve(__dirname,"..",name),"utf8");
const scope = {window:{}};
vm.runInNewContext(read("data/story.js"),scope);
const story = scope.window.STORY_DATA;

function makeElement() {
  const classes = new Set();
  return {
    hidden:false,disabled:false,style:{},dataset:{},textContent:"",innerHTML:"",src:"",alt:"",
    readyState:0,currentTime:0,muted:false,complete:false,naturalWidth:0,
    handlers:{},attributes:{},isContentEditable:false,
    classList:{toggle(k,v){if(v===undefined)v=!classes.has(k);v?classes.add(k):classes.delete(k);return v},contains(k){return classes.has(k)}},
    addEventListener(k,fn){this.handlers[k]=fn},setAttribute(k,v){this.attributes[k]=v},
    closest(){return this.card},focus(){},scrollIntoView(){},querySelector(){return null},contains(){return true}
  };
}
function setup(){
  const ids=`intro game ending header-reset start-btn back-btn again-btn rethink-btn confirm-btn
  scene-title scene-narrative scene-chip scene-number scene-image scene-video image-placeholder
  choices step-fraction progress-fill route-trail ending-title ending-intro ending-code journey-steps
  confirm-actions feedback-section feedback-heading positive-text improve-text status-text status-icon brand-link`.trim().split(/\s+/);
  const el=Object.fromEntries(ids.map(id=>[id,makeElement()]));
  const title={textContent:"過關狀態"};
  el["status-text"].card=makeElement();
  el["status-text"].card.querySelector=selector=>selector==="h3"?title:null;
  const video=el["scene-video"];
  video.playCalls=0; video.pauseCalls=0;
  video.pause=()=>{video.pauseCalls++};
  video.play=()=>{video.playCalls++;return Promise.resolve()};
  video.load=()=>{};
  const slides=[makeElement(),makeElement(),makeElement()];
  const picks=[makeElement(),makeElement(),makeElement()];
  picks.forEach((p,i)=>p.dataset.guide=String(i));
  const document={
    handlers:{},getElementById(id){assert.ok(el[id],"missing "+id);return el[id]},
    querySelectorAll(s){return s==="[data-guide-slide]"?slides:s==="[data-guide]"?picks:[]},
    querySelector(){return null},addEventListener(type,fn){this.handlers[type]=fn}
  };
  const window={STORY_DATA:story,scrollTo(){},setInterval(){},matchMedia(){return {matches:true}}};
  vm.runInNewContext(read("assets/app.js"),{window,document,console},{filename:"assets/app.js"});
  const click=id=>el[id].handlers.click();
  const choose=key=>document.handlers.keydown({key,target:{tagName:"BODY",isContentEditable:false},altKey:false,ctrlKey:false,metaKey:false,repeat:false,preventDefault(){}});
  return {el,title,video,slides,picks,click,choose};
}

test("國小版通關路徑維持 ABA、BCB",()=>{
  assert.deepEqual(Array.from(story.passRoutes),["ABA","BCB"]);
});

test("27 條路徑均可完成三次選擇，確認後才顯示關卡認證",()=>{
  for(const a of "ABC")for(const b of "ABC")for(const c of "ABC"){
    const route=a+b+c, g=setup(),e=g.el,passed=story.passRoutes.includes(route);
    g.click("start-btn");
    [a,b,c].forEach(g.choose);
    assert.equal(e.ending.hidden,false,route);
    assert.equal(e["confirm-actions"].hidden,false,route);
    assert.equal(e["feedback-section"].hidden,true,route);
    assert.equal(e["ending-code"].dataset.route,route,route);
    g.click("confirm-btn");
    assert.equal(e["feedback-section"].hidden,false,route);
    assert.equal(g.title.textContent,"關卡認證",route);
    assert.equal(e["status-text"].card.classList.contains("passed"),passed,route);
    assert.equal(e["status-text"].card.classList.contains("retry"),!passed,route);
    assert.equal(e["status-icon"].textContent,passed?"★":"↻",route);
    assert.equal(e["status-text"].textContent.includes("2599"),passed,"密碼不應顯示於未通關路徑 "+route);
    assert.equal(e["status-text"].style.whiteSpace,"pre-line",route);
    assert.equal(e["positive-text"].textContent,story.endings[route].positive,route);
    assert.equal(e["improve-text"].textContent,story.endings[route].improve,route);
    g.click("again-btn");
    assert.equal(e.intro.hidden,false,route);
  }
});

test("成功與失敗認證文字正確，圖示與前兩張回饋卡不同",()=>{
  const pass=setup();pass.click("start-btn");"ABA".split("").forEach(pass.choose);pass.click("confirm-btn");
  assert.match(pass.el["status-text"].textContent,/恭喜你成功通關！/);
  assert.match(pass.el["status-text"].textContent,/【經彩青春Do密碼】2599/);
  assert.match(pass.el["status-text"].textContent,/意義：愛我久久/);
  const fail=setup();fail.click("start-btn");"AAA".split("").forEach(fail.choose);fail.click("confirm-btn");
  assert.match(fail.el["status-text"].textContent,/沒有過關，繼續加油/);
  assert.ok(!fail.el["status-text"].textContent.includes("2599"));
  for(const icon of [pass.el["status-icon"].textContent,fail.el["status-icon"].textContent])assert.ok(icon!=="✓"&&icon!=="↗");
});

test("返回修改、重新開始仍保留原本功能",()=>{
  const g=setup();g.click("start-btn");"ABA".split("").forEach(g.choose);
  g.click("rethink-btn");
  assert.equal(g.el.game.hidden,false);
  g.choose("B");assert.equal(g.el["ending-code"].dataset.route,"ABB");
  g.click("header-reset");
  assert.equal(g.el.intro.hidden,false);
  g.click("start-btn");
  assert.equal(g.el["scene-title"].textContent,story.nodes.S0.title);
});

test("首頁動畫與第一幕影片功能維持",()=>{
  const g=setup();g.picks[2].handlers.click();
  assert.equal(g.slides[2].attributes["aria-hidden"],"false");
  g.click("start-btn");
  assert.equal(g.el["scene-image"].src,"./images/S0.webp");
  g.video.readyState=4;
  g.video.handlers.loadeddata();
  assert.equal(g.video.hidden,false);
  assert.equal(g.video.playCalls,1);
  g.choose("A");
  assert.equal(g.video.hidden,true);
  g.click("header-reset");
  assert.equal(g.el.intro.hidden,false);
});
