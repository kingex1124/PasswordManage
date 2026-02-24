# Crypto JS Library 🔐

完整的前端 JavaScript 加密函式庫，適用於靜態網站。提供 AES、RSA、SHA、KDF 等加密功能。

## 功能特性

- ✅ **AES 加密** - 對稱加密 (AES-256-CBC)
- ✅ **RSA 加密** - 非對稱加密 (RSA-OAEP-SHA256)
- ✅ **SHA 哈希** - SHA-256 和 SHA-512
- ✅ **KDF 密鑰派生** - PBKDF2 密鑰派生
- ✅ **策略模式設計** - 易於擴展和維護
- ✅ **完整的單元測試** - 58 個單元測試，測試覆蓋率 > 80%
- ✅ **純前端實作** - 使用 Web Crypto API
- ✅ **零外部依賴** - 移除 hash-wasm，使用原生 Web Crypto API

## 系統需求

### 必須條件
1. **HTTPS 或 localhost 環境**
   - Web Crypto API 只能在安全環境下運行
   - 開發時使用 `http://localhost` 或 `http://127.0.0.1`
   - 生產環境必須使用 HTTPS

2. **現代瀏覽器支援**
   - Chrome 60+
   - Firefox 57+
   - Safari 11+
   - Edge 79+

## 安裝

```bash
npm install
```

## 快速開始

### 在 HTML 中使用

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>加密測試</title>
</head>
<body>
  <h1>前端加密測試</h1>
  
  <script type="module">
    import { CryptoInitializer } from './src/index.js';
    
    async function testEncryption() {
      // AES 加密測試
      await CryptoInitializer.initAesSetting('myKey', 'myIV');
      const aesContext = CryptoInitializer.getAesContextForEncrypt();
      
      const result = await aesContext.encryptToBase64('Hello World!');
      console.log('加密結果:', result.data);
      
      const decrypt = await aesContext.decryptFromBase64(result.data);
      console.log('解密結果:', decrypt.data);
    }
    
    testEncryption();
  </script>
</body>
</html>
```

## 使用範例

### 1. AES 加密 (對稱加密)

#### 方式一：指定 IV

```javascript
import { CryptoInitializer } from './src/index.js';

// 初始化設定
await CryptoInitializer.initAesSetting('你的密鑰', '你的IV');

// 加密
const aesContext = CryptoInitializer.getAesContextForEncrypt();
const encryptResult = await aesContext.encryptToBase64('你的明文');

if (encryptResult.success) {
  console.log('加密結果:', encryptResult.data);
}

// 解密
const decryptContext = CryptoInitializer.getAesContextForDecrypt();
const decryptResult = await decryptContext.decryptFromBase64(encryptResult.data);

if (decryptResult.success) {
  console.log('解密結果:', decryptResult.data);
}
```

#### 方式二：隨機 IV (推薦)

```javascript
// 初始化設定 (只需要密鑰)
await CryptoInitializer.initAesSetting('你的密鑰');

// 加密 (自動產生隨機 IV)
const aesContext = CryptoInitializer.getAesContextForEncryptByRandomIV();
const encryptResult = await aesContext.encryptWithIVToBase64('你的明文');

if (encryptResult.success) {
  console.log('加密結果:', encryptResult.cipherText);
  console.log('IV:', encryptResult.iv); // 記得保存 IV
}

// 解密 (使用保存的 IV)
const decryptContext = CryptoInitializer.getAesContextForDecryptByRandomIV(encryptResult.iv);
const decryptResult = await decryptContext.decryptFromBase64(encryptResult.cipherText);

if (decryptResult.success) {
  console.log('解密結果:', decryptResult.data);
}
```

### 2. RSA 加密 (非對稱加密)

```javascript
import { CryptoInitializer } from './src/index.js';

// 產生金鑰對
const { publicKey, privateKey } = await CryptoInitializer.rsaGenerateKeys(2048);
console.log('公鑰:', publicKey);
console.log('私鑰:', privateKey);

// 初始化設定
await CryptoInitializer.initRsaSetting(publicKey, privateKey);

const rsaContext = CryptoInitializer.getRsaContext();

// 加密
const encryptResult = await rsaContext.encryptToBase64('你的明文');
if (encryptResult.success) {
  console.log('加密結果:', encryptResult.data);
}

