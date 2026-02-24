/**
 * KDF 上下文
 * 提供策略模式的密鑰派生操作
 */
export class KdfContext {
  /**
   * @param {IKdfStrategy} strategy - KDF 策略
   */
  constructor(strategy) {
    this._strategy = strategy;
  }

  /**
   * 設置 KDF 策略
   * @param {IKdfStrategy} strategy - KDF 策略
   */
  setStrategy(strategy) {
    this._strategy = strategy;
  }

  /**
   * 從密碼和鹽派生密鑰
   * @param {string} password - 密碼
   * @param {Uint8Array} salt - 鹽
   * @param {number} iterations - 迭代次數，預設 100000
   * @param {number} keyLengthBytes - 密鑰長度 (bytes)，預設 32
   * @returns {Promise<Uint8Array>} 派生的密鑰
   */
  async deriveKey(password, salt, iterations = 100000, keyLengthBytes = 32) {
    return await this._strategy.deriveKey(password, salt, iterations, keyLengthBytes);
  }

  /**
   * 從密碼和鹽派生密鑰，返回 Base64
   * @param {string} password - 密碼
   * @param {Uint8Array} salt - 鹽
   * @param {number} iterations - 迭代次數，預設 100000
   * @param {number} keyLengthBytes - 密鑰長度 (bytes)，預設 32
   * @returns {Promise<string>} Base64 格式的派生密鑰
   */
  async deriveKeyToBase64(password, salt, iterations = 100000, keyLengthBytes = 32) {
    return await this._strategy.deriveKeyToBase64(password, salt, iterations, keyLengthBytes);
  }
}
