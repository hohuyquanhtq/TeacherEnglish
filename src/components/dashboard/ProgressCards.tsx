import React from 'react';
import { ProgressStat } from '@/src/types';

interface ProgressCardsProps {
  stats: ProgressStat[];
}

export const ProgressCards: React.FC<ProgressCardsProps> = ({ stats }) => {
  return (
    <section aria-label="Thẻ tiến độ học tập">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
          >
            <div>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.sublabel}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              {typeof stat.progressPercent === 'number' ? (
                <div className="mb-2">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-700 rounded-full transition-all duration-300"
                      style={{ width: `${stat.progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}
              <p className="text-xs font-medium text-slate-600">{stat.trendText}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
