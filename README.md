# Password Manage Web

依 `Spec20250224Prompt.md` 實作的純靜態帳密管理網站。

## 啟動方式

1. 使用任何靜態伺服器啟動專案根目錄（需 `localhost` 或 HTTPS）。
2. 瀏覽器開啟 `index.html`。

範例（使用 VS Code Live Server 或其他靜態伺服器）：
- 開發：`http://localhost:<port>/index.html`

## 測試

```bash
npm test
```

## 功能對照

- 新增/編輯/刪除帳密資料（Modal）
- 密碼歷程多筆、可刪除、`changedAt DESC` 顯示
- 密碼逐筆眼睛切換，60 秒自動回遮
- 類別/種類多選篩選 + 帳號關鍵字搜尋 + 排序
- 匯入加密 JSON（覆蓋全部）
- 解密失敗 5 秒冷卻重試
- 匯出加密 JSON（優先覆蓋原檔，否則另存/下載）
- 變更存檔密碼（下次匯出生效）
- PWA（Manifest + Service Worker 離線快取）
