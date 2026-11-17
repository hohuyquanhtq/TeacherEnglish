import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-label="Đang tải dữ liệu">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-2/5" />
              <div className="h-3 bg-slate-100 rounded w-3/5" />
            </div>
            <div className="h-8 w-24 bg-slate-100 rounded-lg shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-6 py-12 text-center">
      <div className="mx-auto w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
        {icon ?? <Inbox className="w-5 h-5" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  return (
    <div className="bg-white border border-red-200 rounded-xl px-6 py-8 text-center">
      <div className="mx-auto w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-slate-900">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tải lại
        </button>
      ) : null}
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed max-w-2xl">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-3 shrink-0 flex-wrap">{actions}</div> : null}
    </div>
  );
};
