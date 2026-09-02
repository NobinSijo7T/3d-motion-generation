type Props = {
  playing: boolean;
  loop: boolean;
  speed: number;
  time: number;
  duration: number;
  onPlay: () => void;
  onStop: () => void;
  onLoop: (value: boolean) => void;
  onSpeed: (value: number) => void;
};

export function PlaybackControls({
  playing,
  loop,
  speed,
  time,
  duration,
  onPlay,
  onStop,
  onLoop,
  onSpeed,
}: Props) {
  return (
    <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-slate-400">
      <button className="rounded border border-slate-700 px-2 py-1" onClick={onStop} type="button">
        Stop
      </button>
      <button
        className="rounded border border-cyan-700 bg-cyan-500 px-3 py-1 text-slate-950"
        onClick={onPlay}
        type="button"
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <label className="ml-2 flex items-center gap-1">
        <input type="checkbox" checked={loop} onChange={(event) => onLoop(event.target.checked)} />
        Loop
      </label>
      <select
        value={speed}
        onChange={(event) => onSpeed(Number(event.target.value))}
        className="rounded border border-slate-700 bg-[#101a20] px-1 py-1"
      >
        {[0.25, 0.5, 1, 1.5, 2].map((value) => (
          <option key={value} value={value}>
            {value}x
          </option>
        ))}
      </select>
      <span className="ml-auto">
        {time.toFixed(2)} / {duration.toFixed(2)} sec
      </span>
    </div>
  );
}
