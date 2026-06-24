export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-base-600 border-t-neon-violet ${className}`} />;
}

export function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="flex h-32 items-center justify-center text-sm text-base-400">{message}</div>;
}
