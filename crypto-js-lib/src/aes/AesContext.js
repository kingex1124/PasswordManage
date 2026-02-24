/**
 * AES 加密上下文
 * 提供策略模式的 AES 加解密操作
 */
export class AesContext {
  /**
   * @param {IAesStrategy} aesStrategy - AES 加密策略
   */
  constructor(aesStrategy) {
    this._aesStrategy = aesStrategy;
    this.key = null;
    this.iv = null;
  }

  /**
   * 設置加密策略
   * @param {IAesStrategy} aesStrategy - AES 加密策略
   */
  setStrategy(aesStrategy) {
    this._aesStrategy = aesStrategy;
  }

  /**
   * 加密成 Uint8Array
   * @param {string} plainText - 明文
   * @returns {Promise<Uint8Array|null>} 加密後的字節陣列
   */
  async encryptToByte(plainText) {
    try {
      return await this._aesStrategy.encrypt(plainText, this.key, this.iv);
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  /**
   * 加密成 Base64
   * @param {string} plainText - 明文
   * @returns {Promise<{success: boolean, data: string|null}>} 加密結果
   */
  async encryptToBase64(plainText) {
    try {
      if (!plainText || plainText.length === 0) {
        return { success: false, data: null };
      }
      const result = await this._aesStrategy.encryptToBase64(plainText, this.key, this.iv);
      return { success: true, data: result };
    } catch (error) {
      console.error('Encryption error:', error);
      return { success: false, data: null };
    }
  }

  /**
   * 返回加密資料與 IV (Base64)
   * @param {string} plainText - 明文
   * @returns {Promise<{success: boolean, cipherText: string|null, iv: string|null}>}
   */
  async encryptWithIVToBase64(plainText) {
    try {
      if (!plainText || plainText.length === 0) {
        return { success: false, cipherText: null, iv: null };
      }
      const cipherText = await this._aesStrategy.encryptToBase64(plainText, this.key, this.iv);
      const ivBase64 = this._arrayBufferToBase64(this.iv);
      return { success: true, cipherText, iv: ivBase64 };
    } catch (error) {
      console.error('Encryption error:', error);
      return { success: false, cipherText: null, iv: null };
    }
  }

  /**
   * 返回加密資料與 IV (UTF-8)
   * @param {string} plainText - 明文
   * @returns {Promise<{success: boolean, cipherText: string|null, iv: string|null}>}
   */
  async encryptWithIVToUtf8(plainText) {
    try {
      if (!plainText || plainText.length === 0) {
        return { success: false, cipherText: null, iv: null };
      }
      const cipherText = await this._aesStrategy.encryptToBase64(plainText, this.key, this.iv);
      const decoder = new TextDecoder();
      const ivUtf8 = decoder.decode(this.iv);
      return { success: true, cipherText, iv: ivUtf8 };
    } catch (error) {
      console.error('Encryption error:', error);
      return { success: false, cipherText: null, iv: null };
    }
  }

  /**
   * 透過加密的 byte 解密資料
   * @param {Uint8Array} cipherText - 加密的字節陣列
   * @returns {Promise<{success: boolean, data: string|null}>} 解密結果
   */
  async decryptFromByte(cipherText) {
    try {
      if (!cipherText || cipherText.length === 0) {
        return { success: false, data: null };
      }
      const result = await this._aesStrategy.decrypt(cipherText, this.key, this.iv);
      return { success: true, data: result };
    } catch (error) {
      console.error('Decryption error:', error);
      return { success: false, data: null };
    }
  }

  /**
   * 透過加密的 Base64 解密資料
   * @param {string} cipherTextBase64 - Base64 加密字串
   * @returns {Promise<{success: boolean, data: string|null}>} 解密結果
   */
  async decryptFromBase64(cipherTextBase64) {
    try {
      if (!cipherTextBase64 || cipherTextBase64.length === 0) {
        return { success: false, data: null };
      }
      const result = await this._aesStrategy.decryptFromBase64(cipherTextBase64, this.key, this.iv);
      return { success: true, data: result };
    } catch (error) {
      console.error('Decryption error:', error);
      return { success: false, data: null };
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
