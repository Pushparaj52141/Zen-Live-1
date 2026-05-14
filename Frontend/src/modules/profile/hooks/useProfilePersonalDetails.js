import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

export function useProfilePersonalDetails() {
  const user = useSelector((state) => state.auth.user) || {};
  const [profile, setProfile] = useState({
    name: user.username || user.name || "User",
    about: "",
    gender: "",
    birthday: "",
    category: "",
    showSubscribers: false,
  });

  const rows = useMemo(
    () => [
      { key: "name", label: "Name", value: profile.name },
      { key: "about", label: "About you", value: profile.about },
      { key: "gender", label: "Gender", value: profile.gender },
      { key: "birthday", label: "Birthday", value: profile.birthday },
      { key: "category", label: "Category", value: profile.category },
    ],
    [profile]
  );

  const handleEdit = (key, currentValue) => {
    const nextValue = window.prompt(`Update ${key}`, currentValue || "");
    if (nextValue === null) return;
    setProfile((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleToggleSubscribers = () => {
    setProfile((prev) => ({ ...prev, showSubscribers: !prev.showSubscribers }));
  };

  return { profile, rows, handleEdit, handleToggleSubscribers };
}

