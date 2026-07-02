import { LabelCell } from './LabelCell';

const COLS = 3;

/** One A4 page — one label per product, up to 3 columns × rows. */
export function LabelSheet({ items, maxRows = 4, pageIndex = 0 }) {
  const count = items.length;
  const rows = Math.min(maxRows, Math.max(1, Math.ceil(count / COLS)));

  return (
    <div
      className="a4-sheet bg-white shadow-sm border border-slate-200 mx-auto"
      data-page-index={pageIndex}
    >
      <div
        className="a4-sheet-grid a4-sheet-grid-fit"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {items.map((item) => (
          <LabelCell
            key={item.id}
            itemId={item.id}
            name={item.name}
            code={item.qr_id}
            category={item.category}
            vehicleModel={item.vehicle_model}
          />
        ))}
      </div>
    </div>
  );
}

export { COLS };
