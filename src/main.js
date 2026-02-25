import { EncryptionService } from "./services/EncryptionService.js";
import { FileService } from "./services/FileService.js";
import { ImportService } from "./services/ImportService.js";
import { PasswordRecordService } from "./services/PasswordRecordService.js";
import {
  formatDateTime,
  fromDatetimeLocalValue,
  generateId,
  nowIsoString,
  toDatetimeLocalValue,
} from "./utils.js";

const state = {
  data: PasswordRecordService.createEmptyData(),
  filters: {
    categories: [],
    types: [],
    keyword: "",
    sortMode: "default",
  },
  archivePassword: "",
  selectedCategoryIdForTypeMaintenance: null,
  importedFileHandle: null,
  visibility: new Set(),
  autoHideTimers: new Map(),
};

const FILTER_ALL_VALUE = "__ALL__";
const INSTALL_HINT_DISMISSED_KEY = "pm_pwa_install_hint_dismissed";
let deferredInstallPrompt = null;

const encryptionService = new EncryptionService();
const importService = new ImportService();

const elements = {
  addRecordBtn: document.querySelector("#addRecordBtn"),
  addCategoryBtn: document.querySelector("#addCategoryBtn"),
  addTypeBtn: document.querySelector("#addTypeBtn"),
  importBtn: document.querySelector("#importBtn"),
  saveBtn: document.querySelector("#saveBtn"),
  changeArchivePasswordBtn: document.querySelector("#changeArchivePasswordBtn"),
  categoryFilter: document.querySelector("#categoryFilter"),
  typeFilter: document.querySelector("#typeFilter"),
  accountKeyword: document.querySelector("#accountKeyword"),
  sortMode: document.querySelector("#sortMode"),
  messageArea: document.querySelector("#messageArea"),
  messageText: document.querySelector("#messageText"),
  messageCloseBtn: document.querySelector("#messageCloseBtn"),
  pwaInstallHint: document.querySelector("#pwaInstallHint"),
  pwaInstallTitle: document.querySelector("#pwaInstallTitle"),
  pwaInstallText: document.querySelector("#pwaInstallText"),
  installAppBtn: document.querySelector("#installAppBtn"),
  dismissInstallHintBtn: document.querySelector("#dismissInstallHintBtn"),
  recordTableBody: document.querySelector("#recordTableBody"),
  recordModal: document.querySelector("#recordModal"),
  recordModalTitle: document.querySelector("#recordModalTitle"),
  recordForm: document.querySelector("#recordForm"),
  recordId: document.querySelector("#recordId"),
  categoryInput: document.querySelector("#categoryInput"),
  typeInput: document.querySelector("#typeInput"),
  accountInput: document.querySelector("#accountInput"),
  passwordHistoryEditor: document.querySelector("#passwordHistoryEditor"),
  noteInput: document.querySelector("#noteInput"),
  addPasswordHistoryBtn: document.querySelector("#addPasswordHistoryBtn"),
  cancelModalBtn: document.querySelector("#cancelModalBtn"),
  fileInput: document.querySelector("#fileInput"),
  categoryMasterBody: document.querySelector("#categoryMasterBody"),
  typeMasterBody: document.querySelector("#typeMasterBody"),
  toggleMasterBtn: document.querySelector("#toggleMasterBtn"),
  masterPanelBody: document.querySelector("#masterPanelBody"),
  typeBlockTitle: document.querySelector("#typeBlockTitle"),
  typeBlockHint: document.querySelector("#typeBlockHint"),
  passwordDialog: document.querySelector("#passwordDialog"),
  passwordDialogForm: document.querySelector("#passwordDialogForm"),
  passwordDialogTitle: document.querySelector("#passwordDialogTitle"),
  passwordDialogMessage: document.querySelector("#passwordDialogMessage"),
  passwordDialogInput: document.querySelector("#passwordDialogInput"),
  togglePasswordDialogBtn: document.querySelector("#togglePasswordDialogBtn"),
  cancelPasswordDialogBtn: document.querySelector("#cancelPasswordDialogBtn"),
};

function setMessage(message, messageType = "") {
  elements.messageText.textContent = message;
  elements.messageArea.className = `message ${messageType}`.trim();
  if (message) {
    elements.messageArea.classList.add("is-visible");
  } else {
    elements.messageArea.classList.remove("is-visible");
  }
}

