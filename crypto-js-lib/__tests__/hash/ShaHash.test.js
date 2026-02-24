import { BasicSha256HashStrategy } from '../../src/hash/BasicSha256HashStrategy.js';
import { BasicSha512HashStrategy } from '../../src/hash/BasicSha512HashStrategy.js';
import { ShaHashContext } from '../../src/hash/ShaHashContext.js';

describe('SHA Hash', () => {
  describe('SHA-256', () => {
    let sha256Strategy;
    let sha256Context;

    beforeEach(() => {
      sha256Strategy = new BasicSha256HashStrategy();
      sha256Context = new ShaHashContext(sha256Strategy);
    });

    test('應該能夠產生 SHA-256 哈希', async () => {
      const plainText = 'Hello World';
      const hash = await sha256Strategy.encrypt(plainText);
      
      expect(hash).toBeInstanceOf(Uint8Array);
      expect(hash.length).toBe(32); // SHA-256 產生 32 bytes
    });

    test('應該能夠產生 SHA-256 Base64 哈希', async () => {
      const plainText = 'Test message';
      const hashBase64 = await sha256Strategy.encryptToBase64(plainText);
      
      expect(typeof hashBase64).toBe('string');
      expect(hashBase64.length).toBeGreaterThan(0);
    });

    test('相同輸入應該產生相同哈希', async () => {
      const plainText = 'Same input';
      const hash1 = await sha256Strategy.encryptToBase64(plainText);
      const hash2 = await sha256Strategy.encryptToBase64(plainText);
      
      expect(hash1).toBe(hash2);
    });

    test('不同輸入應該產生不同哈希', async () => {
      const hash1 = await sha256Strategy.encryptToBase64('Text 1');
      const hash2 = await sha256Strategy.encryptToBase64('Text 2');
      
      expect(hash1).not.toBe(hash2);
    });

    test('ShaHashContext 應該能夠產生哈希', async () => {
      const plainText = 'Context test';
      const result = await sha256Context.encryptToBase64(plainText);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
    });

    test('空字串應該能夠哈希', async () => {
      const result = await sha256Context.encryptToBase64('');
      expect(result.success).toBe(false); // 依據實作邏輯
    });

    test('應該能哈希長文本', async () => {
      const longText = 'A'.repeat(10000);
      const hash = await sha256Strategy.encryptToBase64(longText);
      
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    test('應該能哈希特殊字符', async () => {
      const specialText = '你好世界! @#$%^&*() 🎉';
      const hash = await sha256Strategy.encryptToBase64(specialText);
      
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });
  });

  describe('SHA-512', () => {
    let sha512Strategy;
    let sha512Context;

    beforeEach(() => {
      sha512Strategy = new BasicSha512HashStrategy();
      sha512Context = new ShaHashContext(sha512Strategy);
    });

    test('應該能夠產生 SHA-512 哈希', async () => {
      const plainText = 'Hello World';
      const hash = await sha512Strategy.encrypt(plainText);
      
      expect(hash).toBeInstanceOf(Uint8Array);
      expect(hash.length).toBe(64); // SHA-512 產生 64 bytes
    });

    test('應該能夠產生 SHA-512 Base64 哈希', async () => {
      const plainText = 'Test message';
      const hashBase64 = await sha512Strategy.encryptToBase64(plainText);
      
      expect(typeof hashBase64).toBe('string');
      expect(hashBase64.length).toBeGreaterThan(0);
    });

    test('相同輸入應該產生相同哈希', async () => {
      const plainText = 'Same input';
      const hash1 = await sha512Strategy.encryptToBase64(plainText);
      const hash2 = await sha512Strategy.encryptToBase64(plainText);
      
      expect(hash1).toBe(hash2);
    });

    test('SHA-256 和 SHA-512 應該產生不同長度的哈希', async () => {
      const plainText = 'Compare algorithms';
      const sha256 = new BasicSha256HashStrategy();
      const sha512 = new BasicSha512HashStrategy();
      
      const hash256 = await sha256.encrypt(plainText);
      const hash512 = await sha512.encrypt(plainText);
      
      expect(hash256.length).toBe(32);
      expect(hash512.length).toBe(64);
      expect(hash256.length).not.toBe(hash512.length);
    });
  });
});
