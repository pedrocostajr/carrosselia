"use client";

import { useState } from "react";

import { INITIAL_WIZARD_STATE, type WizardState } from "@/components/wizard/wizard-types";
import type { BrandKitRow } from "@/lib/data/brand-kits";
import { WizardProgress } from "@/components/wizard/wizard-progress";
import { StepOrigin } from "@/components/wizard/step-origin";
import { StepStrategy } from "@/components/wizard/step-strategy";
import { StepStructure } from "@/components/wizard/step-structure";
import { StepVisual } from "@/components/wizard/step-visual";
import { Card, CardContent } from "@/components/ui/card";

export function CreationWizard({
  brandKits,
  imageGenAvailable,
}: {
  brandKits: BrandKitRow[];
  imageGenAvailable: boolean;
}) {
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);

  function patch(partial: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div className="space-y-6">
      <WizardProgress current={state.step} />
      <Card>
        <CardContent className="pt-6">
          {state.step === 1 && (
            <StepOrigin
              state={state}
              onChange={(patchOrigin) =>
                setState((prev) => ({ ...prev, origin: { ...prev.origin, ...patchOrigin } }))
              }
              onNext={() => patch({ step: 2 })}
            />
          )}
          {state.step === 2 && (
            <StepStrategy
              state={state}
              onChange={(patchStrategy) =>
                setState((prev) => ({ ...prev, strategy: { ...prev.strategy, ...patchStrategy } }))
              }
              onBack={() => patch({ step: 1 })}
              onNext={() => patch({ step: 3 })}
            />
          )}
          {state.step === 3 && (
            <StepStructure
              state={state}
              onChange={(p) => patch(p)}
              onBack={() => patch({ step: 2 })}
              onNext={() => patch({ step: 4 })}
            />
          )}
          {state.step === 4 && (
            <StepVisual
              state={state}
              brandKits={brandKits}
              imageGenAvailable={imageGenAvailable}
              onChange={(p) => patch(p)}
              onBack={() => patch({ step: 3 })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
