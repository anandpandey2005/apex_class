import React from 'react';
import { Card } from '../ui/Card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  badgeText,
}) => {
  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-400 mb-0 uppercase tracking-wider">{title}</p>
        <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-white">
          <Icon className="w-4 h-4 text-zinc-300" />
        </div>
      </div>
      <div className="mt-3">
        <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">{value}</h2>
        {description && <p className="text-xs text-zinc-500 mb-0">{description}</p>}
        {badgeText && (
          <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold border border-zinc-700 bg-zinc-900 text-zinc-300 rounded">
            {badgeText}
          </span>
        )}
      </div>
    </Card>
  );
};
