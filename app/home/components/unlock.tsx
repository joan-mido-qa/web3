import { ClipboardEvent, FormEvent, useState } from "react";
import * as bip39 from "@scure/bip39";
import { HDKey } from "@scure/bip32";
import Web3 from "web3";
import Wallet from "web3-eth-accounts";

interface Props {
  web3: Web3;
  isLogged: boolean;
  onUnlock: (value: Wallet.Wallet) => void;
}

export default function Unlock({ web3, isLogged, onUnlock }: Props) {
  const [mnemonic, setMnemonic] = useState(emptyMnemonic());
  const [passphrase, setPassphrase] = useState("");

  function emptyMnemonic(): Map<number, string> {
    return new Map(Array.from({ length: 12 }).map((_, i) => [i, ""]));
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const newMnemonic = emptyMnemonic();

    const pastedMnemonic = event.clipboardData.getData("Text").split(" ");

    newMnemonic.forEach((_, key) => {
      if (newMnemonic.has(key)) {
        newMnemonic.set(key, pastedMnemonic[key]);
      }
    });

    setMnemonic(newMnemonic);
  }

  function getAccount(key: HDKey, index: number) {
    return web3.eth.accounts.privateKeyToAccount(
      key.deriveChild(index).privateKey!
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isLogged) {
      event.preventDefault();

      const seed = await bip39.mnemonicToSeed(
        Array.from(mnemonic.values())
          .reduce((mnemonic, word) => `${mnemonic} ${word}`, "")
          .trim(),
        passphrase
      );

      const hdKey = HDKey.fromMasterSeed(seed).derive("m/44'/60'/0'/0");

      for (let index = 0; index < 10; index++) {
        web3.eth.accounts.wallet.add(getAccount(hdKey, index));
      }

      await web3.eth.accounts.wallet.save(passphrase);

      setMnemonic(emptyMnemonic());
    }

    onUnlock(await web3.eth.accounts.wallet.load(passphrase));

    setPassphrase("");
  }

  return !isLogged ? (
    <>
      <div className='text-white flex flex-col items-center justify-center'>
        <h1 className='text-4xl font-bold'>Wallet Access</h1>
        <p className='mt-4 text-s'>Mnemonic & Password</p>
      </div>
      <form
        onSubmit={onSubmit}
        className='flex flex-col justify-around items-center w-[750px] h-[375px] p-2'
      >
        <div className='flex flex-row justify-center items-center flex-wrap w-full'>
          {Array.from(mnemonic.entries()).map(([key, value]) => (
            <input
              placeholder={`Word ${key + 1}`}
              type='text'
              className='m-[5px] py-2 px-4 bg-gray-800 text-white rounded-md focus:outline-none baisis-[calc(100%/3) - 5]'
              key={`word-${key}`}
              value={value}
              onChange={(e) =>
                setMnemonic(new Map(mnemonic.set(key, e.target.value)))
              }
              onPaste={(e) => onPaste(e)}
            />
          ))}
        </div>
        <input
          placeholder='Passphrase'
          type='text'
          className='py-2 px-4 bg-gray-800 text-white rounded-md focus:outline-none'
          onChange={(e) => setPassphrase(e.target.value)}
          value={passphrase}
        />
        <button
          type='submit'
          className='bg-blue-500 py-1.5 px-8 text-white rounded-md hover:bg-blue-600 focus:outline-none'
        >
          Login
        </button>
      </form>
    </>
  ) : (
    <>
      <div className='justify-center items-center flex fixed inset-0 z-50 outline-none focus:outline-none'>
        <form
          onSubmit={onSubmit}
          className='p-2 flex flex-row items-around bg-white rounded-md outline-none focus:outline-none'
        >
          <input
            placeholder='Passphrase'
            type='text'
            className='p-3 m-1 bg-gray-800 text-white rounded-md focus:outline-none'
            onChange={(e) => setPassphrase(e.target.value)}
            value={passphrase}
          />
          <button
            className='bg-blue-500 text-white hover:bg-blue-600 font-bold uppercase text-sm p-3 m-1 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150'
            type='submit'
          >
            Unlock
          </button>
        </form>
      </div>
    </>
  );
}
