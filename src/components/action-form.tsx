"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/lib/action";
import { Notice } from "./ui";

export function ActionForm({
  action,
  children,
  className = "grid gap-4",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      <Notice error={state.error} ok={state.ok} />
      <fieldset disabled={pending} className="grid gap-4">
        {children}
      </fieldset>
    </form>
  );
}
