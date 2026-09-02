import { api } from '../api/client';

type Props = {
  motionId: string | null;
};

export function ExportPanel({ motionId }: Props) {
  if (!motionId) {
    return <p className="text-xs text-slate-500">Generate a motion to enable export.</p>;
  }
  return (
    <div className="flex gap-2">
      {(['npy', 'npz', 'json'] as const).map((format) => (
        <a
          key={format}
          className="flex-1 rounded border border-slate-700 bg-[#14242b] py-2 text-center font-mono text-[10px] uppercase text-cyan-300"
          href={api.downloadUrl(motionId, format)}
        >
          {format}
        </a>
      ))}
    </div>
  );
}
