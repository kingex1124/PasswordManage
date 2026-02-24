import { IAesStrategy } from './IAesStrategy.js';

/**
 * 基本的 AES-CBC 加密策略實作
 * 使用 Web Crypto API 提供 AES-256-CBC 加密
 */
export class BasicAesStrategy extends IAesStrategy {
  /**
   * 加密明文，返回 Uint8Array
   * @param {string} plainText - 明文
   * @param {Uint8Array} key - 密鑰 (16, 24, 或 32 bytes)
   * @param {Uint8Array} iv - 初始化向量 (16 bytes)
   * @returns {Promise<Uint8Array>} 加密後的字節陣列
   */
  async encrypt(plainText, key, iv) {
    try {
      if (!plainText || plainText.length === 0) {
        throw new Error('plainText cannot be null or empty');
      }
      if (!key) {
        throw new Error('key cannot be null');
      }
      if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
        throw new Error('key length must be 16, 24, or 32 bytes');
      }
      if (!iv) {
        throw new Error('iv cannot be null');
      }
      if (iv.length !== 16) {
        throw new Error('iv length must be 16 bytes');
      }

      // 將明文轉換為 Uint8Array
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);

      // 導入密鑰
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-CBC' },
        false,
        ['encrypt']
      );

      // 加密
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-CBC',
          iv: iv,
        },
        cryptoKey,
        data
      );

      return new Uint8Array(encrypted);
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * 加密明文，返回 Base64 字串
   * @param {string} plainText - 明文
   * @param {Uint8Array} key - 密鑰
   * @param {Uint8Array} iv - 初始化向量
   * @returns {Promise<string>} Base64 加密字串
   */
  async encryptToBase64(plainText, key, iv) {
    const encrypted = await this.encrypt(plainText, key, iv);
    return this._arrayBufferToBase64(encrypted);
  }

  /**
   * 解密字節陣列，返回明文
   * @param {Uint8Array} cipherText - 加密的字節陣列
   * @param {Uint8Array} key - 密鑰
   * @param {Uint8Array} iv - 初始化向量
   * @returns {Promise<string>} 解密後的明文
   */
  async decrypt(cipherText, key, iv) {
    try {
      if (!key) {
        throw new Error('key cannot be null');
      }
      if (!iv) {
        throw new Error('iv cannot be null');
      }

      // 導入密鑰
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      );

      // 解密
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-CBC',
          iv: iv,
        },
        cryptoKey,
        cipherText
      );

      // 將解密結果轉換為字串
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * 解密 Base64 字串，返回明文
   * @param {string} cipherTextBase64 - Base64 加密字串
   * @param {Uint8Array} key - 密鑰
   * @param {Uint8Array} iv - 初始化向量
   * @returns {Promise<string>} 解密後的明文
   */
  async decryptFromBase64(cipherTextBase64, key, iv) {
    const cipherText = this._base64ToArrayBuffer(cipherTextBase64);
    return await this.decrypt(cipherText, key, iv);
  }

  /**
   * 將 Uint8Array 轉換為 Base64 字串
   * @private
   */
  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 將 Base64 字串轉換為 Uint8Array
   * @private
   */
  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
