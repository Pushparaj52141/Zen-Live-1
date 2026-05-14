import { useEffect } from "react";

export function useAddLeadModalSwalStyles() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "swal-small-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .swal-small {
        font-size: 0.875rem !important;
      }
      .swal-small-title {
        font-size: 1rem !important;
        margin-bottom: 0.5rem !important;
      }
      .swal-small-content {
        font-size: 0.875rem !important;
        padding: 0 !important;
      }
      .swal2-popup.swal-small {
        padding: 1rem !important;
      }
      .swal2-popup.swal-small .swal2-icon {
        margin: 0.35rem auto 0.6rem !important;
        transform: scale(0.8);
        transform-origin: center center;
      }
      .swal2-popup.swal-small .swal2-icon .swal2-icon-content {
        font-size: 1.4em !important;
      }
      .swal2-popup.swal-small .swal2-title {
        font-size: 1rem !important;
        margin-bottom: 0.5rem !important;
      }
      .swal2-popup.swal-small .swal2-html-container {
        font-size: 0.875rem !important;
      }
    `;
    document.head.appendChild(style);
  }, []);
}
