import { useState } from "react";

const defaultContact = () => ({
  phone: "+91 8870046795",
  email: "user@example.com",
});

export function useProfileContactDetails() {
  const [contact, setContact] = useState(defaultContact);

  const handleEdit = (field) => {
    const value = window.prompt(`Update ${field}`, contact[field] || "");
    if (value === null) return;
    setContact((prev) => ({ ...prev, [field]: value }));
  };

  return { contact, handleEdit };
}

