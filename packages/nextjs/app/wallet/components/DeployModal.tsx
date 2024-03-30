"use client";

import { Web3Context } from "@/app/Web3Provider";
import { FormEvent, useState } from "react";
import Wallet from "web3-eth-accounts";

interface DeployProps {
	web3: Web3Context;
	fromAccount: Wallet.Web3Account;
	onError: (err: Error) => void;
	onAccept: () => void;
}

const NoContractFileSelectedError = new Error("Select a file containing the Contract ABI and Bytecode");

export default function DeployModal({ web3, fromAccount, onError, onAccept }: DeployProps) {
	const [files, setFiles] = useState<FileList | null>();
	const [address, setAddress] = useState<string>("");

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!files) {
			return onError(NoContractFileSelectedError);
		}

		const reader = new FileReader();

		reader.onload = async (event) => {
			let contract;

			try {
				contract = JSON.parse(event.target!.result as string);
			} catch (e) {
				return onError(NoContractFileSelectedError);
			}

			const isContract = "abi" in contract && "bytecode" in contract;

			if (!isContract) return onError(NoContractFileSelectedError);

			await web3
				.deploySignedContratc(fromAccount, contract.abi, contract.bytecode, [["Option 1", "Option 2", "Option 3Q"]])
				.then((recipt) => setAddress(recipt.contractAddress!))
				.catch((e) => onError(e));
		};

		reader.readAsText(files[0]);
	}

	if (address) {
		return (
			<>
				<div className="justify-center items-center flex fixed inset-0 z-50 outline-none focus:outline-none">
					<div className="p-2 flex flex-col items-around bg-white rounded-md outline-none focus:outline-none">
						<span data-testid="contract-address" className="text-blue-500 font-bold text-sm p-3 m-1">
							{address}
						</span>
						<button
							className="bg-blue-500 text-white hover:bg-blue-600 font-bold uppercase text-sm p-3 m-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
							onClick={onAccept}
						>
							Ok
						</button>
					</div>
				</div>
				<div className="opacity-50 fixed inset-0 z-40 bg-black"></div>
			</>
		);
	}

	return (
		<>
			<div className="justify-center items-center flex fixed inset-0 z-50 outline-none focus:outline-none">
				<form
					onSubmit={onSubmit}
					className="p-2 flex flex-col items-around bg-white rounded-md outline-none focus:outline-none"
				>
					<label className="block">
						<input
							type="file"
							className="m-1 block text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white  hover:file:bg-blue-700 file:disabled:opacity-50 file:disabled:pointer-events-none  dark:file:bg-blue-500 dark:hover:file:bg-blue-400"
							onChange={(event) => setFiles(event.target.files)}
							accept="application/json"
							data-testid="file-input"
						/>
					</label>
					<button
						className="bg-blue-500 text-white hover:bg-blue-600 font-bold uppercase text-sm p-3 m-1 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
						type="submit"
					>
						Deploy
					</button>
				</form>
			</div>
			<div className="opacity-50 fixed inset-0 z-40 bg-black"></div>
		</>
	);
}
