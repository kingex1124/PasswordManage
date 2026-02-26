import { generateId, nowIsoString, sortByChangedAtDesc } from '../utils.js';

export class PasswordRecordService {
  static createEmptyData() {
    return {
      version: '1.2.0',
      archivePasswordCreatedAt: null,
      categories: [],
      types: [],
      records: [],
    };
  }

  static normalizeImportedPlainData(plainData) {
    const rawRecords = Array.isArray(plainData) ? plainData : plainData?.records;
    if (!Array.isArray(rawRecords)) {
      throw new Error('UNSUPPORTED_VERSION');
    }

    const records = rawRecords.map((rawRecord) => {
      const id = rawRecord.id || generateId();
      const category = String(rawRecord.category ?? '').trim();
      const type = String(rawRecord.type ?? '').trim();
      const account = String(rawRecord.account ?? '').trim();
      const note = String(rawRecord.note ?? '');

      const rawHistory = Array.isArray(rawRecord.passwordHistory)
        ? rawRecord.passwordHistory
        : rawRecord.password
          ? [{ password: rawRecord.password, changedAt: rawRecord.updatedAt || rawRecord.createdAt || nowIsoString() }]
          : [];

      const passwordHistory = sortByChangedAtDesc(
        rawHistory
          .map((item) => ({
            id: item.id || generateId(),
            password: String(item.password ?? ''),
            changedAt: PasswordRecordService.normalizeDate(item.changedAt) || nowIsoString(),
          }))
          .filter((item) => item.password.length > 0),
      );

      return {
        id,
        category,
        type,
        account,
        passwordHistory,
        note,
        createdAt: PasswordRecordService.normalizeDate(rawRecord.createdAt) || nowIsoString(),
        updatedAt: PasswordRecordService.normalizeDate(rawRecord.updatedAt) || PasswordRecordService.getLatestUpdatedAt(passwordHistory),
      };
    });

    const normalizedCategories = PasswordRecordService.normalizeCategoryItems(
      plainData?.categories,
      records.map((record) => record.category).filter((value) => value),
    );

    const normalizedTypes = PasswordRecordService.normalizeTypeItems(
      plainData?.types,
      normalizedCategories,
      records,
    );

    return {
      version: '1.2.0',
      archivePasswordCreatedAt:
        PasswordRecordService.normalizeDate(plainData?.archivePasswordCreatedAt) || null,
      categories: normalizedCategories,
      types: normalizedTypes,
      records,
    };
  }

  static normalizeCategoryItems(rawItems, fallbackNames) {
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const normalized = rawItems
        .map((item, index) => {
          if (typeof item === 'string') {
            return {
              id: generateId(),
              name: item.trim(),
              seq: index + 1,
            };
          }

          const name = String(item?.name ?? '').trim();
          const seqValue = Number(item?.seq);
          return {
            id: item?.id || generateId(),
            name,
            seq: Number.isFinite(seqValue) ? seqValue : (index + 1),
          };
        })
        .filter((item) => item.name);

      return PasswordRecordService.sortMasterItems(
        PasswordRecordService.deduplicateMasterByName(normalized),
      );
    }

    const fallback = [...new Set(fallbackNames)]
      .map((name, index) => ({
        id: generateId(),
        name,
        seq: index + 1,
      }));

