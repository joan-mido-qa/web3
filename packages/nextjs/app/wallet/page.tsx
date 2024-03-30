"use client";

import { Web3Connection } from "@/app/Web3Provider";
import DeployModal from "@/app/wallet/components/DeployModal";
import SendModal from "@/app/wallet/components/SendModal";
import ErrorMessage from "@/components/ErrorMessage";
import Spinner from "@/components/Spinner";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { GrTransaction } from "react-icons/gr";
import { GrDocumentUpload } from "react-icons/gr";
import Web3 from "web3";
import Wallet from "web3-eth-accounts";

export default function Web3Wallet() {
	const [isSendModalDisplayed, setDisplaySendModal] = useState<boolean>(false);
	const [isDeployModalDisplayed, setDisplayDeployModal] = useState<boolean>(false);

	const web3 = useContext(Web3Connection)!;

	const [balance, setBalance] = useState<string>("0");
	const [account, setAccount] = useState<Wallet.Web3Account>();
	const [error, setError] = useState("");
	const [loaded, setLoaded] = useState(false);

	const prevBalanceRef = useRef("0");
	const router = useRouter();

	const updateBalance = useCallback(() => {
		if (account) {
			web3.getAccountBalance(account!.address).then((balance) => {
				const ethBalance = Web3.utils.fromWei(balance, "ether");
				if (ethBalance !== prevBalanceRef.current) {
					prevBalanceRef.current = ethBalance;
					setBalance(ethBalance);
				}
			});
		}
	}, [account]);

	const isLogged = (): boolean => web3.isWalletSaved() && web3.getWallet().length > 0;

	useEffect(() => {
		if (!isLogged()) {
			return router.push("/login");
		}
		setLoaded(true);
		setAccount(web3.getWallet().get(0)!);
	}, []);

	useEffect(() => {
		const sub = web3.onNewBlock().then((sub) => {
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

	const fromAddress = (address: string) => web3.getWallet().find((acc) => acc.address == address)!;

	if (!loaded) return <Spinner />;

	return (
		<>
			<div className="flex flex-col text-white justify-around items-center h-[250px]">
				<span data-testid="eth-balance" className="text-5xl">
					{balance} ETH
				</span>
				<select
					onChange={(e) => setAccount(fromAddress(e.target.value))}
					className="m-[5px] py-2 px-4 bg-gray-800 text-white rounded-md focus:outline-none"
				>
					{web3.getWallet().map((acc, i) => (
						<option key={`account-${i}`} className="bg-gray-800" value={acc.address}>
							{`${acc.address.substring(0, 5)}...${acc.address.substring(acc.address.length - 5)}`}
						</option>
					))}
				</select>
				<div className="flex">
					<div className="flex flex-col items-center mx-2">
						<button
							data-testid="send-button"
							onClick={() => setDisplaySendModal(true)}
							className="bg-blue-500 hover:bg-blue-600 text-white text-l p-2 m-2 rounded-full"
						>
							<GrTransaction />
						</button>
						<span>Send</span>
					</div>
					<div className="flex flex-col items-center mx-2">
						<button
							data-testid="deploy-button"
							onClick={() => setDisplayDeployModal(true)}
							className="bg-blue-500 hover:bg-blue-600 text-white text-l p-2 m-2 rounded-full"
						>
							<GrDocumentUpload />
						</button>
						<span>Deploy</span>
					</div>
				</div>
			</div>
			{isSendModalDisplayed ? (
				<SendModal
					web3={web3}
					fromAccount={account!}
					onError={(error) => setErrorMessage(error.message)}
					onSend={() => setDisplaySendModal(false)}
				/>
			) : null}
			{isDeployModalDisplayed ? (
				<DeployModal
					web3={web3}
					fromAccount={account!}
					onError={(error) => setErrorMessage(error.message)}
					onAccept={() => setDisplayDeployModal(false)}
				/>
			) : null}
			{error ? <ErrorMessage message={error} /> : null}
		</>
	);
}
