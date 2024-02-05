"use client";

import { ClipboardEvent, FormEvent, useContext, useState } from "react";
import * as bip39 from "@scure/bip39";
import { HDKey } from "@scure/bip32";
import { keccak256 } from "js-sha3";
import * as elliptic from "elliptic";
import { AccountsContext } from "../providers";
import { useRouter } from "next/navigation";

function emptyMnemonic(): Map<number, string> {
  return new Map(Array.from({ length: 12 }).map((_, i) => [i, ""]));
}

export default function Login() {
  const ec = new elliptic.ec("secp256k1");

  const router = useRouter();

  const context = useContext(AccountsContext)!;

  const [mnemonic, setMnemonic] = useState(emptyMnemonic());
  const [passphrase, setPassphrase] = useState("");

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

  function toHex(key: Uint8Array): string {
    return Buffer.from(key).toString("hex");
  }

  function addChildAccount(
    accounts: Map<string, string>,
    key: HDKey,
    index: number
  ) {
    const childKey = key.deriveChild(index);
    const keyPair = ec.keyFromPublic(childKey.publicKey!, "hex");
    const publicKey = keyPair.getPublic().encode("hex", false).slice(2);
    const address = keccak256(Buffer.from(publicKey, "hex")).slice(64 - 40);

    accounts.set(address, toHex(childKey.privateKey!));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newAccounts = new Map();

    const seed = bip39.mnemonicToSeedSync(
      Array.from(mnemonic.values())
        .reduce((mnemonic, word) => `${mnemonic} ${word}`, "")
        .trim(),
      passphrase
    );

    const hdKey = HDKey.fromMasterSeed(seed);
    const derivedKey = hdKey.derive("m/44'/60'/0'/0");

    for (let index = 0; index < 10; index++) {
      addChildAccount(newAccounts, derivedKey, index);
    }

    context.setAccounts(newAccounts);

    router.push("/account");
  }

  return (
    <main className='bg-gray-900 flex min-h-screen flex-col items-center justify-center'>
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
    </main>
  );
}
