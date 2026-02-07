import { useState, useCallback } from 'react';
import type { SelectionState } from '@/types';

/**
 * Hook for managing multi-select functionality
 */
export function useSelection<T extends { id: string }>(items: T[]) {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedIds: new Set<string>(),
    lastSelectedId: null,
  });

  const isSelected = useCallback(
    (id: string) => selectionState.selectedIds.has(id),
    [selectionState.selectedIds]
  );

  const toggle = useCallback((id: string) => {
    setSelectionState((prev) => {
      const newSelected = new Set(prev.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return {
        selectedIds: newSelected,
        lastSelectedId: id,
      };
    });
  }, []);

  const select = useCallback((id: string) => {
    setSelectionState((prev) => {
      const newSelected = new Set(prev.selectedIds);
      newSelected.add(id);
      return {
        selectedIds: newSelected,
        lastSelectedId: id,
      };
    });
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectionState((prev) => {
      const newSelected = new Set(prev.selectedIds);
      newSelected.delete(id);
      return {
        selectedIds: newSelected,
        lastSelectedId: prev.lastSelectedId === id ? null : prev.lastSelectedId,
      };
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectionState({
      selectedIds: new Set(items.map((item) => item.id)),
      lastSelectedId: items.length > 0 ? items[items.length - 1].id : null,
    });
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectionState({
      selectedIds: new Set(),
      lastSelectedId: null,
    });
  }, []);

  const selectRange = useCallback(
    (id: string) => {
      if (!selectionState.lastSelectedId) {
        toggle(id);
        return;
      }

      const lastIndex = items.findIndex(
        (item) => item.id === selectionState.lastSelectedId
      );
      const currentIndex = items.findIndex((item) => item.id === id);

      if (lastIndex === -1 || currentIndex === -1) {
        toggle(id);
        return;
      }

      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);

      setSelectionState((prev) => {
        const newSelected = new Set(prev.selectedIds);
        for (let i = start; i <= end; i++) {
          newSelected.add(items[i].id);
        }
        return {
          selectedIds: newSelected,
          lastSelectedId: id,
        };
      });
    },
    [items, selectionState.lastSelectedId, toggle]
  );

  const handleClick = useCallback(
    (id: string, event: React.MouseEvent) => {
      if (event.shiftKey && selectionState.lastSelectedId) {
        selectRange(id);
      } else if (event.ctrlKey || event.metaKey) {
        toggle(id);
      } else {
        // Single click without modifiers - select only this item
        setSelectionState({
          selectedIds: new Set([id]),
          lastSelectedId: id,
        });
      }
    },
    [selectionState.lastSelectedId, selectRange, toggle]
  );

  const getSelectedItems = useCallback(() => {
    return items.filter((item) => selectionState.selectedIds.has(item.id));
  }, [items, selectionState.selectedIds]);

  const selectedCount = selectionState.selectedIds.size;
  const hasSelection = selectedCount > 0;
  const allSelected = selectedCount === items.length && items.length > 0;

  return {
    selectedIds: selectionState.selectedIds,
    selectedCount,
    hasSelection,
    allSelected,
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    deselectAll,
    selectRange,
    handleClick,
    getSelectedItems,
  };
}

export default useSelection;
