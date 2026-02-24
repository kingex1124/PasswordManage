/**
 * 生成加密的 JSON 資料
 * 這個腳本會創建範例資料並使用 AES 加密
 */

import { CryptoInitializer, Pbkdf2Strategy, AesContext, BasicAesStrategy } from './src/index.js';
import fs from 'fs';
import path from 'path';

// 預設密碼（可以修改）
const DEFAULT_PASSWORD = '^6(QEH(|K47Q(a2}Dc6=';

function loadAllJsonFiles() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      throw new Error(`Data directory not found: ${dataDir}`);
    }

    const files = fs.readdirSync(dataDir);
    const jsonFiles = files.filter(file => {
      return file.endsWith('.json') && file !== 'resume-data.json';
    });

    const dataMap = {};
    for (const file of jsonFiles) {
      const filePath = path.join(dataDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(raw);
      dataMap[file] = json;
    }

    return dataMap;
  } catch (err) {
    console.error('[generate-encrypted-data] Failed to load data:', err);
    throw err;
  }
}

async function generateEncryptedData() {
  try {
    console.log('🔐 開始生成加密資料...');
    console.log('');

    const dataMap = loadAllJsonFiles();
    const fileNames = Object.keys(dataMap);

    if (fileNames.length === 0) {
      console.log('⚠️ 未找到任何 JSON 檔案');
      return;
    }

    console.log(`📂 找到 ${fileNames.length} 個檔案:`);
    fileNames.forEach(name => console.log(`   - ${name}`));
    console.log('');

    // 確保 encrypted 目錄存在
    const encryptedDir = path.join(process.cwd(), 'data', 'encrypted');
    if (!fs.existsSync(encryptedDir)) {
      fs.mkdirSync(encryptedDir, { recursive: true });
      console.log(`✅ 已建立加密資料夾: ${encryptedDir}`);
    }
    console.log('');

    // 依次加密所有檔案
    for (const fileName of fileNames) {
      try {
        console.log(`🔄 正在加密: ${fileName}`);

        const jsonData = dataMap[fileName];

        // 1. 產生隨機鹽
        const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);

        // 2. 使用 PBKDF2 從密碼派生密鑰
        const pbkdf2 = new Pbkdf2Strategy();
        const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
          DEFAULT_PASSWORD,
          bytesSalt,
          pbkdf2,
          100000, // 100,000 次迭代
          32      // 256 位元密鑰
        );

        // 3. 將資料轉換為 JSON 字串
        const jsonString = JSON.stringify(jsonData, null, 2);

        // 4. 生成隨機 IV
        const iv = crypto.getRandomValues(new Uint8Array(16));

        // 5. 使用 AES 加密
        const aesContext = new AesContext(new BasicAesStrategy());
        aesContext.key = derivedKey;
        aesContext.iv = iv;

        const encryptResult = await aesContext.encryptToBase64(jsonString);

        if (!encryptResult.success) {
          throw new Error('加密失敗');
        }

        // 將 IV 轉換為 Base64
        const ivBase64 = Buffer.from(iv).toString('base64');

        // 6. 建立加密資料結構
        const encryptedData = {
          version: '1.0',
          encrypted: true,
          algorithm: 'AES-256-CBC',
          kdf: 'PBKDF2-SHA256',
          iterations: 100000,
          salt: base64Salt,
          iv: ivBase64,
          cipherText: encryptResult.data,
          timestamp: new Date().toISOString(),
          sourceFile: fileName,
          description: '此檔案包含加密的履歷資料，需要正確的密碼才能解密'
        };

        // 7. 儲存到 encrypted 資料夾
        const outputPath = path.join(encryptedDir, fileName);
        fs.writeFileSync(outputPath, JSON.stringify(encryptedData, null, 2), 'utf-8');

        console.log(`   ✅ 已儲存至: data/encrypted/${fileName}`);
        console.log('');
      } catch (err) {
        console.error(`   ❌ ${fileName} 加密失敗:`, err.message);
        console.log('');
      }
    }

    console.log('📋 加密設定:');
    console.log('  密碼:', DEFAULT_PASSWORD);
    console.log('  演算法: AES-256-CBC');
    console.log('  KDF: PBKDF2-SHA256');
    console.log('  迭代次數: 100000');
    console.log('');
    console.log('🎉 完成！');

  } catch (error) {
    console.error('❌ 發生錯誤:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 執行
generateEncryptedData();
