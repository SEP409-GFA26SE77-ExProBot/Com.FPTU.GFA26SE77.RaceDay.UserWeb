"use client";

import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  isError = false,
  isSuccess = false,
  autoFocus = true,
  className = "",
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of length
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const digit = rawVal.replace(/\D/g, "").slice(-1); // Only keep the last entered digit

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newOtp = newDigits.join("");
    onChange(newOtp);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }

    if (newOtp.length === length && onComplete) {
      onComplete(newOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        const newOtp = newDigits.join("");
        onChange(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else if (digits[index]) {
        // Clear current
        const newDigits = [...digits];
        newDigits[index] = "";
        const newOtp = newDigits.join("");
        onChange(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const numericData = pastedData.replace(/\D/g, "").slice(0, length);

    if (numericData.length > 0) {
      onChange(numericData);

      const targetIndex = Math.min(numericData.length, length - 1);
      inputRefs.current[targetIndex]?.focus();

      if (numericData.length === length && onComplete) {
        onComplete(numericData);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className={`otp-inputs-wrapper ${isError ? "otp-shake" : ""} ${className}`} role="group" aria-label="6-digit verification code">
      {digits.map((digit, index) => {
        let stateClass = "";
        if (isError) stateClass = "otp-digit--error";
        else if (isSuccess) stateClass = "otp-digit--success";
        else if (digit) stateClass = "otp-digit--filled";

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={handleFocus}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={`otp-digit-input ${stateClass}`}
            autoComplete="one-time-code"
          />
        );
      })}
    </div>
  );
};
