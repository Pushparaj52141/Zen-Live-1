import { useEffect } from "react";

export function useDashboardBodyBackground() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = "#f0f1f5";
    document.documentElement.style.backgroundColor = "#f0f1f5";
    return () => {
      document.body.style.backgroundColor = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBg;
    };
  }, []);
}

export function useDashboardNavbarUndoRedo(setNavbarProps, handleUndo, handleRedo) {
  useEffect(() => {
    if (setNavbarProps) {
      setNavbarProps({
        handleUndo,
        handleRedo,
        undoDisabled: false,
        redoDisabled: false,
      });
    }
  }, [setNavbarProps, handleUndo, handleRedo]);
}
