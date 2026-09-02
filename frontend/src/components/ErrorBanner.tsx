type Props = {
  message: string;
};

export function ErrorBanner({ message }: Props) {
  if (!message) return null;
  return (
    <div className="mt-2 rounded border border-red-900 bg-[#3a1c22] p-2 text-xs text-red-200" role="alert">
      {message}
    </div>
  );
}
