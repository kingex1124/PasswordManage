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

## 部署安全標頭

此專案已提供部署端安全標頭範本：

- Netlify / Cloudflare Pages：`_headers`
- Vercel：`vercel.json`

重點：`frame-ancestors 'none'` 必須由 HTTP 回應標頭下發，不能只放在 HTML `<meta>` 中。

## KDF 成本參數（可調）

目前加密使用 PBKDF2，支援每次匯出時調整 KDF 成本參數（會寫入匯出檔 `algorithm.kdfParams`）：

- `iterations`：`100000` ~ `2000000`
- `keyLengthBytes`：`16 | 24 | 32`
- `saltLengthBytes`：`16` ~ `32`

範例：

```js
const service = new EncryptionService();
const encrypted = await service.encryptRecords(data, archivePassword, {
	kdfParams: {
		iterations: 750000,
		keyLengthBytes: 32,
		saltLengthBytes: 24,
	},
});
```

若匯入檔案包含超出支援範圍的 KDF 參數，系統會拒絕解密並顯示錯誤。

## 功能對照

- 新增/編輯/刪除帳密資料（Modal）
- 密碼歷程多筆、可刪除、`changedAt DESC` 顯示
- 密碼逐筆眼睛切換，60 秒自動回遮
- 類別/種類多選篩選 + 帳號關鍵字搜尋 + 排序
- 匯入加密 JSON（覆蓋全部）
- 匯入舊版 AES-CBC 檔案可一鍵升級為新版加密格式
- 解密失敗 5 秒冷卻重試
- 匯出加密 JSON（優先覆蓋原檔，否則另存/下載）
- 存檔密碼不預填且不在前端常駐
- 變更存檔密碼會立即重新加密並匯出
- 舊版 AES-CBC 匯入預設停用（僅保留隔離相容入口）
- PWA（Manifest + Service Worker 離線快取）
