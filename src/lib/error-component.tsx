import type { ErrorComponentProps } from "@tanstack/react-router";

const FALLBACK_MESSAGE = "Có lỗi bất ngờ. Hãy tải lại trang.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="error-shell">
      <h1>Không mở được VXOAI</h1>
      <p>{errorMessage(error)}</p>
    </main>
  );
}
