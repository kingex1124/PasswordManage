/**
 * KDF (Key Derivation Function) 策略介面
 * 定義密鑰派生函數的基本操作
 */
export class IKdfStrategy {
  /**
   * 從密碼和鹽派生密鑰，返回 Uint8Array
   * @param {string} password - 密碼
   * @param {Uint8Array} salt - 鹽
   * @param {number} iterations - 迭代次數
   * @param {number} keyLengthBytes - 密鑰長度 (bytes)
   * @returns {Promise<Uint8Array>} 派生的密鑰
   */
  async deriveKey(password, salt, iterations, keyLengthBytes) {
    throw new Error('Method not implemented');
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
    throw new Error('Method not implemented');
  }
}