// 解密
const decryptResult = await rsaContext.decryptFromBase64(encryptResult.data);
if (decryptResult.success) {
  console.log('解密結果:', decryptResult.data);
}
```

### 3. SHA 哈希

```javascript
import { CryptoInitializer } from './src/index.js';

// SHA-256
const sha256Context = CryptoInitializer.getSha256HashContext();
const hashResult = await sha256Context.encryptToBase64('要哈希的文字');

if (hashResult.success) {
  console.log('SHA-256 哈希:', hashResult.data);
}

// SHA-512
const sha512Context = CryptoInitializer.getSha512HashContext();
const hashResult512 = await sha512Context.encryptToBase64('要哈希的文字');

if (hashResult512.success) {
  console.log('SHA-512 哈希:', hashResult512.data);
}
```

### 4. KDF 密鑰派生

```javascript
import { CryptoInitializer, Pbkdf2Strategy } from './src/index.js';

// 產生隨機鹽
const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);

// 從密碼派生密鑰 (使用 PBKDF2)
const password = '使用者密碼';
const pbkdf2Strategy = new Pbkdf2Strategy();
const derivedKey = await CryptoInitializer.deriveKeyFromPasswordToBase64(
  password,
  bytesSalt,
  pbkdf2Strategy,
  100000,  // 迭代次數
  32       // 密鑰長度
);

console.log('派生的密鑰:', derivedKey);

// 驗證密鑰
const isValid = await CryptoInitializer.verifyDerivedKey(
  password,
  bytesSalt,
  atob(derivedKey),
  pbkdf2Strategy,
  100000
);

console.log('密鑰驗證:', isValid ? '成功' : '失敗');
```

### 5. 完整範例：密碼加密系統

```javascript
import { CryptoInitializer, Pbkdf2Strategy } from './src/index.js';

// 加密
async function encryptWithPassword(plainText, password) {
  // 1. 產生隨機鹽
  const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);
  
  // 2. 從密碼派生密鑰
  const pbkdf2 = new Pbkdf2Strategy();
  const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
    password,
    bytesSalt,
    pbkdf2,
    100000,
    32
  );
  
  // 3. 使用派生的密鑰進行 AES 加密
  const aesContext = CryptoInitializer.getAesContextForEncryptByRandomIV();
  aesContext.key = derivedKey;
  
  const encryptResult = await aesContext.encryptWithIVToBase64(plainText);
  
  return {
    cipherText: encryptResult.cipherText,
    iv: encryptResult.iv,
    salt: base64Salt
  };
}

// 解密
async function decryptWithPassword(cipherText, iv, salt, password) {
  // 1. 從 Base64 轉換鹽
  const saltBinary = atob(salt);
  const bytesSalt = new Uint8Array(saltBinary.length);
  for (let i = 0; i < saltBinary.length; i++) {
    bytesSalt[i] = saltBinary.charCodeAt(i);
  }
  
  // 2. 從密碼派生相同的密鑰
  const pbkdf2 = new Pbkdf2Strategy();
  const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
    password,
    bytesSalt,
    pbkdf2,
    100000,
    32
  );
  
  // 3. 使用派生的密鑰進行 AES 解密
  const aesContext = CryptoInitializer.getAesContextForDecryptByRandomIV(iv);
  aesContext.key = derivedKey;
  
  const decryptResult = await aesContext.decryptFromBase64(cipherText);
  
  return decryptResult.data;
}

// 使用範例
const encrypted = await encryptWithPassword('機密資料', '使用者密碼123');
console.log('加密資料:', encrypted);

const decrypted = await decryptWithPassword(
  encrypted.cipherText,
  encrypted.iv,
  encrypted.salt,
  '使用者密碼123'
);
console.log('解密資料:', decrypted);
```

## 執行測試

```bash
# 執行所有測試
npm test

# 監聽模式
npm run test:watch

# 測試覆蓋率
npm run test:coverage
```

## 查看範例

### 1. 互動式完整示例 (example.html)
在瀏覽器中開啟 `example.html`，可以實時測試所有加密功能：
- AES 加密/解密
- RSA 加密/解密
- SHA-256/512 哈希
- PBKDF2 密鑰派生
- 完整密碼加密系統

**需求**: 使用 HTTP 伺服器運行，不能直接以 `file://` 開啟

### 2. 自動化測試套件 (test-auto.html)
執行完整的自動化測試套件，驗證所有功能是否正常運作

## API 文件

### CryptoInitializer

主要的初始化器類別，提供所有加密操作的便捷方法。

