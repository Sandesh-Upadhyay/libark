import { useState, useEffect } from 'react';

export interface P2PCountdownTimerProps {
  expiresAt: string;
  onComplete?: () => void;
  className?: string;
}

export function P2PCountdownTimer({
  expiresAt,
  onComplete,
  className = '',
}: P2PCountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      return Math.max(0, expiry - now);
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft === 0 && onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onComplete]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft === 0;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className='text-sm text-gray-600'>残り時間:</span>
      <span
        className={`text-lg font-mono font-semibold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}
      >
        {formatTime(timeLeft)}
      </span>
      {isExpired && <span className='text-xs text-red-600'>期限切れ</span>}
    </div>
  );
}
