import { useState, useCallback, useEffect, useRef } from 'react';

interface UseDropzoneOptions {
  onDrop: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
}

interface UseDropzoneReturn {
  isDragActive: boolean;
  getRootProps: () => {
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onPaste: (e: React.ClipboardEvent) => void;
  };
  getInputProps: () => {
    type: 'file';
    multiple: boolean;
    accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    ref: React.RefObject<HTMLInputElement | null>;
  };
  open: () => void;
}

export function useDropzone({
  onDrop,
  accept = ['image/*'],
  multiple = true,
  disabled = false,
}: UseDropzoneOptions): UseDropzoneReturn {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const isValidFile = useCallback(
    (file: File) => {
      if (accept.includes('*') || accept.includes('*/*')) return true;
      return accept.some((acceptType) => {
        if (acceptType.endsWith('/*')) {
          const baseType = acceptType.replace('/*', '');
          return file.type.startsWith(baseType);
        }
        return file.type === acceptType;
      });
    },
    [accept]
  );

  const processFiles = useCallback(
    (files: FileList | File[] | null) => {
      if (!files || disabled) return;

      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(isValidFile);

      if (validFiles.length > 0) {
        onDrop(multiple ? validFiles : [validFiles[0]]);
      }
    },
    [disabled, isValidFile, multiple, onDrop]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    [disabled]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;
      if (!disabled && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragActive(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragActive(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      dragCounter.current = 0;

      if (!disabled) {
        processFiles(e.dataTransfer.files);
      }
    },
    [disabled, processFiles]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && isValidFile(file)) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        onDrop(multiple ? files : [files[0]]);
      }
    },
    [disabled, isValidFile, multiple, onDrop]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [processFiles]
  );

  const open = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  // Handle global paste events
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (disabled) return;

      // Don't handle paste if focus is on an input or textarea
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && isValidFile(file)) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        onDrop(multiple ? files : [files[0]]);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [disabled, isValidFile, multiple, onDrop]);

  return {
    isDragActive,
    getRootProps: () => ({
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onPaste: handlePaste,
    }),
    getInputProps: () => ({
      type: 'file' as const,
      multiple,
      accept: accept.join(','),
      onChange: handleChange,
      ref: inputRef,
    }),
    open,
  };
}

export default useDropzone;
