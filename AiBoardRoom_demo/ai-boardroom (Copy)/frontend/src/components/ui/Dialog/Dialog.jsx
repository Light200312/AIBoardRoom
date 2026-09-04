import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";

// Dialog wraps Radix primitives with consistent sizing, positioning, and motion.
const Dialog = ({
  isOpen,
  onClose,
  children,
  size = "md",
  position = "center",
  backdrop = "blur",
  className = ""
}) => {
  const sizeClasses = {
    sm: "w-[400px]",
    md: "w-[600px]",
    lg: "w-[800px]",
    full: "w-screen h-screen"
  };
  const positionClasses = {
    center: "items-center justify-center",
    top: "items-start justify-center pt-16",
    right: "items-stretch justify-end"
  };
  const backdropClasses = {
    blur: "backdrop-blur-sm bg-black/30",
    opaque: "bg-black/50",
    transparent: "bg-transparent"
  };
  return <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
	              <Motion.div
    initial={{
      opacity: 0
    }}
    animate={{
      opacity: 1
    }}
    exit={{
      opacity: 0
    }}
    className={`fixed inset-0 z-50 ${backdropClasses[backdrop]}`}
	  />

	            </DialogPrimitive.Overlay>
	            <DialogPrimitive.Content asChild aria-describedby={undefined}>
	              <Motion.div
    initial={position === "right" ? {
      x: "100%"
    } : {
      opacity: 0,
      y: 10
    }}
    animate={position === "right" ? {
      x: 0
    } : {
      opacity: 1,
      y: 0
    }}
    exit={position === "right" ? {
      x: "100%"
    } : {
      opacity: 0,
      y: 10
    }}
    className={`fixed inset-0 z-50 flex ${positionClasses[position]}`}
  >

                <div
    className={`
                    ${position !== "right" ? sizeClasses[size] : "w-[400px]"}
                    ${position === "right" ? "h-full" : ""}
                    bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-lg
                    ${position === "center" ? "rounded-lg" : ""}
                    ${className}
                  `}
  >

                  {children}
                  <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white dark:ring-offset-slate-800 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-slate-500 focus:ring-offset-2 disabled:pointer-events-none text-slate-500 dark:text-slate-300">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                </div>
	              </Motion.div>
	            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>}
      </AnimatePresence>
    </DialogPrimitive.Root>;
};
// DialogHeader provides the modal title area.
const DialogHeader = ({
  children,
  className = ""
}) => <div className={`p-6 border-b border-gray-200 dark:border-slate-700 ${className}`}>
    <DialogPrimitive.Title className="text-lg font-semibold text-slate-900 dark:text-slate-100">
      {children}
    </DialogPrimitive.Title>
  </div>;
// DialogContent provides the modal body container.
const DialogContent = ({
  children,
  className = ""
}) => <div className={`p-6 ${className}`}>{children}</div>;
// DialogFooter aligns modal actions at the bottom.
const DialogFooter = ({
  children,
  className = ""
}) => <div
  className={`p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-4 ${className}`}
>

    {children}
  </div>;
export {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader
};
