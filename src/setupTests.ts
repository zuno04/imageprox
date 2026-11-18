import '@testing-library/jest-dom'
import { vi } from 'vitest';
import React from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// React only batches updates inside act() when this flag is set; without it the
// testing library emits "not configured to support act(...)" on every update.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Node 26 defines a global `localStorage` that is undefined unless the process
 * is started with --localstorage-file, and it shadows the jsdom one. Install a
 * deterministic in-memory Storage so tests do not depend on the node flag.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

if (!globalThis.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

// Initialize i18n for tests - using the labels that tests expect
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        'convertAction.title': 'Your Image Optimizer',
        'convertAction.maxSizeLabel': 'Max Size (MB)',
        'convertAction.maxDimensionLabel': 'Max Width/Height (px)',
        'convertAction.outputFormatLabel': 'Output Format',
        'convertAction.selectFormatPlaceholder': 'Select format',
        'convertAction.formatOriginal': 'Keep Original',
        'convertAction.formatPng': 'PNG',
        'convertAction.formatJpg': 'JPG',
        'convertAction.formatWebp': 'WEBP',
        'convertAction.formatAvif': 'AVIF',
        'convertAction.webpWarning': 'WEBP offers better compression but may not be supported by all devices.',
        'convertAction.avifWarning': 'AVIF offers excellent compression but has limited browser support.',
        'convertAction.avifNotSupported': 'AVIF is not supported in this browser. Falling back to WebP.',
        'convertAction.compressionModeLabel': 'Compression Mode',
        'convertAction.modeAggressive': 'Aggressive (Smaller Size)',
        'convertAction.modeHighQuality': 'High Quality (Larger Size)',
        'convertAction.keepExifLabel': 'Keep EXIF Data (camera, GPS). Applies to JPEGs. May increase size.',
        'convertAction.processButton_zero': 'Convert Images',
        'convertAction.processButton_one': 'Convert ({{count}})',
        'convertAction.processButton_other': 'Convert ({{count}})',
        'convertAction.processButton': 'Convert ({{count}})',
        'convertAction.processingMessage': 'Processing images...',
        'convertAction.reducedFileNamePrefix': 'Reduced_',
        'convertAction.errorFailedToReadBlob': 'Failed to read blob.',
        'convertAction.errorUnexpectedResultFormat': 'Unexpected result format.',
        'convertAction.errorUnknown': 'Unknown error.',
        'convertAction.compressionFailed': 'Compression failed: {{message}}',
        'toast.processingStarted': 'Processing {{count}} images...',
        'toast.processingComplete': '{{count}} images processed successfully.',
        'toast.processingError': 'Processing failed.',
      },
    },
  },
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock new components that don't need to be tested in ConvertAction tests
vi.mock('@/components/presets/PresetSelector', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-preset-selector' }),
}));

vi.mock('@/components/progress/ProcessingProgress', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-processing-progress' }),
}));

vi.mock('@/components/ai/FormatSuggestion', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-format-suggestion' }),
}));

vi.mock('@/components/ai/QualitySuggestion', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-quality-suggestion' }),
}));

/**
 * createElement with permissive props. The mocks forward arbitrary attributes
 * (including data-* test ids), which the strict element prop types reject.
 */
type CreateElement = (
  type: React.ElementType,
  props?: Record<string, unknown> | null,
  ...children: React.ReactNode[]
) => React.ReactElement;

const createEl = React.createElement as unknown as CreateElement;