#### AES 相關方法

- `initAesSetting(keyStr, ivStr?, useSha256ForKey?, useSha256ForIv?, isRandomBase64ForIv?)` - 初始化 AES 設定
- `getAesContextForEncrypt()` - 取得加密上下文 (指定 IV)
- `getAesContextForEncryptByRandomIV()` - 取得加密上下文 (隨機 IV)
- `getAesContextForDecrypt()` - 取得解密上下文
- `getAesContextForDecryptByRandomIV(ivStr)` - 取得解密上下文 (隨機 IV)

#### RSA 相關方法

- `rsaGenerateKeys(keySize?)` - 產生 RSA 金鑰對
- `initRsaSetting(publicKey, privateKey)` - 初始化 RSA 設定
- `getRsaContext()` - 取得 RSA 上下文
- `getRsaContextDirect(publicKey, privateKey)` - 直接取得 RSA 上下文

#### Hash 相關方法

- `getSha256HashContext()` - 取得 SHA-256 上下文
- `getSha512HashContext()` - 取得 SHA-512 上下文

#### KDF 相關方法

- `generateSalt(length?)` - 產生隨機鹽
- `deriveKeyFromPassword(password, salt, kdfStrategy?, iterations?, keyLengthBytes?)` - 派生密鑰
- `deriveKeyFromPasswordToBase64(...)` - 派生密鑰 (Base64)
- `verifyDerivedKey(password, salt, expectedKey, kdfStrategy?, iterations?)` - 驗證密鑰

## 架構設計

本函式庫採用**策略模式 (Strategy Pattern)** 設計，使代碼易於擴展和維護：

```
src/
├── aes/                  # AES 加密模組
│   ├── IAesStrategy.js
│   ├── BasicAesStrategy.js
│   └── AesContext.js
├── rsa/                  # RSA 加密模組
│   ├── IRsaStrategy.js
│   ├── BasicRsaStrategy.js
│   └── RsaContext.js
├── hash/                 # 哈希模組
│   ├── IShaHashStrategy.js
│   ├── BasicSha256HashStrategy.js
│   ├── BasicSha512HashStrategy.js
│   └── ShaHashContext.js
├── kdf/                  # 密鑰派生模組
│   ├── IKdfStrategy.js
│   ├── Pbkdf2Strategy.js
│   └── KdfContext.js
├── common/               # 共用模組
│   └── CryptoInitializer.js
├── CryptoExtension.js    # 擴展方法
└── index.js              # 主入口
```

## 性能建議

### 密鑰派生
- **開發/測試**: PBKDF2，迭代次數 10,000
- **生產環境**: PBKDF2，迭代次數 100,000 - 600,000

### AES 加密
- 永遠使用隨機 IV (`encryptAesByRandomIV`)
- 不要在生產環境使用固定 IV

### RSA 加密
- 密鑰長度建議 2048 或 4096 位元
- 只加密小量資料（如 AES 密鑰）
- 大量資料應使用 AES + RSA 混合加密

## 安全建議

1. **不要在前端儲存私鑰或敏感密鑰**
   - 考慮使用 HSM（硬體安全模組）或遠端密鑰伺服器

2. **使用隨機 IV**
   - 每次加密都使用新的隨機 IV
   - IV 可以公開傳輸，但不可重複使用

3. **密鑰派生**
   - 使用 KDF (PBKDF2) 從密碼派生密鑰
   - 使用足夠長的密碼
   - 使用足夠多的迭代次數

4. **HTTPS**
   - 確保網站使用 HTTPS
   - 防止中間人攻擊

5. **密鑰管理**
   - 妥善保管密鑰和鹽值
   - 定期更換密鑰
   - 使用環境變數或安全配置管理

## 常見問題

### Q1: 頁面顯示 "Web Crypto API 不可用"
**原因**: 沒有在 HTTPS 或 localhost 環境下運行  
**解決**: 使用 `http://localhost:8000` 而不是 `http://<IP地址>:8000`

### Q2: 模組載入失敗 (404 錯誤)
**原因**: 沒有正確安裝依賴或路徑錯誤  
**解決**:
```bash
npm install
```

### Q3: 在 Firefox 中出現 CORS 錯誤
**原因**: Firefox 對 file:// 協議有更嚴格的限制  
**解決**: 必須使用 HTTP 伺服器，不能直接開啟 HTML 檔案

## 除錯技巧