function clearMessage() {
  setMessage("");
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

function isIosDevice() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();
  const isTouchMac = platform === "macintel" && window.navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/.test(userAgent) || isTouchMac;
}

function isInstallHintDismissed() {
  try {
    return window.localStorage.getItem(INSTALL_HINT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function dismissInstallHint() {
  elements.pwaInstallHint.hidden = true;
  try {
    window.localStorage.setItem(INSTALL_HINT_DISMISSED_KEY, "1");
  } catch {
    setMessage("已暫時隱藏安裝提示（此裝置不支援記住設定）", "success");
  }
}

function showInstallHint(title, text, showInstallButton) {
  if (isInstallHintDismissed() || isStandaloneMode()) {
    return;
  }

  elements.pwaInstallTitle.textContent = title;
  elements.pwaInstallText.textContent = text;
  elements.installAppBtn.hidden = !showInstallButton;
  elements.pwaInstallHint.hidden = false;
}

function setupPwaInstallExperience() {
  if (isStandaloneMode()) {
    elements.pwaInstallHint.hidden = true;
    return;
  }

  if (isIosDevice()) {
    showInstallHint(
      "安裝 App（iPhone/iPad）",
      "請點 Safari 分享按鈕，再選「加入主畫面」。",
      false,
    );
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallHint(
      "安裝 App",
      "點擊安裝後，可像原生 App 一樣從桌面快速開啟。",
      true,
    );
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    elements.pwaInstallHint.hidden = true;
  });
}

function askPassword({ title, message, defaultValue = "" }) {
  return new Promise((resolve) => {
    elements.passwordDialogTitle.textContent = title;
    elements.passwordDialogMessage.textContent = message;
    elements.passwordDialogInput.value = defaultValue;
    elements.passwordDialogInput.type = "password";

    // SVGs for eye icons
    const eyeOpen =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const eyeClosed =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

    elements.togglePasswordDialogBtn.innerHTML = eyeOpen;

    const cleanup = () => {
      elements.passwordDialogForm.removeEventListener("submit", onSubmit);
      elements.cancelPasswordDialogBtn.removeEventListener("click", onCancel);
      elements.togglePasswordDialogBtn.removeEventListener("click", onToggle);
      elements.passwordDialog.removeEventListener("cancel", onCancel);
    };

    const onSubmit = (event) => {
      event.preventDefault();
      const value = elements.passwordDialogInput.value;
      cleanup();
      elements.passwordDialog.close();
      resolve(value);
    };

    const onCancel = () => {
      cleanup();
      if (elements.passwordDialog.open) {
        elements.passwordDialog.close();
      }
      resolve(null);
    };

    const onToggle = () => {
      const isHidden = elements.passwordDialogInput.type === "password";
      elements.passwordDialogInput.type = isHidden ? "text" : "password";
      elements.togglePasswordDialogBtn.innerHTML = isHidden
        ? eyeClosed
        : eyeOpen;
    };

    elements.passwordDialogForm.addEventListener("submit", onSubmit);
    elements.cancelPasswordDialogBtn.addEventListener("click", onCancel);
    elements.togglePasswordDialogBtn.addEventListener("click", onToggle);
    elements.passwordDialog.addEventListener("cancel", onCancel);

    elements.passwordDialog.showModal();
    elements.passwordDialogInput.focus();
    elements.passwordDialogInput.select();
  });
}

function getVisibilityKey(recordId, historyId) {
  return `${recordId}::${historyId}`;
}

function hidePassword(recordId, historyId) {
  const key = getVisibilityKey(recordId, historyId);
  state.visibility.delete(key);
  const timerId = state.autoHideTimers.get(key);
  if (timerId) {
    clearTimeout(timerId);
    state.autoHideTimers.delete(key);
  }
  renderRecords();
}

function showPassword(recordId, historyId) {
  const key = getVisibilityKey(recordId, historyId);
  state.visibility.add(key);
  const currentTimer = state.autoHideTimers.get(key);
  if (currentTimer) {
    clearTimeout(currentTimer);
  }
  const timerId = setTimeout(() => hidePassword(recordId, historyId), 60000);
  state.autoHideTimers.set(key, timerId);
}

function togglePasswordVisibility(recordId, historyId) {
  const key = getVisibilityKey(recordId, historyId);
  if (state.visibility.has(key)) {
    hidePassword(recordId, historyId);
    return;
  }
  showPassword(recordId, historyId);
  renderRecords();
}

function clearAllVisibility() {
  for (const timerId of state.autoHideTimers.values()) {
    clearTimeout(timerId);
  }
  state.visibility.clear();
  state.autoHideTimers.clear();
}

function createHistoryEditItem(history) {
  const wrapper = document.createElement("div");
  wrapper.className = "history-edit-item";
  wrapper.dataset.historyId = history.id;

  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.required = true;
  passwordInput.value = history.password;
  passwordInput.className = "history-password-input";

  const dateInput = document.createElement("input");
  dateInput.type = "datetime-local";
  dateInput.required = true;
  dateInput.value = toDatetimeLocalValue(history.changedAt);
  dateInput.step = "1";
  dateInput.className = "history-date-input";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "icon-btn";
  toggleBtn.title = "顯示/隱藏密碼";
  toggleBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  toggleBtn.addEventListener("click", () => {
    passwordInput.type =
      passwordInput.type === "password" ? "text" : "password";
    if (passwordInput.type === "text") {
      setTimeout(() => {
        passwordInput.type = "password";
      }, 60000);
    }
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "icon-btn danger-btn";
  deleteBtn.title = "刪除";
  deleteBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
  deleteBtn.addEventListener("click", () => {
    wrapper.remove();
  });

  const actionContainer = document.createElement("div");
  actionContainer.className = "action-buttons";
  actionContainer.append(toggleBtn, deleteBtn);

  wrapper.append(passwordInput, dateInput, actionContainer);
  return wrapper;
}

function addHistoryEditorItem(password = "", changedAt = nowIsoString()) {
  const item = {
    id: generateId(),
    password,
    changedAt,
  };
  elements.passwordHistoryEditor.appendChild(createHistoryEditItem(item));
}

function readRecordForm() {
  const passwordHistory = Array.from(
    elements.passwordHistoryEditor.children,
  ).map((itemElement) => {
    const historyId = itemElement.dataset.historyId || generateId();
    const password = itemElement.querySelector(".history-password-input").value;
    const changedAtInput = itemElement.querySelector(
      ".history-date-input",
    ).value;
    const changedAt = fromDatetimeLocalValue(changedAtInput);
    return {
      id: historyId,
      password,
      changedAt,
    };
  });

  return {
    id: elements.recordId.value || null,
    category: elements.categoryInput.value,
    type: elements.typeInput.value,
    account: elements.accountInput.value,
    passwordHistory,
    note: elements.noteInput.value,
  };
}

function fillRecordMasterSelect(selectElement, items, selectedValue = "") {
  selectElement.innerHTML = "";
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "請選擇";
  selectElement.appendChild(placeholderOption);

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = `${item.seq}. ${item.name}`;
    option.selected = item.name === selectedValue;
    selectElement.appendChild(option);
  });
}

function refreshRecordFormMasterSelects(record = null) {
  const categories = PasswordRecordService.sortMasterItems(
    state.data.categories || [],
  );

  fillRecordMasterSelect(
    elements.categoryInput,
    categories,
    record?.category || "",
  );

  const selectedCategory = record?.category || elements.categoryInput.value || "";
  const categoryTypes = PasswordRecordService.getTypesByCategory(
    state.data,
    selectedCategory,
  );
  fillRecordMasterSelect(elements.typeInput, categoryTypes, record?.type || "");
}

function syncTypeOptionsBySelectedCategory(selectedType = "") {
  const selectedCategory = elements.categoryInput.value;
  const categoryTypes = PasswordRecordService.getTypesByCategory(
    state.data,
    selectedCategory,
  );
  fillRecordMasterSelect(elements.typeInput, categoryTypes, selectedType);
}

function openRecordModal(record = null) {
  elements.recordForm.reset();
  elements.passwordHistoryEditor.innerHTML = "";
  elements.recordId.value = "";
  refreshRecordFormMasterSelects(record);

  if (record) {
    elements.recordModalTitle.textContent = "編輯資料";
    elements.recordId.value = record.id;
    elements.categoryInput.value = record.category;
    elements.typeInput.value = record.type;
    elements.accountInput.value = record.account;
    elements.noteInput.value = record.note;
    record.passwordHistory.forEach((history) => {
      elements.passwordHistoryEditor.appendChild(
        createHistoryEditItem(history),
      );
    });
  } else {
    elements.recordModalTitle.textContent = "新增資料";
    if (
      (state.data.categories || []).length === 0 ||
      (state.data.types || []).length === 0
    ) {
      setMessage("請先在頁面維護至少一筆類別與種類", "error");
      return;
    }
    addHistoryEditorItem();
  }

  elements.recordModal.showModal();
}

function closeRecordModal() {
  elements.recordModal.close();
}

function fillFilterSelect(selectElement, options, selectedValues) {
  const current = new Set(selectedValues);
  selectElement.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = FILTER_ALL_VALUE;
  allOption.textContent = "全部";
  allOption.selected = selectedValues.length === 0;
  selectElement.appendChild(allOption);

  options.forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    option.selected = current.has(optionValue);
    selectElement.appendChild(option);
  });
}

