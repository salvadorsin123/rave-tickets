import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId } from 'react';
import clsx from 'clsx';

const BASE_CLASSES =
  'w-full rounded-lg border border-base-600 bg-base-850 px-3 py-2 text-sm text-base-100 placeholder-base-400 ' +
  'focus:border-neon-violet focus:outline-none focus:ring-1 focus:ring-neon-violet disabled:opacity-50';

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function FieldWrapper({ label, error, hint, children, htmlFor }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-base-200">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <span className="text-xs text-base-400">{hint}</span>}
      {error && <span className="text-xs text-neon-red">{error}</span>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={inputId}>
        <input ref={ref} id={inputId} className={clsx(BASE_CLASSES, className)} {...props} />
      </FieldWrapper>
    );
  },
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={selectId}>
        <select ref={ref} id={selectId} className={clsx(BASE_CLASSES, className)} {...props}>
          {children}
        </select>
      </FieldWrapper>
    );
  },
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={textareaId}>
        <textarea ref={ref} id={textareaId} className={clsx(BASE_CLASSES, 'min-h-[80px]', className)} {...props} />
      </FieldWrapper>
    );
  },
);
Textarea.displayName = 'Textarea';
