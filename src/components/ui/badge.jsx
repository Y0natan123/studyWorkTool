import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground normal-case tracking-normal",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        emerald: "border-transparent bg-emerald-tag/60 text-emerald-900 dark:bg-emerald-tag/20 dark:text-emerald-300",
        indigo: "border-transparent bg-indigo-tag/60 text-indigo-900 dark:bg-indigo-tag/20 dark:text-indigo-300",
        amber: "border-transparent bg-amber-tag/60 text-amber-900 dark:bg-amber-tag/20 dark:text-amber-300",
        rose: "border-transparent bg-rose-tag/60 text-rose-900 dark:bg-rose-tag/20 dark:text-rose-300",
        sky: "border-transparent bg-sky-tag/60 text-sky-900 dark:bg-sky-tag/20 dark:text-sky-300",
        violet: "border-transparent bg-violet-tag/60 text-violet-900 dark:bg-violet-tag/20 dark:text-violet-300",
        teal: "border-transparent bg-teal-tag/60 text-teal-900 dark:bg-teal-tag/20 dark:text-teal-300",
        fuchsia: "border-transparent bg-fuchsia-tag/60 text-fuchsia-900 dark:bg-fuchsia-tag/20 dark:text-fuchsia-300",
        orange: "border-transparent bg-orange-tag/60 text-orange-900 dark:bg-orange-tag/20 dark:text-orange-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />
}

export { Badge, badgeVariants }
