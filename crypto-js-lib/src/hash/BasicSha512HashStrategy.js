import { IShaHashStrategy } from './IShaHashStrategy.js';

/**
 * SHA-512 哈希策略實作
 * 使用 Web Crypto API 提供 SHA-512 哈希
 */
export class BasicSha512HashStrategy extends IShaHashStrategy {
  /**
   * 加密明文，返回 Uint8Array
   * @param {string} plainText - 明文
   * @returns {Promise<Uint8Array>} 哈希後的字節陣列
   */
  async encrypt(plainText) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);
      const hashBuffer = await crypto.subtle.digest('SHA-512', data);
      return new Uint8Array(hashBuffer);
    } catch (error) {
      throw new Error(`SHA-512 hashing failed: ${error.message}`);
    }
  }

  /**
   * 加密明文，返回 Base64 字串
   * @param {string} plainText - 明文
   * @returns {Promise<string>} Base64 哈希字串
   */
  async encryptToBase64(plainText) {
    const hash = await this.encrypt(plainText);
    return this._arrayBufferToBase64(hash);
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
}
