type Props = {
  duration: number;
  current: number;
};

export function TimelineRuler({ duration, current }: Props) {
  const ticks = Math.max(2, Math.ceil(duration || 9) + 1);
  return (
    <div className="relative ml-20 mt-3 mb-2 h-5">
      <div className="flex justify-between font-mono text-[10px] text-slate-500">
        {Array.from({ length: ticks }, (_, index) => (
          <span key={index}>{index}s</span>
        ))}
      </div>
      <div
        className="absolute top-0 h-5 w-px bg-cyan-300"
        style={{ left: `${duration ? (current / duration) * 100 : 0}%` }}
      />
    </div>
  );
}
