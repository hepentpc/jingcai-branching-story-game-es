# 經彩青春Do｜國小月經關懷小旅程

這是依照《國小版分支遊戲劇本網格修正版 V2》製作的互動網頁。學生閱讀情境、完成三次選擇、確認自己的選擇，再查看回饋與過關結果。

## 目前版本

- 名稱：經彩青春Do。
- 首頁：左側三個主題「破除偏見、真誠關懷、自然談論」，右側三步驟動畫教學。
- 情境頁：三次選擇，共 13 個情境節點、39 個四字標籤選項。
- 圖片：13 個情境的圖檔路徑已設定為 images/節點代碼.webp。
- 結局頁：先確認三次選擇；按「確定選擇」才看三項回饋；「回頭再想一次」回到第三次選擇。
- 回饋區：做得好的地方、可以改進的地方、過關狀態。
- **暫定通關路徑：AAA、BBB。** 這是活動測試設定，不代表其選項在教學價值上最適當；原本的建議回饋仍會如實呈現。
- 「再玩一次」回到首頁，不直接進入第一個情境。
- 全介面盡可能使用國小學生能理解的中文，僅名稱保留 Do；內部路徑代碼仍使用英文字母方便程式管理，畫面上維持 A、B、C。
- 主要文字、選項及按鈕特別提高字級，支援手機、平板與電腦。

## 第一幕的十秒影片

第一幕 S0 改為 MP4 動畫。進入 S0 時載入影片，準備完成便以靜音方式自動播放、每次十秒循環；播放器保留播放／音量控制，可自行開啟聲音。返回封面或進入其他情境時會暫停。原本的 `images/S0.webp` 保留為載入失敗時的替代圖片。

將使用者提供的原始影片 `gemini_generated_video_9aa4eba3.mp4` 上傳到本儲存庫根目錄（與 `index.html` 同一層），不要改檔名：
https://github.com/kaoelvmpvm/jingcai-branching-story-game-es/upload/main

網頁參照路徑為 `./gemini_generated_video_9aa4eba3.mp4`。只修改網頁檔案不會自動將聊天附件同步到 GitHub，請確認 Repository 中確實已出現 MP4 檔案。

## 圖片一次安裝（需要專案擁有者上傳）

13 張插圖已另行整理為檔案：jingcai-do-13-images.zip。

上傳一次就可以讓程式自動安裝：

1. 從對話下載 **jingcai-do-13-images.zip**（內含 images/S0.webp 等 13 張插圖）。
2. 開啟本 repository 的 **Add file → Upload files**。
3. 將 **jingcai-do-13-images.zip** 拖入上傳區，並提交到 **main** 分支的根目錄。請保留這個 ZIP 檔名。
4. GitHub Actions 的「安裝十三張情境圖片」工作流程會自動解壓縮，將 13 張圖片加入 images/ 資料夾。若儲存庫禁止 Actions 寫入，需至 Settings → Actions → General → Workflow permissions 開啟 Read and write permissions 後重新執行流程。
5. 在專案的 Actions 頁檢查流程完成，再開啟網站。

圖檔對應：S0、A1、AA2、AB2、AC2、B1、BA2、BB2、BC2、C1、CA2、CB2、CC2。只有 GitHub 上實際存在 images/*.webp 後，公開網站才會顯示圖片；否則安全地維持「劇情圖片」佔位區，不會顯示破圖。

> GitHub 的文字檔工具無法直接上傳這批二進位圖檔，因此圖檔需由儲存庫擁有者進行上述單次上傳。其餘程式、圖片對應及自動安裝流程均已寫入。

## 開啟網頁

GitHub Repository：
https://github.com/kaoelvmpvm/jingcai-branching-story-game-es

如尚未啟用 GitHub Pages，可至 Settings → Pages 選擇 Deploy from a branch，指定 main 與 /(root)。

預計網站：
https://kaoelvmpvm.github.io/jingcai-branching-story-game-es/

## 檔案說明

- index.html：首頁、情境頁、結局確認與回饋版面。
- assets/style.css：響應式、字級與教學小動畫。
- assets/app.js：進入遊戲、三次選擇、確認、回頭重選、過關顯示、回到封面、顯示插圖。
- data/story.js：所有情境、選項、結局與通關設定。
- images/*.webp：13 張情境插圖，圖片包安裝完成後出現。
- tests/*.test.cjs：全路徑與介面流程測試。
- .github/workflows/validate.yml：每次推送自動測試。
- .github/workflows/install-images.yml：收到圖片包後自動安裝。

### 本機測試

安裝 Node.js 20 以上，在專案根目錄執行：

    node --test tests/*.test.cjs

修改通關條件：編輯 data/story.js 的 passRoutes，例如目前為 ["AAA", "BBB"]，其他路徑不會被判定為通關。
