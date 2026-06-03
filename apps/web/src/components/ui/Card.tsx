import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', onClick, hoverable = false }: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border shadow-sm
        ${hoverable ? 'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 cursor-pointer transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 pt-5 pb-3 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 pb-5 ${className}`}>{children}</div>;
}