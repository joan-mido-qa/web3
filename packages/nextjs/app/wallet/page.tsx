"use client";

import { useEffect, useState } from "react";
import Wallet from "web3-eth-accounts";
import Unlock from "./components/Unlock";
import Web3Wallet from "./components/Web3Wallet";
import Web3, { WebSocketProvider } from "web3";

export default function UserWallet() {
  const [wallet, setWallet] = useState<Wallet.Wallet>();
  const [isConnected, setConnection] = useState<boolean>();
  const [isStorageReady, setStorageReady] = useState<boolean>();

  const provider = new WebSocketProvider(
    process.env.WS_PATH || "ws://localhost:8545",
    {
      timeout: 10000,
    },
    {
      autoReconnect: true,
      delay: 10000,
      maxAttempts: 10,
    }
  );

  provider.on("error", () => setConnection(false));
  provider.on("connect", () => setConnection(true));

  const web3 = new Web3(provider);

  useEffect(() => (localStorage === undefined ? setStorageReady(false) : setStorageReady(true)), []);

  const isLogged = (): boolean => localStorage.getItem("web3js_wallet") != null;

  function spinner(): JSX.Element {
    return (
      <div className='absolute right-1/2 bottom-1/2  transform translate-x-1/2 translate-y-1/2 '>
        <div className='border-t-transparent border-solid animate-spin  rounded-full border-blue-500 border-8 h-40 w-40'></div>
      </div>
    );
  }

  const isUnlocked = (): boolean => Boolean(wallet && wallet.length > 0);

  function page(): JSX.Element {
    return isUnlocked() ? (
      <Web3Wallet web3={web3} wallet={wallet!} />
    ) : (
      <Unlock web3={web3} isLogged={isLogged()} onUnlock={(wallet) => setWallet(wallet)} />
    );
  }

  return (
    <main className='bg-gray-900 flex min-h-screen flex-col items-center justify-center'>
      {isStorageReady && isConnected ? page() : spinner()}
    </main>
  );
}
