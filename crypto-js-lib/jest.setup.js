// Jest setup file to add Web Crypto API support
import { webcrypto } from 'node:crypto';

// Add Web Crypto API to global scope
global.crypto = webcrypto;

// Add TextEncoder/TextDecoder if not present
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock document for CryptoExtension.js htmlDecode function
global.document = {
  createElement: () => ({
    innerHTML: '',
    get value() {
      return this.innerHTML
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    },
    set value(v) {
      this._value = v;
    }
  })
};
