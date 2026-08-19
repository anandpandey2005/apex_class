import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'solid' | 'outline' | 'subtle';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'solid',
  children,
  ...props
}) => {
  const variantStyles = {
    solid: 'bg-white text-black border-white font-bold',
    outline: 'border border-zinc-700 text-zinc-300 bg-transparent',
    subtle: 'bg-zinc-900 text-zinc-400 border border-zinc-800',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs tracking-wide transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
