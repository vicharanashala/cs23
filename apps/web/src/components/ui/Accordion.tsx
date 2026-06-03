import React, { useState } from 'react';
import { Card } from './Card';

interface AccordionItem {
  id: string;
  title: string;
  body: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({ items, allowMultiple = false, className = '' }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map(item => {
        const isOpen = openIds.has(item.id);
        return (
          <Card key={item.id} className="overflow-hidden" hoverable>
            <button
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-b-xl"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-body-${item.id}`}
            >
              <span className="font-medium text-gray-900 dark:text-dark-text text-sm">{item.title}</span>
              <svg
                className={`w-4 h-4 text-gray-400 dark:text-dark-muted flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div
                id={`accordion-body-${item.id}`}
                className="px-5 pb-5 text-sm text-gray-600 dark:text-dark-muted border-t border-gray-100 dark:border-dark-border pt-3"
              >
                {item.body}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}