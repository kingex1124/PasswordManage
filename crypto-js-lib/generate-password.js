/**
 * 密碼產生工具
 * 產生符合要求的隨機密碼：
 * - 長度：20 字元
 * - 至少 1 個英文大寫
 * - 至少 1 個英文小寫
 * - 至少 1 個特殊符號
 * - 至少 1 個數字
 */

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

const PASSWORD_LENGTH = 20;

/**
 * 從字符串中隨機選取一個字符
 * @param {string} chars - 字符串
 * @returns {string} 隨機字符
 */
function getRandomChar(chars) {
  const randomIndex = Math.floor(Math.random() * chars.length);
  return chars[randomIndex];
}

/**
 * 產生符合要求的隨機密碼
 * @returns {string} 隨機密碼
 */
function generatePassword() {
  // 確保至少包含一個各種必需的字符
  const password = [
    getRandomChar(UPPERCASE),
    getRandomChar(LOWERCASE),
    getRandomChar(NUMBERS),
    getRandomChar(SPECIAL_CHARS),
  ];

  // 合併所有可用字符
  const allChars = UPPERCASE + LOWERCASE + NUMBERS + SPECIAL_CHARS;

  // 填充剩餘的長度
  for (let i = password.length; i < PASSWORD_LENGTH; i++) {
    password.push(getRandomChar(allChars));
  }

  // 打亂密碼順序
  const shuffledPassword = password
    .sort(() => Math.random() - 0.5)
    .join('');

  return shuffledPassword;
}

/**
 * 驗證密碼是否符合要求
 * @param {string} password - 密碼
 * @returns {boolean} 是否符合要求
 */
function validatePassword(password) {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  const isCorrectLength = password.length === PASSWORD_LENGTH;

  return (
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecialChar &&
    isCorrectLength
  );
}

// 主程序
if (require.main === module) {
  console.log('🔐 密碼產生工具\n');
  console.log(`密碼長度: ${PASSWORD_LENGTH} 字元`);
  console.log('要求: 至少1個大寫、1個小寫、1個數字、1個特殊符號\n');

  // 產生並顯示 10 個密碼
  for (let i = 1; i <= 10; i++) {
    const password = generatePassword();
    const isValid = validatePassword(password);
    const status = isValid ? '✓ 有效' : '✗ 無效';

    console.log(`密碼 ${i}: ${password} (${status})`);
  }

  console.log('\n💡 建議: 將上面的任何一個密碼複製作為 DEFAULT_PASSWORD');
}

// 匯出函數
module.exports = {
  generatePassword,
  validatePassword,
  PASSWORD_LENGTH,
};
