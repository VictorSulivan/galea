"use client";

import { useActionState, type DragEvent, type ReactNode } from "react";
import type { ActionState } from "@/lib/action";
import { Notice } from "./ui";

function isFileDrag(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

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

  // Sans ça, déposer un fichier sur le formulaire fait naviguer le navigateur (souvent hors site → /parvis).
  function blockFileNavigation(event: DragEvent) {
    if (!isFileDrag(event)) return;
    event.preventDefault();
  }

  return (
    <form
      action={formAction}
      className={className}
      onDragEnter={blockFileNavigation}
      onDragOver={blockFileNavigation}
      onDrop={blockFileNavigation}
    >
      <Notice error={state.error} ok={state.ok} />
      <fieldset disabled={pending || undefined} className="grid gap-4">
        {children}
      </fieldset>
    </form>
  );
}
