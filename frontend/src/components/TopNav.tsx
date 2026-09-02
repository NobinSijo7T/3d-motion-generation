export function TopNav() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#0b1014] px-6">
      <div className="flex items-center gap-3">
        <span className="text-cyan-400">✣</span>
        <h1 className="text-base font-semibold tracking-wide">Motion AI Studio</h1>
        <span className="hidden font-mono text-[10px] tracking-[0.18em] text-slate-500 sm:inline">
          LOCAL MOTION LAB
        </span>
      </div>
    </header>
  );
}
