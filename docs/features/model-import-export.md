# Model Import/Export

The Model Import/Export feature allows you to backup, share, and migrate your Allium model schemas between projects or environments.

## Features

### Export Models

#### Export All Models

1. Navigate to **Import / Export** page
2. Click **Export Schema** button
3. Downloads `allium-schema-YYYY-MM-DD.json` containing all models

#### Export Single Model

1. Navigate to **Models** page
2. Hover over any model card
3. Click the **Download** icon (green)
4. Downloads `modelname-YYYY-MM-DD.json` for that specific model

### Import Models

1. Navigate to **Import / Export** page
2. Click to upload a JSON schema file
3. **Preview** all models in the file with field/relation counts
4. **Select** specific models to import using checkboxes
5. Use **Select All** / **Deselect All** for convenience
6. Choose import strategy:
   - **Skip Existing**: Ignores models that already exist
   - **Overwrite**: Replaces existing models with imported versions
7. Click **Import X Selected Models**
8. View detailed results (imported, skipped, errors)

## Schema Format

Exported files follow this structure:

\`\`\`json
{
"version": "0.1.0",
"exportedAt": "2025-12-07T06:30:00.000Z",
"models": [
{
"name": "User",
"fields": [...],
"relations": [...],
"routes": {...}
}
]
}
\`\`\`

## Use Cases

- **Backup**: Export your schema regularly for version control
- **Migration**: Move models between development, staging, and production
- **Sharing**: Share specific models with team members or across projects
- **Templates**: Create reusable model templates for new projects

## API Endpoints

### Export

- `GET /_admin/models` - Get all models
- `GET /_admin/models/:name` - Get single model

### Import

- `POST /_admin/models/import` - Import models with strategy
  ```json
  {
    "models": [...],
    "strategy": "skip" | "overwrite"
  }
  ```

## Technical Details

- Version is read from `package.json` automatically
- Files are downloaded client-side (no server upload)
- Import triggers `allium sync` to update database schema
- Both JSON and TypeScript model files are created/updated
