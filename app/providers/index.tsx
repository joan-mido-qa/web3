"use client";

import React, {
  Dispatch,
  SetStateAction,
  createContext,
  useEffect,
  useState,
} from "react";

interface AccountsState {
  accounts: Map<string, string>;
  setAccounts: Dispatch<SetStateAction<Map<string, string>>>;
}

export const AccountsContext = createContext<AccountsState | null>(null);

export default function AccountsProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [accounts, setAccounts] = useState(() => {
    return global?.window?.sessionStorage?.getItem("accounts")
      ? new Map(JSON.parse(sessionStorage.getItem("accounts")!))
      : new Map();
  });

  useEffect(
    () =>
      sessionStorage.setItem(
        "accounts",
        JSON.stringify(Array.from(accounts.entries()))
      ),
    [accounts]
  );

  return (
    <AccountsContext.Provider value={{ accounts, setAccounts }}>
      {children}
    </AccountsContext.Provider>
  );
}
