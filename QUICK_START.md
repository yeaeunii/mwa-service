# Quick Start Guide

## Start Development

```bash
cd miso-mwa-electron
pnpm dev
```

The Electron app will launch automatically with:

- ✅ Hot Module Replacement (HMR)
- ✅ DaisyUI styling
- ✅ Dark mode toggle
- ✅ Auto-imports enabled

## Build for Production

```bash
pnpm build
```

Output will be in `out/` directory.

## Build Platform-Specific

```bash
pnpm build:win     # Windows
pnpm build:mac     # macOS
pnpm build:linux   # Linux
```

## Common Tasks

### Add a New Page

1. Create file in `src/renderer/src/views/MyPage.vue`
2. Add route in `src/renderer/src/router/index.ts`:

```typescript
{
  path: '/my-page',
  name: 'my-page',
  component: () => import('@/views/MyPage.vue')
}
```

### Add a New Store

Create file in `src/renderer/src/stores/myStore.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMyStore = defineStore('my-store', () => {
  const data = ref(null)

  function updateData(newData) {
    data.value = newData
  }

  return { data, updateData }
})
```

### Add IPC Handler

1. In `src/main/index.ts`:

```typescript
ipcMain.handle('my:action', async () => {
  // Your code here
  return result
})
```

2. In `src/preload/index.ts`, add to INVOKE_CHANNELS:

```typescript
const INVOKE_CHANNELS = [
  'dialog:openFile',
  'shell:openExternal',
  'app:getVersion',
  'my:action' // Add your channel
]
```

3. Use in renderer:

```typescript
const result = await window.api.invoke('my:action')
```

## Project Structure Overview

```
src/
├── main/           # Electron main process (Node.js)
├── preload/        # Secure IPC bridge
└── renderer/       # Vue 3 app
    └── src/
        ├── views/      # Pages
        ├── components/ # Reusable components
        ├── stores/     # Pinia stores
        ├── router/     # Routes
        └── composables/ # Composition API utils
```

## Tips

- **Auto-imports**: No need to import `ref`, `computed`, `reactive`, `useRouter`, `useRoute`, `defineStore`, etc.
- **Components**: Components in `src/renderer/src/components/` are auto-registered
- **Composables**: Functions in `src/renderer/src/composables/` are auto-imported
- **DaisyUI**: Use `btn`, `card`, `navbar`, etc. classes directly
- **Theme**: Toggle between light/dark with the button in navbar

## Verification Checklist

After running `pnpm dev`, verify:

- [ ] Electron window opens
- [ ] DaisyUI styles are applied (navbar, cards, buttons)
- [ ] Dark mode toggle works
- [ ] Counter increments when button clicked
- [ ] System information displays correctly
- [ ] "Open File Dialog" button opens native dialog
- [ ] No console errors

## Troubleshooting

**Electron won't start?**

```bash
rm -rf node_modules out
pnpm install
pnpm dev
```

**Types not working?**

- Check that `auto-imports.d.ts` and `components.d.ts` exist
- Restart your IDE

**Tailwind classes not working?**

- Check `src/renderer/src/assets/main.css` has Tailwind imports
- Rebuild: `pnpm build`
