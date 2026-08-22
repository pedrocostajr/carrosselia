import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Origem" },
  { number: 2, label: "Estratégia" },
  { number: 3, label: "Estrutura" },
  { number: 4, label: "Visual e geração" },
];

export function WizardProgress({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((step, i) => (
        <li key={step.number} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
              current > step.number && "border-primary bg-primary text-primary-foreground",
              current === step.number && "border-primary text-primary",
              current < step.number && "text-muted-foreground"
            )}
          >
            {current > step.number ? <Check className="size-3.5" /> : step.number}
          </div>
          <span
            className={cn(
              "hidden text-sm sm:inline",
              current === step.number ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
        </li>
      ))}
    </ol>
  );
}
