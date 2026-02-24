/**
 * AES 加密策略介面
 * 定義 AES 加解密的基本操作
 */
export class IAesStrategy {
  /**
   * 加密明文，返回 Uint8Array
   * @param {string} plainText - 明文
   * @param {Uint8Array} key - 密鑰
   * @param {Uint8Array} iv - 初始化向量
   * @returns {Promise<Uint8Array>} 加密後的字節陣列
   */
  async encrypt(plainText, key, iv) {
    throw new Error('Method not implemented');
  }

  /**
   * 加密明文，返回 Base64 字串
   * @param {string} plainText - 明文
   * @param {Uint8Array} key - 密鑰
   * @param {Uint8Array} iv - 初始化向量
   * @returns {Promise<string>} Base64 加密字串
   */
  async encryptToBase64(plainText, key, iv) {
    throw new Error('Method not implemented');
  }

  /**
   * 解密字節陣列，返回明文
   * @param {Uint8Array} cipherText - 加密的字節陣列
   * @param {Uint8Array} key - 密鑰
   * @param {Uint8Array} iv - 初始化向量
   * @returns {Promise<string>} 解密後的明文
   */
  async decrypt(cipherText, key, iv) {
    throw new Error('Method not implemented');
  }

  /**
   * 解密 Base64 字串，返回明文
   * @param {string} cipherTextBase64 - Base64 加密字串
   * @param {Uint8Array} key - 密鑰
   * @param {Uint8Array} iv - 初始化向量
   * @returns {Promise<string>} 解密後的明文
   */
  async decryptFromBase64(cipherTextBase64, key, iv) {
    throw new Error('Method not implemented');
  }
}
