import { useEffect, useRef, useState } from 'react';
import { api } from './api/client';
import { ErrorBanner } from './components/ErrorBanner';
import { ExportPanel } from './components/ExportPanel';
import { GenerationStatus } from './components/GenerationStatus';
import { HistoryPanel } from './components/HistoryPanel';
import { ModelPanel } from './components/ModelPanel';
import { MotionViewer } from './components/MotionViewer';
import { PromptEditor } from './components/PromptEditor';
import { Timeline } from './components/Timeline';
import { TopNav } from './components/TopNav';
import { usePlayback } from './hooks/usePlayback';
import type { HealthStatus, MotionEngineId, MotionPlan, MotionRecord } from './types/motion';

export default function App() {
  const [prompt, setPrompt] = useState(
    'A person walks toward a chair, sits down, waits for two seconds, and then stands up.',
  );
  const [duration, setDuration] = useState('');
  const [variations, setVariations] = useState(1);
  const [engine, setEngine] = useState<MotionEngineId>('preview');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [frames, setFrames] = useState<number[][][]>([]);
  const [bones, setBones] = useState<number[][]>([]);
  const [plan, setPlan] = useState<MotionPlan | undefined>();
  const [motion, setMotion] = useState<MotionRecord | null>(null);
  const [motionPrompt, setMotionPrompt] = useState('');
  const [history, setHistory] = useState<MotionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resetCamera = useRef<(() => void) | undefined>();
  const playback = usePlayback(frames.length, motion?.fps || 20);

  useEffect(() => {
    api.health()
      .then((status) => {
        setHealth(status);
        if (status.motion_engine === 'preview' || status.motion_engine === 'humanml3d' || status.motion_engine === 'kimodo') {
          setEngine(status.motion_engine);
        }
      })
      .catch(() => undefined);
    api.motions().then(setHistory).catch(() => undefined);
  }, [motion]);

  async function loadMotion(id: string) {
    const record = await api.motion(id);
    const data = await api.data(id);
    setMotion(record);
    setMotionPrompt(record.prompt);
    setPlan(record.plan || data.plan);
    setFrames(data.frames);
    setBones(data.bones);
    playback.setFrame(0);
  }

  async function generate() {
    if (prompt.trim().length < 3) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.generate(prompt, duration ? Number(duration) : null, variations, engine);
      setPlan(result.plan);
      await loadMotion(result.motion_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080b0f] text-slate-200">
      <TopNav />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(0,1.05fr)_320px]">
        <div className="flex min-h-0 flex-col gap-3">
          <MotionViewer
            frames={frames}
            prompt={motionPrompt}
            bones={bones}
            frame={playback.frame}
            fps={motion?.fps || 20}
            onResetRef={(fn) => {
              resetCamera.current = fn;
            }}
          />
          <Timeline
            plan={plan}
            duration={motion?.duration || 0}
            time={playback.time}
            frame={playback.frame}
            frames={frames.length}
            playing={playback.playing}
            loop={playback.loop}
            speed={playback.speed}
            onFrame={playback.setFrame}
            onPlay={() => playback.setPlaying((value) => !value)}
            onStop={playback.reset}
            onLoop={playback.setLoop}
            onSpeed={playback.setSpeed}
          />
        </div>
        <aside className="space-y-3">
          <section className="border border-slate-800 bg-[#0c1217] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest">MOTION GENERATOR</span>
              <GenerationStatus loading={loading} status="PLANNING + GENERATING" />
            </div>
            <ModelPanel
              engine={engine}
              duration={duration}
              variations={variations}
              speed={playback.speed}
              health={health}
              onEngine={setEngine}
              onDuration={setDuration}
              onVariations={setVariations}
              onSpeed={playback.setSpeed}
            />
            <div className="mt-3">
              <PromptEditor prompt={prompt} onChange={setPrompt} onGenerate={generate} disabled={loading} />
            </div>
            <ErrorBanner message={error} />
            <button
              className="mt-4 w-full rounded bg-cyan-400 py-2.5 font-semibold text-slate-950 disabled:opacity-50"
              disabled={loading}
              onClick={generate}
              type="button"
            >
              {loading ? 'Generating…' : 'Generate Motion'}
            </button>
            <p className="mt-2 text-center font-mono text-[9px] text-slate-500">CTRL + ENTER TO GENERATE</p>
            <button
              className="mt-2 w-full rounded border border-slate-700 py-1 text-[11px]"
              type="button"
              onClick={() => resetCamera.current?.()}
            >
              Reset camera
            </button>
          </section>
          <section className="border border-slate-800 bg-[#0c1217] p-4">
            <div className="mb-3 font-mono text-[10px] tracking-widest">EXPORT</div>
            <ExportPanel motionId={motion?.id || null} />
          </section>
        </aside>
      </div>
      <HistoryPanel items={history} onSelect={(id) => loadMotion(id)} />
    </div>
  );
}
