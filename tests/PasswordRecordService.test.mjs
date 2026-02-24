import test from 'node:test';
import assert from 'node:assert/strict';
import { PasswordRecordService } from '../src/services/PasswordRecordService.js';

test('saveRecord should create and update record with sorted password history', () => {
  const data = PasswordRecordService.createEmptyData();
  PasswordRecordService.saveRecord(data, {
    id: null,
    category: '信箱',
    type: 'Yahoo平台',
    account: 'alice',
    note: 'note',
    passwordHistory: [
      { password: 'old', changedAt: '2024-02-24T01:00:00.000Z' },
      { password: 'new', changedAt: '2024-02-24T05:00:00.000Z' },
    ],
  });

  assert.equal(data.records.length, 1);
  assert.equal(data.records[0].passwordHistory[0].password, 'new');

  const existingId = data.records[0].id;
  PasswordRecordService.saveRecord(data, {
    id: existingId,
    category: '信箱',
    type: 'Yahoo平台',
    account: 'alice2',
    note: '',
    passwordHistory: [{ password: 'latest', changedAt: '2024-02-24T09:00:00.000Z' }],
  });

  assert.equal(data.records.length, 1);
  assert.equal(data.records[0].account, 'alice2');
  assert.equal(data.records[0].passwordHistory[0].password, 'latest');
});

test('queryRecords should keep filters and apply default sort', () => {
  const data = PasswordRecordService.createEmptyData();
  data.records = [
    {
      id: '1',
      category: '信箱',
      type: 'A平台',
      account: 'bbb',
      passwordHistory: [{ id: 'h1', password: '1', changedAt: '2024-02-24T01:00:00.000Z' }],
      note: '',
      createdAt: '2024-02-24T00:00:00.000Z',
      updatedAt: '2024-02-24T01:00:00.000Z',
    },
    {
      id: '2',
      category: '信箱',
      type: 'A平台',
      account: 'aaa',
      passwordHistory: [{ id: 'h2', password: '2', changedAt: '2024-02-24T03:00:00.000Z' }],
      note: '',
      createdAt: '2024-02-24T00:00:00.000Z',
      updatedAt: '2024-02-24T03:00:00.000Z',
    },
    {
      id: '3',
      category: '購物',
      type: 'B平台',
      account: 'ccc',
      passwordHistory: [{ id: 'h3', password: '3', changedAt: '2024-02-24T02:00:00.000Z' }],
      note: '',
      createdAt: '2024-02-24T00:00:00.000Z',
      updatedAt: '2024-02-24T02:00:00.000Z',
    },
  ];

  const result = PasswordRecordService.queryRecords(data, {
    categories: ['信箱'],
    types: ['A平台'],
    keyword: 'a',
    sortMode: 'default',
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, '2');
});

test('deleteRecord should remove specific record', () => {
  const data = PasswordRecordService.createEmptyData();
  data.records = [
    { id: 'a', category: '', type: '', account: '', passwordHistory: [], note: '', createdAt: '', updatedAt: '' },
    { id: 'b', category: '', type: '', account: '', passwordHistory: [], note: '', createdAt: '', updatedAt: '' },
  ];

  PasswordRecordService.deleteRecord(data, 'a');
  assert.equal(data.records.length, 1);
  assert.equal(data.records[0].id, 'b');
});

test('master items should support add edit delete and sequence sorting', () => {
  const data = PasswordRecordService.createEmptyData();

  PasswordRecordService.saveMasterItem(data, 'category', { name: '信箱' });
  PasswordRecordService.saveMasterItem(data, 'category', { name: '購物' });
  PasswordRecordService.saveMasterItem(data, 'category', { name: '論壇', seq: 10 });
  PasswordRecordService.saveMasterItem(data, 'category', { name: '影音' });

  assert.equal(data.categories[0].seq, 1);
  assert.equal(data.categories[1].seq, 2);
  assert.equal(data.categories[2].seq, 10);
  assert.equal(data.categories[3].seq, 11);

  data.categories = PasswordRecordService.sortMasterItems(data.categories);
  assert.equal(data.categories.length, 4);

  const firstId = data.categories[0].id;
  PasswordRecordService.saveMasterItem(data, 'category', { id: firstId, name: '電子郵件' });
  assert.equal(data.categories[0].name, '電子郵件');
  assert.equal(data.categories[0].seq, 1);

  PasswordRecordService.deleteMasterItem(data, 'category', data.categories[1].id);
  assert.equal(data.categories.length, 3);
  assert.equal(data.categories.some((item) => item.name === '購物'), false);
});