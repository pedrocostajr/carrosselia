"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border p-0"
          aria-label={`Selecionar cor: ${label}`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}
