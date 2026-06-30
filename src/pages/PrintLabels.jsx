import { useMemo, useState } from 'react';
import { useItems } from '../hooks/useItems';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProductImage } from '../components/ui/ProductImage';
import { LabelSheet } from '../components/Labels/LabelSheet';
import { COLS, chunkItemsForPages, downloadLabelsPdf } from '../services/labelPrintService';
import { NavIcon } from '../components/icons/NavIcons';
import {
  PageContainer,
  PageHeader,
  PageSkeleton,
  EmptyState,
  SegmentPills,
  filterInputClass,
} from '../components/ui/PageLayout';

const ROW_OPTIONS = [
  { id: '3', label: '3 rows' },
  { id: '4', label: '4 rows' },
];

export function PrintLabels() {
  const { items, loading } = useItems();
  const { success, error: notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [rows, setRows] = useState('4');
  const [listView, setListView] = useState('all');
  const [exporting, setExporting] = useState(false);

  const rowCount = Number(rows);
  const labelsPerSheet = COLS * rowCount;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.qr_id?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id) && item.qr_id),
    [items, selectedIds]
  );

  const labelPages = useMemo(
    () => chunkItemsForPages(selectedItems, rowCount),
    [selectedItems, rowCount]
  );

  const listItems = useMemo(() => {
    let list = listView === 'selected'
      ? items.filter((item) => selectedIds.has(item.id))
      : filtered;
    if (listView === 'selected' && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.qr_id?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [listView, filtered, items, selectedIds, search]);

  const previewSummary = useMemo(() => {
    if (selectedItems.length === 0) return null;
    const n = selectedItems.length;
    const pages = labelPages.length;
    const labelWord = n === 1 ? '1 label' : `${n} labels`;
    const pageWord = pages === 1 ? '1 A4 page' : `${pages} A4 pages`;
    return `${labelWord} · ${pageWord}`;
  }, [selectedItems.length, labelPages.length]);

  const toggleItem = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((item) => {
        if (item.qr_id) next.add(item.id);
      });
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setListView('all');
  };

  const handlePrint = () => {
    if (selectedItems.length === 0) {
      notifyError('Select at least one product');
      return;
    }
    setTimeout(() => window.print(), 200);
  };

  const handleDownloadPdf = async () => {
    if (selectedItems.length === 0) {
      notifyError('Select at least one product');
      return;
    }
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      await downloadLabelsPdf(selectedItems, rowCount);
      success('PDF downloaded');
    } catch (err) {
      notifyError(err.message || 'PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <PageSkeleton variant="table" />;
  }

  return (
    <PageContainer width="wide">
      <div className="no-print space-y-6">
        <PageHeader
          title="Print labels"
          subtitle="Each selected product gets one label — up to 3 per row on A4"
        />

        <Card className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">Max rows on A4:</span>
              <SegmentPills options={ROW_OPTIONS} value={rows} onChange={setRows} />
              <span className="text-xs text-slate-400">Up to {labelsPerSheet} products per page</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="text-sm" onClick={selectAllFiltered}>
                Select filtered
              </Button>
              <Button variant="outline" className="text-sm" onClick={clearSelection} disabled={selectedIds.size === 0}>
                Clear
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={filterInputClass}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              {selectedIds.size} selected
            </p>
            <SegmentPills
              options={[
                { id: 'all', label: 'All products' },
                { id: 'selected', label: `Selected (${selectedIds.size})` },
              ]}
              value={listView}
              onChange={setListView}
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          {listView === 'selected' && selectedIds.size === 0 ? (
            <EmptyState
              icon="printer"
              title="No products selected"
              description="Tick products in the list or switch to All products"
            />
          ) : listItems.length === 0 ? (
            <EmptyState icon="package" title="No products found" description="Try a different search" />
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
              {listItems.map((item) => {
                const checked = selectedIds.has(item.id);
                return (
                  <li key={item.id}>
                    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/80 transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(item.id)}
                        className="w-4 h-4 rounded border-slate-300 text-asahi focus:ring-asahi/30"
                      />
                      {item.photo_url ? (
                        <ProductImage
                          src={item.photo_url}
                          alt=""
                          className="w-10 h-10 rounded shrink-0"
                          iconClassName="w-5 h-5"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <NavIcon name="package" className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{item.name}</p>
                        <p className="text-xs font-mono text-slate-500 truncate">{item.qr_id || 'No code'}</p>
                      </div>
                      {item.category && (
                        <span className="text-xs text-slate-400 shrink-0 hidden sm:block">{item.category}</span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handlePrint} disabled={selectedIds.size === 0}>
            Print A4
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf} disabled={selectedIds.size === 0 || exporting}>
            {exporting ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <section className="mt-8 pt-6 border-t border-slate-200">
        <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Print preview</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {previewSummary || 'Select products — one label per product, shown below'}
            </p>
          </div>
          {labelPages.length > 1 && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              Scroll to see all pages
            </span>
          )}
        </div>

        <div className="print-preview-viewport rounded-xl border border-slate-200 bg-slate-100/80 p-4 sm:p-6">
          <div id="print-labels-root" className="print-preview-pages">
            {selectedItems.length === 0 ? (
              <div className="print-preview-empty">
                <NavIcon name="printer" className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">Nothing to preview yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Select products above — each gets one label on the sheet
                </p>
              </div>
            ) : (
              labelPages.map((pageItems, index) => (
                <div key={`page-${index}`} className="print-preview-page">
                  <div className="print-preview-page-label">
                    <span className="text-xs font-medium text-slate-500">
                      Page {index + 1} of {labelPages.length}
                    </span>
                    <span className="text-xs text-slate-400">
                      {pageItems.length} product{pageItems.length !== 1 ? 's' : ''}
                      {pageItems.length === 1 ? ` · ${pageItems[0].name}` : ''}
                    </span>
                  </div>
                  <LabelSheet items={pageItems} maxRows={rowCount} pageIndex={index} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
