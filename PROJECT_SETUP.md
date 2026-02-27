# miso-mwa-electron - Project Setup Summary

## Overview

This is a modern desktop application built with Electron, Vue 3, TypeScript, Tailwind CSS 4, and DaisyUI.

## Tech Stack

- **Electron** 39.6.1 - Desktop application framework
- **Vue 3** 3.5.29 - Progressive JavaScript framework
- **TypeScript** 5.9.3 - Type-safe JavaScript
- **Tailwind CSS** 4.2.1 - Utility-first CSS framework
- **DaisyUI** 5.5.19 - Component library for Tailwind
- **Pinia** 3.0.4 - State management
- **Vue Router** 5.0.3 - Client-side routing
- **electron-vite** 5.0.0 - Build tooling
- **unplugin-auto-import** - Automatic imports
- **unplugin-vue-components** - Automatic component registration

## Project Structure

````
miso-mwa-electron/
├── src/
│   ├── main/                      # Electron main process
│   │   └── index.ts              # Main process entry point
│   ├── preload/                   # Electron preload scripts
│   │   ├── index.ts              # Preload script with IPC handlers
│   │   └── index.d.ts            # Type definitions for window.api
│   └── renderer/                  # Vue application
│       └── src/
│           ├── assets/            # Static assets
│           │   └── main.css      # Tailwind CSS imports
│           ├── components/        # Vue components
│           │   ├── ui/           # DaisyUI wrapper components
│           │   └── layout/       # Layout components
│           ├── composables/       # Composition API utilities
│           │   └── useElectron.ts # IPC communication wrapper
│           ├── router/            # Vue Router configuration
│           │   └── index.ts      # Routes definition
│           ├── stores/            # Pinia stores
│           │   ├── index.ts      # Pinia instance
│           │   └── counter.ts    # Example store
│           ├── types/             # TypeScript types
│           ├── views/             # Page components
│           │   └── HomeView.vue  # Home page
│           ├── App.vue            # Root component with navbar
│           ├── main.ts            # Application entry point
│           ├── auto-imports.d.ts  # Auto-generated imports
│           └── components.d.ts    # Auto-generated component types
├── electron.vite.config.ts        # Vite configuration
├── electron-builder.yml           # Build configuration
├── package.json                   # Dependencies and scripts
├── tsconfig.web.json             # TypeScript config for renderer
├── .eslintrc.cjs                 # ESLint configuration
├── .prettierrc.yaml              # Prettier configuration
└── .gitignore                    # Git ignore rules

## Features Implemented

### 1. Electron Configuration
- **Main Process**: Window management, auto-updater, IPC handlers
- **Preload Script**: Secure IPC bridge with whitelisted channels
- **IPC Handlers**:
  - `dialog:openFile` - Open file dialog
  - `shell:openExternal` - Open external URLs
  - `app:getVersion` - Get application version
- **Auto-updater**: Ready for production updates

### 2. Vue 3 Setup
- **Composition API**: Using setup script syntax
- **Pinia**: State management with composition API style
- **Vue Router**: Hash-based routing (required for Electron)
- **Auto-imports**: Vue, Router, Pinia APIs auto-imported

### 3. UI/UX
- **DaisyUI**: Component library with Tailwind CSS 4
- **Dark Mode**: Theme toggle in navbar
- **Responsive**: Mobile-first design
- **Components**:
  - Navbar with theme toggle
  - Counter card (Pinia demo)
  - System info card
  - Tech stack display

### 4. Development Experience
- **Auto-imports**: Vue APIs, composables, stores
- **Auto-component Registration**: Components automatically registered
- **TypeScript**: Full type safety with auto-generated types
- **Hot Module Replacement**: Fast development iteration
- **ESLint + Prettier**: Code quality and formatting

## Available Scripts

```bash
# Development
pnpm dev              # Start development server with HMR

# Build
pnpm build            # Build for production
pnpm build:win        # Build for Windows
pnpm build:mac        # Build for macOS
pnpm build:linux      # Build for Linux

# Code Quality
pnpm lint             # Lint code with ESLint
pnpm format           # Format code with Prettier
pnpm typecheck        # Type check with TypeScript
````

## Getting Started

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Start Development Server**

   ```bash
   pnpm dev
   ```

3. **Build for Production**
   ```bash
   pnpm build
   ```

## Key Configuration Files

### electron.vite.config.ts

- Tailwind CSS plugin configured
- Auto-import for Vue APIs and composables
- Auto-component registration
- Path aliases (@, @renderer)

### package.json

- Scripts for development and building
- All dependencies properly configured

### tsconfig.web.json

- Includes auto-generated type files
- Path aliases configured

## IPC Communication

### From Renderer to Main (Invoke)

```typescript
// In any Vue component or composable
const result = await window.api.invoke('dialog:openFile')
```

### Listening to Main Process Events

```typescript
// In any Vue component
const unsubscribe = window.api.on('update:available', () => {
  console.log('Update available!')
})
// Call unsubscribe() when component unmounts
```

### Type-Safe IPC with useElectron Composable

```typescript
import { useElectron } from '@/composables/useElectron'

const { invoke, on } = useElectron()
const version = await invoke<string>('app:getVersion')
```

## Styling with Tailwind + DaisyUI

### Using DaisyUI Components

```vue
<template>
  <button class="btn btn-primary">Click me</button>
  <div class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">Title</h2>
      <p>Content</p>
    </div>
  </div>
</template>
```

### Theme Configuration

Themes are configured in `src/renderer/src/assets/main.css`:

```css
@import 'tailwindcss';
@plugin "daisyui" {
  themes:
    light --default,
    dark --prefersdark;
}
```

## Best Practices

1. **Security**: Always use preload script for IPC, never disable context isolation
2. **Routing**: Use `createWebHashHistory()` for Electron compatibility
3. **State Management**: Use Pinia with composition API for reactive state
4. **Type Safety**: Leverage auto-generated types from unplugin packages
5. **Auto-imports**: Add frequently used composables to the `composables/` directory

## Next Steps

1. **Add More Views**: Create new pages in `src/renderer/src/views/`
2. **Build Components**: Add reusable components in `src/renderer/src/components/`
3. **Extend Stores**: Add new Pinia stores in `src/renderer/src/stores/`
4. **Add IPC Handlers**: Extend main process functionality in `src/main/index.ts`
5. **Customize Theme**: Modify DaisyUI theme in `main.css`

## Troubleshooting

### Build Issues

- Clear the `out/` directory: `rm -rf out`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`

### Type Errors

- Regenerate auto-import types: Delete `auto-imports.d.ts` and `components.d.ts`, then run `pnpm dev`

### IPC Errors

- Check that channels are whitelisted in `src/preload/index.ts`
- Verify handlers are registered in `src/main/index.ts`

## Resources

- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [Vue 3 Documentation](https://vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [DaisyUI Documentation](https://daisyui.com/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [electron-vite Documentation](https://electron-vite.org/)
