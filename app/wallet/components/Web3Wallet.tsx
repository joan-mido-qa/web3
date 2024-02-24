"use client";

import { FormEvent, useEffect, useState } from "react";
import Web3 from "web3";
import Wallet from "web3-eth-accounts";
import { GrTransaction } from "react-icons/gr";
import { GrDocumentUpload } from "react-icons/gr";

interface Props {
  web3: Web3;
  accounts: Wallet.Wallet;
}

export default function Web3Wallet({ web3, accounts }: Props) {
  const [isSendDisplayed, setDisplaySend] = useState<boolean>(false);

  const [balance, setBalance] = useState<string>("0");
  const [account, setAccount] = useState<Wallet.Web3Account>(accounts.get(0)!);

  const updateBalance = () =>
    web3.eth
      .getBalance(account.address)
      .then((balance) => setBalance(Web3.utils.fromWei(balance, "ether")));

  useEffect(() => {
    const sub = web3.eth.subscribe("newBlockHeaders").then((sub) => {
      sub.on("data", async () => await updateBalance());
      return sub;
    });

    return () => {
      sub.then((sub) => sub.unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const fromAddress = (address: string) =>
    accounts.find((acc) => acc.address == address)!;

  return (
    <>
      <div className='flex flex-col text-white justify-around items-center h-[250px]'>
        <span className='text-5xl'>{balance} ETH</span>
        <select
          onChange={(e) => setAccount(fromAddress(e.target.value))}
          className='m-[5px] py-2 px-4 bg-gray-800 text-white rounded-md focus:outline-none'
        >
          {accounts.map((acc, i) => (
            <option
              key={`account-${i}`}
              className='bg-gray-800'
              value={acc.address}
            >
              {`${acc.address.substring(0, 5)}...${acc.address.substring(acc.address.length - 5)}`}
            </option>
          ))}
        </select>
        <div className='flex'>
          <div className='flex flex-col items-center mx-2'>
            <button
              onClick={() => setDisplaySend(true)}
              className='bg-blue-500 hover:bg-blue-600 text-white text-l p-2 m-2 rounded-full'
            >
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
          onSend={() => setDisplaySend(false)}
        />
      ) : null}
    </>
  );
}

interface SendProps {
  web3: Web3;
  fromAccount: Wallet.Web3Account;
  onSend: () => void;
}

function SendModal({ web3, fromAccount, onSend }: SendProps) {
  const [toAdress, setAdress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nonce = await web3.eth.getTransactionCount(
      fromAccount.address,
      "latest"
    );
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
  }

  return (
    <>
      <div className='justify-center items-center flex fixed inset-0 z-50 outline-none focus:outline-none'>
        <form
          onSubmit={onSubmit}
          className='p-2 flex flex-col items-around bg-white rounded-md outline-none focus:outline-none'
        >
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
            type='submit'
          >
            Send
          </button>
        </form>
      </div>
      <div className='opacity-50 fixed inset-0 z-40 bg-black'></div>
    </>
  );
}
