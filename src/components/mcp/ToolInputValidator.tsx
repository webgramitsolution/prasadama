import { z } from "zod";

export const ToolInputValidator = ({ error }: { error: unknown }) => {
  if (error instanceof z.ZodError) {
    const first = error.errors[0];
    if (first) {
      return (
        <div className="text-destructive text-sm mt-1">
          {first.message || `Invalid ${first.path.join(".")}`}
        </div>
      );
    }
  }
  return null;
};

export function getFirstZodError(e: unknown): string {
  if (e instanceof z.ZodError) {
    const first = e.errors[0];
    if (first) {
      return first.message || `Invalid ${first.path.join(".")}`;
    }
    return "Validation failed";
  }
  return String(e);
}
