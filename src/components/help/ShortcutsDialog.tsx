import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SHORTCUTS, formatShortcut } from '@/lib/shortcuts';
import { Keyboard } from 'lucide-react';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();

  // Group shortcuts by category
  const groupedShortcuts = [
    {
      title: 'File Operations',
      shortcuts: SHORTCUTS.filter((s) =>
        ['openFiles', 'processImages', 'downloadAll'].includes(s.action)
      ),
    },
    {
      title: 'Selection',
      shortcuts: SHORTCUTS.filter((s) =>
        ['selectAll', 'deselectAll', 'deleteSelected'].includes(s.action)
      ),
    },
    {
      title: 'Navigation',
      shortcuts: SHORTCUTS.filter((s) =>
        ['navigatePrev', 'navigateNext', 'escape', 'toggleView', 'showShortcuts'].includes(s.action)
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard size={20} />
            {t('shortcuts.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {groupedShortcuts.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.action}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm">{t(shortcut.description)}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {t('shortcuts.showShortcuts')}: Press <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded border">?</kbd>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsDialog;
