import { LoadingSpinner } from "./LoadingSpinner";

// Button is a shared action component with variants, sizes, icons, and loading state.
const Button = ({
  variant = "primary",
  size = "medium",
  loading = false,
  leftIcon,
  rightIcon,
  iconOnly,
  children,
  disabled,
  className = "",
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-black dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-gray-800 dark:hover:bg-slate-200 active:bg-gray-900 dark:active:bg-slate-300 disabled:bg-gray-300 dark:disabled:bg-slate-600",
    secondary: "bg-white dark:bg-slate-800 border-2 border-black dark:border-slate-400 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 disabled:border-gray-300 dark:disabled:border-slate-500 disabled:text-gray-300 dark:disabled:text-slate-400",
    tertiary: "bg-transparent text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 disabled:text-gray-300 dark:disabled:text-slate-500",
    destructive: "bg-white dark:bg-slate-800 border-2 border-black dark:border-slate-400 text-black dark:text-white hover:bg-gray-900 dark:hover:bg-slate-900 hover:border-gray-900 dark:hover:border-slate-300 hover:text-white dark:hover:text-slate-400 active:bg-black dark:active:bg-slate-950 disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:border-gray-300 dark:disabled:border-slate-500 disabled:text-gray-300 dark:disabled:text-slate-400"
  };
  const sizes = {
    small: "text-sm px-3 py-1.5 gap-1.5",
    medium: "text-base px-4 py-2 gap-2",
    large: "text-lg px-6 py-3 gap-2.5"
  };
  const iconSizes = {
    small: "p-1.5",
    medium: "p-2",
    large: "p-3"
  };
  return <button
    className={`
        ${baseStyles}
        ${variants[variant]}
        ${iconOnly ? iconSizes[size] : sizes[size]}
        ${className}
      `}
    disabled={disabled || loading}
    {...props}
  >

      {loading ? <LoadingSpinner className="mr-2" /> : <>
          {leftIcon}
          {iconOnly ? iconOnly : children}
          {rightIcon}
        </>}
    </button>;
};
export {
  Button
};
