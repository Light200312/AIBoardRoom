import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

// Input is a flexible text field with adornments, validation, and password toggle support.
const Input = forwardRef(
  ({
    label,
    error,
    helperText,
    startAdornment,
    endAdornment,
    size = "medium",
    maxLength,
    showCharacterCount,
    disabled,
    readOnly,
    type = "text",
    className,
    value,
    defaultValue,
    onChange,
    ...props
  }, ref) => {
    // Keep local value for character counting and uncontrolled usage.
    const [showPassword, setShowPassword] = useState(false);
    const [inputValue, setInputValue] = useState(value || defaultValue || "");
    // Normalize onChange so internal and external state stay in sync.
    const handleChange = (e) => {
      setInputValue(e.target.value);
      onChange?.(e);
    };
    const sizeClasses = {
      small: "h-8 text-sm",
      medium: "h-10 text-base",
      large: "h-12 text-lg"
    };
    const isPassword = type === "password";
    const currentType = isPassword && showPassword ? "text" : type;
    const characterCount = String(inputValue).length;
    return <div className="w-full">
        {label && <label
      className={`block mb-1 text-sm font-medium ${disabled ? "text-gray-400 dark:text-slate-500" : "text-gray-700 dark:text-slate-300"}`}
    >

            {label}
          </label>}
        <div className="relative">
          {startAdornment && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400">
              {startAdornment}
            </div>}
          <input
      {...props}
      ref={ref}
      type={currentType}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      className={`
              w-full
              ${sizeClasses[size]}
              px-3
              border
              rounded-md
              outline-none
              transition-colors
              ${startAdornment ? "pl-10" : ""}
              ${endAdornment || isPassword ? "pr-10" : ""}
              ${error ? "border-gray-900 dark:border-slate-400 bg-gray-50 dark:bg-slate-700" : "border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500"}
              ${disabled ? "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed" : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"}
              ${readOnly ? "bg-gray-50 dark:bg-slate-700 cursor-default" : ""}
              focus:border-gray-900 dark:focus:border-slate-300
              focus:ring-1
              focus:ring-gray-900 dark:focus:ring-slate-300
              ${className || ""}
            `}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : void 0}
    />

          {(endAdornment || isPassword) && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400">
              {isPassword ? <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="p-1 hover:text-gray-700"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >

                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button> : endAdornment}
            </div>}
        </div>
        <div className="mt-1 flex justify-between">
          {(error || helperText) && <span
      id={error ? `${props.id}-error` : `${props.id}-helper`}
      className={`text-sm ${error ? "text-gray-900 dark:text-red-300" : "text-gray-500 dark:text-slate-400"}`}
    >

              {error || helperText}
            </span>}
          {showCharacterCount && maxLength && <span className="text-sm text-gray-500 dark:text-slate-400">
              {characterCount}/{maxLength}
            </span>}
        </div>
      </div>;
  }
);
Input.displayName = "Input";
export {
  Input
};
