import type { BadgeTier } from '../pages/MyQuestions';

interface ReputationBadgeProps {
  badge: BadgeTier;
  earned: boolean;
}

const BADGE_CONFIG: Record<BadgeTier, { emoji: string; label: string; colorClass: string }> = {
  beginner:   { emoji: '🌱', label: 'First Question',   colorClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  intermediate:{ emoji: '⭐', label: 'Rising Star',      colorClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  advanced:   { emoji: '🔥', label: 'Top Contributor',  colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  champion:   { emoji: '🏆', label: 'Champion',         colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
};

export function ReputationBadge({ badge, earned }: ReputationBadgeProps) {
  const config = BADGE_CONFIG[badge];
  return (
    <span
      title={config.label}
      aria-label={`${config.emoji} ${config.label}${earned ? ' (earned)' : ''}`}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        transition-all
        ${config.colorClass}
        ${earned ? 'opacity-100 shadow-sm' : 'opacity-35 dark:opacity-20'}
      `}
    >
      <span aria-hidden="true">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}