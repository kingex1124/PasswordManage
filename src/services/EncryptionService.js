import { CryptoInitializer, Pbkdf2Strategy } from '../../crypto-js-lib/src/index.js';
import { base64ToBytes } from '../utils.js';

const LEGACY_ITERATIONS = 100000;
const DEFAULT_KDF_PARAMS = {
  iterations: 600000,
  keyLengthBytes: 32,
  saltLengthBytes: 16,
};
const KDF_BOUNDS = {
  minIterations: 100000,
  maxIterations: 2000000,
  minSaltLengthBytes: 16,
  maxSaltLengthBytes: 32,
};
const SUPPORTED_KEY_LENGTHS = new Set([16, 24, 32]);
const CURRENT_FORMAT_VERSION = '3.0.0';
const CIPHER_AES_256_GCM = 'AES-256-GCM';
const CIPHER_AES_256_CBC = 'AES-256-CBC';

export class EncryptionService {
  constructor(options = {}) {
    this.kdfStrategy = new Pbkdf2Strategy();
    this.kdfDefaults = this.resolveKdfDefaults(options.kdfDefaults);
  }

  async encryptRecords(plainData, archivePassword, options = {}) {
    const plainText = JSON.stringify(plainData);
    const kdfParams = this.resolveKdfParamsForEncrypt(options.kdfParams);
    const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(kdfParams.saltLengthBytes);

    const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
      archivePassword,
      bytesSalt,
      this.kdfStrategy,
      kdfParams.iterations,
      kdfParams.keyLengthBytes,
    );

    const encrypted = await this.encryptWithAesGcm(plainText, derivedKey);

