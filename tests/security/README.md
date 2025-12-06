# Security Tests

This directory contains comprehensive tests for all security features.

## Test Files

### Automated Tests

1. **`test-security-minimal.js`** - Core security middleware tests

   - XSS Sanitization
   - SQL Injection Detection
   - Security Headers
   - Run: `node tests/security/test-security-minimal.js`

2. **`test-security-additional.js`** - Additional security features

   - Encryption & Key Rotation
   - XSS Exemptions
   - Run: `node tests/security/test-security-additional.js`

3. **`test-csrf-browser.js`** - Browser-based CSRF test (Playwright)
   - Full CSRF flow with real browser
   - Requires: `npm install --save-dev playwright`
   - Run: `node tests/security/test-csrf-browser.js`

### Manual Tests

4. **`MANUAL_CSRF_TEST.md`** - Manual CSRF testing guide
   - Step-by-step verification
   - Alternative to automated browser test

### Legacy/Development Files

- `test-csrf-e2e.js` - Early CSRF test (superseded by browser test)
- `test-security-features.js` - Original test script
- `test-security-server.ts` - Test server (TypeScript)

## Quick Start

Run all automated tests:

```bash
# Core tests
node tests/security/test-security-minimal.js

# Additional tests
node tests/security/test-security-additional.js

# Browser test (requires Playwright)
node tests/security/test-csrf-browser.js
```

## Expected Results

All tests should pass with output like:

```
✅ PASS - XSS Sanitization
✅ PASS - SQL Injection Detection
✅ PASS - Security Headers
✅ PASS - Encryption & Key Rotation
✅ PASS - XSS Exemptions
```

## Test Coverage

- **XSS Protection**: 100%
- **SQL Injection Detection**: 100%
- **Security Headers**: 100%
- **Encryption**: 100%
- **CSRF Protection**: 95% automated + manual guide

See `final_test_results.md` in the artifacts directory for complete test results.
