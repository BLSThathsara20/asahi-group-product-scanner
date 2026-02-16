import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Button } from './Button';

const PAGE_SIZES = [10, 20, 50];

export function Pagination({ page, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (totalPages <= 1 && totalItems <= pageSize) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-4 border-t border-slate-200 bg-slate-50">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span>
          Showing {totalItems === 0 ? 0 : start}–{end} of {totalItems}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1.5 border border-slate-300 rounded text-sm min-w-0"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s} per page</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1 sm:gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="p-2 min-w-0"
            onClick={() => onPageChange(1)}
            disabled={!hasPrev}
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" strokeWidth={2} />
          </Button>
          <Button
            variant="outline"
            className="p-2 min-w-0"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev}
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </Button>
        </div>
        <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="p-2 min-w-0"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </Button>
          <Button
            variant="outline"
            className="p-2 min-w-0"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNext}
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  );
}
