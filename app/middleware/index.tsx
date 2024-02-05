"use client";

import { useContext, useEffect, useState } from "react";
import { AccountsContext } from "../providers";
import { usePathname, useRouter } from "next/navigation";

export const ProtectedRoutes = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const router = useRouter();
  const pathname = usePathname();

  const [isReady, setIsReady] = useState(false)!;
  const context = useContext(AccountsContext)!;

  function isAuth(): boolean {
    return context.accounts.size != 0;
  }

  function isLogin(): boolean {
    return pathname.startsWith("/login");
  }

  useEffect(() => {
    if (!isAuth() && !isLogin()) {
      return router.push("/login");
    }
    if (isAuth() && isLogin()) {
      return router.push("/account");
    }
    setIsReady(true);
  });

  return isReady ? (
    children
  ) : (
    <main className='bg-gray-900 flex min-h-screen flex-col items-center justify-center'>
      <div className='absolute right-1/2 bottom-1/2  transform translate-x-1/2 translate-y-1/2 '>
        <div className='border-t-transparent border-solid animate-spin  rounded-full border-blue-500 border-8 h-40 w-40'></div>
      </div>
    </main>
  );
};
