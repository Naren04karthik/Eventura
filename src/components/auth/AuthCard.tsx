import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export default function AuthCard({ children, className }: AuthCardProps) {
  return <div className={cn('rounded-3xl border border-white/10 bg-black p-8', className)}>{children}</div>;
}