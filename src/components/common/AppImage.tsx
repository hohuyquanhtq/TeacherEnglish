import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface AppImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export const AppImage: React.FC<AppImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-500 border border-slate-200 ${className}`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="w-6 h-6 text-slate-400 mb-1" />
        {fallbackText ? (
          <span className="text-xs font-medium text-slate-600 px-2 text-center truncate max-w-full">
            {fallbackText}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
