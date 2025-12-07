# Allium VSCode Extension

IntelliSense and tooling for Allium model JSON files.

## Features

- ✅ **IntelliSense & Auto-complete**: Smart suggestions for field types, relation types, and model names
- ✅ **Real-time Validation**: Instant error detection for invalid model references
- ✅ **Code Snippets**: Quick templates for models, fields, and relations
- ✅ **Configurable**: Custom model directory path via settings
- ⏳ **Model Visualization**: Interactive diagrams (coming soon)

## Installation

### For Development

1. Navigate to the extension directory:

   ```bash
   cd packages/vscode-extension
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Compile the extension:

   ```bash
   npm run compile
   ```

4. Press `F5` in VSCode to launch Extension Development Host

### From VSIX (Local Install)

```bash
npm run package
code --install-extension allium-vscode-0.1.0.vsix
```

## Usage

### Auto-complete

Open any `.json` file in your `.allium/models/` directory and start typing:

- Type `"type":` to see field type suggestions (String, Int, Float, Boolean, DateTime, Json, Enum)
- Type `"model":` to see available model names for relations
- Type `allium-` to see available code snippets

### Snippets

- `allium-model` - Create a basic model
- `allium-field-string` - Add a String field
- `allium-field-enum` - Add an Enum field
- `allium-relation-1n` - Add a one-to-many relation

### Commands

Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

- **Allium: Visualize Current Model** - View diagram of current model (placeholder)
- **Allium: Visualize All Models** - View all models in workspace (placeholder)

### Settings

Configure the model directory in VSCode settings:

```json
{
  "allium.modelDirectory": ".allium/models"
}
```

## Development

### Project Structure

```
src/
├── extension.ts              # Main entry point
├── providers/
│   ├── completionProvider.ts # Auto-complete logic
│   └── diagnosticProvider.ts # Validation logic
├── utils/
│   ├── config.ts            # Configuration management
│   └── modelLoader.ts       # Model caching & watching
└── schemas/
    └── model.schema.json    # Allium model schema
```

### Building

```bash
npm run compile        # Compile with webpack
npm run watch         # Watch mode for development
npm run package       # Create .vsix package
```

### Schema Management

> **Important:** The extension uses a JSON schema (`src/schemas/model.schema.json`) to provide validation and IntelliSense. This schema must be kept in sync with the core model types defined in `@allium/core`. If you update the model types, please ensure the JSON schema is updated accordingly to match the new definitions.

### Testing

1. Open the extension directory in VSCode
2. Press `F5` to launch Extension Development Host
3. Open an Allium project with model files
4. Test IntelliSense, validation, and snippets

## Roadmap

- [ ] Complete model visualization with Mermaid.js
- [ ] Add hover provider with documentation
- [ ] Expand snippet library
- [ ] Add JSON schema validation
- [ ] Publish to VSCode Marketplace

## Contributing

Contributions are welcome! Please ensure:

1. Code follows existing patterns
2. TypeScript compiles without errors
3. Extension works in Development Host

## License

MIT
