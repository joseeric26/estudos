import React from 'react';
import { TaskStatus, STATUS_LABELS, STATUS_STYLES } from '@/types/task';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const label = STATUS_LABELS[status] || status;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : 'px-2.5 py-1 text-xs sm:text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses}`}
    >
      <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
};
