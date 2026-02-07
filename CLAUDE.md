# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ImageProx is a privacy-first, client-side browser-based image optimization tool. All processing happens locally in the browser—no server uploads. Built with React 19, TypeScript, Vite, and Tailwind CSS.

## Commands

```bash
pnpm dev        # Start dev server (localhost:5173)
pnpm build      # TypeScript check + production build
pnpm lint       # Run ESLint
pnpm test       # Run Vitest test suite
pnpm coverage   # Generate coverage report
```

Run a single test file:
```bash
pnpm vitest run src/components/ConvertAction.test.tsx
```

## Architecture

### 3-Column Layout Data Flow

```
FileUpload (upload) → ConvertAction (compress) → FileRenderDownload (download)
     ↓                       ↓                            ↓
imagesToProcess[]     browser-image-compression     convertedImages[]
   (File[])           (Web Worker processing)       (base64 data URLs)
```

### Key State in App.tsx
- `imagesToProcess`: Uploaded File objects
- `convertedImages`: Array of `{image_name, image_data}` (base64)
- `previewIndex`: Current image in modal preview

### Component Structure
- `src/components/` - Main feature components (FileUpload, ConvertAction, FileRenderDownload)
- `src/components/ui/` - Shadcn UI components (button, dialog, input, etc.)
- `src/components/modals/` - Modal components using React portals (#modal-root)
- `src/components/layout/` - Header and Footer
- `src/lib/` - Utilities (i18n config, localStorage helpers, ZIP generation)

### Core Libraries
- **browser-image-compression**: Image compression engine with format conversion
- **jszip**: ZIP file generation for bulk downloads
- **i18next**: Internationalization (5 languages: en, fr, de, es, zh-CN)
- **next-themes**: Light/dark mode management

## Key Patterns

### Path Aliases
Use `@/*` to import from `src/`:
```typescript
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
```

### Translations
Translations are in `public/locales/{lang}/translation.json`. Use in components:
```typescript
const { t } = useTranslation()
return <span>{t('section.key')}</span>
```

### localStorage Persistence
Settings (compression options, zoom level, theme) persist via type-safe helpers:
```typescript
saveToLocalStorage('key', value)
const data = loadFromLocalStorage<Type>('key')
```

### Modal Portals
AdvancedImagePreviewModal renders to `#modal-root` portal. Supports keyboard navigation (Esc, arrows), zoom, rotation, and image editing (rotate data, grayscale filter).

## Testing

- Framework: Vitest with jsdom environment
- Tests colocated with components (`.test.tsx` files)
- Setup file: `src/setupTests.ts` (jest-dom matchers)
