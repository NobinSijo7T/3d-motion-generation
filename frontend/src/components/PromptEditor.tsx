export const EXAMPLE_PROMPTS = [
  'A person walks forward.',
  'A person sits down and stands up.',
  'A person waves with the right hand.',
  'A person jumps twice.',
  'A person walks forward, turns around and stops.',
];

type Props = {
  prompt: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  disabled: boolean;
};

export function PromptEditor({ prompt, onChange, onGenerate, disabled }: Props) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[10px] tracking-widest text-slate-500">PROMPT</label>
      <textarea
        className="h-28 w-full resize-y rounded border border-slate-700 bg-[#101a20] p-3 leading-relaxed outline-none focus:border-cyan-700"
        value={prompt}
        disabled={disabled}
        maxLength={2000}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.ctrlKey && event.key === 'Enter') onGenerate();
        }}
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
        <button type="button" disabled={disabled} onClick={() => onChange('')}>
          Clear
        </button>
        <span>{prompt.length}/2000</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            type="button"
            disabled={disabled}
            className="rounded border border-slate-700 bg-[#14252c] px-2 py-1 text-[10px] text-slate-300"
            onClick={() => onChange(example)}
          >
            {example.replace('A person ', '').slice(0, 22)}
          </button>
        ))}
      </div>
    </div>
  );
}