function normalizeSingleFilterSelection(selectedValue) {
  if (!selectedValue || selectedValue === FILTER_ALL_VALUE) {
    return [];
  }
  return [selectedValue];
}

function promptMasterInput(title, defaultName = "") {
  const name = window.prompt(`${title} - 名稱`, defaultName);
  if (name === null) {
    return null;
  }

  return { name };
}

function getSelectedCategoryForTypeMaintenance() {
  const categories = PasswordRecordService.sortMasterItems(
    state.data.categories || [],
  );

  if (!categories.length) {
    state.selectedCategoryIdForTypeMaintenance = null;
    return null;
  }

  const found = categories.find(
    (category) => category.id === state.selectedCategoryIdForTypeMaintenance,
  );
  if (found) {
    return found;
  }

  state.selectedCategoryIdForTypeMaintenance = categories[0].id;
  return categories[0];
}

function renderMasterTable(masterType, bodyElement) {
  const listKey = masterType === "category" ? "categories" : "types";
  const selectedCategory = getSelectedCategoryForTypeMaintenance();
  const items = masterType === "category"
    ? PasswordRecordService.sortMasterItems(state.data[listKey] || [])
    : (selectedCategory
      ? PasswordRecordService.getTypesByCategory(state.data, selectedCategory.name)
      : []);
  bodyElement.innerHTML = "";

  if (items.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.className = "empty-state";
    cell.textContent = masterType === "type"
      ? (selectedCategory ? "此類別目前沒有種類" : "請先選擇類別")
      : "目前沒有資料";
    row.appendChild(cell);
    bodyElement.appendChild(row);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("tr");
    const seqCell = document.createElement("td");
    seqCell.textContent = String(item.seq);
    if (masterType === "category") {
      row.classList.toggle(
        "master-row-selected",
        item.id === state.selectedCategoryIdForTypeMaintenance,
      );
      row.addEventListener("click", () => {
        state.selectedCategoryIdForTypeMaintenance = item.id;
        renderMasterMaintenance();
      });
    }
    const nameCell = document.createElement("td");
    nameCell.textContent = item.name;

    const actionCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "action-buttons";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-btn";
    editBtn.title = "修改";
    editBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();

      const result = masterType === "type"
        ? promptMasterInput("修改種類", item.name)
        : promptMasterInput("修改", item.name);

      if (!result) {
        return;
      }

      try {
        PasswordRecordService.saveMasterItem(state.data, masterType, {
          id: item.id,
          name: result.name,
          ...(masterType === "type" ? { categoryId: item.categoryId } : {}),
        });
        updateFilterOptions();
        renderMasterMaintenance();
        renderRecords();
        setMessage("主檔修改成功", "success");
      } catch (error) {
        handleMasterError(error);
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "icon-btn danger-btn";
    deleteBtn.title = "刪除";
    deleteBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!window.confirm("確定要刪除這筆主檔資料嗎？")) {
        return;
      }

      try {
        PasswordRecordService.deleteMasterItem(state.data, masterType, item.id);
        updateFilterOptions();
        renderMasterMaintenance();
        renderRecords();
        setMessage("主檔刪除成功", "success");
      } catch (error) {
        handleMasterError(error);
      }
    });

    actions.append(editBtn, deleteBtn);
    actionCell.appendChild(actions);

    row.append(seqCell, nameCell, actionCell);
    bodyElement.appendChild(row);
  });
}

