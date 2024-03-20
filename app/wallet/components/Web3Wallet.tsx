"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Web3 from "web3";
import Wallet from "web3-eth-accounts";
import { GrTransaction } from "react-icons/gr";
import { GrDocumentUpload } from "react-icons/gr";
import ErrorMessage from "./ErrorMessage";

interface Props {
  web3: Web3;
  wallet: Wallet.Wallet;
}

export default function Web3Wallet({ web3, wallet }: Props) {
  const [isSendDisplayed, setDisplaySend] = useState<boolean>(false);

  const [balance, setBalance] = useState<string>("0");
  const [account, setAccount] = useState<Wallet.Web3Account>(wallet.get(0)!);
  const [error, setError] = useState("");

  const prevBalanceRef = useRef("0");

  const updateBalance = useCallback(
    () =>
      web3.eth.getBalance(account.address, "latest").then((balance) => {
        const ethBalance = Web3.utils.fromWei(balance, "ether");
        if (ethBalance !== prevBalanceRef.current) {
          prevBalanceRef.current = ethBalance;
          setBalance(ethBalance);
        }
      }),
    [account]
  );

  useEffect(() => {
    const sub = web3.eth.subscribe("newBlockHeaders").then((sub) => {
      sub.on("data", () => updateBalance());
      // Avoid Unhandled Errors
      sub.on("error", () => {});
      return sub;
    });

    return () => {
      sub.then((sub) => sub.unsubscribe());
    };
  }, [updateBalance]);

  useEffect(() => {
    updateBalance();
  }, [updateBalance]);

  function setErrorMessage(err?: string) {
    if (err) {
      setError(err);
      setTimeout(() => {
        setError("");
      }, 3000);
    }
  }

  const fromAddress = (address: string) => wallet.find((acc) => acc.address == address)!;

  return (
    <>
      <div className='flex flex-col text-white justify-around items-center h-[250px]'>
        <span data-testid='eth-balance' className='text-5xl'>
          {balance} ETH
        </span>
        <select
          onChange={(e) => setAccount(fromAddress(e.target.value))}
          className='m-[5px] py-2 px-4 bg-gray-800 text-white rounded-md focus:outline-none'>
          {wallet.map((acc, i) => (
            <option key={`account-${i}`} className='bg-gray-800' value={acc.address}>
              {`${acc.address.substring(0, 5)}...${acc.address.substring(acc.address.length - 5)}`}
            </option>
          ))}
        </select>
        <div className='flex'>
          <div className='flex flex-col items-center mx-2'>
            <button
              data-testid='send-button'
              onClick={() => setDisplaySend(true)}
              className='bg-blue-500 hover:bg-blue-600 text-white text-l p-2 m-2 rounded-full'>
              <GrTransaction />
            </button>
            <span>Send</span>
          </div>
          <div className='flex flex-col items-center mx-2'>
            <button className='bg-blue-500 hover:bg-blue-600 text-white text-l p-2 m-2 rounded-full'>
              <GrDocumentUpload />
            </button>
            <span>Upload</span>
          </div>
        </div>
      </div>
      {isSendDisplayed ? (
        <SendModal
          web3={web3}
          fromAccount={account}
          onSend={(err) => {
            setDisplaySend(false);
            setErrorMessage(err);
          }}
        />
      ) : null}
      {error ? <ErrorMessage message={error} /> : null}
    </>
  );
}

interface SendProps {
  web3: Web3;
  fromAccount: Wallet.Web3Account;
  onSend: (err?: string) => void;
}

export function SendModal({ web3, fromAccount, onSend }: SendProps) {
  const [toAdress, setAdress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const nonce = await web3.eth.getTransactionCount(fromAccount.address, "latest");
      const gasPrice = await web3.eth.getGasPrice();

      const transaction = {
        to: toAdress,
        value: web3.utils.toWei(amount!, "ether"),
        gasPrice: gasPrice,
        nonce: nonce,
      };

      const gas = await web3.eth.estimateGas(transaction);

      const signedTransaction = await fromAccount.signTransaction({
        ...transaction,
        gas,
      });

      await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

      onSend();
    } catch (e) {
      onSend(getErrorMessage(e));
    }
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
            className='bg-blue-500 text-white hover:bg-blue-600 font-bold uppercase text-sm p-3 m-1 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150'
            type='submit'>
            Send
          </button>
        </form>
      </div>
      <div className='opacity-50 fixed inset-0 z-40 bg-black'></div>
    </>
  );
}
