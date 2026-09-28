import { unstable_rethrow } from "next/navigation";

export type ActionState = { error?: string; ok?: string };

export function actionError(error: unknown): ActionState {
  unstable_rethrow(error);
  console.error(error);
  if (error instanceof Error && /DATABASE_URL|AUTH_SECRET|NEON_STORAGE/.test(error.message)) {
    return { error: error.message };
  }
  return { error: "L'archive n'a pas pu être écrite." };
}
