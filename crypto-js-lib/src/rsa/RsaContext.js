/**
 * RSA 加密上下文
 * 提供策略模式的 RSA 加解密操作
 */
export class RsaContext {
  /**
   * @param {IRsaStrategy} rsaStrategy - RSA 加密策略
   */
  constructor(rsaStrategy) {
    this._rsaStrategy = rsaStrategy;
    this.publicKey = null;
    this.privateKey = null;
  }

  /**
   * 設置加密策略
   * @param {IRsaStrategy} rsaStrategy - RSA 加密策略
   */
  setStrategy(rsaStrategy) {
    this._rsaStrategy = rsaStrategy;
  }

  /**
   * 產生 RSA 金鑰對
   * @param {number} keySize - 金鑰大小 (bits)，預設 2048
   * @returns {Promise<{publicKey: string, privateKey: string}>} JWK 格式的公私鑰
   */
  static async generateKeys(keySize = 2048) {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: keySize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

      return {
        publicKey: JSON.stringify(publicKey),
        privateKey: JSON.stringify(privateKey),
      };
    } catch (error) {
      throw new Error(`Key generation failed: ${error.message}`);
    }
  }

  /**
   * 從 JWK 字串匯入公鑰
   * @param {string} publicKeyString - JWK 格式的公鑰字串
   * @returns {Promise<CryptoKey>} CryptoKey 物件
   */
  static async importPublicKeyFromString(publicKeyString) {
    try {
      const jwk = JSON.parse(publicKeyString);
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['encrypt']
      );
    } catch (error) {
      throw new Error(`Public key import failed: ${error.message}`);
    }
  }

  /**
   * 從 JWK 字串匯入私鑰
   * @param {string} privateKeyString - JWK 格式的私鑰字串
   * @returns {Promise<CryptoKey>} CryptoKey 物件
   */
  static async importPrivateKeyFromString(privateKeyString) {
    try {
      const jwk = JSON.parse(privateKeyString);
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['decrypt']
      );
    } catch (error) {
      throw new Error(`Private key import failed: ${error.message}`);
    }
  }

  /**
   * 加密成 Uint8Array
   * @param {string} plainText - 明文
   * @returns {Promise<{success: boolean, data: Uint8Array|null}>} 加密結果
   */
  async encryptToByte(plainText) {
    try {
      if (!plainText || plainText.length === 0) {
        return { success: false, data: null };
      }
      const result = await this._rsaStrategy.encrypt(plainText, this.publicKey);
      return { success: true, data: result };
    } catch (error) {
      console.error('RSA Encryption error:', error);
      return { success: false, data: null };
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
      const result = await this._rsaStrategy.encryptToBase64(plainText, this.publicKey);
      return { success: true, data: result };
    } catch (error) {
      console.error('RSA Encryption error:', error);
      return { success: false, data: null };
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
      const result = await this._rsaStrategy.decrypt(cipherText, this.privateKey);
      return { success: true, data: result };
    } catch (error) {
      console.error('RSA Decryption error:', error);
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
      const result = await this._rsaStrategy.decryptFromBase64(cipherTextBase64, this.privateKey);
      return { success: true, data: result };
    } catch (error) {
      console.error('RSA Decryption error:', error);
      return { success: false, data: null };
    }
  }
}
