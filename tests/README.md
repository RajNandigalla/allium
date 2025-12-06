# Allium Tests

This directory contains all test files for the Allium framework.

## Structure

```
tests/
├── security/           # Security feature tests
│   ├── README.md
│   ├── test-security-minimal.js
│   ├── test-security-additional.js
│   ├── test-csrf-browser.js
│   └── MANUAL_CSRF_TEST.md
└── README.md          # This file
```

## Running Tests

### Security Tests

```bash
# Run all security tests
cd tests/security
node test-security-minimal.js
node test-security-additional.js
node test-csrf-browser.js  # Requires Playwright
```

See `tests/security/README.md` for detailed information.

## Adding New Tests

When adding new tests:

1. Create appropriate subdirectory (e.g., `tests/api/`, `tests/models/`)
2. Add README.md explaining the tests
3. Use descriptive filenames: `test-{feature}-{aspect}.js`
4. Include test documentation in the file header

## Test Requirements

- Node.js 18+
- Playwright (for browser tests): `npm install --save-dev playwright`

## CI/CD Integration

To integrate with CI/CD:

```yaml
# Example GitHub Actions
- name: Run Security Tests
  run: |
    node tests/security/test-security-minimal.js
    node tests/security/test-security-additional.js
```
