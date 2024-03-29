"use client";

import { createContext } from "react";
import Web3, { WebSocketProvider } from "web3";
import Wallet from "web3-eth-accounts";

export class Web3Context {
  private readonly web3: Web3;

  constructor(provider: WebSocketProvider) {
    this.web3 = new Web3(provider);
  }

  public saveWallet = (passphrase: string) => this.web3.eth.accounts.wallet.save(passphrase);

  public loadWallet = (passphrase: string) => this.web3.eth.accounts.wallet.load(passphrase);

  public clearWallet = () => this.web3.eth.accounts.wallet.clear();

  public addAccount = (privateKey: Uint8Array | string) =>
    this.web3.eth.accounts.wallet.add(this.getAccount(privateKey));

  public isWalletSaved = () => localStorage.getItem("web3js_wallet") != null;

  public getWallet = () => this.web3.eth.accounts.wallet;

  public getAccountBalance = (address: string) => this.web3.eth.getBalance(address, "latest");

  public onNewBlock = () => this.web3.eth.subscribe("newBlockHeaders");

  public async sendSignedTransaction(account: Wallet.Web3Account, address: string, amount: string) {
    const nonce = await this.web3.eth.getTransactionCount(account.address, "latest");
    const gasPrice = await this.web3.eth.getGasPrice();

    const transaction = {
      to: address,
      value: this.web3.utils.toWei(amount, "ether"),
      gasPrice: gasPrice,
      nonce: nonce,
    };

    const gas = await this.web3.eth.estimateGas(transaction);

    const signedTransaction = await account.signTransaction({
      ...transaction,
      gas,
    });

    return this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
  }

  private getAccount = (privateKey: Uint8Array | string) => this.web3.eth.accounts.privateKeyToAccount(privateKey);
}

export const Web3Connection = createContext<Web3Context | null>(null);

export default function Web3Provider({ children }: Readonly<{ children: React.ReactNode }>) {
  const socketPath = process.env.WS_PATH || "ws://localhost:8545";

  const provider = new WebSocketProvider(
    socketPath,
    { timeout: 10000 },
    {
      autoReconnect: true,
      delay: 10000,
      maxAttempts: 10,
    }
  );

  // Avoid Unhandled Errors

  provider.on("error", () => {});

  const web3 = new Web3Context(provider);

  return <Web3Connection.Provider value={web3}>{children}</Web3Connection.Provider>;
}
