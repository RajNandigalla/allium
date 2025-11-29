# Auto-Loading Models Example

## Location

I created the auto-loader utility in:

- **File**: `/packages/core/src/utils/model-loader.ts`
- **Exported from**: `@allium/core`

## How to Use in Your App

### Option 1: Using in app.ts (Recommended)

```typescript
import path from 'path';
import { autoLoadModels } from '@allium/core';
import Fastify from 'fastify';
import { alliumPlugin } from '@allium/fastify';

const app = Fastify({ logger: true });

// Auto-load all models from src/models/
const models = await autoLoadModels(path.join(__dirname, 'models'));

// Register Allium with auto-loaded models
await app.register(alliumPlugin, {
  models,
  routePrefix: '/api',
});

await app.listen({ port: 3000 });
```

### Option 2: Using Sync Version (if async not available)

```typescript
import path from 'path';
import { autoLoadModelsSync } from '@allium/core';
import Fastify from 'fastify';
import { alliumPlugin } from '@allium/fastify';

const app = Fastify({ logger: true });

// Synchronously load all models
const models = autoLoadModelsSync(path.join(__dirname, 'models'));

await app.register(alliumPlugin, {
  models,
  routePrefix: '/api',
});

await app.listen({ port: 3000 });
```

### Option 3: Create a Helper Function

Create `src/utils/load-models.ts`:

```typescript
import path from 'path';
import { autoLoadModels } from '@allium/core';

export async function loadAllModels() {
  const modelsDir = path.join(__dirname, '..', 'models');
  return await autoLoadModels(modelsDir);
}
```

Then use it in your app:

```typescript
import { loadAllModels } from './utils/load-models';
import { alliumPlugin } from '@allium/fastify';

const models = await loadAllModels();

await app.register(alliumPlugin, {
  models,
  routePrefix: '/api',
});
```

## How It Works

The auto-loader:

1. Scans the `src/models/` directory for `.model.ts` or `.model.js` files
2. Dynamically imports each file
3. Extracts the exported `ModelDefinition` objects (created by `registerModel`)
4. Returns an array of all models

## Example Project Structure

```
src/
├── models/
│   ├── user.model.ts      # export const User = registerModel('User', {...})
│   ├── product.model.ts   # export const Product = registerModel('Product', {...})
│   └── order.model.ts     # export const Order = registerModel('Order', {...})
├── app.ts                 # Uses autoLoadModels() to load all models
└── index.ts               # Entry point
```

## Benefits

✅ **No Manual Imports**: Automatically discovers all models
✅ **Type-Safe**: Returns properly typed `ModelDefinition[]`
✅ **Error Handling**: Logs warnings if models fail to load
✅ **Flexible**: Works with both async and sync contexts
✅ **DRY**: No need to update imports when adding new models
