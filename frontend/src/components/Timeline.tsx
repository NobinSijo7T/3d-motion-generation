import type { MotionPlan } from '../types/motion';
import { ActionTrack } from './ActionTrack';
import { PlaybackControls } from './PlaybackControls';
import { TimelineRuler } from './TimelineRuler';

type Props = {
  plan?: MotionPlan;
  duration: number;
  time: number;
  frame: number;
  frames: number;
  playing: boolean;
  loop: boolean;
  speed: number;
  onFrame: (frame: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onLoop: (value: boolean) => void;
  onSpeed: (value: number) => void;
};

export function Timeline({
  plan,
  duration,
  time,
  frame,
  frames,
  playing,
  loop,
  speed,
  onFrame,
  onPlay,
  onStop,
  onLoop,
  onSpeed,
}: Props) {
  let cursor = 0;
  const actions = plan?.actions || [];
  return (
    <section className="border border-slate-800 bg-[#0c1217] p-3">
      <div className="mb-1 flex justify-between font-mono text-[10px] tracking-widest text-slate-400">
        <span className="text-slate-200">SEQUENCE TIMELINE</span>
        <span>{duration ? `${duration.toFixed(1)}s · ${frames} frames` : 'NO MOTION LOADED'}</span>
      </div>
      <TimelineRuler duration={duration || 9} current={time} />
      <div className="space-y-1">
        {actions.length ? (
          actions.map((action, index) => {
            const start = cursor;
            cursor += action.duration;
            return (
              <ActionTrack
                key={`${action.action}-${index}`}
                label={index === 0 ? 'PROMPT' : ''}
                start={start}
                duration={action.duration}
                total={duration || plan?.total_duration || 9}
                text={`${action.action} ${action.duration.toFixed(1)}s`}
              />
            );
          })
        ) : (
          <ActionTrack label="PROMPT" start={0} duration={0} total={9} />
        )}
        <ActionTrack label="FULL BODY" start={0} duration={duration} total={duration || 9} text="generated" />
        <ActionTrack label="LEFT HAND" start={0} duration={0} total={9} muted />
        <ActionTrack label="RIGHT HAND" start={0} duration={0} total={9} muted />
        <ActionTrack label="LEFT FOOT" start={0} duration={0} total={9} muted />
        <ActionTrack label="RIGHT FOOT" start={0} duration={0} total={9} muted />
      </div>
      <input
        className="ml-20 mt-2 w-[calc(100%-5rem)] accent-cyan-400"
        type="range"
        min={0}
        max={Math.max(0, frames - 1)}
        value={frame}
        onChange={(event) => onFrame(Number(event.target.value))}
      />
      <PlaybackControls
        playing={playing}
        loop={loop}
        speed={speed}
        time={time}
        duration={duration}
        onPlay={onPlay}
        onStop={onStop}
        onLoop={onLoop}
        onSpeed={onSpeed}
      />
    </section>
  );
}
