import { CryptoInitializer, Pbkdf2Strategy } from '../../crypto-js-lib/src/index.js';
import { base64ToBytes } from '../utils.js';

const ITERATIONS = 100000;
const KEY_LENGTH_BYTES = 32;

export class EncryptionService {
  constructor() {
    this.kdfStrategy = new Pbkdf2Strategy();
  }

  async encryptRecords(plainData, archivePassword) {
    const plainText = JSON.stringify(plainData);
    const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);

    const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
      archivePassword,
      bytesSalt,
      this.kdfStrategy,
      ITERATIONS,
      KEY_LENGTH_BYTES,
    );

    const aesContext = CryptoInitializer.getAesContextForEncryptByRandomIV();
    aesContext.key = derivedKey;
    const encrypted = await aesContext.encryptWithIVToBase64(plainText);

    if (!encrypted.success || !encrypted.cipherText || !encrypted.iv) {
      throw new Error('ENCRYPT_FAILED');
    }

    return {
      formatVersion: '1.1.0',
      algorithm: {
        kdf: 'PBKDF2',
        iterations: ITERATIONS,
        keyLengthBytes: KEY_LENGTH_BYTES,
        cipher: 'AES-256-CBC',
        ivEncoding: 'base64',
        saltEncoding: 'base64',
        cipherTextEncoding: 'base64',
      },
      salt: base64Salt,
      iv: encrypted.iv,
      cipherText: encrypted.cipherText,
      createdAt: new Date().toISOString(),
    };
  }

  async decryptFilePayload(encryptedPayload, archivePassword) {
    this.validateEncryptedPayload(encryptedPayload);

    const bytesSalt = base64ToBytes(encryptedPayload.salt);
    const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
      archivePassword,
      bytesSalt,
      this.kdfStrategy,
      ITERATIONS,
      KEY_LENGTH_BYTES,
    );

    const aesContext = CryptoInitializer.getAesContextForDecryptByRandomIV(encryptedPayload.iv);
    aesContext.key = derivedKey;
    const decrypted = await aesContext.decryptFromBase64(encryptedPayload.cipherText);
    if (!decrypted.success || typeof decrypted.data !== 'string') {
      throw new Error('DECRYPT_FAILED');
    }

    const plainData = JSON.parse(decrypted.data);
    return plainData;
  }

  validateEncryptedPayload(encryptedPayload) {
    if (!encryptedPayload || typeof encryptedPayload !== 'object') {
      throw new Error('INVALID_FILE');
    }

    const requiredFields = ['salt', 'iv', 'cipherText'];
    const missing = requiredFields.some((fieldName) => !encryptedPayload[fieldName]);
    if (missing) {
      throw new Error('INVALID_FILE');
    }

    const version = encryptedPayload.formatVersion || encryptedPayload.version;
    if (version && typeof version !== 'string') {
      throw new Error('UNSUPPORTED_VERSION');
    }
  }
}