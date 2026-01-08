import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TrialCountdownProps {
  trialEndsAt: string;
  onExpired?: () => void;
}

export function TrialCountdown({ trialEndsAt, onExpired }: TrialCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endsAt = new Date(trialEndsAt);
      const diffMs = endsAt.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        if (onExpired) {
          onExpired();
        }
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, total: diffMs });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [trialEndsAt, onExpired]);

  const progressPercent = Math.max(0, Math.min(100, (timeRemaining.total / (24 * 60 * 60 * 1000)) * 100));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-zinc-900">
            الوقت المتبقي في التجربة
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-lg font-bold text-blue-600">
          <span>{String(timeRemaining.hours).padStart(2, '0')}</span>
          <span>:</span>
          <span>{String(timeRemaining.minutes).padStart(2, '0')}</span>
          <span>:</span>
          <span>{String(timeRemaining.seconds).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="w-full bg-zinc-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${
            progressPercent < 10
              ? 'bg-red-600'
              : progressPercent < 30
              ? 'bg-orange-500'
              : 'bg-blue-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <p className="text-xs text-zinc-600 text-center">
        {timeRemaining.total > 0
          ? `لديك ${timeRemaining.hours} ساعة و ${timeRemaining.minutes} دقيقة لتجربة النظام مجاناً`
          : 'انتهت فترة التجربة المجانية'}
      </p>
    </div>
  );
}
