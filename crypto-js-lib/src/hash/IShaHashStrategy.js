/**
 * SHA 哈希策略介面
 * 定義 SHA 哈希的基本操作
 */
export class IShaHashStrategy {
  /**
   * 加密明文，返回 Uint8Array
   * @param {string} plainText - 明文
   * @returns {Promise<Uint8Array>} 哈希後的字節陣列
   */
  async encrypt(plainText) {
    throw new Error('Method not implemented');
  }

  /**
   * 加密明文，返回 Base64 字串
   * @param {string} plainText - 明文
   * @returns {Promise<string>} Base64 哈希字串
   */
  async encryptToBase64(plainText) {
    throw new Error('Method not implemented');
  }
}
