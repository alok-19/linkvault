'use client';

import { useState, useEffect } from 'react';
import { X, Link2, MousePointerClick, TrendingUp, Clock, Globe, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardStats } from '@/types';
import { CATEGORIES } from '@/types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const topCategory = stats?.categories
    ? Object.entries(stats.categories).sort((a, b) => b[1] - a[1])[0]
    : null;

  const categoryColor = topCategory
    ? CATEGORIES.find(c => c.name === topCategory[0])?.color || '#6366f1'
    : '#6366f1';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold">Dashboard Stats</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : stats ? (
                  <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Link2 className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Total Links</span>
                        </div>
                        <span className="text-3xl font-bold">{stats.total}</span>
                      </div>

                      <div className="bg-background border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MousePointerClick className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Total Clicks</span>
                        </div>
                        <span className="text-3xl font-bold">{stats.total_clicks}</span>
                      </div>

                      <div className="bg-background border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-muted-foreground">Broken Links</span>
                        </div>
                        <span className={`text-3xl font-bold ${(stats as any).broken_count > 0 ? 'text-red-500' : ''}`}>
                          {(stats as any).broken_count || 0}
                        </span>
                      </div>
                    </div>

                    {/* Top Category */}
                    {topCategory && (
                      <div className="bg-background border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-muted-foreground">Top Category</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="px-3 py-1 rounded-full text-white text-sm font-medium"
                            style={{ backgroundColor: categoryColor }}
                          >
                            {CATEGORIES.find(c => c.name === topCategory[0])?.label || topCategory[0]}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {topCategory[1]} links
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Categories Breakdown */}
                    {Object.keys(stats.categories).length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          Categories
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(stats.categories)
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, count]) => {
                              const cat = CATEGORIES.find(c => c.name === name);
                              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                              return (
                                <div key={name} className="flex items-center gap-3">
                                  <div className="w-24 text-xs text-muted-foreground truncate">
                                    {cat?.label || name}
                                  </div>
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: cat?.color || '#737373',
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium w-8 text-right">{count}</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Top Domains */}
                    {stats.top_domains.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          Top Domains
                        </h3>
                        <div className="space-y-2">
                          {stats.top_domains.map(({ domain, count }) => (
                            <div key={domain} className="flex items-center justify-between py-1.5 px-3 bg-background rounded-lg">
                              <span className="text-sm truncate">{domain}</span>
                              <span className="text-xs text-muted-foreground">{count} links</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recently Saved */}
                    {stats.recent.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          Recently Saved
                        </h3>
                        <div className="space-y-2">
                          {stats.recent.map(link => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 py-2 px-3 bg-background rounded-lg hover:bg-muted transition-colors"
                            >
                              {link.favicon_url && (
                                <img src={link.favicon_url} alt="" className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="text-sm truncate flex-1">{link.title || link.domain}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {link.domain}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Failed to load stats</p>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
