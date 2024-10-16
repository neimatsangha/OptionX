import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== '');
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className="relative mb-4">
        <input
          type={type || "text"}
          id={id}
          className={cn(
            "peer w-full bg-transparent border-b-2 border-gray-600 text-white",
            "focus:outline-none focus:border-accent",
            "pt-4 pb-1 px-0 text-base transition-all duration-200",
            className
          )}
          placeholder=" "
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(e.target.value !== '');
          }}
          onChange={handleChange}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "absolute left-0 text-base text-gray-400 cursor-text transition-all duration-200",
            "top-4",
            (isFocused || hasValue) && "-top-3 text-sm text-accent"
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };