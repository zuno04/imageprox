import '@testing-library/jest-dom'
import { vi } from 'vitest';
import React from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

// Global mock for Radix UI Select component using React context
vi.mock('@/components/ui/select', () => {
  const SelectContext = React.createContext<{ onValueChange?: (val: string) => void }>({});

  const SelectMock = ({ children, value, onValueChange, ...props }: any) => {
    return React.createElement(SelectContext.Provider, { value: { onValueChange } },
      React.createElement('div', {
        'data-testid': 'global-mock-select',
        'data-value': value,
        ...props,
      }, children)
    );
  };

  const SelectTriggerMock = ({ children, ...props }: any) => {
    return React.createElement('button', {
      'data-testid': 'global-mock-select-trigger',
      type: 'button',
      ...props,
    }, children);
  };

  const SelectValueMock = ({ placeholder }: any) => {
    return React.createElement('span', null, placeholder);
  };

  const SelectContentMock = ({ children, ...props }: any) => {
    return React.createElement('div', {
      'data-testid': 'global-mock-select-content',
      ...props,
    }, children);
  };

  const SelectItemMock = ({ children, value, ...props }: any) => {
    const ctx = React.useContext(SelectContext);
    return React.createElement('div', {
      'data-testid': `global-mock-select-item-${value}`,
      onClick: () => ctx.onValueChange && ctx.onValueChange(value),
      ...props,
    }, children);
  };

  return {
    Select: SelectMock,
    SelectTrigger: SelectTriggerMock,
    SelectValue: SelectValueMock,
    SelectContent: SelectContentMock,
    SelectItem: SelectItemMock,
    SelectGroup: ({ children }: any) => React.createElement('div', null, children),
    SelectLabel: ({ children }: any) => React.createElement('div', null, children),
    SelectSeparator: () => React.createElement('hr'),
    SelectScrollUpButton: () => null,
    SelectScrollDownButton: () => null,
  };
});

// Global mock for Radix UI RadioGroup component using React context
vi.mock('@/components/ui/radio-group', () => {
  const RadioGroupContext = React.createContext<{ onValueChange?: (val: string) => void; groupValue?: string }>({});

  const RadioGroupMock = ({ children, value, onValueChange, className, ...props }: any) => {
    return React.createElement(RadioGroupContext.Provider, { value: { onValueChange, groupValue: value } },
      React.createElement('div', {
        'data-testid': 'global-mock-radiogroup',
        'data-value': value,
        className,
        ...props,
      }, children)
    );
  };

  const RadioGroupItemMock = ({ value, id, ...props }: any) => {
    const ctx = React.useContext(RadioGroupContext);
    const isChecked = ctx.groupValue === value;
    return React.createElement('div', {
      'data-testid': `global-mock-radiogroup-item-container-${value}`,
      onClick: () => ctx.onValueChange && ctx.onValueChange(value),
      ...props,
    },
      React.createElement('input', {
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
  const CheckboxMock = ({ id, checked, onCheckedChange, ...props }: any) => {
    return React.createElement('div', {
      'data-testid': `global-mock-checkbox-${id}`,
      ...props,
    },
      React.createElement('input', {
        type: 'checkbox',
        'data-testid': `global-mock-checkbox-input-${id}`,
        id,
        checked: !!checked,
        onChange: (e: any) => onCheckedChange && onCheckedChange(e.target.checked),
      })
    );
  };

  return {
    Checkbox: CheckboxMock,
  };
});
