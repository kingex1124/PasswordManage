export class ImportService {
  constructor() {
    this.cooldownUntil = 0;
  }

  getRemainingCooldownSeconds() {
    const remainingMs = this.cooldownUntil - Date.now();
    if (remainingMs <= 0) {
      return 0;
    }
    return Math.ceil(remainingMs / 1000);
  }

  ensureCanRetry() {
    const seconds = this.getRemainingCooldownSeconds();
    if (seconds > 0) {
      throw new Error('RETRY_LATER');
    }
  }

  registerFailureCooldown(seconds = 5) {
    this.cooldownUntil = Date.now() + (seconds * 1000);
  }

  clearCooldown() {
    this.cooldownUntil = 0;
  }
}