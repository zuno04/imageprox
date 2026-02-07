import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid, Trash2, CheckSquare, Square } from 'lucide-react';
import ThumbnailCard from './ThumbnailCard';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/types';

interface GridItem {
  id: string;
  name: string;
  size: number;
  thumbnail?: string;
  downloadUrl?: string;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

interface ThumbnailGridProps {
  items: GridItem[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedIds: Set<string>;
  onSelect: (id: string, event: React.MouseEvent) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onPreview: (index: number) => void;
  onRemove: (index: number) => void;
  onRemoveSelected: () => void;
  showSelectionControls?: boolean;
  className?: string;
}

const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  items,
  viewMode,
  onViewModeChange,
  selectedIds,
  onSelect,
  onSelectAll,
  onDeselectAll,
  onPreview,
  onRemove,
  onRemoveSelected,
  showSelectionControls = true,
  className,
}) => {
  const { t } = useTranslation();
  const hasSelection = selectedIds.size > 0;
  const allSelected = selectedIds.size === items.length && items.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2 rounded-r-none"
              onClick={() => onViewModeChange('list')}
              title={t('gallery.viewList')}
            >
              <List size={16} />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2 rounded-l-none"
              onClick={() => onViewModeChange('grid')}
              title={t('gallery.viewGrid')}
            >
              <LayoutGrid size={16} />
            </Button>
          </div>

          {/* Selection controls */}
          {showSelectionControls && items.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={allSelected ? onDeselectAll : onSelectAll}
              >
                {allSelected ? (
                  <>
                    <Square size={16} className="mr-1" />
                    {t('gallery.deselectAll')}
                  </>
                ) : (
                  <>
                    <CheckSquare size={16} className="mr-1" />
                    {t('gallery.selectAll')}
                  </>
                )}
              </Button>

              {hasSelection && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive"
                  onClick={onRemoveSelected}
                >
                  <Trash2 size={16} className="mr-1" />
                  {t('gallery.deleteSelected')}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Selection count */}
        {hasSelection && (
          <span className="text-sm text-muted-foreground">
            {t('gallery.selected', { count: selectedIds.size })}
          </span>
        )}
      </div>

      {/* Grid/List content */}
      {items.length > 0 ? (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
              : 'space-y-2'
          )}
        >
          {items.map((item, index) => (
            <ThumbnailCard
              key={item.id}
              id={item.id}
              name={item.name}
              size={item.size}
              thumbnail={item.thumbnail}
              isSelected={selectedIds.has(item.id)}
              onSelect={onSelect}
              onPreview={() => onPreview(index)}
              onRemove={() => onRemove(index)}
              downloadUrl={item.downloadUrl}
              showCheckbox={viewMode === 'grid'}
              status={item.status}
              progress={item.progress}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('dropzone.dragInactive')}</p>
        </div>
      )}
    </div>
  );
};

export default ThumbnailGrid;