    return {
      formatVersion: CURRENT_FORMAT_VERSION,
      algorithm: {
        kdf: 'PBKDF2',
        iterations: kdfParams.iterations,
        keyLengthBytes: kdfParams.keyLengthBytes,
        kdfParams,
        hash: 'SHA-256',
        cipher: CIPHER_AES_256_GCM,
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

  async decryptFilePayload(encryptedPayload, archivePassword, options = {}) {
    this.validateEncryptedPayload(encryptedPayload);
    const allowLegacyCbc = options?.allowLegacyCbc === true;

    const bytesSalt = base64ToBytes(encryptedPayload.salt);
    const iterations = this.resolveIterations(encryptedPayload);
    const keyLengthBytes = this.resolveKeyLengthBytes(encryptedPayload);
    const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
      archivePassword,
      bytesSalt,
      this.kdfStrategy,
      iterations,
      keyLengthBytes,
    );

    const cipherName = this.resolveCipherName(encryptedPayload);

    let plainText;
    if (cipherName === CIPHER_AES_256_GCM) {
      plainText = await this.decryptWithAesGcm(encryptedPayload, derivedKey);
    } else if (cipherName === CIPHER_AES_256_CBC) {
      if (!allowLegacyCbc) {
        throw new Error('LEGACY_CIPHER_DISABLED');
      }
      plainText = await this.decryptWithAesCbc(encryptedPayload, derivedKey);
    } else {
      throw new Error('UNSUPPORTED_VERSION');
    }

    const plainData = JSON.parse(plainText);
    return plainData;
  }

  async decryptLegacyFilePayload(encryptedPayload, archivePassword) {
    return this.decryptFilePayload(encryptedPayload, archivePassword, {
      allowLegacyCbc: true,
    });
  }

  resolveIterations(encryptedPayload) {
    const candidate = Number(
      encryptedPayload?.algorithm?.kdfParams?.iterations
      ?? encryptedPayload?.algorithm?.iterations,
    );
    if (!Number.isFinite(candidate) || candidate <= 0) {
      const version = String(encryptedPayload?.formatVersion || encryptedPayload?.version || '');
      if (version.startsWith('1.') || version.startsWith('2.')) {
        return LEGACY_ITERATIONS;
      }
      return this.kdfDefaults.iterations;
    }

    const normalized = Math.floor(candidate);
    if (normalized < KDF_BOUNDS.minIterations || normalized > KDF_BOUNDS.maxIterations) {
      throw new Error('UNSUPPORTED_KDF_PARAMS');
    }
    return normalized;
  }

  resolveKeyLengthBytes(encryptedPayload) {
    const candidate = Number(
      encryptedPayload?.algorithm?.kdfParams?.keyLengthBytes
      ?? encryptedPayload?.algorithm?.keyLengthBytes,
    );
    if (!Number.isFinite(candidate) || candidate <= 0) {
      return this.kdfDefaults.keyLengthBytes;
    }

    const normalized = Math.floor(candidate);
    if (!SUPPORTED_KEY_LENGTHS.has(normalized)) {
      throw new Error('UNSUPPORTED_KDF_PARAMS');
    }
    return normalized;
  }

  resolveKdfDefaults(input = {}) {
    const iterations = this.normalizeInteger(
      input?.iterations,
      DEFAULT_KDF_PARAMS.iterations,
      KDF_BOUNDS.minIterations,
      KDF_BOUNDS.maxIterations,
    );

    const keyLengthBytes = this.normalizeKeyLength(
      input?.keyLengthBytes,
      DEFAULT_KDF_PARAMS.keyLengthBytes,
    );

    const saltLengthBytes = this.normalizeInteger(
      input?.saltLengthBytes,
      DEFAULT_KDF_PARAMS.saltLengthBytes,
      KDF_BOUNDS.minSaltLengthBytes,
      KDF_BOUNDS.maxSaltLengthBytes,
    );

    return {
      iterations,
      keyLengthBytes,
      saltLengthBytes,
    };
  }

  resolveKdfParamsForEncrypt(input = {}) {
    return {
      iterations: this.normalizeInteger(
        input?.iterations,
        this.kdfDefaults.iterations,
        KDF_BOUNDS.minIterations,
        KDF_BOUNDS.maxIterations,
      ),
      keyLengthBytes: this.normalizeKeyLength(
        input?.keyLengthBytes,
        this.kdfDefaults.keyLengthBytes,
      ),
      saltLengthBytes: this.normalizeInteger(
        input?.saltLengthBytes,
        this.kdfDefaults.saltLengthBytes,
        KDF_BOUNDS.minSaltLengthBytes,
        KDF_BOUNDS.maxSaltLengthBytes,
      ),
    };
  }

  normalizeInteger(value, fallback, min, max) {
    if (value === undefined || value === null) {
      return fallback;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw new Error('UNSUPPORTED_KDF_PARAMS');
    }

    const normalized = Math.floor(numeric);
    if (normalized < min || normalized > max) {
      throw new Error('UNSUPPORTED_KDF_PARAMS');
    }

    return normalized;
  }

  normalizeKeyLength(value, fallback) {
    if (value === undefined || value === null) {
      return fallback;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw new Error('UNSUPPORTED_KDF_PARAMS');
    }

    const normalized = Math.floor(numeric);
    if (!SUPPORTED_KEY_LENGTHS.has(normalized)) {
      throw new Error('UNSUPPORTED_KDF_PARAMS');
    }

    return normalized;
  }

  resolveCipherName(encryptedPayload) {
    const cipherName = String(encryptedPayload?.algorithm?.cipher || '').toUpperCase();
    if (cipherName === CIPHER_AES_256_GCM) {
      return CIPHER_AES_256_GCM;
    }
    if (cipherName === CIPHER_AES_256_CBC) {
      return CIPHER_AES_256_CBC;
    }

    const version = String(encryptedPayload?.formatVersion || encryptedPayload?.version || '');
    if (version.startsWith('2.') || version.startsWith('3.')) {
      return CIPHER_AES_256_GCM;
    }
    if (version.startsWith('1.')) {
      return CIPHER_AES_256_CBC;
    }
    return CIPHER_AES_256_GCM;
  }

  async encryptWithAesGcm(plainText, derivedKey) {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        derivedKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt'],
      );

      const encoder = new TextEncoder();
      const plainBytes = encoder.encode(plainText);
      const cipherBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        cryptoKey,
        plainBytes,
      );

      return {
        iv: this.bytesToBase64(iv),
        cipherText: this.bytesToBase64(new Uint8Array(cipherBuffer)),
      };
    } catch {
      throw new Error('ENCRYPT_FAILED');
    }
  }

  async decryptWithAesGcm(encryptedPayload, derivedKey) {
    try {
      const iv = base64ToBytes(encryptedPayload.iv);
      const cipherBytes = base64ToBytes(encryptedPayload.cipherText);
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        derivedKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt'],
      );

      const plainBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        cryptoKey,
        cipherBytes,
      );

      const decoder = new TextDecoder();
      return decoder.decode(plainBuffer);
    } catch {
      throw new Error('DECRYPT_FAILED');
    }
  }

  async decryptWithAesCbc(encryptedPayload, derivedKey) {
    const aesContext = CryptoInitializer.getAesContextForDecryptByRandomIV(encryptedPayload.iv);
    aesContext.key = derivedKey;
    const decrypted = await aesContext.decryptFromBase64(encryptedPayload.cipherText);
    if (!decrypted.success || typeof decrypted.data !== 'string') {
      throw new Error('DECRYPT_FAILED');
    }
    return decrypted.data;
  }

  bytesToBase64(bytes) {
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }
    return btoa(binary);
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