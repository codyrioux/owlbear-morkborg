import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: 'yellow' | 'pink' | 'bone' | 'blood';
  rightElement?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  accentColor = 'yellow',
  rightElement,
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

  return (
    <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-mb-charcoal">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-6 h-6 shrink-0 flex items-center justify-center border ${getIconColor()}`}
        >
          {icon}
        </div>
        <div className="flex items-baseline gap-1.5 truncate">
          <h2 className="font-brutal font-black text-xs sm:text-sm tracking-wider uppercase text-mb-white">
            {title}
          </h2>
          {subtitle && (
            <span className="font-punk text-[10px] text-mb-white/50 hidden xs:inline tracking-normal font-normal truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {rightElement && (
        <div className="flex items-center gap-1.5 shrink-0">
          {rightElement}
        </div>
      )}
    </div>
  );
};
