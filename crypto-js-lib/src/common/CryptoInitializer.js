import { AesContext } from '../aes/AesContext.js';
import { BasicAesStrategy } from '../aes/BasicAesStrategy.js';
import { RsaContext } from '../rsa/RsaContext.js';
import { BasicRsaStrategy } from '../rsa/BasicRsaStrategy.js';
import { ShaHashContext } from '../hash/ShaHashContext.js';
import { BasicSha256HashStrategy } from '../hash/BasicSha256HashStrategy.js';
import { BasicSha512HashStrategy } from '../hash/BasicSha512HashStrategy.js';
import { KdfContext } from '../kdf/KdfContext.js';
import { Pbkdf2Strategy } from '../kdf/Pbkdf2Strategy.js';

/**
 * 加密初始化器
 * 提供所有加密操作的便捷方法
 */
export class CryptoInitializer {
  static _key = null;
  static _iv = null;
  static _publicKey = null;
  static _privateKey = null;

  // ==================== AES 相關 ====================

  /**
   * 初始化 AES 設定 (指定 IV)
   * @param {string} keyStr - 自定義密鑰字串
   * @param {string} ivStr - 自定義 IV 字串
   * @param {boolean} useSha256ForKey - 是否使用 SHA256 處理密鑰
   * @param {boolean} useSha256ForIv - 是否使用 SHA256 處理 IV
   * @param {boolean} isRandomBase64ForIv - IV 是否為 Base64 字串
   */
  static async initAesSetting(keyStr, ivStr = null, useSha256ForKey = true, useSha256ForIv = true, isRandomBase64ForIv = false) {
    this._key = useSha256ForKey ? await this._computeSha256(keyStr) : this._resizeKey(keyStr);
    
    if (ivStr) {
      if (isRandomBase64ForIv) {
        this._iv = this._base64ToArrayBuffer(ivStr);
      } else {
        this._iv = useSha256ForIv ? this._resizeIV(await this._computeSha256(ivStr)) : this._resizeIV(this._stringToUint8Array(ivStr));
      }
    }
  }

  /**
   * 取得 AES 加密上下文 (指定 IV)
   */
  static getAesContextForEncrypt() {
    const context = new AesContext(new BasicAesStrategy());
    context.key = this._key;
    context.iv = this._iv;
    return context;
  }

  /**
   * 取得 AES 加密上下文 (隨機 IV)
   */
  static getAesContextForEncryptByRandomIV() {
    const context = new AesContext(new BasicAesStrategy());
    context.key = this._key;
    context.iv = this._generateRandomIV();
    return context;
  }

  /**
   * 取得 AES 加密上下文 (使用指定的 Base64 IV)
   */
  static getAesContextForEncryptByRandomBase64IV(ivStr) {
    const context = new AesContext(new BasicAesStrategy());
    context.key = this._key;
    context.iv = this._base64ToArrayBuffer(ivStr);
    return context;
  }

  /**
   * 取得 AES 解密上下文 (指定 IV)
   */
  static getAesContextForDecrypt() {
    const context = new AesContext(new BasicAesStrategy());
    context.key = this._key;
    context.iv = this._iv;
    return context;
  }

  /**
   * 取得 AES 解密上下文 (隨機 IV)
   */
  static getAesContextForDecryptByRandomIV(ivStr) {
    const context = new AesContext(new BasicAesStrategy());
    context.key = this._key;
    context.iv = this._base64ToArrayBuffer(ivStr);
    return context;
  }

  /**
   * 直接加密 (指定 key 和 iv)
   */
  static async getAesContextForEncryptDirect(keyStr, ivStr, useSha256ForKey = true, useSha256ForIv = true, isRandomBase64ForIv = false) {
    const context = new AesContext(new BasicAesStrategy());
    context.key = useSha256ForKey ? await this._computeSha256(keyStr) : this._resizeKey(keyStr);
    
    if (isRandomBase64ForIv) {
      context.iv = this._base64ToArrayBuffer(ivStr);
    } else {
      context.iv = useSha256ForIv ? this._resizeIV(await this._computeSha256(ivStr)) : this._resizeIV(this._stringToUint8Array(ivStr));
    }
    
    return context;
  }

  /**
   * 直接加密 (隨機 IV)
   */
  static async getAesContextForEncryptDirectRandom(keyStr, useSha256ForKey = true) {
    const context = new AesContext(new BasicAesStrategy());
    context.key = useSha256ForKey ? await this._computeSha256(keyStr) : this._resizeKey(keyStr);
    context.iv = this._generateRandomIV();
    return context;
  }

  /**
   * 直接解密
   */
  static async getAesContextForDecryptDirect(keyStr, ivStr, useSha256ForKey = true, isBase64ForIv = true) {
    const context = new AesContext(new BasicAesStrategy());
    context.key = useSha256ForKey ? await this._computeSha256(keyStr) : this._resizeKey(keyStr);
    context.iv = isBase64ForIv ? this._base64ToArrayBuffer(ivStr) : this._stringToUint8Array(ivStr);
    return context;
  }

