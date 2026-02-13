# Mendix Documenter Extension

A Mendix Studio Pro extension that adds Markdown document support with a rich text editor.

## Overview

This extension demonstrates how to build custom document types in Mendix Studio Pro using the Web Extensibility API. It registers a new Markdown document type and provides a tab-based editor with MDXEditor for rich editing capabilities.

## Features

- **Custom Document Type**: Registers Markdown documents in the Mendix model
- **Rich Editor**: Full-featured Markdown editor with toolbar

## Architecture

### Core Components

- `src/main/index.ts` - Extension entry point, registers document type and editor
- `src/ui/editor.tsx` - React component for the editor tab
- `src/components/markdown-canvas/` - MDXEditor integration with save functionality

### Key APIs Used

- **Custom Blob Documents API**: Registers and manages Markdown documents
- **UI Editors API**: Registers the editor as a tab interface

## Build Process

The extension uses **esbuild** for fast bundling with custom plugins:

### Entry Points & Manifest Relationship

The build process defines entry points that map to the `manifest.json` configuration:

```javascript
// build-extension.mjs
const entryPoints = [
    { in: 'src/main/index.ts', out: 'main' },      // → main.js
    { in: 'src/ui/editor.tsx', out: 'editor' }     // → editor.js
]
```

These correspond to the manifest:
```json
{
  "mendixComponent": {
    "entryPoints": {
      "main": "main.js",
      "ui": {
        "editor": "editor.js"
      }
    }
  }
}
```

### CSS Bundling

CSS files are automatically bundled using the `bundleCssPlugin`:

- **Collection**: All imported CSS files are collected during build
- **Bundling**: Combined into a single `style.css` file in the output
- **Injection**: Can auto-inject stylesheets into the document head
- **Import**: Simply import CSS in your TypeScript files:
  ```typescript
  import "../main/style.css";
  import "../components/markdown-canvas/markdown-canvas.css";
  ```

### Build Pipeline

1. **TypeScript Compilation**: Type checking with `tsc --noEmit`
2. **esbuild Bundling**: Code splitting, tree shaking, asset optimization
3. **CSS Bundling**: Combines all CSS into single file
4. **Manifest Copy**: Copies `src/manifest.json` to output
5. **App Deployment**: Copies built extension to Mendix app directory

### Development

```bash
npm run build        # Production build
npm run build:dev    # Development with watch mode
```

### Configuration

Update `build-extension.mjs` to point to your Mendix app directory:

```javascript
const appDir = "path/to/your/mendix/app"
```

## Key Implementation Details

### Document Registration

```typescript
await studioPro.app.model.customBlobDocuments.registerDocumentType<MarkdownDocument>({
    type: 'mendixdocumenter.MarkdownDocument',
    readableTypeName: 'Markdown',
    defaultContent: { content: '' }
});
```

### Editor Registration

```typescript
await studioPro.ui.editors.registerEditorForCustomDocument({
    documentType: 'mendixdocumenter.MarkdownDocument',
    editorEntryPoint: 'editor',
    editorKind: 'tab',
    iconLight: markdownLightThemeIcon,
    iconDark: markdownDarkThemeIcon
});
```

### Content Persistence

```typescript
studioPro.app.model.customBlobDocuments.updateDocumentContent(documentId, { 
    content: newContent 
});
```

## Resources

- [Mendix Web Extensibility API Getting Started](https://docs.mendix.com/apidocs-mxsdk/apidocs/web-extensibility-api-11/getting-started/)
- [Custom Blob Document API](https://docs.mendix.com/apidocs-mxsdk/apidocs/web-extensibility-api-11/custom-blob-document-api/)
- [MDXEditor Documentation](https://mdxeditor.dev/editor/docs/getting-started)

## License

MIT
