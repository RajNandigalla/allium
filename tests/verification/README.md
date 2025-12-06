# Verification Tests

This directory contains verification scripts for testing various Allium features.

## Scripts

### `verify-advanced-fields.ts`

Tests advanced field features including:

- Computed fields
- Virtual fields
- Masked fields
- Field validation

**Run**: `npx ts-node tests/verification/verify-advanced-fields.ts`

### `verify-hydration.ts`

Tests data hydration and population features:

- Relation population
- Nested population
- Field selection

**Run**: `npx ts-node tests/verification/verify-hydration.ts`

### `verify-schema.ts`

Tests schema generation and validation:

- Prisma schema generation
- Model definitions
- Field types

**Run**: `npx ts-node tests/verification/verify-schema.ts`

### `verify-sync.ts`

Tests database synchronization:

- Schema sync
- Model updates
- Migration handling

**Run**: `npx ts-node tests/verification/verify-sync.ts`

## Test Fixtures

Test fixtures are located in `tests/fixtures/`:

- `.test-advanced/` - Advanced fields test data
- `.test-hydration/` - Hydration test data
- `.test-sync/` - Sync test data

## Running All Verification Tests

```bash
cd tests/verification
npx ts-node verify-advanced-fields.ts
npx ts-node verify-hydration.ts
npx ts-node verify-schema.ts
npx ts-node verify-sync.ts
```