  // ==================== RSA 相關 ====================

  /**
   * 產生 RSA 金鑰對
   */
  static async rsaGenerateKeys(keySize = 2048) {
    return await RsaContext.generateKeys(keySize);
  }

  /**
   * 初始化 RSA 設定
   */
  static async initRsaSetting(publicKey, privateKey) {
    this._publicKey = await RsaContext.importPublicKeyFromString(publicKey);
    this._privateKey = await RsaContext.importPrivateKeyFromString(privateKey);
  }

  /**
   * 取得 RSA 上下文 (使用預設金鑰)
   */
  static getRsaContext() {
    const context = new RsaContext(new BasicRsaStrategy());
    context.publicKey = this._publicKey;
    context.privateKey = this._privateKey;
    return context;
  }

  /**
   * 取得 RSA 上下文 (直接指定金鑰)
   */
  static async getRsaContextDirect(publicKey, privateKey) {
    const context = new RsaContext(new BasicRsaStrategy());
    context.publicKey = await RsaContext.importPublicKeyFromString(publicKey);
    context.privateKey = await RsaContext.importPrivateKeyFromString(privateKey);
    return context;
  }

  // ==================== SHA Hash 相關 ====================

  /**
   * 取得 SHA-256 哈希上下文
   */
  static getSha256HashContext() {
    return new ShaHashContext(new BasicSha256HashStrategy());
  }

  /**
   * 取得 SHA-512 哈希上下文
   */
  static getSha512HashContext() {
    return new ShaHashContext(new BasicSha512HashStrategy());
  }

  // ==================== KDF 相關 ====================

  /**
   * 產生隨機鹽
   * @param {number} length - 長度 (bytes)，預設 16
   */
  static generateSalt(length = 16) {
    if (length <= 0) throw new Error('length must be greater than 0');
    const salt = new Uint8Array(length);
    crypto.getRandomValues(salt);
    const base64Salt = this._arrayBufferToBase64(salt);
    return { base64Salt, bytesSalt: salt };
  }

  /**
   * 從密碼與鹽派生密鑰 (byte[])
   */
  static async deriveKeyFromPassword(password, salt, kdfStrategy = null, iterations = 100000, keyLengthBytes = 32) {
    if (!password) throw new Error('password cannot be null');
    if (!salt) throw new Error('salt cannot be null');
    const ctx = new KdfContext(kdfStrategy || new Pbkdf2Strategy());
    return await ctx.deriveKey(password, salt, iterations, keyLengthBytes);
  }

  /**
   * 從密碼與鹽派生密鑰 (Base64)
   */
  static async deriveKeyFromPasswordToBase64(password, salt, kdfStrategy = null, iterations = 100000, keyLengthBytes = 32) {
    if (!password) throw new Error('password cannot be null');
    if (!salt) throw new Error('salt cannot be null');
    const ctx = new KdfContext(kdfStrategy || new Pbkdf2Strategy());
    return await ctx.deriveKeyToBase64(password, salt, iterations, keyLengthBytes);
  }

  /**
   * 驗證派生密鑰
   */
  static async verifyDerivedKey(password, salt, expectedKey, kdfStrategy = null, iterations = 100000) {
    if (!password) throw new Error('password cannot be null');
    if (!salt) throw new Error('salt cannot be null');
    if (!expectedKey) throw new Error('expectedKey cannot be null');
    
    const derived = await this.deriveKeyFromPassword(password, salt, kdfStrategy, iterations, expectedKey.length);
    return this._constantTimeEquals(derived, expectedKey);
  }

  // ==================== 私有輔助方法 ====================

  /**
   * 計算 SHA-256
   * @private
   */
  static async _computeSha256(input, isBase64 = false) {
    const encoder = new TextEncoder();
    const data = isBase64 ? this._base64ToArrayBuffer(input) : encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  /**
   * 調整密鑰大小至 32 bytes
   * @private
   */
  static _resizeKey(keyStr, isBase64 = false) {
    const encoder = new TextEncoder();
    const keyBytes = isBase64 ? this._base64ToArrayBuffer(keyStr) : encoder.encode(keyStr);
    const resized = new Uint8Array(32);
    for (let i = 0; i < Math.min(keyBytes.length, 32); i++) {
      resized[i] = keyBytes[i];
    }
    return resized;
  }

  /**
   * 調整 IV 大小至 16 bytes
   * @private
   */
  static _resizeIV(ivBytes) {
    const resized = new Uint8Array(16);
    for (let i = 0; i < Math.min(ivBytes.length, 16); i++) {
      resized[i] = ivBytes[i];
    }
    return resized;
  }

  /**
   * 產生隨機 IV
   * @private
   */
  static _generateRandomIV() {
    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);
    return iv;
  }

  /**
   * 字串轉 Uint8Array
   * @private
   */
  static _stringToUint8Array(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }

  /**
   * Uint8Array 轉 Base64
   * @private
   */
  static _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64 轉 Uint8Array
   * @private
   */
  static _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * 常數時間比較 (防止時序攻擊)
   * @private
   */
  static _constantTimeEquals(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }
}
