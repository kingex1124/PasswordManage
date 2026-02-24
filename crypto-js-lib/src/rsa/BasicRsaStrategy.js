import { IRsaStrategy } from './IRsaStrategy.js';

/**
 * 基本的 RSA-OAEP 加密策略實作
 * 使用 Web Crypto API 提供 RSA-OAEP-SHA256 加密
 */
export class BasicRsaStrategy extends IRsaStrategy {
  /**
   * 加密明文，返回 Uint8Array
   * @param {string} plainText - 明文
   * @param {CryptoKey} publicKey - 公鑰
   * @returns {Promise<Uint8Array>} 加密後的字節陣列
   */
  async encrypt(plainText, publicKey) {
    try {
      if (!plainText || plainText.length === 0) {
        throw new Error('plainText cannot be null or empty');
      }
      if (!publicKey) {
        throw new Error('publicKey cannot be null');
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        data
      );

      return new Uint8Array(encrypted);
    } catch (error) {
      throw new Error(`RSA Encryption failed: ${error.message}`);
    }
  }

  /**
   * 加密明文，返回 Base64 字串
   * @param {string} plainText - 明文
   * @param {CryptoKey} publicKey - 公鑰
   * @returns {Promise<string>} Base64 加密字串
   */
  async encryptToBase64(plainText, publicKey) {
    const encrypted = await this.encrypt(plainText, publicKey);
    return this._arrayBufferToBase64(encrypted);
  }

  /**
   * 解密字節陣列，返回明文
   * @param {Uint8Array} cipherText - 加密的字節陣列
   * @param {CryptoKey} privateKey - 私鑰
   * @returns {Promise<string>} 解密後的明文
   */
  async decrypt(cipherText, privateKey) {
    try {
      if (!privateKey) {
        throw new Error('privateKey cannot be null');
      }

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKey,
        cipherText
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error(`RSA Decryption failed: ${error.message}`);
    }
  }

  /**
   * 解密 Base64 字串，返回明文
   * @param {string} cipherTextBase64 - Base64 加密字串
   * @param {CryptoKey} privateKey - 私鑰
   * @returns {Promise<string>} 解密後的明文
   */
  async decryptFromBase64(cipherTextBase64, privateKey) {
    const cipherText = this._base64ToArrayBuffer(cipherTextBase64);
    return await this.decrypt(cipherText, privateKey);
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
