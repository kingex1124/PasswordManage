import { BasicRsaStrategy } from '../../src/rsa/BasicRsaStrategy.js';
import { RsaContext } from '../../src/rsa/RsaContext.js';

describe('RSA Encryption', () => {
  let rsaStrategy;
  let rsaContext;
  let publicKey;
  let privateKey;

  beforeAll(async () => {
    rsaStrategy = new BasicRsaStrategy();
    rsaContext = new RsaContext(rsaStrategy);
    
    // 產生測試用的金鑰對
    const keys = await RsaContext.generateKeys(2048);
    publicKey = await RsaContext.importPublicKeyFromString(keys.publicKey);
    privateKey = await RsaContext.importPrivateKeyFromString(keys.privateKey);
    
    rsaContext.publicKey = publicKey;
    rsaContext.privateKey = privateKey;
  });

  test('應該能夠產生金鑰對', async () => {
    const keys = await RsaContext.generateKeys(2048);
    expect(keys.publicKey).toBeTruthy();
    expect(keys.privateKey).toBeTruthy();
    expect(typeof keys.publicKey).toBe('string');
    expect(typeof keys.privateKey).toBe('string');
  });

  test('應該能夠加密和解密明文', async () => {
    const plainText = 'Hello RSA!';
    
    const encrypted = await rsaStrategy.encrypt(plainText, publicKey);
    expect(encrypted).toBeInstanceOf(Uint8Array);
    expect(encrypted.length).toBeGreaterThan(0);
    
    const decrypted = await rsaStrategy.decrypt(encrypted, privateKey);
    expect(decrypted).toBe(plainText);
  });

  test('應該能夠加密成 Base64 並解密', async () => {
    const plainText = 'RSA Test 測試';
    
    const encryptedBase64 = await rsaStrategy.encryptToBase64(plainText, publicKey);
    expect(typeof encryptedBase64).toBe('string');
    expect(encryptedBase64.length).toBeGreaterThan(0);
    
    const decrypted = await rsaStrategy.decryptFromBase64(encryptedBase64, privateKey);
    expect(decrypted).toBe(plainText);
  });

  test('RsaContext 應該能夠加密和解密', async () => {
    const plainText = 'Context RSA test';
    
    const encryptResult = await rsaContext.encryptToBase64(plainText);
    expect(encryptResult.success).toBe(true);
    expect(encryptResult.data).toBeTruthy();
    
    const decryptResult = await rsaContext.decryptFromBase64(encryptResult.data);
    expect(decryptResult.success).toBe(true);
    expect(decryptResult.data).toBe(plainText);
  });

  test('應該能夠從字串匯入公鑰', async () => {
    const keys = await RsaContext.generateKeys(2048);
    const importedPublicKey = await RsaContext.importPublicKeyFromString(keys.publicKey);
    expect(importedPublicKey).toBeTruthy();
    expect(importedPublicKey.type).toBe('public');
  });

  test('應該能夠從字串匯入私鑰', async () => {
    const keys = await RsaContext.generateKeys(2048);
    const importedPrivateKey = await RsaContext.importPrivateKeyFromString(keys.privateKey);
    expect(importedPrivateKey).toBeTruthy();
    expect(importedPrivateKey.type).toBe('private');
  });

  test('空字串應該返回失敗', async () => {
    const result = await rsaContext.encryptToBase64('');
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
  });

  test('應該能加密特殊字符', async () => {
    const specialText = '特殊字符 @#$% 🚀';
    
    const encrypted = await rsaStrategy.encryptToBase64(specialText, publicKey);
    const decrypted = await rsaStrategy.decryptFromBase64(encrypted, privateKey);
    
    expect(decrypted).toBe(specialText);
  });

  test('每次加密相同明文應該產生不同密文 (因為 OAEP padding)', async () => {
    const plainText = 'Same text';
    
    const encrypted1 = await rsaStrategy.encryptToBase64(plainText, publicKey);
    const encrypted2 = await rsaStrategy.encryptToBase64(plainText, publicKey);
    
    // RSA-OAEP 使用隨機 padding，所以每次結果應該不同
    expect(encrypted1).not.toBe(encrypted2);
    
    // 但都應該能解密成相同明文
    const decrypted1 = await rsaStrategy.decryptFromBase64(encrypted1, privateKey);
    const decrypted2 = await rsaStrategy.decryptFromBase64(encrypted2, privateKey);
    expect(decrypted1).toBe(plainText);
    expect(decrypted2).toBe(plainText);
  });
});
