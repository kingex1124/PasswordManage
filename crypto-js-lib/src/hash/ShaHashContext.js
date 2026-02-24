/**
 * SHA 哈希上下文
 * 提供策略模式的 SHA 哈希操作
 */
export class ShaHashContext {
  /**
   * @param {IShaHashStrategy} shaHashStrategy - SHA 哈希策略
   */
  constructor(shaHashStrategy) {
    this._shaHashStrategy = shaHashStrategy;
  }

  /**
   * 設置哈希策略
   * @param {IShaHashStrategy} shaHashStrategy - SHA 哈希策略
   */
  setStrategy(shaHashStrategy) {
    this._shaHashStrategy = shaHashStrategy;
  }

  /**
   * 加密成 Uint8Array
   * @param {string} plainText - 明文
   * @returns {Promise<{success: boolean, data: Uint8Array|null}>} 哈希結果
   */
  async encryptToByte(plainText) {
    try {
      if (!plainText || plainText.length === 0) {
        return { success: false, data: null };
      }
      const result = await this._shaHashStrategy.encrypt(plainText);
      return { success: true, data: result };
    } catch (error) {
      console.error('Hash error:', error);
      return { success: false, data: null };
    }
  }

  /**
   * 加密成 Base64
   * @param {string} plainText - 明文
   * @returns {Promise<{success: boolean, data: string|null}>} 哈希結果
   */
  async encryptToBase64(plainText) {
    try {
      if (!plainText || plainText.length === 0) {
        return { success: false, data: null };
      }
      const result = await this._shaHashStrategy.encryptToBase64(plainText);
      return { success: true, data: result };
    } catch (error) {
      console.error('Hash error:', error);
      return { success: false, data: null };
    }
  }
}
