import { CryptoInitializer } from './common/CryptoInitializer.js';

/**
 * CryptoExtension
 * 提供便捷的加密擴展方法,類似 C# 的 Extension Methods
 * 使用範例: await encryptAes('myPlainText')
 */

/**
 * 使用預設設定加密 (固定 key 和 iv)
 * @param {string} plain - 明文
 * @returns {Promise<string|null>} 加密後的 Base64 字串
 */
export async function encryptAes(plain) {
  return await encryptAesWithIV(plain, '10864108035Roc');
}

/**
 * 使用指定 IV 加密
 * @param {string} plain - 明文
 * @param {string} iv - IV 字串
 * @returns {Promise<string|null>} 加密後的 Base64 字串
 */
export async function encryptAesWithIV(plain, iv) {
  try {
    await CryptoInitializer.initAesSetting('Roc10864108035', iv);
    const context = CryptoInitializer.getAesContextForEncrypt();
    const result = await context.encryptToBase64(plain);
    return result.success ? result.data : plain;
  } catch (error) {
    console.error('Encryption error:', error);
    return plain;
  }
}

/**
 * 使用隨機產生的 Base64 IV 加密
 * @param {string} plain - 明文
 * @param {string} iv - Base64 格式的 IV
 * @returns {Promise<string|null>} 加密後的 Base64 字串
 */
export async function encryptAesByRandomBase64IV(plain, iv) {
  try {
    await CryptoInitializer.initAesSetting('Roc10864108035', iv, true, true, true);
    const context = CryptoInitializer.getAesContextForEncrypt();
    const result = await context.encryptToBase64(plain);
    return result.success ? result.data : plain;
  } catch (error) {
    console.error('Encryption error:', error);
    return plain;
  }
}

/**
 * 解密 (使用預設設定)
 * @param {string} cipher - Base64 加密字串
 * @returns {Promise<string|null>} 解密後的明文
 */
export async function decryptAes(cipher) {
  try {
    await CryptoInitializer.initAesSetting('Roc10864108035', '10864108035Roc');
    const context = CryptoInitializer.getAesContextForDecrypt();
    const result = await context.decryptFromBase64(cipher);
    
    if (result.success) {
      // 模擬 System.Web.HttpUtility.HtmlDecode
      return htmlDecode(result.data);
    }
    return cipher;
  } catch (error) {
    console.error('Decryption error:', error);
    return cipher;
  }
}

/**
 * 使用隨機 IV 加密,返回密文和 IV
 * @param {string} plain - 明文
 * @returns {Promise<{cipher: string|null, iv: string|null}>} 加密結果和 IV
 */
export async function encryptAesByRandomIV(plain) {
  try {
    await CryptoInitializer.initAesSetting('Roc10864108035');
    const context = CryptoInitializer.getAesContextForEncryptByRandomIV();
    const result = await context.encryptWithIVToBase64(plain);
    
    if (result.success) {
      return { cipher: result.cipherText, iv: result.iv };
    }
    return { cipher: plain, iv: null };
  } catch (error) {
    console.error('Encryption error:', error);
    return { cipher: plain, iv: null };
  }
}

/**
 * 使用隨機 IV 解密
 * @param {string} cipher - Base64 加密字串
 * @param {string} iv - Base64 格式的 IV
 * @returns {Promise<string|null>} 解密後的明文
 */
export async function decryptAesByRandomIV(cipher, iv) {
  try {
    await CryptoInitializer.initAesSetting('Roc10864108035');
    const context = CryptoInitializer.getAesContextForDecryptByRandomIV(iv);
    const result = await context.decryptFromBase64(cipher);
    
    if (result.success) {
      return htmlDecode(result.data);
    }
    return cipher;
  } catch (error) {
    console.error('Decryption error:', error);
    return cipher;
  }
}

/**
 * HTML 解碼 (簡易版,模擬 C# 的 HttpUtility.HtmlDecode)
 * @param {string} html - HTML 編碼的字串
 * @returns {string} 解碼後的字串
 */
function htmlDecode(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// 如果在 Node.js 環境,提供替代實作
if (typeof document === 'undefined') {
  function htmlDecode(html) {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
}

/**
 * 使用範例:
 * 
 * // 基本加密
 * const encrypted = await encryptAes('Hello World');
 * const decrypted = await decryptAes(encrypted);
 * 
 * // 使用隨機 IV
 * const { cipher, iv } = await encryptAesByRandomIV('Secret Message');
 * const plain = await decryptAesByRandomIV(cipher, iv);
 * 
 * // 使用指定 IV
 * const encrypted2 = await encryptAesWithIV('Test', 'myCustomIV123');
 */
