import React from 'react';

type BadgeVariant = 'pending' | 'review' | 'resolved' | 'official' | 'community' | 'rejected';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  official: 'bg-purple-100 text-purple-800',
  community: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
};

const variantLabels: Record<BadgeVariant, string> = {
  pending: 'Pending',
  review: 'In Review',
  resolved: 'Resolved',
  official: 'Official FAQ',
  community: 'Community',
  rejected: 'Rejected',
};

export function Badge({ variant = 'pending', children, className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children ?? variantLabels[variant]}
    </span>
  );
}