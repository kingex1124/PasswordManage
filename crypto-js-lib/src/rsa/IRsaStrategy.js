/**
 * RSA 加密策略介面
 * 定義 RSA 加解密的基本操作
 */
export class IRsaStrategy {
  /**
   * 加密明文，返回 Uint8Array
   * @param {string} plainText - 明文
   * @param {CryptoKey} publicKey - 公鑰
   * @returns {Promise<Uint8Array>} 加密後的字節陣列
   */
  async encrypt(plainText, publicKey) {
    throw new Error('Method not implemented');
  }

  /**
   * 加密明文，返回 Base64 字串
   * @param {string} plainText - 明文
   * @param {CryptoKey} publicKey - 公鑰
   * @returns {Promise<string>} Base64 加密字串
   */
  async encryptToBase64(plainText, publicKey) {
    throw new Error('Method not implemented');
  }

  /**
   * 解密字節陣列，返回明文
   * @param {Uint8Array} cipherText - 加密的字節陣列
   * @param {CryptoKey} privateKey - 私鑰
   * @returns {Promise<string>} 解密後的明文
   */
  async decrypt(cipherText, privateKey) {
    throw new Error('Method not implemented');
  }

  /**
   * 解密 Base64 字串，返回明文
   * @param {string} cipherTextBase64 - Base64 加密字串
   * @param {CryptoKey} privateKey - 私鑰
   * @returns {Promise<string>} 解密後的明文
   */
  async decryptFromBase64(cipherTextBase64, privateKey) {
    throw new Error('Method not implemented');
  }
}
