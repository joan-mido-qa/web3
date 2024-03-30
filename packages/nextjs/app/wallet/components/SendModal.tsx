"use client";

import { FormEvent, useState } from "react";
import Wallet from "web3-eth-accounts";
import { Web3Context } from "@/app/Web3Provider";

interface SendProps {
  web3: Web3Context;
  fromAccount: Wallet.Web3Account;
  onError: (err: Error) => void;
  onSend: () => void;
}

export default function SendModal({ web3, fromAccount, onSend, onError }: SendProps) {
  const [toAdress, setAdress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await web3
      .sendSignedTransaction(fromAccount, toAdress, amount)
      .then(() => onSend())
      .catch((e) => onError(e));
  }

  return (
    <>
      <div className='justify-center items-center flex fixed inset-0 z-50 outline-none focus:outline-none'>
        <form
          onSubmit={onSubmit}
          className='p-2 flex flex-col items-around bg-white rounded-md outline-none focus:outline-none'>
          <input
            placeholder='Address'
            type='text'
            className='p-3 m-1 bg-gray-800 text-white rounded-md focus:outline-none'
            onChange={(e) => setAdress(e.target.value)}
            value={toAdress}
          />
          <input
            placeholder='Amount (Eth)'
            type='text'
            className='p-3 m-1 bg-gray-800 text-white rounded-md focus:outline-none'
            onChange={(e) => setAmount(e.target.value)}
            value={amount}
          />
          <button
            className='bg-blue-500 text-white hover:bg-blue-600 font-bold uppercase text-sm p-3 m-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150'
            type='submit'>
            Send
          </button>
        </form>
      </div>
      <div className='opacity-50 fixed inset-0 z-40 bg-black'></div>
    </>
  );
}
