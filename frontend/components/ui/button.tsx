import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_10px_28px_rgba(0,101,169,0.22)] hover:bg-[#00558d] hover:shadow-[0_14px_36px_rgba(0,101,169,0.28)]",
        secondary: "bg-[#eaf3f8] text-foreground hover:bg-[#dcecf6] dark:bg-slate-800 dark:hover:bg-slate-700",
        ghost: "hover:bg-muted",
        outline: "border bg-background/88 hover:border-[#4DB6E7] hover:bg-[#eef8fd] hover:text-[#0065A9] dark:hover:bg-slate-900 dark:hover:text-[#9bd7f2]"
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-10 px-4",
        lg: "h-12 px-7",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
