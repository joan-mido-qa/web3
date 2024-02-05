"use client";

import { useContext } from "react";
import { AccountsContext } from "../providers";

export default function Account() {
  const context = useContext(AccountsContext)!;

  return (
    <main className='bg-gray-900 flex min-h-screen flex-col items-center justify-center'>
      <select className='m-[5px] py-2 px-4 bg-gray-800 text-white rounded-md focus:outline-none'>
        {Array.from(context.accounts.values()).map((address, i) => (
          <option key={`account-${i}`} className='bg-gray-800' value={address}>
            {address}
          </option>
        ))}
      </select>
    </main>
  );
}