function handleMasterError(error) {
  if (error.message === "MASTER_NAME_REQUIRED") {
    setMessage("名稱不可空白", "error");
    return;
  }
  if (error.message === "MASTER_SEQ_INVALID") {
    setMessage("流水號需為正整數", "error");
    return;
  }
  if (error.message === "MASTER_NAME_DUPLICATED") {
    setMessage("名稱不可重複", "error");
    return;
  }
  if (error.message === "MASTER_CATEGORY_REQUIRED") {
    setMessage("請選擇有效的所屬類別", "error");
    return;
  }
  if (error.message === "MASTER_HAS_CHILDREN") {
    setMessage("此類別底下仍有種類，請先刪除種類", "error");
    return;
  }
  if (error.message === "MASTER_IN_USE") {
    setMessage("此主檔已被帳密資料使用，無法刪除", "error");
    return;
  }
  setMessage("主檔操作失敗", "error");
}

function renderMasterMaintenance() {
  const selectedCategory = getSelectedCategoryForTypeMaintenance();
  elements.typeBlockTitle.textContent = selectedCategory
    ? `種類維護（${selectedCategory.name}）`
    : "種類維護";
  elements.typeBlockHint.textContent = selectedCategory
    ? "以下僅顯示此類別底下的種類"
    : "請先在左側選擇類別";

  renderMasterTable("category", elements.categoryMasterBody);
  renderMasterTable("type", elements.typeMasterBody);
  refreshRecordFormMasterSelects();
}

