import type { HealthStatus, MotionEngineId } from '../types/motion';

type Props = {
  engine: MotionEngineId;
  duration: string;
  variations: number;
  speed: number;
  health: HealthStatus | null;
  onEngine: (value: MotionEngineId) => void;
  onDuration: (value: string) => void;
  onVariations: (value: number) => void;
  onSpeed: (value: number) => void;
};

const FALLBACK_ENGINES = [
  { id: 'preview', label: 'Quick Preview', model: 'Procedural Preview', available: true, requires_setup: false },
  { id: 'humanml3d', label: 'HumanML3D', model: 'Comp_v6_KLD01', available: false, requires_setup: true },
  { id: 'kimodo', label: 'Kimodo', model: 'Kimodo-SOMA-RP-v1.1', available: false, requires_setup: true },
] as const;

export function ModelPanel({
  engine,
  duration,
  variations,
  speed,
  health,
  onEngine,
  onDuration,
  onVariations,
  onSpeed,
}: Props) {
  const engines = health?.available_engines?.length ? health.available_engines : FALLBACK_ENGINES;
  const selected = engines.find((item) => item.id === engine);
  return (
    <div className="space-y-3">
      <label className="block font-mono text-[10px] tracking-widest text-slate-500">MODEL</label>
      <select
        value={engine}
        onChange={(event) => onEngine(event.target.value as MotionEngineId)}
        className="w-full rounded border border-slate-700 bg-[#101a20] px-3 py-2 text-sm"
      >
        {engines.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label} - {item.available ? item.model : `${item.model} setup needed`}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block font-mono text-[10px] text-slate-500">DURATION</label>
          <input
            type="number"
            min={1}
            max={9}
            placeholder="Auto"
            value={duration}
            onChange={(event) => onDuration(event.target.value)}
            className="w-full rounded border border-slate-700 bg-[#101a20] px-2 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] text-slate-500">VARIATIONS</label>
          <select
            value={variations}
            onChange={(event) => onVariations(Number(event.target.value))}
            className="w-full rounded border border-slate-700 bg-[#101a20] px-2 py-2"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block font-mono text-[10px] text-slate-500">SPEED</label>
        <select
          value={speed}
          onChange={(event) => onSpeed(Number(event.target.value))}
          className="w-full rounded border border-slate-700 bg-[#101a20] px-2 py-2"
        >
          {[0.25, 0.5, 1, 1.5, 2].map((value) => (
            <option key={value} value={value}>
              {value}x
            </option>
          ))}
        </select>
      </div>
      <details className="rounded border border-slate-800 p-2 text-[11px] text-slate-400">
        <summary className="cursor-pointer font-mono text-[10px] tracking-widest">ADVANCED</summary>
        <p className="mt-2">Batch size is locked to 1 for 4 GB VRAM. Groq plans language; motion runs locally.</p>
        <p className="mt-1">CUDA: {health?.cuda_available ? 'available' : 'not detected'}</p>
        <p>Selected: {selected?.label || engine}</p>
        <p>Model files: {selected?.available ? 'ready' : 'setup needed'}</p>
      </details>
    </div>
  );
}