    return PasswordRecordService.sortMasterItems(fallback);
  }

  static normalizeTypeItems(rawItems, categories, records) {
    const recordsCategoryMap = new Map();
    records.forEach((record) => {
      if (!record.type || !record.category || recordsCategoryMap.has(record.type)) {
        return;
      }
      recordsCategoryMap.set(record.type, record.category);
    });

    const categoryByName = new Map(categories.map((category) => [category.name, category]));

    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const normalized = rawItems
        .map((item, index) => {
          if (typeof item === 'string') {
            const matchedCategoryName = recordsCategoryMap.get(item.trim()) || '';
            const matchedCategory = categoryByName.get(matchedCategoryName);
            return {
              id: generateId(),
              name: item.trim(),
              seq: index + 1,
              categoryId: matchedCategory?.id || null,
            };
          }

          const name = String(item?.name ?? '').trim();
          const seqValue = Number(item?.seq);
          const categoryIdByName = categoryByName.get(String(item?.categoryName ?? item?.category ?? '').trim())?.id || null;

          return {
            id: item?.id || generateId(),
            name,
            seq: Number.isFinite(seqValue) ? seqValue : (index + 1),
            categoryId: item?.categoryId || categoryIdByName,
          };
        })
        .filter((item) => item.name);

      return PasswordRecordService.sortTypeItems(
        PasswordRecordService.deduplicateTypeItems(normalized),
        categories,
      );
    }

    const seenKey = new Set();
    const fallback = [];
    records.forEach((record) => {
      if (!record.type) {
        return;
      }

      const category = categoryByName.get(record.category || '');
      const key = `${category?.id || ''}::${record.type}`;
      if (seenKey.has(key)) {
        return;
      }
      seenKey.add(key);

      fallback.push({
        id: generateId(),
        name: record.type,
        seq: PasswordRecordService.getNextMasterSeq(fallback, category?.id || null),
        categoryId: category?.id || null,
      });
    });

    return PasswordRecordService.sortTypeItems(fallback, categories);
  }

  static deduplicateMasterByName(items) {
    const nameSet = new Set();
    const deduplicated = [];
    items.forEach((item) => {
      if (nameSet.has(item.name)) {
        return;
      }
      nameSet.add(item.name);
      deduplicated.push(item);
    });
    return deduplicated;
  }

  static deduplicateTypeItems(items) {
    const keySet = new Set();
    const deduplicated = [];
    items.forEach((item) => {
      const key = `${item.categoryId || ''}::${item.name}`;
      if (keySet.has(key)) {
        return;
      }
      keySet.add(key);
      deduplicated.push(item);
    });
    return deduplicated;
  }

  static sortMasterItems(items) {
    return [...items].sort((left, right) => {
      const seqCompare = left.seq - right.seq;
      if (seqCompare !== 0) {
        return seqCompare;
      }
      return left.name.localeCompare(right.name, 'zh-Hant');
    });
  }

  static sortTypeItems(items, categories) {
    const categorySeqById = new Map(categories.map((category) => [category.id, category.seq]));
    const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

    return [...items].sort((left, right) => {
      const leftCategorySeq = categorySeqById.get(left.categoryId) ?? Number.MAX_SAFE_INTEGER;
      const rightCategorySeq = categorySeqById.get(right.categoryId) ?? Number.MAX_SAFE_INTEGER;
      if (leftCategorySeq !== rightCategorySeq) {
        return leftCategorySeq - rightCategorySeq;
      }

      const leftCategoryName = categoryNameById.get(left.categoryId) || '';
      const rightCategoryName = categoryNameById.get(right.categoryId) || '';
      const categoryCompare = leftCategoryName.localeCompare(rightCategoryName, 'zh-Hant');
      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      const seqCompare = left.seq - right.seq;
      if (seqCompare !== 0) {
        return seqCompare;
      }

      return left.name.localeCompare(right.name, 'zh-Hant');
    });
  }

  static getMasterListKey(masterType) {
    if (masterType === 'category') {
      return 'categories';
    }
    if (masterType === 'type') {
      return 'types';
    }
    throw new Error('INVALID_MASTER_TYPE');
  }

  static saveMasterItem(data, masterType, input) {
    const listKey = PasswordRecordService.getMasterListKey(masterType);
    const targetList = data[listKey];

    const name = String(input?.name ?? '').trim();
    const seqInput = Number(input?.seq);
    if (!name) {
      throw new Error('MASTER_NAME_REQUIRED');
    }
    if (input?.seq !== undefined && (!Number.isFinite(seqInput) || seqInput <= 0)) {
      throw new Error('MASTER_SEQ_INVALID');
    }

    const categoryId = masterType === 'type' ? String(input?.categoryId || '') : null;
    if (masterType === 'type') {
      if (!categoryId || !(data.categories || []).some((category) => category.id === categoryId)) {
        throw new Error('MASTER_CATEGORY_REQUIRED');
      }
    }

    const duplicated = targetList.find((item) => {
      if (masterType === 'type') {
        return item.name === name && item.id !== input.id && item.categoryId === categoryId;
      }
      return item.name === name && item.id !== input.id;
    });
    if (duplicated) {
      throw new Error('MASTER_NAME_DUPLICATED');
    }

    const existingIndex = targetList.findIndex((item) => item.id === input.id);
    const isTypeCategoryChanged = masterType === 'type' && existingIndex >= 0 && targetList[existingIndex].categoryId !== categoryId;
    const resolvedSeq = existingIndex >= 0
      ? (Number.isFinite(seqInput) && seqInput > 0
        ? seqInput
        : (isTypeCategoryChanged
          ? PasswordRecordService.getNextMasterSeq(targetList, categoryId)
          : targetList[existingIndex].seq))
      : (Number.isFinite(seqInput) && seqInput > 0 ? seqInput : PasswordRecordService.getNextMasterSeq(targetList, categoryId));

    const duplicatedSeq = targetList.find((item) => {
      if (item.id === input.id || Number(item.seq) !== resolvedSeq) {
        return false;
      }
      if (masterType === 'type') {
        return item.categoryId === categoryId;
      }
      return true;
    });
    if (duplicatedSeq) {
      throw new Error('MASTER_SEQ_DUPLICATED');
    }

    const normalizedItem = {
      id: input?.id || generateId(),
      name,
      seq: resolvedSeq,
      ...(masterType === 'type' ? { categoryId } : {}),
    };

    if (existingIndex >= 0) {
      targetList[existingIndex] = normalizedItem;
    } else {
      targetList.push(normalizedItem);
    }

    data[listKey] = masterType === 'type'
      ? PasswordRecordService.sortTypeItems(targetList, data.categories || [])
      : PasswordRecordService.sortMasterItems(targetList);
  }

  static getNextMasterSeq(targetList, categoryId = null) {
    const scopedList = categoryId
      ? targetList.filter((item) => item.categoryId === categoryId)
      : targetList;

    if (!scopedList.length) {
      return 1;
    }

    const maxSeq = scopedList.reduce((max, item) => {
      const seq = Number(item.seq);
      if (!Number.isFinite(seq)) {
        return max;
      }
      return Math.max(max, seq);
    }, 0);

    return maxSeq + 1;
  }

  static deleteMasterItem(data, masterType, itemId) {
    const listKey = PasswordRecordService.getMasterListKey(masterType);
    const item = data[listKey].find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    const inUse = masterType === 'category'
      ? data.records.some((record) => record.category === item.name)
      : false;

    if (inUse) {
      throw new Error('MASTER_IN_USE');
    }

    if (masterType === 'category') {
      const hasChildren = (data.types || []).some((typeItem) => typeItem.categoryId === item.id);
      if (hasChildren) {
        throw new Error('MASTER_HAS_CHILDREN');
      }
    }

    if (masterType === 'type') {
      const categoryById = new Map((data.categories || []).map((category) => [category.id, category.name]));
      const categoryName = categoryById.get(item.categoryId) || '';
      const typeInUse = data.records.some((record) => record.type === item.name && record.category === categoryName);
      if (typeInUse) {
        throw new Error('MASTER_IN_USE');
      }
    }

    data[listKey] = data[listKey].filter((entry) => entry.id !== itemId);
  }

  static getTypesByCategory(data, categoryName) {
    const category = (data.categories || []).find((item) => item.name === categoryName);
    if (!category) {
      return [];
    }

    return PasswordRecordService.sortTypeItems(data.types || [], data.categories || [])
      .filter((typeItem) => typeItem.categoryId === category.id);
  }

  static normalizeDate(value) {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  }

  static getLatestUpdatedAt(passwordHistory) {
    if (!passwordHistory.length) {
      return nowIsoString();
    }
    return passwordHistory[0].changedAt;
  }

  static validateRecordInput(recordInput) {
    if (!recordInput.category?.trim()) {
      throw new Error('CATEGORY_REQUIRED');
    }
    if (!recordInput.type?.trim()) {
      throw new Error('TYPE_REQUIRED');
    }
    if (!recordInput.account?.trim()) {
      throw new Error('ACCOUNT_REQUIRED');
    }
    if (!Array.isArray(recordInput.passwordHistory) || recordInput.passwordHistory.length === 0) {
      throw new Error('PASSWORD_REQUIRED');
    }

    recordInput.passwordHistory.forEach((item) => {
      if (!item.password) {
        throw new Error('PASSWORD_REQUIRED');
      }
      if (!PasswordRecordService.normalizeDate(item.changedAt)) {
        throw new Error('INVALID_DATE');
      }
    });
  }

  static saveRecord(data, recordInput) {
    this.validateRecordInput(recordInput);

    const normalizedHistory = sortByChangedAtDesc(
      recordInput.passwordHistory.map((item) => ({
        id: item.id || generateId(),
        password: item.password,
        changedAt: PasswordRecordService.normalizeDate(item.changedAt),
      })),
    );

    const now = nowIsoString();
    const existingIndex = data.records.findIndex((record) => record.id === recordInput.id);
    const normalizedRecord = {
      id: recordInput.id || generateId(),
      category: recordInput.category.trim(),
      type: recordInput.type.trim(),
      account: recordInput.account.trim(),
      passwordHistory: normalizedHistory,
      note: String(recordInput.note || ''),
      createdAt: existingIndex >= 0 ? data.records[existingIndex].createdAt : now,
      updatedAt: normalizedHistory[0].changedAt || now,
    };

    if (existingIndex >= 0) {
      data.records[existingIndex] = normalizedRecord;
    } else {
      data.records.push(normalizedRecord);
    }
  }

  static deleteRecord(data, recordId) {
    data.records = data.records.filter((record) => record.id !== recordId);
  }

  static queryRecords(data, filterState) {
    const { categories, types, keyword, sortMode } = filterState;
    let result = [...data.records];

    if (categories.length > 0) {
      const categorySet = new Set(categories);
      result = result.filter((record) => categorySet.has(record.category));
    }
    if (types.length > 0) {
      const typeSet = new Set(types);
      result = result.filter((record) => typeSet.has(record.type));
    }
    if (keyword.trim()) {
      const target = keyword.trim().toLowerCase();
      result = result.filter((record) => {
        const accountMatched = String(record.account || '').toLowerCase().includes(target);
        const noteMatched = String(record.note || '').toLowerCase().includes(target);
        return accountMatched || noteMatched;
      });
    }

    if (sortMode === 'updatedDesc') {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sortMode === 'updatedAsc') {
      result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    } else if (sortMode === 'accountAsc') {
      result.sort((a, b) => a.account.localeCompare(b.account, 'zh-Hant'));
    } else {
      result.sort((a, b) => {
        const categoryCompare = a.category.localeCompare(b.category, 'zh-Hant');
        if (categoryCompare !== 0) {
          return categoryCompare;
        }
        const typeCompare = a.type.localeCompare(b.type, 'zh-Hant');
        if (typeCompare !== 0) {
          return typeCompare;
        }
        const accountCompare = a.account.localeCompare(b.account, 'zh-Hant');
        if (accountCompare !== 0) {
          return accountCompare;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    return result;
  }

  static buildFilterOptions(data) {
    const categoriesFromMaster = PasswordRecordService.sortMasterItems(data.categories || []).map((item) => item.name);
    const typesFromMaster = PasswordRecordService.sortTypeItems(data.types || [], data.categories || []).map((item) => item.name);

    const categories = [...new Set([
      ...categoriesFromMaster,
      ...data.records.map((record) => record.category),
    ])].filter((value) => value);

    const types = [...new Set([
      ...typesFromMaster,
      ...data.records.map((record) => record.type),
    ])].filter((value) => value);

    return { categories, types };
  }
}