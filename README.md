# Database Explorer

A Mendix Studio Pro extension that provides a treeview pane for exploring the domain model structure of your app — modules, entities, attributes, and associations — at a glance.

## Features

- **Treeview navigation**: Browse modules → entities → attributes + associations in a collapsible tree
- **Expand / Collapse all**: Quickly open or close the entire tree from the header toolbar
- **Search**: Filter modules and entities by name
- **Association support**: Displays both intra-module and cross-module associations with target entity info
- **Attribute types**: Shows the Mendix attribute type next to each attribute name
- **Open Domain Model**: Double-click any entity to open its module's domain model editor in Studio Pro
- **Auto-refresh**: Reload the tree with a single click

## Architecture

```
src/
├── main/
│   ├── index.ts          # Extension entry point — registers pane & menu
│   └── style.css         # Base styles
├── ui/
│   └── pane.tsx          # React root for the pane
├── components/
│   └── database-explorer/
│       ├── index.tsx      # DatabaseExplorer component (tree, icons, data fetching)
│       └── database-explorer.css  # Tree & layout styles
└── manifest.json          # Mendix component manifest
```

### Key APIs Used

- **Domain Models API** (`studioPro.app.model.domainModels`) — load domain models per module, read entities, attributes, associations, and cross-associations
- **Projects API** (`studioPro.app.model.projects`) — list all modules in the app
- **Panes API** (`studioPro.ui.panes`) — register and open the side pane
- **Extensions Menu API** (`studioPro.ui.extensionsMenu`) — add a menu item to open the pane
- **Editors API** (`studioPro.ui.editors`) — open the domain model editor on double-click

## Build

```bash
npm run build        # Type-check + bundle
npm run build:dev    # Type-check + bundle with watch mode
```

### Build Pipeline

1. **TypeScript** — type checking via `tsc --noEmit`
2. **esbuild** — bundles TS/TSX entry points into `main.js` and `pane.js`
3. **CSS bundling** — all imported CSS files are combined into a single `style.css`
4. **Manifest** — `src/manifest.json` is copied to the output directory
5. **Deployment** — the built extension is copied to the configured Mendix app directory

### Configuration

Update `build-extension.mjs` to point to your Mendix app directory:

```javascript
const appDir = "path/to/your/mendix/app"
```

### Entry Points & Manifest

```json
{
  "mendixComponent": {
    "entryPoints": {
      "main": "main.js",
      "ui": {
        "pane": "pane.js"
      }
    }
  }
}
```

## Key Implementation Details

### Pane & Menu Registration (11.6+ API)

```typescript
const paneHandle = await studioPro.ui.panes.register(
    { title: "Database Explorer", initialPosition: "right" },
    { componentName: "extension/database-explorer", uiEntrypoint: "pane" }
);

await studioPro.ui.extensionsMenu.add({
    menuId: "database-explorer.MainMenu",
    caption: "Database Explorer",
    action: async () => {
        studioPro.ui.panes.open(paneHandle);
    }
});
```

### Association Resolution

Associations in the Mendix API reference parent and child entities by GUID. The extension builds an entity-ID-to-name mapping to resolve these into human-readable names:

```typescript
const entityIdToName: Record<string, string> = {};
for (const entity of domainModel.entities) {
    entityIdToName[entity.$ID] = entity.name;
}
```

Both `associations` (intra-module) and `crossAssociations` (cross-module) are extracted from the domain model.

### Open Domain Model on Double-Click

```typescript
await studioPro.ui.editors.editDocument(domainModelId);
```

## Tech Stack

- **Mendix Web Extensibility API** `v0.5.3-mendix.11.6.3`
- **React 18** with hooks
- **TypeScript 5**
- **esbuild** for bundling

## Resources

- [Mendix Web Extensibility API — Getting Started](https://docs.mendix.com/apidocs-mxsdk/apidocs/web-extensibility-api-11/getting-started/)
- [Model Access API](https://docs.mendix.com/apidocs-mxsdk/apidocs/web-extensibility-api-11/model-api/)
- [Editor API — Open a Document](https://docs.mendix.com/apidocs-mxsdk/apidocs/web-extensibility-api-11/editor-api/)
- [Menu API](https://docs.mendix.com/apidocs-mxsdk/apidocs/web-extensibility-api-11/menu-api/)

## License

MIT
