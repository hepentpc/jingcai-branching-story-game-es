# 經彩青春 GO｜月經友善分支劇情遊戲

以《經彩青春 GO｜國小版｜月經友善分支遊戲劇本｜網格修正版 V2》為基礎製作的靜態網頁互動遊戲。

學生以三次 A／B／C 選擇完成故事，看到個別結局中的「做得好的地方」與「可以改進的地方」。此活動旨在促進理解、尊重與價值反思，**不使用分數或對錯排名**。

## 目前完成

- 國小版：13 個情境節點、27 種完整結局、39 個選項。
- 所有選項採用四個中文字標籤＋原始對話，例如：溫柔關懷：「可以。妳現在需要什麼？我陪妳一起想辦法。」
- 每個情境保留「劇情圖片」佔位區；目前完全未製作或引用劇情圖片。
- 完整保留 V2 結局的三段七字總結與雙向回饋。
- 支援手機與電腦、A／B／C 鍵盤選擇、上一個情境、修改最後的選擇、重新開始。
- 不需要資料庫、註冊、外部字型或 JavaScript 框架，也不蒐集學生輸入資料。

## 讓 GitHub Pages 上線

1. 開啟本 repository 的 Settings → Pages。
2. 在 Build and deployment 的 Source 選擇 Deploy from a branch。
3. Branch 選擇 main，資料夾選擇 /(root)，按 Save。
4. 等待 GitHub 部署完成，再開啟：

   https://kaoelvmpvm.github.io/jingcai-branching-story-game-es/

> 上述是預期的 GitHub Pages 網址；未在 Settings 啟用或部署尚未完成前，網站可能無法開啟。

也可以下載整個 repository，直接開啟根目錄的 index.html 預覽遊戲。

## 專案檔案

| 路徑 | 用途 |
| --- | --- |
| index.html | 首頁、情境與結局畫面 |
| assets/style.css | 畫面樣式與響應式排版 |
| assets/app.js | 選擇、跳轉、返回與結局呈現 |
| data/story.js | 國小版 V2 的 13 個情境、四字標籤及 27 個結局 |
| tests/story.test.cjs | 驗證所有分支、字數、結局回饋 |
| .github/workflows/validate.yml | 每次推送後執行自動檢查 |

## 後續修改

- 換劇情圖：目前 index.html 的 .image-placeholder 是保留區，日後可用圖片元素替換；目前僅顯示「劇情圖片」。
- 修改四字標籤：編輯 data/story.js 的 choices.A/B/C.label，每個必須剛好四個中文字。
- 修改對話：編輯各節點 choices.A/B/C.text；不得無意變更 next 路徑。
- 修改結局：編輯 endings 中的 steps、positive、improve。
- 新增其他教育階段：建議各自新增獨立劇本資料，不覆蓋國小 V2。

## 驗證

安裝 Node.js 20 以上版本，在 repository 根目錄執行：

    node --test tests/story.test.cjs

程式會檢查 13 個情境、27 個結局、39 個四字選項、每條路徑是否能在第三步到達正確結局，以及回饋是否齊全。

## 教育主題

國小版的三條代表性學習路徑為 ABA（破除週期偏見）、BBA（月經關懷）、CAA（月經去汙名化）。遊戲不把這三條設為唯一「正確」結局，讓每一條路徑都能形成學習反思。
