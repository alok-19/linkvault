'use client';

import { Search, Plus, Moon, Sun, BarChart3, RefreshCw, Import, Shield } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';

import { StatsModal } from '../modals/StatsModal';
import { ExportImportModal } from '../modals/ExportImportModal';

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  totalLinks: number;
  onLinkAdded: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  showAddModal?: boolean;
  onShowAddModalChange?: (open: boolean) => void;
  onHealthCheck?: () => void;
  checkingHealth?: boolean;
}

export function Header({ search, onSearchChange, totalLinks, onLinkAdded, onRefresh, refreshing, showAddModal: controlledShowAddModal, onShowAddModalChange, onHealthCheck, checkingHealth }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [internalShowAddModal, setInternalShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showExportImportModal, setShowExportImportModal] = useState(false);

  const showAddModal = controlledShowAddModal ?? internalShowAddModal;
  const setShowAddModal = (open: boolean) => {
    setInternalShowAddModal(open);
    onShowAddModalChange?.(open);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LV</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold">LinkVault</h1>
                <p className="text-xs text-muted-foreground">{totalLinks} links saved</p>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-4 hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search links... (press /)"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg hover:bg-background transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowExportImportModal(true)}
                className="p-2 rounded-lg hover:bg-background transition-colors"
                title="Export / Import"
              >
                <Import className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={onHealthCheck}
                disabled={checkingHealth}
                className="p-2 rounded-lg hover:bg-background transition-colors disabled:opacity-50"
                title="Check link health"
              >
                <Shield className={`w-5 h-5 text-muted-foreground ${checkingHealth ? 'animate-pulse' : ''}`} />
              </button>

              <button
                onClick={() => setShowStatsModal(true)}
                className="p-2 rounded-lg hover:bg-background transition-colors"
                title="Stats"
              >
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-background transition-colors"
                title="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Link</span>
              </button>
            </div>
          </div>

          <div className="sm:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search links..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </header>

      <StatsModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} />
      <ExportImportModal
        isOpen={showExportImportModal}
        onClose={() => setShowExportImportModal(false)}
        onImportSuccess={onLinkAdded}
      />
    </>
  );
}
