type BadgeVariant = 'pending' | 'review' | 'resolved' | 'official' | 'community' | 'rejected';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  pending:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  review:     'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  resolved:   'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  official:   'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  community:  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  rejected:   'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const variantLabels: Record<BadgeVariant, string> = {
  pending:   'Pending',
  review:    'In Review',
  resolved:  'Resolved',
  official:  'Official FAQ',
  community: 'Community',
  rejected:  'Rejected',
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