### 開啟瀏覽器開發者工具
- Chrome/Edge: `F12` 或 `Ctrl+Shift+I`
- Firefox: `F12` 或 `Ctrl+Shift+K`
- Safari: `Cmd+Option+I`

### 測試連接
```javascript
// 在 Console 中執行
console.log('Crypto API:', !!window.crypto.subtle);
console.log('TextEncoder:', !!window.TextEncoder);
console.log('Location:', window.location.protocol);
```

## 專案結構

```
crypto-js-lib/
├── src/                    # 源代碼
│   ├── aes/               # AES 加密
│   ├── rsa/               # RSA 加密
│   ├── hash/              # SHA 哈希
│   ├── kdf/               # 密鑰派生
│   ├── common/            # 共用工具
│   ├── CryptoExtension.js # 擴展方法
│   └── index.js           # 主入口
├── __tests__/             # 單元測試 (58 個測試)
├── example.html           # 互動式完整範例
├── test-auto.html         # 自動化測試套件
├── package.json
├── jest.config.js
├── babel.config.js
└── README.md              # 本檔案
```

## 版本記錄

### v1.0.0 (2025-11-06)
- ✅ 移除 Argon2Strategy 和 hash-wasm 依賴
- ✅ 統一使用 PBKDF2 進行密鑰派生
- ✅ 整合文件和範例頁面
- ✅ 所有 50 個測試通過

## 專案亮點

1. ✨ **完整轉換自 C# 版本** - 保持相同的架構和 API 設計
2. 🏗️ **使用策略模式** - 易於維護和擴展
3. 🧪 **高測試覆蓋率** - 50 個單元測試涵蓋主要功能
4. 📚 **詳細的文件** - 完整的 API 說明和使用範例
5. 🔐 **使用現代加密標準** - 符合安全最佳實踐
6. 🌐 **純前端實作** - 適用於靜態網站

## 已完成項目

### 核心加密模組
- ✅ **AES 加密** (對稱加密)
  - IAesStrategy.js - 策略介面
  - BasicAesStrategy.js - AES-256-CBC 實作
  - AesContext.js - 加密上下文

- ✅ **RSA 加密** (非對稱加密)
  - IRsaStrategy.js - 策略介面
  - BasicRsaStrategy.js - RSA-OAEP-SHA256 實作
  - RsaContext.js - 加密上下文與金鑰管理

- ✅ **SHA 哈希**
  - IShaHashStrategy.js - 策略介面
  - BasicSha256HashStrategy.js - SHA-256 實作
  - BasicSha512HashStrategy.js - SHA-512 實作
  - ShaHashContext.js - 哈希上下文

- ✅ **KDF 密鑰派生**
  - IKdfStrategy.js - 策略介面
  - Pbkdf2Strategy.js - PBKDF2-SHA256 實作
  - KdfContext.js - 密鑰派生上下文

### 輔助工具
- ✅ **CryptoInitializer.js** - 統一的初始化器，提供便捷的 API
- ✅ **CryptoExtension.js** - 類似 C# Extension Methods 的便捷函數
- ✅ **index.js** - 主入口，匯出所有模組

### 測試與文件
- ✅ **50 個單元測試** - AES (10)、RSA (9)、SHA (14)、KDF (8)、整合 (9)
- ✅ **README.md** - 完整的使用文件與 API 說明
- ✅ **example.html** - 互動式完整範例
- ✅ **test-auto.html** - 自動化測試套件

## 與 C# 版本對應關係

| C# 類別/方法 | JavaScript 對應 |
|-------------|----------------|
| `AesContext` | `AesContext.js` |
| `BasicAesStrategy` | `BasicAesStrategy.js` |
| `RsaContext` | `RsaContext.js` |
| `BasicRsaStrategy` | `BasicRsaStrategy.js` |
| `ShaHashContext` | `ShaHashContext.js` |
| `BasicSha256HashStrategy` | `BasicSha256HashStrategy.js` |
| `BasicSha512HashStrategy` | `BasicSha512HashStrategy.js` |
| `KdfContext` | `KdfContext.js` |
| `Pbkdf2Strategy` | `Pbkdf2Strategy.js` |
| `CryptoInitializer` | `CryptoInitializer.js` |
| `CryptoExtension` | `CryptoExtension.js` |

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request!

---

**開發完成日期**: 2025-11-06  
**版本**: 1.0.0  
**授權**: MIT License
