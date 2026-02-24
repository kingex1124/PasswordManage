import test from 'node:test';
import assert from 'node:assert/strict';
import { ImportService } from '../src/services/ImportService.js';
import { EncryptionService } from '../src/services/EncryptionService.js';

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

  const decrypted = await service.decryptFilePayload(encrypted, 'archive-pass');
  assert.deepEqual(decrypted, plainData);
});