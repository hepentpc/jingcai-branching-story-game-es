"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// 不依賴任何套件，可用 node --test tests/story.test.cjs 執行。
const source = fs.readFileSync(path.join(__dirname, "../data/story.js"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: "data/story.js" });
const story = sandbox.window.STORY_DATA;
const nodeIds = Object.keys(story.nodes);
const outcomeIds = Object.keys(story.endings);

test("保留國小版 V2 的 13 個情境、27 種結局與 39 個選項", () => {
  assert.equal(nodeIds.length, 13);
  assert.equal(outcomeIds.length, 27);
  assert.equal(nodeIds.reduce((sum, id) => sum + Object.keys(story.nodes[id].choices).length, 0), 39);
  assert.equal(story.start, "S0");
});

test("所有選項都有剛好四個中文字的行為標籤", () => {
  for (const id of nodeIds) {
    for (const letter of ["A", "B", "C"]) {
      const option = story.nodes[id].choices[letter];
      assert.match(option.label, /^[\u3400-\u9fff]{4}$/u, id + letter);
      assert.ok(option.text.startsWith("「") && option.text.endsWith("」"), id + letter);
      assert.ok(story.nodes[option.next] || story.endings[option.next], id + letter);
    }
  }
});

test("三次選擇共 27 條路徑，皆精確對應唯一結局", () => {
  const found = new Set();
  for (const a of ["A", "B", "C"]) {
    for (const b of ["A", "B", "C"]) {
      for (const c of ["A", "B", "C"]) {
        const letters = [a, b, c];
        let location = story.start;
        letters.forEach((letter, position) => {
          assert.ok(story.nodes[location], "還有後續選項才應在情境節點：" + location);
          location = story.nodes[location].choices[letter].next;
          if (position < 2) assert.ok(story.nodes[location], "提前結局：" + location);
        });
        assert.equal(location, a + b + c, "選擇路徑對應不符");
        assert.ok(story.endings[location], "找不到結局：" + location);
        found.add(location);
      }
    }
  }
  assert.equal(found.size, 27);
});

test("每種結局均有三句各七字摘要及完整雙向回饋", () => {
  for (const id of outcomeIds) {
    const ending = story.endings[id];
    assert.equal(ending.steps.length, 3, id);
    for (const part of ending.steps) assert.equal([...part].length, 7, id + "：" + part);
    assert.ok(ending.positive.length > 10, id + " 的優點不完整");
    assert.ok(ending.improve.length > 10, id + " 的建議不完整");
  }
});

test("三條代表性學習路徑保留於劇本", () => {
  assert.equal(story.featured.ABA, "破除週期偏見");
  assert.equal(story.featured.BBA, "月經關懷");
  assert.equal(story.featured.CAA, "月經去汙名化");
});
