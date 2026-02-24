import { Pbkdf2Strategy } from '../../src/kdf/Pbkdf2Strategy.js';
import { KdfContext } from '../../src/kdf/KdfContext.js';

describe('KDF (Key Derivation Function)', () => {
  describe('PBKDF2', () => {
    let pbkdf2Strategy;
    let kdfContext;

    beforeEach(() => {
      pbkdf2Strategy = new Pbkdf2Strategy();
      kdfContext = new KdfContext(pbkdf2Strategy);
    });

    test('應該能夠從密碼派生密鑰', async () => {
      const password = 'mySecurePassword';
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);
      
      const derivedKey = await pbkdf2Strategy.deriveKey(password, salt, 1000, 32);
      
      expect(derivedKey).toBeInstanceOf(Uint8Array);
      expect(derivedKey.length).toBe(32);
    });

    test('應該能夠派生 Base64 格式的密鑰', async () => {
      const password = 'testPassword';
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);
      
      const derivedKeyBase64 = await pbkdf2Strategy.deriveKeyToBase64(password, salt, 1000, 32);
      
      expect(typeof derivedKeyBase64).toBe('string');
      expect(derivedKeyBase64.length).toBeGreaterThan(0);
    });

    test('相同密碼和鹽應該產生相同密鑰', async () => {
      const password = 'samePassword';
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const iterations = 1000;
      
      const key1 = await pbkdf2Strategy.deriveKeyToBase64(password, salt, iterations, 32);
      const key2 = await pbkdf2Strategy.deriveKeyToBase64(password, salt, iterations, 32);
      
      expect(key1).toBe(key2);
    });

    test('不同鹽應該產生不同密鑰', async () => {
      const password = 'password123';
      const salt1 = new Uint8Array(16);
      const salt2 = new Uint8Array(16);
      crypto.getRandomValues(salt1);
      crypto.getRandomValues(salt2);
      
      const key1 = await pbkdf2Strategy.deriveKeyToBase64(password, salt1, 1000, 32);
      const key2 = await pbkdf2Strategy.deriveKeyToBase64(password, salt2, 1000, 32);
      
      expect(key1).not.toBe(key2);
    });

    test('KdfContext 應該能夠派生密鑰', async () => {
      const password = 'contextPassword';
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);
      
      const derivedKey = await kdfContext.deriveKey(password, salt, 1000, 32);
      
      expect(derivedKey).toBeInstanceOf(Uint8Array);
      expect(derivedKey.length).toBe(32);
    });

    test('應該能夠使用不同的密鑰長度', async () => {
      const password = 'password';
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);
      
      const key16 = await pbkdf2Strategy.deriveKey(password, salt, 1000, 16);
      const key32 = await pbkdf2Strategy.deriveKey(password, salt, 1000, 32);
      const key64 = await pbkdf2Strategy.deriveKey(password, salt, 1000, 64);
      
      expect(key16.length).toBe(16);
      expect(key32.length).toBe(32);
      expect(key64.length).toBe(64);
    });
  });
});
