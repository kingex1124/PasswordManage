import { IKdfStrategy } from './IKdfStrategy.js';

/**
 * PBKDF2 密鑰派生策略
 * 使用 Web Crypto API 的 PBKDF2-SHA256
 */
export class Pbkdf2Strategy extends IKdfStrategy {
  /**
   * 從密碼和鹽派生密鑰，返回 Uint8Array
   * @param {string} password - 密碼
   * @param {Uint8Array} salt - 鹽
   * @param {number} iterations - 迭代次數
   * @param {number} keyLengthBytes - 密鑰長度 (bytes)
   * @returns {Promise<Uint8Array>} 派生的密鑰
   */
  async deriveKey(password, salt, iterations, keyLengthBytes) {
    try {
      if (!password) {
        throw new Error('password cannot be null');
      }
      if (!salt) {
        throw new Error('salt cannot be null');
      }

      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);

      // 導入密碼作為基礎密鑰材料
      const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );

      // 派生密鑰
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: Math.max(1, iterations),
          hash: 'SHA-256',
        },
        baseKey,
        keyLengthBytes * 8 // 轉換為 bits
      );

      return new Uint8Array(derivedBits);
    } catch (error) {
      throw new Error(`PBKDF2 key derivation failed: ${error.message}`);
    }
  }

  /**
   * 從密碼和鹽派生密鑰，返回 Base64 字串
   * @param {string} password - 密碼
   * @param {Uint8Array} salt - 鹽
   * @param {number} iterations - 迭代次數
   * @param {number} keyLengthBytes - 密鑰長度 (bytes)
   * @returns {Promise<string>} Base64 格式的派生密鑰
   */
  async deriveKeyToBase64(password, salt, iterations, keyLengthBytes) {
    try {
      const key = await this.deriveKey(password, salt, iterations, keyLengthBytes);
      return this._arrayBufferToBase64(key);
    } catch (error) {
      throw new Error(`PBKDF2 key derivation to Base64 failed: ${error.message}`);
    }
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
