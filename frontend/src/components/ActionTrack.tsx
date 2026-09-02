type Props = {
  label: string;
  start: number;
  duration: number;
  total: number;
  muted?: boolean;
  text?: string;
};

export function ActionTrack({ label, start, duration, total, muted, text }: Props) {
  const left = total ? (start / total) * 100 : 0;
  const width = total ? (duration / total) * 100 : 0;
  return (
    <div className="flex h-7 items-center gap-2">
      <span className="w-20 shrink-0 font-mono text-[9px] uppercase tracking-wider text-slate-500">{label}</span>
      <div className="relative h-3.5 flex-1 overflow-hidden rounded-sm bg-[#132029]">
        {duration > 0 && (
          <div
            className={`absolute top-0 h-full ${muted ? 'bg-slate-700' : 'bg-[#1b7c9f]'} px-1 font-mono text-[9px] text-cyan-50`}
            style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
}
