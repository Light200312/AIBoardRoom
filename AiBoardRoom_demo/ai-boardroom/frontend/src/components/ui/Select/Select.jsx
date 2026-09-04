import { useState } from "react";
import {
  useFloating,
  offset,
  flip,
  size,
  autoUpdate,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager
} from "@floating-ui/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import clsx from "clsx";

// Select provides single/multi-select with search and grouped options.
const Select = ({
  options,
  value,
  onChange,
  multiple = false,
  disabled = false,
  error,
  label,
  placeholder = "Select option",
  searchable = false,
  required = false,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedValues, setSelectedValues] = useState(
    multiple ? Array.isArray(value) ? value : [] : value ? [value] : []
  );
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [
      offset(4),
      flip(),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`
          });
        }
      })
    ],
    whileElementsMounted: autoUpdate
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getReferenceProps, getFloatingProps } = useInteractions(
    [
      click,
      dismiss,
      role
    ]
  );
  // Apply selection changes for single or multi-select mode.
  const handleOptionClick = (optionValue) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue) ? selectedValues.filter((v) => v !== optionValue) : [...selectedValues, optionValue];
      setSelectedValues(newValues);
      onChange?.(newValues);
    } else {
      setSelectedValues([optionValue]);
      onChange?.(optionValue);
      setOpen(false);
    }
  };
  const filteredOptions = options.filter(
    (option) => option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const groupedOptions = filteredOptions.reduce(
    (acc, option) => {
      const group = option.group || "";
      if (!acc[group]) acc[group] = [];
      acc[group].push(option);
      return acc;
    },
    {}
  );
  const selectedLabels = selectedValues.map((v) => options.find((o) => o.value === v)?.label).filter(Boolean);
  return <div className="w-full">
      {label && <label className="block text-sm font-medium mb-1 text-gray-700">
          {label}
          {required && <span className="text-gray-500 ml-1">*</span>}
        </label>}
      <div
    ref={refs.setReference}
    {...getReferenceProps()}
    className={clsx(
      "relative w-full border rounded-md px-3 py-2 text-sm",
      "focus:outline-none focus:ring-2 focus:ring-gray-400",
      {
        "bg-gray-100 cursor-not-allowed": disabled,
        "border-gray-300": !error,
        "border-gray-700": error
      },
      className
    )}
  >

        <div className="flex flex-wrap gap-1 min-h-[20px]">
          {selectedValues.length > 0 ? multiple ? selectedLabels.map(
    (label2) => <span
      key={label2}
      className="bg-gray-200 px-2 py-0.5 rounded-sm text-sm flex items-center gap-1"
    >

                  {label2}
                  <button
      onClick={(e) => {
        e.stopPropagation();
        handleOptionClick(
          options.find((o) => o.label === label2)?.value || ""
        );
      }}
      className="hover:bg-gray-300 rounded-sm"
    >

                    <X size={14} />
                  </button>
                </span>
  ) : <span>{selectedLabels[0]}</span> : <span className="text-gray-400 dark:text-slate-500">{placeholder}</span>}
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <ChevronDown
    size={18}
    className={clsx("transition-transform", {
      "rotate-180": open
    })}
  />

        </div>
      </div>
	      {error && <p className="mt-1 text-sm text-gray-700 dark:text-red-300">{error}</p>}
	      {open && !disabled && <FloatingFocusManager context={context} modal={false}>
	          <div
    // eslint-disable-next-line react-hooks/refs
	    ref={refs.setFloating}
	    style={floatingStyles}
	    {...getFloatingProps()}
    className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg z-50 text-slate-900 dark:text-slate-100"
  >

            {searchable && <div className="p-2 border-b border-gray-200 dark:border-slate-700">
                <div className="relative">
                  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full px-8 py-1 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-sm text-sm text-slate-900 dark:text-slate-100"
    placeholder="Search..."
  />

                  <Search
    size={16}
    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
  />

                  {searchQuery && <button
    onClick={() => setSearchQuery("")}
    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
  >

                      <X size={16} />
                    </button>}
                </div>
              </div>}
            <div className="max-h-60 overflow-auto">
              {Object.entries(groupedOptions).map(
    ([group, options2]) => <div key={group || "ungrouped"}>
                  {group && <div className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-700">
                      {group}
                    </div>}
                  {options2.map(
      (option) => <button
        key={option.value}
        onClick={() => handleOptionClick(option.value)}
        disabled={option.disabled}
        className={clsx(
          "w-full px-3 py-2 text-sm text-left flex items-center",
          "hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700 focus:outline-none",
          {
            "opacity-50 cursor-not-allowed": option.disabled
          }
        )}
      >

                      {multiple && <span className="mr-2">
                          {selectedValues.includes(option.value) && <Check size={16} />}
                        </span>}
                      {option.label}
                    </button>
    )}
                </div>
  )}
            </div>
          </div>
        </FloatingFocusManager>}
    </div>;
};
export {
  Select
};
