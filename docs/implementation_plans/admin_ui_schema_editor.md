# Implementation Plan: Admin UI & Schema Editor

## Overview

To provide a "Wow" factor and compete with Headless CMSs like Strapi and Keystone, we will implement a **Dynamic Admin UI** and a **Schema Editor**. This allows users to manage content and modify their data model (create tables, add columns) directly from a web interface in Development mode.

## Architecture

### 1. The Schema API (Backend)

We will add a set of "Internal" API endpoints to `@allium/fastify` that are only available when `NODE_ENV=development`. These endpoints will allow the Admin UI to read and write the project's source code (specifically the model definitions).

**New Plugin:** `@allium/fastify/src/plugins/admin-api.ts`

**Endpoints:**

- `GET /_admin/config`: Get project configuration (name, db type, etc).
- `GET /_admin/models`: List all models and their full schema (fields, relations).
- `POST /_admin/models`: Create a new model.
  - **Payload:** `{ name: "Product", fields: [...] }`
  - **Action:** Creates `.allium/models/product.json` and `src/models/product.model.ts`.
- `PATCH /_admin/models/:name`: Update a model (add/edit fields).
  - **Payload:** `{ fields: [...] }`
  - **Action:** Updates `.allium/models/{name}.json`.
- `DELETE /_admin/models/:name`: Delete a model.
  - **Action:** Deletes the JSON and TS files.

**Sync Trigger:**
After any write operation, the API should trigger the equivalent of `allium sync` to regenerate the Prisma schema and client. Since the server is running, we might need to spawn a child process or invoke the core logic directly.

### 2. The Admin UI (Frontend)

We will create a new package `packages/admin` which is a Next.js application.

**Stack:**

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + Shadcn/UI
- **State/Data:** Apollo Client (GraphQL) for Content; React Query (REST) for Schema Editor (Hybrid approach).

**Features:**

- **Schema Builder:** A UI to create models and add fields (Text, Number, Boolean, Relation, etc.).
- **Content Manager:** A dynamic CRUD interface for all models.
  - List View (Data Table with pagination/sorting).
  - Create/Edit View (Auto-generated forms).

### 3. Orchestration

- The `allium dev` command currently runs the Fastify server.
- We need to decide how to run the Admin UI.
  - **Option A:** Run it on a separate port (e.g., 3001) alongside the API.
  - **Option B:** Serve the static build of the Admin UI from the Fastify server (harder for dev mode).
  - **Decision:** Run as a separate process in dev mode. The user will run `allium dev`, which will use `concurrently` to run both the API and the Admin UI.

## Step-by-Step Implementation

### Phase 1: The Schema API

1.  Create `packages/fastify/src/plugins/admin-api.ts`.
2.  Implement `GET /_admin/models` by reading `.allium/schema.json` or aggregating `.allium/models/*.json`.
3.  Implement `POST` and `PATCH` endpoints to write to the file system.
4.  Implement the "Sync" trigger (using `child_process.exec` to run `allium sync` or importing the logic).

### Phase 2: The Admin UI Scaffold

1.  Initialize `packages/admin` with `create-next-app`.
2.  Configure it to proxy requests to `http://localhost:3000` (the API).
3.  Set up the basic layout (Sidebar, Header).

### Phase 3: The Schema Builder UI

1.  Create the "Model List" page.
2.  Create the "Model Editor" page (drag-and-drop or form-based field editor).
3.  Connect to the Schema API.

### Phase 4: The Content Manager UI

1.  Create a dynamic route `/admin/content/[model]`.
2.  Fetch the schema for the model.
3.  Generate the Table and Form dynamically.

## Next Steps

Start with **Phase 1: The Schema API**.
