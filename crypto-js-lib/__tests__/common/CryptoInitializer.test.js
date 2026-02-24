import { CryptoInitializer } from '../../src/common/CryptoInitializer.js';
import { Pbkdf2Strategy } from '../../src/kdf/Pbkdf2Strategy.js';

describe('CryptoInitializer', () => {
  describe('AES 功能', () => {
    test('應該能夠初始化 AES 設定並加解密', async () => {
      await CryptoInitializer.initAesSetting('myKey123', 'myIV456');
      
      const plainText = 'Test message';
      const aesContext = CryptoInitializer.getAesContextForEncrypt();
      
      const encryptResult = await aesContext.encryptToBase64(plainText);
      expect(encryptResult.success).toBe(true);
      
      const decryptContext = CryptoInitializer.getAesContextForDecrypt();
      const decryptResult = await decryptContext.decryptFromBase64(encryptResult.data);
      
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(plainText);
    });

    test('應該能夠使用隨機 IV 加解密', async () => {
      await CryptoInitializer.initAesSetting('myKey123');
      
      const plainText = 'Random IV test';
      const aesContext = CryptoInitializer.getAesContextForEncryptByRandomIV();
      
      const encryptResult = await aesContext.encryptWithIVToBase64(plainText);
      expect(encryptResult.success).toBe(true);
      expect(encryptResult.iv).toBeTruthy();
      
      const decryptContext = CryptoInitializer.getAesContextForDecryptByRandomIV(encryptResult.iv);
      const decryptResult = await decryptContext.decryptFromBase64(encryptResult.cipherText);
      
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(plainText);
    });

    test('應該能夠直接加密 (不預先初始化)', async () => {
      const plainText = 'Direct encryption';
      const aesContext = await CryptoInitializer.getAesContextForEncryptDirect('directKey', 'directIV');
      
      const encryptResult = await aesContext.encryptToBase64(plainText);
      expect(encryptResult.success).toBe(true);
    });
  });

  describe('RSA 功能', () => {
    test('應該能夠產生 RSA 金鑰對', async () => {
      const keys = await CryptoInitializer.rsaGenerateKeys(2048);
      
      expect(keys.publicKey).toBeTruthy();
      expect(keys.privateKey).toBeTruthy();
      expect(typeof keys.publicKey).toBe('string');
      expect(typeof keys.privateKey).toBe('string');
    });

    test('應該能夠初始化 RSA 設定並加解密', async () => {
      const keys = await CryptoInitializer.rsaGenerateKeys(2048);
      await CryptoInitializer.initRsaSetting(keys.publicKey, keys.privateKey);
      
      const plainText = 'RSA test message';
      const rsaContext = CryptoInitializer.getRsaContext();
      
      const encryptResult = await rsaContext.encryptToBase64(plainText);
      expect(encryptResult.success).toBe(true);
      
      const decryptResult = await rsaContext.decryptFromBase64(encryptResult.data);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(plainText);
    });

    test('應該能夠直接使用 RSA (不預先初始化)', async () => {
      const keys = await CryptoInitializer.rsaGenerateKeys(2048);
      const rsaContext = await CryptoInitializer.getRsaContextDirect(keys.publicKey, keys.privateKey);
      
      const plainText = 'Direct RSA';
      const encryptResult = await rsaContext.encryptToBase64(plainText);
      expect(encryptResult.success).toBe(true);
      
      const decryptResult = await rsaContext.decryptFromBase64(encryptResult.data);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(plainText);
    });
  });

  describe('SHA 哈希功能', () => {
    test('應該能夠產生 SHA-256 哈希', async () => {
      const sha256Context = CryptoInitializer.getSha256HashContext();
      const result = await sha256Context.encryptToBase64('Test hash');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
    });

    test('應該能夠產生 SHA-512 哈希', async () => {
      const sha512Context = CryptoInitializer.getSha512HashContext();
      const result = await sha512Context.encryptToBase64('Test hash');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
    });
  });

  describe('KDF 功能', () => {
    test('應該能夠產生隨機鹽', () => {
      const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);
      
      expect(typeof base64Salt).toBe('string');
      expect(base64Salt.length).toBeGreaterThan(0);
      expect(bytesSalt).toBeInstanceOf(Uint8Array);
      expect(bytesSalt.length).toBe(16);
    });

    test('應該能夠從密碼派生密鑰', async () => {
      const password = 'myPassword';
      const { bytesSalt } = CryptoInitializer.generateSalt(16);
      const pbkdf2 = new Pbkdf2Strategy();
      
      const derivedKey = await CryptoInitializer.deriveKeyFromPassword(password, bytesSalt, pbkdf2, 1000, 32);
      
      expect(derivedKey).toBeInstanceOf(Uint8Array);
      expect(derivedKey.length).toBe(32);
    }, 10000);

    test('應該能夠派生 Base64 密鑰', async () => {
      const password = 'testPassword';
      const { bytesSalt } = CryptoInitializer.generateSalt(16);
      const pbkdf2 = new Pbkdf2Strategy();
      
      const derivedKeyBase64 = await CryptoInitializer.deriveKeyFromPasswordToBase64(password, bytesSalt, pbkdf2, 1000, 32);
      
      expect(typeof derivedKeyBase64).toBe('string');
      expect(derivedKeyBase64.length).toBeGreaterThan(0);
    }, 10000);

    test('應該能夠驗證派生密鑰', async () => {
      const password = 'verifyPassword';
      const { bytesSalt } = CryptoInitializer.generateSalt(16);
      const pbkdf2 = new Pbkdf2Strategy();
      
      const derivedKey = await CryptoInitializer.deriveKeyFromPassword(password, bytesSalt, pbkdf2, 1000, 32);
      const isValid = await CryptoInitializer.verifyDerivedKey(password, bytesSalt, derivedKey, pbkdf2, 1000);
      
      expect(isValid).toBe(true);
    }, 10000);

    test('錯誤的密碼應該驗證失敗', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const { bytesSalt } = CryptoInitializer.generateSalt(16);
      const pbkdf2 = new Pbkdf2Strategy();
      
      const derivedKey = await CryptoInitializer.deriveKeyFromPassword(password, bytesSalt, pbkdf2, 1000, 32);
      const isValid = await CryptoInitializer.verifyDerivedKey(wrongPassword, bytesSalt, derivedKey, pbkdf2, 1000);
      
      expect(isValid).toBe(false);
    }, 10000);
  });

  describe('整合測試：KDF + AES', () => {
    test('應該能夠使用 KDF 派生的密鑰進行 AES 加密', async () => {
      const password = 'userPassword123';
      const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);
      const pbkdf2 = new Pbkdf2Strategy();
      
      // 從密碼派生密鑰
      const derivedKey = await CryptoInitializer.deriveKeyFromPassword(password, bytesSalt, pbkdf2, 1000, 32);
      
      // 使用派生的密鑰進行 AES 加密
      const aesContext = CryptoInitializer.getAesContextForEncryptByRandomIV();
      aesContext.key = derivedKey;
      
      const plainText = 'Secret message';
      const encryptResult = await aesContext.encryptWithIVToBase64(plainText);
      
      expect(encryptResult.success).toBe(true);
      expect(encryptResult.cipherText).toBeTruthy();
      expect(encryptResult.iv).toBeTruthy();
      
      // 解密
      const decryptContext = CryptoInitializer.getAesContextForDecryptByRandomIV(encryptResult.iv);
      decryptContext.key = derivedKey;
      
      const decryptResult = await decryptContext.decryptFromBase64(encryptResult.cipherText);
      
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(plainText);
    }, 10000);
  });
});
