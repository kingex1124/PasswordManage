import { BasicAesStrategy } from '../../src/aes/BasicAesStrategy.js';
import { AesContext } from '../../src/aes/AesContext.js';

describe('AES Encryption', () => {
  let aesStrategy;
  let aesContext;
  let key;
  let iv;

  beforeEach(() => {
    aesStrategy = new BasicAesStrategy();
    aesContext = new AesContext(aesStrategy);
    
    // 32 bytes key for AES-256
    key = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      key[i] = i;
    }
    
    // 16 bytes IV
    iv = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      iv[i] = i;
    }
    
    aesContext.key = key;
    aesContext.iv = iv;
  });

  test('應該能夠加密和解密明文', async () => {
    const plainText = 'Hello, World!';
    
    const encrypted = await aesStrategy.encrypt(plainText, key, iv);
    expect(encrypted).toBeInstanceOf(Uint8Array);
    expect(encrypted.length).toBeGreaterThan(0);
    
    const decrypted = await aesStrategy.decrypt(encrypted, key, iv);
    expect(decrypted).toBe(plainText);
  });

  test('應該能夠加密成 Base64 並解密', async () => {
    const plainText = 'Test message 測試訊息';
    
    const encryptedBase64 = await aesStrategy.encryptToBase64(plainText, key, iv);
    expect(typeof encryptedBase64).toBe('string');
    expect(encryptedBase64.length).toBeGreaterThan(0);
    
    const decrypted = await aesStrategy.decryptFromBase64(encryptedBase64, key, iv);
    expect(decrypted).toBe(plainText);
  });

  test('AesContext 應該能夠加密和解密', async () => {
    const plainText = 'Context test';
    
    const encryptResult = await aesContext.encryptToBase64(plainText);
    expect(encryptResult.success).toBe(true);
    expect(encryptResult.data).toBeTruthy();
    
    const decryptResult = await aesContext.decryptFromBase64(encryptResult.data);
    expect(decryptResult.success).toBe(true);
    expect(decryptResult.data).toBe(plainText);
  });

  test('應該能返回加密資料與 IV (Base64)', async () => {
    const plainText = 'Test with IV';
    
    const result = await aesContext.encryptWithIVToBase64(plainText);
    expect(result.success).toBe(true);
    expect(result.cipherText).toBeTruthy();
    expect(result.iv).toBeTruthy();
  });

  test('空字串應該返回失敗', async () => {
    const result = await aesContext.encryptToBase64('');
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
  });

  test('錯誤的密鑰長度應該拋出錯誤', async () => {
    const wrongKey = new Uint8Array(10); // 錯誤的長度
    await expect(aesStrategy.encrypt('test', wrongKey, iv)).rejects.toThrow();
  });

  test('錯誤的 IV 長度應該拋出錯誤', async () => {
    const wrongIv = new Uint8Array(10); // 錯誤的長度
    await expect(aesStrategy.encrypt('test', key, wrongIv)).rejects.toThrow();
  });

  test('應該能加密長文本', async () => {
    const longText = 'A'.repeat(1000);
    
    const encrypted = await aesStrategy.encryptToBase64(longText, key, iv);
    const decrypted = await aesStrategy.decryptFromBase64(encrypted, key, iv);
    
    expect(decrypted).toBe(longText);
  });

  test('應該能加密特殊字符', async () => {
    const specialText = '你好世界! @#$%^&*() 🎉🎊';
    
    const encrypted = await aesStrategy.encryptToBase64(specialText, key, iv);
    const decrypted = await aesStrategy.decryptFromBase64(encrypted, key, iv);
    
    expect(decrypted).toBe(specialText);
  });
});
