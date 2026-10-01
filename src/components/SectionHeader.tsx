import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: 'yellow' | 'pink' | 'bone' | 'blood';
  rightElement?: React.ReactNode;
  collapsedElement?: React.ReactNode;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  accentColor = 'yellow',
  rightElement,
  collapsedElement,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const getIconColor = () => {
    switch (accentColor) {
      case 'pink':
        return 'text-mb-pink border-mb-pink/40 bg-mb-pink/10';
      case 'bone':
        return 'text-mb-bone border-mb-bone/40 bg-mb-bone/10';
      case 'blood':
        return 'text-mb-blood border-mb-blood/40 bg-mb-blood/10';
      case 'yellow':
      default:
        return 'text-mb-yellow border-mb-yellow/40 bg-mb-yellow/10';
    }
  };

  const isInteractive = Boolean(onToggleCollapse);

  return (
    <div
      onClick={onToggleCollapse}
      className={`flex items-center justify-between gap-2 transition-colors ${
        isCollapsed ? 'py-0.5' : 'pb-1.5 mb-2 border-b border-mb-charcoal'
      } ${
        isInteractive
          ? 'cursor-pointer select-none group/header hover:bg-white/5 -mx-1 px-1'
          : ''
      }`}
      title={isInteractive ? (isCollapsed ? 'Click to expand section' : 'Click to collapse section') : undefined}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        {isInteractive && (
          <span
            className="text-mb-white/50 group-hover/header:text-mb-yellow transition-colors shrink-0"
            aria-hidden="true"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        )}
        <div
          className={`w-6 h-6 shrink-0 flex items-center justify-center border ${getIconColor()}`}
        >
          {icon}
        </div>
        <div className="flex items-baseline gap-1.5 truncate">
          <h2 className="font-brutal font-black text-xs sm:text-sm tracking-wider uppercase text-mb-white group-hover/header:text-mb-yellow transition-colors truncate">
            {title}
          </h2>
          {!isCollapsed && subtitle && (
            <span className="font-punk text-[10px] text-mb-white/50 hidden xs:inline tracking-normal font-normal truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Action / Information Area */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end"
      >
        {isCollapsed ? (collapsedElement ?? rightElement) : rightElement}
      </div>
    </div>
  );
};

