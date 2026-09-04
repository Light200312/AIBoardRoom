import { cn } from "../utils";

// CardFooter renders action/summary content aligned at the bottom of a card.
const CardFooter = ({
  className,
  children,
  ...props
}) => {
  return <div className={cn("pt-4 flex items-center", className)} {...props}>
      {children}
    </div>;
};
export {
  CardFooter
};
