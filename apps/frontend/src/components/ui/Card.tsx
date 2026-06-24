import clsx from 'clsx';
import { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-xl border border-base-700 bg-base-900/80 p-5 shadow-lg shadow-black/20', className)}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  accent = 'violet',
}: {
  label: string;
  value: string | number;
  accent?: 'violet' | 'cyan' | 'pink' | 'green' | 'amber';
}) {
  const accentClasses: Record<string, string> = {
    violet: 'text-neon-violet',
    cyan: 'text-neon-cyan',
    pink: 'text-neon-pink',
    green: 'text-neon-green',
    amber: 'text-neon-amber',
  };

  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-base-400">{label}</span>
      <span className={clsx('text-2xl font-bold', accentClasses[accent])}>{value}</span>
    </Card>
  );
}