function updateFilterOptions() {
  const { categories, types } = PasswordRecordService.buildFilterOptions(
    state.data,
  );
  state.filters.categories = state.filters.categories.filter((item) =>
    categories.includes(item),
  );
  state.filters.types = state.filters.types.filter((item) =>
    types.includes(item),
  );
  fillFilterSelect(
    elements.categoryFilter,
    categories,
    state.filters.categories,
  );
  fillFilterSelect(elements.typeFilter, types, state.filters.types);
}

function renderRecords() {
  const records = PasswordRecordService.queryRecords(state.data, state.filters);
  elements.recordTableBody.innerHTML = "";

  if (records.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-state";
    cell.textContent = "目前沒有資料";
    row.appendChild(cell);
    elements.recordTableBody.appendChild(row);
    return;
  }

  records.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    `;

    row.children[0].innerHTML = `<span class="badge">${record.category}</span>`;
    row.children[1].innerHTML = `<span class="badge badge-type">${record.type}</span>`;
    row.children[2].textContent = record.account;

    const historyContainer = document.createElement("div");
    historyContainer.className = "history-list";
    record.passwordHistory.forEach((history) => {
      const key = getVisibilityKey(record.id, history.id);
      const visible = state.visibility.has(key);
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";

      const value = document.createElement("span");
      value.textContent = visible
        ? history.password
        : "•".repeat(Math.max(6, history.password.length || 6));

      const date = document.createElement("time");
      date.textContent = formatDateTime(history.changedAt);

      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "icon-btn";
      toggleBtn.title = visible ? "隱藏密碼" : "顯示密碼";
      toggleBtn.innerHTML = visible
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      toggleBtn.addEventListener("click", () =>
        togglePasswordVisibility(record.id, history.id),
      );

      historyItem.append(value, date, toggleBtn);
      historyContainer.appendChild(historyItem);
    });
    row.children[3].appendChild(historyContainer);

    row.children[4].textContent = record.note;

    const actions = document.createElement("div");
    actions.className = "action-buttons";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-btn";
    editBtn.title = "編輯";
    editBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
    editBtn.addEventListener("click", () => openRecordModal(record));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "icon-btn danger-btn";
    deleteBtn.title = "刪除";
    deleteBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
    deleteBtn.addEventListener("click", () => {
      if (!window.confirm("確定要刪除這筆資料嗎？")) {
        return;
      }
      if (!window.confirm("請再次確認刪除，刪除後無法復原。")) {
        return;
      }
      PasswordRecordService.deleteRecord(state.data, record.id);
      setMessage("刪除完成", "success");
      updateFilterOptions();
      renderRecords();
    });

    actions.append(editBtn, deleteBtn);
    row.children[5].appendChild(actions);
    elements.recordTableBody.appendChild(row);
  });
}

async function handleImport(encryptedText, fileHandle = null) {
  importService.ensureCanRetry();

  let encryptedPayload;
  try {
    encryptedPayload = JSON.parse(encryptedText);
  } catch {
    throw new Error("INVALID_FILE");
  }

  const inputPassword = await askPassword({
    title: "匯入加密檔",
    message: "請輸入存檔密碼",
    defaultValue: "",
  });
  if (inputPassword === null) {
    return;
  }

  try {
    const plainData = await encryptionService.decryptFilePayload(
      encryptedPayload,
      inputPassword,
    );
    state.data = PasswordRecordService.normalizeImportedPlainData(plainData);
    state.archivePassword = inputPassword;
    state.importedFileHandle = fileHandle;
    importService.clearCooldown();
    clearAllVisibility();
    updateFilterOptions();
    renderMasterMaintenance();
    renderRecords();
    setMessage("匯入成功，已覆蓋目前資料", "success");
  } catch (error) {
    if (error.message === "UNSUPPORTED_VERSION") {
      setMessage("匯入失敗：不支援的檔案版本", "error");
      return;
    }

    importService.registerFailureCooldown(5);
    setMessage("匯入失敗：密碼錯誤或檔案已損毀", "error");
  }
}

async function handleImportClick() {
  try {
    if (window.showOpenFilePicker) {
      const { content, fileHandle } = await FileService.pickFileWithHandle();
      if (!content) {
        return;
      }
      await handleImport(content, fileHandle);
      return;
    }

    elements.fileInput.value = "";
    elements.fileInput.click();
  } catch (error) {
    if (error.message === "RETRY_LATER") {
      setMessage("請 5 秒後再試", "error");
      return;
    }
    if (error.name === "AbortError") {
      return;
    }
    setMessage("匯入失敗：檔案格式不正確", "error");
  }
}

async function handleExportClick() {
  try {
    const inputPassword = await askPassword({
      title: "存檔",
      message: "請輸入存檔密碼（可留空為目前密碼）",
      defaultValue: state.archivePassword || "",
    });
    if (inputPassword === null) {
      return;
    }
    state.archivePassword = inputPassword;

    const encryptedPayload = await encryptionService.encryptRecords(
      state.data,
      state.archivePassword,
    );
    const saveResult = await FileService.saveEncryptedPayload(
      encryptedPayload,
      state.importedFileHandle,
    );
    state.importedFileHandle =
      saveResult.fileHandle || state.importedFileHandle;

    if (saveResult.mode === "overwrite") {
      setMessage("存檔成功，已覆蓋原檔", "success");
    } else if (saveResult.mode === "saveAs") {
      setMessage("存檔成功，已另存新檔", "success");
    } else {
      setMessage(
        "存檔成功，瀏覽器不支援原檔覆蓋，已改以下載方式匯出",
        "success",
      );
    }
  } catch {
    setMessage("匯出失敗：請稍後再試", "error");
  }
}

function bindEvents() {
  elements.toggleMasterBtn.addEventListener("click", () => {
    elements.masterPanelBody.classList.toggle("is-collapsed");
    const isCollapsed = elements.masterPanelBody.classList.contains("is-collapsed");
    elements.toggleMasterBtn.textContent = isCollapsed ? "展開" : "收合";
  });

  elements.addCategoryBtn.addEventListener("click", () => {
    const result = promptMasterInput("新增類別", "");
    if (!result) {
      return;
    }

    try {
      PasswordRecordService.saveMasterItem(state.data, "category", result);
      updateFilterOptions();
      renderMasterMaintenance();
      renderRecords();
      setMessage("類別新增成功", "success");
    } catch (error) {
      handleMasterError(error);
    }
  });

  elements.addTypeBtn.addEventListener("click", () => {
    const selectedCategory = getSelectedCategoryForTypeMaintenance();
    if (!selectedCategory) {
      setMessage("請先新增類別，再新增種類", "error");
      return;
    }

    const result = promptMasterInput(
      `新增種類（${selectedCategory.name}）`,
      "",
    );
    if (!result) {
      return;
    }

    try {
      PasswordRecordService.saveMasterItem(state.data, "type", {
        name: result.name,
        categoryId: selectedCategory.id,
      });
      updateFilterOptions();
      renderMasterMaintenance();
      renderRecords();
      setMessage("種類新增成功", "success");
    } catch (error) {
      handleMasterError(error);
    }
  });

  elements.addRecordBtn.addEventListener("click", () => {
    openRecordModal();
  });

  elements.categoryInput.addEventListener("change", () => {
    syncTypeOptionsBySelectedCategory();
  });

  elements.importBtn.addEventListener("click", handleImportClick);
  if (elements.saveBtn) {
    elements.saveBtn.addEventListener("click", handleExportClick);
  }

  elements.changeArchivePasswordBtn.addEventListener("click", async () => {
    const newPassword = await askPassword({
      title: "變更存檔密碼",
      message: "請輸入新的存檔密碼",
      defaultValue: state.archivePassword || "",
    });
    if (newPassword === null) {
      return;
    }
    state.archivePassword = newPassword;
    setMessage("已更新存檔密碼，將於下次匯出生效", "success");
  });

  elements.addPasswordHistoryBtn.addEventListener("click", () =>
    addHistoryEditorItem(),
  );

  elements.cancelModalBtn.addEventListener("click", () => closeRecordModal());

  elements.recordForm.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      const recordInput = readRecordForm();
      PasswordRecordService.saveRecord(state.data, recordInput);
      closeRecordModal();
      updateFilterOptions();
      renderRecords();
      setMessage("儲存成功", "success");
    } catch (error) {
      if (error.message === "CATEGORY_REQUIRED") {
        setMessage("類別不可空白", "error");
        return;
      }
      if (error.message === "TYPE_REQUIRED") {
        setMessage("種類不可空白", "error");
        return;
      }
      if (error.message === "ACCOUNT_REQUIRED") {
        setMessage("帳號不可空白", "error");
        return;
      }
      if (error.message === "INVALID_DATE") {
        setMessage("日期格式需可解析", "error");
        return;
      }
      setMessage("新增資料時至少一筆密碼", "error");
    }
  });

  elements.categoryFilter.addEventListener("change", () => {
    state.filters.categories = normalizeSingleFilterSelection(
      elements.categoryFilter.value,
    );
    fillFilterSelect(
      elements.categoryFilter,
      PasswordRecordService.buildFilterOptions(state.data).categories,
      state.filters.categories,
    );
    renderRecords();
  });

  elements.typeFilter.addEventListener("change", () => {
    state.filters.types = normalizeSingleFilterSelection(
      elements.typeFilter.value,
    );
    fillFilterSelect(
      elements.typeFilter,
      PasswordRecordService.buildFilterOptions(state.data).types,
      state.filters.types,
    );
    renderRecords();
  });

  elements.accountKeyword.addEventListener("input", () => {
    state.filters.keyword = elements.accountKeyword.value;
    renderRecords();
  });

  elements.sortMode.addEventListener("change", () => {
    state.filters.sortMode = elements.sortMode.value;
    renderRecords();
  });

  elements.messageCloseBtn.addEventListener("click", () => {
    clearMessage();
  });

  elements.dismissInstallHintBtn.addEventListener("click", () => {
    dismissInstallHint();
  });

  elements.installAppBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      setMessage("目前裝置暫時無法顯示安裝提示，請用瀏覽器選單加入主畫面", "error");
      return;
    }

    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    if (result.outcome === "accepted") {
      elements.pwaInstallHint.hidden = true;
    }
    deferredInstallPrompt = null;
  });

  elements.fileInput.addEventListener("change", async () => {
    try {
      const content = await FileService.readFileFromInput(elements.fileInput);
      if (!content) {
        return;
      }
      await handleImport(content, null);
    } catch (error) {
      if (error.message === "RETRY_LATER") {
        setMessage("請 5 秒後再試", "error");
      } else {
        setMessage("匯入失敗：檔案格式不正確", "error");
      }
    }
  });
}

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch {
      setMessage("Service Worker 註冊失敗", "error");
    }
  }
}

function init() {
  bindEvents();
  setupPwaInstallExperience();
  updateFilterOptions();
  renderMasterMaintenance();
  renderRecords();
  registerServiceWorker();
}

init();
