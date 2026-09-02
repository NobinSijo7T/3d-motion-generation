import { FileText, Github, Settings } from 'lucide-react';

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
      <nav className="flex items-center gap-5 text-xs text-slate-400">
        <a className="hover:text-cyan-300" href="#docs">
          <span className="inline-flex items-center gap-1">
            <FileText size={14} /> Docs
          </span>
        </a>
        <a className="hover:text-cyan-300" href="https://github.com/EricGuo5513/text-to-motion" target="_blank" rel="noreferrer">
          <span className="inline-flex items-center gap-1">
            <Github size={14} /> GitHub
          </span>
        </a>
        <button className="rounded border border-slate-700 p-1.5 hover:text-cyan-300" aria-label="Settings">
          <Settings size={14} />
        </button>
      </nav>
    </header>
  );
}
