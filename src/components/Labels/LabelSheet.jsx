import { LabelCell } from './LabelCell';

const COLS = 3;

export function LabelSheet({ item, rows = 4 }) {
  const code = item.qr_id;
  const count = COLS * rows;

  return (
    <div
      className="a4-sheet bg-white shadow-sm border border-slate-200 mx-auto"
      data-item-id={item.id}
      data-item-name={item.name}
    >
      <div
        className="a4-sheet-grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: count }, (_, i) => (
          <LabelCell key={`${item.id}-${i}`} name={item.name} code={code} />
        ))}
      </div>
    </div>
  );
}
