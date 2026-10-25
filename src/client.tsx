import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { hydrateStart } from "@tanstack/react-start/client";

async function hydrateApp() {
  const router = await hydrateStart();

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
      {
        onRecoverableError: (error, errorInfo) => {
          console.error("[debug] recoverable hydration error:", error, errorInfo?.componentStack?.slice(0, 1200));
        },
      },
    );
  });
}

void hydrateApp();