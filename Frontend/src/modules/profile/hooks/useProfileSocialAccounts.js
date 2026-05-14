import { useState } from "react";
import { SOCIAL_ACCOUNTS_CONFIG } from "../constants/socialAccountsConfig";

const readInitialState = () =>
  SOCIAL_ACCOUNTS_CONFIG.map((item) => ({
    ...item,
    value: "",
    show: false,
  }));

export function useProfileSocialAccounts() {
  const [accounts, setAccounts] = useState(readInitialState);

  const updateItem = (key, updates) => {
    setAccounts((prev) =>
      prev.map((item) => (item.key !== key ? item : { ...item, ...updates }))
    );
  };

  return { accounts, updateItem };
}

