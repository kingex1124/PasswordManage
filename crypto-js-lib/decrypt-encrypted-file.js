#!/usr/bin/env node
/*
  Node 解密腳本
  - 在下面填入 PASSWORD 與 FILE_PATH
  - 會讀取指定的加密 JSON（resume-data.json 或其他），使用 PBKDF2 與 AES 解密並在 console.log 印出解密結果
*/

import fs from 'fs';
import path from 'path';
import { CryptoInitializer, Pbkdf2Strategy, AesContext, BasicAesStrategy } from './src/index.js';

// ======= 在這裡填入密碼與檔案路徑 =======
// 密碼（請填入你想測試的密碼）
const PASSWORD = 'mySecurePassword123';

// 要解密的檔案路徑（相對於專案根，或可改為絕對路徑）
const FILE_PATH = path.join(process.cwd(), 'data', 'resume-data.json');
// =========================================

function base64ToUint8Array(base64) {
  // Node-friendly base64 decode -> Uint8Array
  const buf = Buffer.from(base64, 'base64');
  return new Uint8Array(buf);
}

async function run() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      console.error('指定的檔案不存在：', FILE_PATH);
      process.exit(1);
    }

    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    const encrypted = JSON.parse(raw);

    if (!encrypted.encrypted || !encrypted.cipherText) {
      console.error('檔案不是預期的加密格式或缺少 cipherText');
      process.exit(1);
    }

    // 取得 KDF 與參數
    const saltBase64 = encrypted.salt;
    const ivBase64 = encrypted.iv;
    const iterations = encrypted.iterations || 100000;
    const keyLen = 32; // bytes (AES-256)

    if (!saltBase64 || !ivBase64) {
      console.error('缺少 salt 或 iv，無法解密');
      process.exit(1);
    }

    const saltBytes = base64ToUint8Array(saltBase64);

    // 使用 PBKDF2 派生密鑰
    const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
      PASSWORD,
      saltBytes,
      new Pbkdf2Strategy(),
      iterations,
      keyLen
    );

    // 建立 AES context 並設定 key / iv
    const aesContext = new AesContext(new BasicAesStrategy());
    aesContext.key = derivedKey;
    aesContext.iv = base64ToUint8Array(ivBase64);

    // 將 cipherText Base64 轉成 Uint8Array，自行解碼以避免在 Node 中依賴 atob
    const cipherBytes = base64ToUint8Array(encrypted.cipherText);

    const decryptResult = await aesContext.decryptFromByte(cipherBytes);

    if (!decryptResult.success) {
      console.error('解密失敗');
      process.exit(1);
    }

    console.log('=== 解密結果 (明文) ===');
    console.log(decryptResult.data);
    console.log('=== JSON 解析後（若是 JSON 會顯示物件） ===');
    try {
      const parsed = JSON.parse(decryptResult.data);
      // 使用 JSON.stringify 可以完整印出所有細節
      // 若資料有循環參照請改用 util.inspect 或 console.dir
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('(不是 JSON 格式或解析失敗)');
    }

  } catch (err) {
    console.error('執行時發生錯誤：', err);
    process.exit(1);
  }
}

run();
