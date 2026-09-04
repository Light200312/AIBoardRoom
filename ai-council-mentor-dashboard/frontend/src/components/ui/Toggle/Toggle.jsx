import { useState, forwardRef } from "react";
import { cva } from "class-variance-authority";

// Variant definitions for the outer toggle track.
const toggleVariants = cva(
  "relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2",
  {
    variants: {
      size: {
        small: "h-5 w-9",
        medium: "h-6 w-11",
        large: "h-7 w-14"
      },
      disabled: {
        true: "cursor-not-allowed opacity-50",
        false: "cursor-pointer"
      }
    },
    defaultVariants: {
      size: "medium",
      disabled: false
    }
  }
);
const thumbVariants = cva(
  "pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
  {
    variants: {
      size: {
        small: "h-4 w-4",
        medium: "h-5 w-5",
        large: "h-6 w-6"
      },
      checked: {
        true: "translate-x-full",
        false: "translate-x-0"
      }
    },
    defaultVariants: {
      size: "medium",
      checked: false
    }
  }
);
const labelVariants = cva("text-gray-700", {
  variants: {
    size: {
      small: "text-sm",
      medium: "text-base",
      large: "text-lg"
    },
    disabled: {
      true: "text-gray-400",
      false: "text-gray-700"
    }
  },
  defaultVariants: {
    size: "medium",
    disabled: false
  }
});
// Toggle supports controlled/uncontrolled modes with keyboard accessibility.
const Toggle = forwardRef(
  ({
    checked,
    defaultChecked,
    onChange,
    size,
    disabled,
    label,
    labelPosition = "right",
    icon,
    className,
    ...props
  }, ref) => {
    const [isChecked, setIsChecked] = useState(defaultChecked ?? false);
    const isControlled = checked !== void 0;
    // Handle pointer toggle while respecting disabled and control mode.
    const handleClick = () => {
      if (disabled) return;
      if (isControlled) {
        onChange?.(!checked);
      } else {
        setIsChecked((prev) => !prev);
        onChange?.(!isChecked);
      }
    };
    // Allow keyboard activation on Enter/Space.
    const handleKeyDown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick();
      }
    };
    const currentChecked = isControlled ? checked : isChecked;
    const toggleClasses = toggleVariants({
      size,
      disabled
    });
    const thumbClasses = thumbVariants({
      size,
      checked: currentChecked
    });
    const labelClasses = labelVariants({
      size,
      disabled
    });
	    const renderToggle = <button
	      ref={ref}
	      role="switch"
      aria-checked={currentChecked}
      onClick={handleClick}
	      onKeyDown={handleKeyDown}
	      disabled={disabled}
	      className={`${toggleClasses} ${className || ""}`.trim()}
	      tabIndex={0}
	      {...props}
	    >

        <span
      className={`absolute inset-0 ${currentChecked ? "bg-gray-600" : "bg-gray-300"} rounded-full transition-colors`}
    />

        <span className={thumbClasses}>
          {icon && <span className="absolute inset-0 flex items-center justify-center">
              {icon}
            </span>}
        </span>
      </button>;
    if (!label) return renderToggle;
    return <div className="flex items-center gap-2">
        {labelPosition === "left" && <span className={labelClasses}>{label}</span>}
        {renderToggle}
        {labelPosition === "right" && <span className={labelClasses}>{label}</span>}
      </div>;
  }
);
Toggle.displayName = "Toggle";
export {
  Toggle
};
