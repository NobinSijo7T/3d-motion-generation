import type { MotionRecord } from '../types/motion';

type Props = {
  items: MotionRecord[];
  onSelect: (id: string) => void;
};

export function HistoryPanel({ items, onSelect }: Props) {
  return (
    <section className="flex items-center gap-3 overflow-auto border-t border-slate-800 px-6 py-2 font-mono text-[10px] text-slate-500">
      <span>HISTORY</span>
      {items.slice(0, 8).map((item) => (
        <button
          key={item.id}
          className="whitespace-nowrap text-slate-300 hover:text-cyan-300"
          onClick={() => onSelect(item.id)}
          type="button"
        >
          {item.prompt.slice(0, 40)}
          <span className="ml-2 text-slate-600">{new Date(item.created_at).toLocaleTimeString()}</span>
        </button>
      ))}
    </section>
  );
}
