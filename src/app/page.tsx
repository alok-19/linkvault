'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { LinkGrid } from '@/components/dashboard/LinkGrid';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { BulkActionsToolbar } from '@/components/dashboard/BulkActionsToolbar';
import { EditLinkModal } from '@/components/modals/EditLinkModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { AddLinkModal } from '@/components/modals/AddLinkModal';
import { ShortcutsHelpModal } from '@/components/modals/ShortcutsHelpModal';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Link as LinkType, LinkStatus } from '@/types';
import { useKeyboard } from '@/hooks/useKeyboard';

function DashboardContent() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLinks, setTotalLinks] = useState(0);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({ unread: 0, reading: 0, archived: 0 });
  const [brokenCount, setBrokenCount] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const handleStatusChange = (newStatus: string) => {
    setStatus(prev => prev === newStatus ? 'all' : newStatus);
  };
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLink, setEditLink] = useState<LinkType | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLinkId, setDeleteLinkId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<number>>(new Set());
  const [prefillUrl, setPrefillUrl] = useState('');
  const [prefillTitle, setPrefillTitle] = useState('');

  const { toast } = useToast();
  const isAnyModalOpen = editModalOpen || deleteModalOpen || showAddModal || showHelp;

  // Handle ?action=add from PWA shortcut and Web Share Target
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add') {
      const sharedUrl = params.get('url') || params.get('text') || '';
      const sharedTitle = params.get('title') || '';
      if (sharedUrl) setPrefillUrl(sharedUrl);
      if (sharedTitle) setPrefillTitle(sharedTitle);
      setShowAddModal(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const fetchLinks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      if (status !== 'all') params.set('status', status);
      params.set('sort', sort);
      params.set('page', page.toString());
      params.set('limit', '20');

      const response = await fetch(`/api/links?${params}`);
      const data = await response.json();

      console.log('[LinkVault] fetchLinks response:', data);
      setLinks(data.links || []);
      setTotalLinks(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      console.error('Failed to fetch links:', error);
    } finally {
      setLoading(false);
    }
  }, [search, category, status, sort, page]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      console.log('[LinkVault] fetchStats response:', data);
      setCategories(data.categories);
      setStatusCounts(data.status_counts || { unread: 0, reading: 0, archived: 0 });
      setBrokenCount(data.broken_count || 0);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    // Batch initial load to reduce perceived latency
    Promise.all([fetchLinks(), fetchStats()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [search, category, status, sort]);

  const handleDelete = async (id: number) => {
    setDeleteLinkId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteLinkId) return;

    try {
      await fetch(`/api/links/${deleteLinkId}`, { method: 'DELETE' });
      toast('Link deleted');
      fetchLinks(true);
      fetchStats();
    } catch (error) {
      toast('Failed to delete link', 'error');
    } finally {
      setDeleteModalOpen(false);
      setDeleteLinkId(null);
    }
  };

  const handleEdit = (link: LinkType) => {
    setEditLink(link);
    setEditModalOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLinks(true), fetchStats()]);
    setRefreshing(false);
  };

  const handleHealthCheck = async () => {
    setCheckingHealth(true);
    try {
      const response = await fetch('/api/links/health-check', { method: 'POST' });
      const data = await response.json();
      toast(`Checked ${data.checked} links. ${data.broken} broken links found.`);
      fetchLinks(true);
      fetchStats();
    } catch (error) {
      toast('Health check failed', 'error');
    } finally {
      setCheckingHealth(false);
    }
  };

  useKeyboard({
    onSearchFocus: () => {
      const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      input?.focus();
    },
    onNewLink: () => {
      if (!isAnyModalOpen) setShowAddModal(true);
    },
    onNavigate: (direction) => {
      if (isAnyModalOpen || links.length === 0) return;
      setSelectedIndex(prev => {
        if (direction === 'down') {
          return prev < links.length - 1 ? prev + 1 : 0;
        } else {
          return prev > 0 ? prev - 1 : links.length - 1;
        }
      });
    },
    onOpen: () => {
      if (selectedIndex >= 0 && selectedIndex < links.length) {
        const link = links[selectedIndex];
        fetch(`/api/links/${link.id}/click`, { method: 'POST' });
        window.open(link.url, '_blank');
      }
    },
    onSelect: () => {
      if (selectedIndex >= 0 && selectedIndex < links.length) {
        const link = links[selectedIndex];
        setSelectedLinkIds(prev => {
          const next = new Set(prev);
          if (next.has(link.id)) next.delete(link.id);
          else next.add(link.id);
          return next;
        });
      }
    },
    onDelete: () => {
      if (selectedIndex >= 0 && selectedIndex < links.length) {
        handleDelete(links[selectedIndex].id);
      }
    },
    onEscape: () => {
      if (showHelp) {
        setShowHelp(false);
      } else if (editModalOpen) {
        setEditModalOpen(false);
        setEditLink(null);
      } else if (deleteModalOpen) {
        setDeleteModalOpen(false);
        setDeleteLinkId(null);
      } else if (showAddModal) {
        setShowAddModal(false);
      } else if (search) {
        setSearch('');
      } else {
        setSelectedIndex(-1);
        setSelectedLinkIds(new Set());
      }
    },
    onHelp: () => {
      if (!isAnyModalOpen) setShowHelp(true);
    },
  });

  const deleteLinkTitle = links.find(l => l.id === deleteLinkId)?.title || 'this link';

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedLinkIds);
    if (ids.length === 0) return;

    try {
      await fetch('/api/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      toast(`${ids.length} links deleted`);
      setSelectedLinkIds(new Set());
      fetchLinks(true);
      fetchStats();
    } catch (error) {
      toast('Failed to delete links', 'error');
    }
  };

  const handleBulkStatusChange = async (newStatus: LinkStatus) => {
    const ids = Array.from(selectedLinkIds);
    if (ids.length === 0) return;

    try {
      await fetch('/api/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: newStatus }),
      });
      toast(`${ids.length} links marked as ${newStatus}`);
      setSelectedLinkIds(new Set());
      fetchLinks(true);
      fetchStats();
    } catch (error) {
      toast('Failed to update links', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        search={search}
        onSearchChange={handleSearchChange}
        totalLinks={totalLinks}
        onLinkAdded={() => {
          fetchLinks(true);
          fetchStats();
        }}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        showAddModal={showAddModal}
        onShowAddModalChange={setShowAddModal}
        onHealthCheck={handleHealthCheck}
        checkingHealth={checkingHealth}
      />

      <FilterBar
        categories={categories}
        totalLinks={totalLinks}
        activeCategory={category}
        onCategoryChange={setCategory}
        activeStatus={status}
        onStatusChange={handleStatusChange}
        statusCounts={statusCounts}
        sort={sort}
        onSortChange={setSort}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {links.length === 0 && !loading ? (
          <EmptyState onLinkAdded={() => {
            fetchLinks(true);
            fetchStats();
          }} />
        ) : (
          <>
            <LinkGrid
              links={links}
              loading={loading}
              totalLinks={totalLinks}
              onDelete={handleDelete}
              onEdit={handleEdit}
              selectedIndex={selectedIndex}
              selectedLinkIds={selectedLinkIds}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Previous
                </button>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <EditLinkModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditLink(null);
        }}
        link={editLink}
        onSuccess={() => {
          fetchLinks(true);
          toast('Link updated');
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteLinkId(null);
        }}
        onConfirm={confirmDelete}
        linkTitle={deleteLinkTitle}
      />

      <AddLinkModal
        isOpen={showAddModal}
        initialUrl={prefillUrl}
        initialTitle={prefillTitle}
        onClose={() => { setShowAddModal(false); setPrefillUrl(''); setPrefillTitle(''); }}
        onSuccess={() => {
          fetchLinks(true);
          fetchStats();
          setShowAddModal(false);
          setPrefillUrl('');
          setPrefillTitle('');
        }}
      />

      <ShortcutsHelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      <BulkActionsToolbar
        selectedCount={selectedLinkIds.size}
        onClearSelection={() => setSelectedLinkIds(new Set())}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