// Global mock for Radix UI Select component using React context
vi.mock('@/components/ui/select', () => {
  const SelectContext = React.createContext<{ onValueChange?: (val: string) => void }>({});

  interface SelectMockProps {
    children?: React.ReactNode;
    value?: string;
    onValueChange?: (val: string) => void;
    [key: string]: unknown;
  }

  const SelectMock = ({ children, value, onValueChange, ...props }: SelectMockProps) =>
    createEl(SelectContext.Provider, { value: { onValueChange } },
      createEl('div', {
        'data-testid': 'global-mock-select',
        'data-value': value,
        ...props,
      }, children)
    );

  const SelectTriggerMock = ({ children, ...props }: SelectMockProps) =>
    createEl('button', {
      'data-testid': 'global-mock-select-trigger',
      type: 'button',
      ...props,
    }, children);

  const SelectValueMock = ({ placeholder }: { placeholder?: string }) =>
    createEl('span', null, placeholder);

  const SelectContentMock = ({ children, ...props }: SelectMockProps) =>
    createEl('div', {
      'data-testid': 'global-mock-select-content',
      ...props,
    }, children);

  const SelectItemMock = ({ children, value, ...props }: SelectMockProps) => {
    const ctx = React.useContext(SelectContext);
    return createEl('div', {
      'data-testid': `global-mock-select-item-${String(value)}`,
      onClick: () => ctx.onValueChange && ctx.onValueChange(String(value)),
      ...props,
    }, children);
  };

  const SelectGroupMock = ({ children }: SelectMockProps) =>
    createEl('div', null, children);

  const SelectLabelMock = ({ children }: SelectMockProps) =>
    createEl('div', null, children);

  return {
    Select: SelectMock,
    SelectTrigger: SelectTriggerMock,
    SelectValue: SelectValueMock,
    SelectContent: SelectContentMock,
    SelectItem: SelectItemMock,
    SelectGroup: SelectGroupMock,
    SelectLabel: SelectLabelMock,
    SelectSeparator: () => createEl('hr'),
    SelectScrollUpButton: () => null,
    SelectScrollDownButton: () => null,
  };
});

// Global mock for Radix UI RadioGroup component using React context
vi.mock('@/components/ui/radio-group', () => {
  const RadioGroupContext = React.createContext<{
    onValueChange?: (val: string) => void;
    groupValue?: string;
  }>({});

  interface RadioGroupMockProps {
    children?: React.ReactNode;
    value?: string;
    onValueChange?: (val: string) => void;
    className?: string;
    [key: string]: unknown;
  }

  interface RadioGroupItemMockProps {
    value: string;
    id?: string;
    [key: string]: unknown;
  }

  const RadioGroupMock = ({
    children,
    value,
    onValueChange,
    className,
    ...props
  }: RadioGroupMockProps) =>
    createEl(RadioGroupContext.Provider, { value: { onValueChange, groupValue: value } },
      createEl('div', {
        'data-testid': 'global-mock-radiogroup',
        'data-value': value,
        className,
        ...props,
      }, children)
    );

  const RadioGroupItemMock = ({ value, id, ...props }: RadioGroupItemMockProps) => {
    const ctx = React.useContext(RadioGroupContext);
    const isChecked = ctx.groupValue === value;
    return createEl('div', {
      'data-testid': `global-mock-radiogroup-item-container-${value}`,
      onClick: () => ctx.onValueChange && ctx.onValueChange(value),
      ...props,
    },
      createEl('input', {
        type: 'radio',
        'data-testid': `global-mock-radiogroup-input-${value}`,
        id,
        value,
        checked: isChecked,
        readOnly: true,
      })
    );
  };

  return {
    RadioGroup: RadioGroupMock,
    RadioGroupItem: RadioGroupItemMock,
  };
});

// Global mock for Radix UI Checkbox component
vi.mock('@/components/ui/checkbox', () => {
  interface CheckboxMockProps {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    [key: string]: unknown;
  }

  const CheckboxMock = ({ id, checked, onCheckedChange, ...props }: CheckboxMockProps) =>
    createEl('div', {
      'data-testid': `global-mock-checkbox-${String(id)}`,
      ...props,
    },
      createEl('input', {
        type: 'checkbox',
        'data-testid': `global-mock-checkbox-input-${String(id)}`,
        id,
        checked: !!checked,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          onCheckedChange && onCheckedChange(event.target.checked),
      })
    );

  return {
    Checkbox: CheckboxMock,
  };
});
