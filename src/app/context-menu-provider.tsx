"use client";

import { useEffect } from "react";

export default function ContextMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Only disable in production
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    // Disable context menu (right-click)
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable developer tools
    const disableDevTools = (e: KeyboardEvent) => {
      // F12 - Open DevTools
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }

      // Ctrl+Shift+I (or Cmd+Option+I on Mac) - Open DevTools
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        return;
      }

      // Ctrl+Shift+J (or Cmd+Option+J on Mac) - Open Console
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
        e.preventDefault();
        return;
      }

      // Ctrl+Shift+C (or Cmd+Option+C on Mac) - Open Inspector
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        return;
      }

      // Ctrl+Shift+K (or Cmd+Option+K on Mac) - Open Console
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "K") {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("contextmenu", disableContextMenu);
    document.addEventListener("keydown", disableDevTools);

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("keydown", disableDevTools);
    };
  }, []);

  return <>{children}</>;
}
