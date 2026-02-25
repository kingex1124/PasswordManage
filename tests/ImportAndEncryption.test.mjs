import test from 'node:test';
import assert from 'node:assert/strict';
import { ImportService } from '../src/services/ImportService.js';
import { EncryptionService } from '../src/services/EncryptionService.js';
import { CryptoInitializer, Pbkdf2Strategy } from '../crypto-js-lib/src/index.js';

test('ImportService should enforce cooldown window', () => {
  const service = new ImportService();
  service.registerFailureCooldown(1);
  assert.throws(() => service.ensureCanRetry(), /RETRY_LATER/);
  service.clearCooldown();
  assert.doesNotThrow(() => service.ensureCanRetry());
});

test('EncryptionService should encrypt and decrypt records', async () => {
  const service = new EncryptionService();
  const plainData = {
    version: '1.1.0',
    records: [
      {
        id: 'r1',
        category: '信箱',
        type: 'Yahoo',
        account: 'user',
        passwordHistory: [{ id: 'p1', password: '密碼123', changedAt: '2024-02-24T03:00:00.000Z' }],
        note: '備註',
        createdAt: '2024-02-24T02:00:00.000Z',
        updatedAt: '2024-02-24T03:00:00.000Z',
      },
    ],
  };

  const encrypted = await service.encryptRecords(plainData, 'archive-pass');
  assert.equal(typeof encrypted.cipherText, 'string');
  assert.equal(typeof encrypted.salt, 'string');
  assert.equal(typeof encrypted.iv, 'string');
  assert.equal(encrypted.algorithm.cipher, 'AES-256-GCM');

  const decrypted = await service.decryptFilePayload(encrypted, 'archive-pass');
  assert.deepEqual(decrypted, plainData);
});

test('EncryptionService should decrypt legacy AES-CBC payload', async () => {
  const service = new EncryptionService();
  const plainData = {
    version: '1.1.0',
    records: [
      {
        id: 'r-legacy',
        category: '舊版',
        type: '測試',
        account: 'legacy-user',
        passwordHistory: [{ id: 'h-legacy', password: 'legacy-pass', changedAt: '2024-02-24T03:00:00.000Z' }],
        note: 'legacy',
        createdAt: '2024-02-24T02:00:00.000Z',
        updatedAt: '2024-02-24T03:00:00.000Z',
      },
    ],
  };

  const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);
  const kdf = new Pbkdf2Strategy();
  const derivedKey = await CryptoInitializer.deriveKeyFromPassword('archive-pass', bytesSalt, kdf, 100000, 32);

  const aesContext = CryptoInitializer.getAesContextForEncryptByRandomIV();
  aesContext.key = derivedKey;
  const encrypted = await aesContext.encryptWithIVToBase64(JSON.stringify(plainData));

  const legacyPayload = {
    formatVersion: '1.1.0',
    algorithm: {
      kdf: 'PBKDF2',
      iterations: 100000,
      keyLengthBytes: 32,
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

  const decrypted = await service.decryptFilePayload(legacyPayload, 'archive-pass');
  assert.deepEqual(decrypted, plainData);
});