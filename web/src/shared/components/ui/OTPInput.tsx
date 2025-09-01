import React, { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';

import { cn } from '../../lib/utils';

interface OTPInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const OTPInput = forwardRef<HTMLInputElement, OTPInputProps>(
  ({ value = '', onChange, onComplete, error, disabled, className }, ref) => {
    const [otp, setOtp] = useState<string[]>(Array.from({ length: 6 }, () => ''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Sync with external value
    useEffect(() => {
      if (value) {
        const digits = value.split('').slice(0, 6);
        const newOtp = Array.from({ length: 6 }, () => '');
        digits.forEach((digit, i) => {
          newOtp[i] = digit;
        });
        setOtp(newOtp);
      }
    }, [value]);

    // Expose ref to parent
    useImperativeHandle(ref, () => inputRefs.current[0] as HTMLInputElement);

    const handleChange = (index: number, digit: string): void => {
      if (digit && !/^\d$/.test(digit)) return;

      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      const otpString = newOtp.join('');
      onChange?.(otpString);

      // Auto-focus next input
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check if complete
      if (otpString.length === 6 && !otpString.includes('')) {
        onComplete?.(otpString);
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Backspace') {
        e.preventDefault();

        if (otp[index]) {
          // Clear current input
          handleChange(index, '');
        } else if (index > 0) {
          // Move to previous input and clear it
          inputRefs.current[index - 1]?.focus();
          handleChange(index - 1, '');
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent): void => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text');
      const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

      const newOtp = Array.from({ length: 6 }, () => '');
      digits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);

      const otpString = newOtp.join('');
      onChange?.(otpString);

      // Focus last filled input or last input if all filled
      const lastFilledIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();

      if (otpString.length === 6) {
        onComplete?.(otpString);
      }
    };

    return (
      <div className="space-y-2">
        <div className={cn('flex gap-2 justify-center', className)}>
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              className={cn(
                'w-12 h-14 text-center text-xl font-semibold',
                'border-2 rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-4',
                focusedIndex === index ? 'border-[#093FB4] ring-[#093FB4]/10' : 'border-gray-200',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-100',
                disabled && 'bg-gray-50 cursor-not-allowed',
                'hover:border-gray-300'
              )}
              disabled={disabled}
              inputMode="numeric"
              maxLength={1}
              pattern="\d{1}"
              style={
                {
                  '--tw-ring-color': error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(9, 63, 180, 0.1)',
                } as React.CSSProperties
              }
              type="text"
              value={otp[index]}
              onBlur={() => setFocusedIndex(null)}
              onChange={(e) => handleChange(index, e.target.value)}
              onFocus={() => setFocusedIndex(index)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
            />
          ))}
        </div>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </div>
    );
  }
);

OTPInput.displayName = 'OTPInput';
