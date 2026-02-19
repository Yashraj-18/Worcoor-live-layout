// @ts-nocheck
import * as React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"; // adjust import as needed
import { cn } from "@/lib/utils";

interface FloatingLabelSelectProps<T> {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: T[];
  label: string;
  placeholder?: string;
  widthClass?: string;
  valueKey: keyof T;
  labelKey: keyof T;
  className?: string;
}

function FloatingLabelSelectInner<T>({
  value,
  onValueChange,
  options,
  label,
  placeholder = "Select...",
  widthClass = "w-[160px]",
  valueKey,
  labelKey,
  className,
}: FloatingLabelSelectProps<T>) {
  return (
    <div className="relative">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            widthClass,
            "bg-background border text-left border-input focus:outline-none focus:ring-0 focus:border-input focus:ring-transparent rounded-md transition-colors",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-h-60 overflow-auto">
          {options.map((opt, idx) => {
            const val = String(opt[valueKey]);
            const lab = String(opt[labelKey]);
            return (
              <SelectItem key={`${val}-${idx}`} value={val} className="w-full">
                {lab}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <span
        className={cn(
          "pointer-events-none absolute left-2.5 bg-background px-1 transition-all duration-200",
          value
            ? "-top-2 text-xs scale-90 text-primary"
            : "top-3.5 text-sm text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

// Wrap with generic forwardRef support (optional, if you want to support ref)
const FloatingLabelSelect = React.forwardRef(
  <T,>(
    props: FloatingLabelSelectProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>
  ) => <FloatingLabelSelectInner {...props} ref={ref} />
);

FloatingLabelSelect.displayName = "FloatingLabelSelect";

export { FloatingLabelSelect };
