import { useCallback, useMemo, useState } from "react";
import { getEnrollmentUrls } from "../constants/enrollmentRecordsConstants";

export function useEnrollmentRecordsController() {
  const [activeTab, setActiveTab] = useState("student");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => getEnrollmentUrls()[activeTab], [activeTab]);
  const isStudent = activeTab === "student";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleOpenLink = useCallback(() => {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }, [shareUrl]);

  const toggleTab = useCallback(() => {
    setActiveTab((prev) => (prev === "student" ? "trainer" : "student"));
  }, []);

  return {
    activeTab,
    setActiveTab,
    showShareModal,
    setShowShareModal,
    copied,
    shareUrl,
    isStudent,
    handleCopy,
    handleOpenLink,
    toggleTab,
  };
}
