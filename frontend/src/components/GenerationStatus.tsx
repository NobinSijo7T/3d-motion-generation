type Props = {
  loading: boolean;
  status: string;
};

export function GenerationStatus({ loading, status }: Props) {
  return (
    <div className="font-mono text-[10px] tracking-widest text-slate-400">
      {loading ? <span className="text-amber-300">● {status}</span> : <span className="text-emerald-400">● READY</span>}
    </div>
  );
}
