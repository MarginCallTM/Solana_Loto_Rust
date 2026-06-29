import { cn } from "@/lib/utils";

// 1. The shape of our props. We EXTEND the native <button> props (onClick, type, disabled...) and add our own 'variant'.
type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "primary" | "secondary";
};

// 2. A lookup table: each variant -> its specific classes.
const variantClasses: Record<"primary" | "secondary", string> = {
  primary: "text-primary-foreground cta-glow",
  secondary: "border border-border bg-card hover:bg-secondary",
};

// 3. The component itself.
export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02]",
        variantClasses[variant],
        className,
      )}
      style={variant === "primary" ? { background: "var(--gradient-brand)" } : undefined}
      {...props}
    >
      {children}
    </button>
  );
}
