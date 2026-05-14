import { useEffect } from "react";

export function useArchivedLeadsStyles() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.document) return;
    if (document.head.querySelector("style[data-archived-leads-anim]")) return;

    const style = document.createElement("style");
    style.setAttribute("data-archived-leads-anim", "true");
    style.innerHTML = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .archived-leads-container::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }, []);
}
