import React from 'react';

import { Check, Circle } from 'lucide-react';

export type TimelineStatus = 'completed' | 'active' | 'pending' | 'blocked';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  status: TimelineStatus;
  canGoBack?: boolean;
  canContinue?: boolean;
}

interface TimelineProps {
  events: TimelineEvent[];
  onContinue?: (eventId: string) => void;
  onGoBack?: (eventId: string) => void;
  title?: string;
  className?: string;
}

export function Timeline({
  events,
  onContinue,
  onGoBack,
  title = 'Blueprint',
  className = '',
}: TimelineProps): React.JSX.Element {
  // Find active event index for future use
  // const activeIndex = events.findIndex(e => e.status === 'active');

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-1">
          {events.map((event, index) => {
            const isActive = event.status === 'active';
            const isCompleted = event.status === 'completed';
            const isLast = index === events.length - 1;

            return (
              <React.Fragment key={event.id}>
                {/* Step */}
                <div className="flex items-center gap-1">
                  <div
                    className={`
                      relative flex items-center justify-center rounded-full transition-all
                      ${
                        isActive
                          ? 'w-6 h-6 bg-blue-600 text-white shadow-sm'
                          : isCompleted
                            ? 'w-5 h-5 bg-blue-600 text-white'
                            : 'w-5 h-5 bg-gray-300 text-gray-500'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3" />
                    ) : isActive ? (
                      <Circle className="h-3 w-3 fill-white" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>

                  {/* Title - only show for active */}
                  {isActive && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">{event.title}</span>

                      {/* Actions */}
                      {(event.canGoBack ?? event.canContinue) && (
                        <div className="flex items-center gap-1">
                          {event.canGoBack && (
                            <button
                              className="text-xs text-gray-500 hover:text-gray-700 px-1"
                              onClick={() => onGoBack?.(event.id)}
                            >
                              ←
                            </button>
                          )}
                          {event.canContinue && (
                            <button
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-1"
                              onClick={() => onContinue?.(event.id)}
                            >
                              →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Connector */}
                {!isLast && (
                  <div className={`h-px w-4 ${isCompleted ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
