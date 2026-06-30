import { useMemo, useState } from 'react';
import { useItems } from '../hooks/useItems';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProductImage } from '../components/ui/ProductImage';
import { LabelSheet } from '../components/Labels/LabelSheet';
import { downloadLabelsPdf } from '../services/labelPrintService';
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
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  const rowCount = Number(rows);
  const labelsPerSheet = 3 * rowCount;

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

  const clearSelection = () => setSelectedIds(new Set());

  const handlePreview = () => {
    if (selectedItems.length === 0) {
      notifyError('Select at least one product');
      return;
    }
    setShowPreview(true);
    success(`${selectedItems.length} product${selectedItems.length !== 1 ? 's' : ''} ready to print`);
  };

  const handlePrint = () => {
    if (selectedItems.length === 0) return;
    setShowPreview(true);
    setTimeout(() => window.print(), 300);
  };

  const handleDownloadPdf = async () => {
    if (selectedItems.length === 0) return;
    setShowPreview(true);
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
    <>
      <PageContainer width="wide" className="no-print">
        <PageHeader
          title="Print labels"
          subtitle="Select products and print A4 sheets with QR codes and barcodes to stick on items"
        />

        <Card className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">Layout per sheet:</span>
              <SegmentPills options={ROW_OPTIONS} value={rows} onChange={setRows} />
              <span className="text-xs text-slate-400">
                3 × {rowCount} = {labelsPerSheet} labels
              </span>
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

        <Card className="p-4">
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={filterInputClass}
          />
          <p className="text-xs text-slate-500 mt-2">
            {selectedIds.size} selected · {filtered.length} shown
          </p>
        </Card>

        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon="package" title="No products found" description="Try a different search" />
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {filtered.map((item) => {
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

        <div className="flex flex-wrap gap-3 sticky bottom-20 md:bottom-4 z-10 bg-slate-50/95 backdrop-blur py-2 -mx-1 px-1">
          <Button onClick={handlePreview} disabled={selectedIds.size === 0}>
            Preview ({selectedIds.size})
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={selectedIds.size === 0}>
            Print A4
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf} disabled={selectedIds.size === 0 || exporting}>
            {exporting ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>

        {showPreview && selectedItems.length > 0 && (
          <div id="print-labels-root" className="space-y-8 print-label-preview mt-6">
            <h2 className="text-sm font-medium text-slate-600 no-print">Preview — one A4 page per product</h2>
            {selectedItems.map((item) => (
              <LabelSheet key={item.id} item={item} rows={rowCount} />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
