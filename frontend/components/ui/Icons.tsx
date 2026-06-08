import React from 'react';

interface IconProps {
    className?: string;
}

export const CafeIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" fill="currentColor" fillOpacity="0.15" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
);

export const RestaurantIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 17h20" />
        <path d="M20 17c0-4.418-3.582-8-8-8s-8 3.582-8 8" fill="currentColor" fillOpacity="0.15" />
        <path d="M12 9V6" />
        <circle cx="12" cy="5" r="1.5" fill="currentColor" />
        <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </svg>
);

export const StudyIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
        <path d="M2 16h20v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2z" />
        <path d="M12 16v4" />
    </svg>
);

export const CocktailIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18l-9 9z" fill="currentColor" fillOpacity="0.15" />
        <path d="M12 12v9" />
        <path d="M8 21h8" />
        <circle cx="12" cy="7" r="1.5" fill="currentColor" />
    </svg>
);

export const SparkleIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c.132 4.318 1.562 6.84 5.3 7.7 0 0-4.312 1.34-5.3 7.7-.09-6.36-5.3-7.7-5.3-7.7 3.738-.86 5.168-3.382 5.3-7.7z" fill="currentColor" fillOpacity="0.15" />
    </svg>
);

export const NatureIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 2 2 4a7 7 0 0 1-12 14z" fill="currentColor" fillOpacity="0.15" />
        <path d="M19 2c-2.26 4.33-5.27 7.14-8 9" />
    </svg>
);

export const TentIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 20 12 4 5 20Z" fill="currentColor" fillOpacity="0.15" />
        <path d="M12 4v16" />
        <path d="m12 14-4 6h8Z" />
    </svg>
);


