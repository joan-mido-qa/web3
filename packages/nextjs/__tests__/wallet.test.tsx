import { readFileSync } from "fs";
import { Web3Connection, Web3Context } from "@/app/Web3Provider";
import DeployModal from "@/app/wallet/components/DeployModal";
import SendModal from "@/app/wallet/components/SendModal";
import Web3Wallet from "@/app/wallet/page";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { WebSocketProvider } from "web3";

function setup(jsx: JSX.Element) {
	return {
		user: userEvent.setup(),
		...render(jsx),
	};
}

jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

const mockPush = { push: jest.fn() };

(useRouter as jest.Mock).mockReturnValue(mockPush);

const toNumber = (balance: string) => Number(balance.split(" ")[0]);

describe("Wallet Auth", () => {
	let provider: WebSocketProvider;
	let web3: Web3Context;

	beforeAll(() => {
		provider = new WebSocketProvider("ws://localhost:8545");
		web3 = new Web3Context(provider);
	});

	afterAll(async () => {
		await provider.safeDisconnect();
	});

	test("Should expect to be logged in", () => {
		setup(
			<Web3Connection.Provider value={web3}>
				<Web3Wallet />
			</Web3Connection.Provider>,
		);

		expect(mockPush.push).toHaveBeenCalledWith("/login");
	});
});

describe("Wallet", () => {
	let provider: WebSocketProvider;
	let web3: Web3Context;

	beforeAll(async () => {
		provider = new WebSocketProvider("ws://localhost:8545");
		web3 = new Web3Context(provider);

		web3.addAccount("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d");
		web3.addAccount("0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1");

		await web3.saveWallet("secret");
	});

	afterAll(async () => {
		web3.clearWallet();
		localStorage.removeItem("web3js_wallet");

		await provider.safeDisconnect();
	});

	test("Should render Wallet page unchanged", async () => {
		const { container } = setup(
			<Web3Connection.Provider value={web3}>
				<Web3Wallet />
			</Web3Connection.Provider>,
		);
		expect(container).toMatchSnapshot();
	});

	describe("Send Transaction", () => {
		test("Should render SendModal unchanged", async () => {
			const account = web3.getWallet().get(1)!;
			const { container } = render(
				<SendModal web3={web3} fromAccount={account} onError={() => {}} onSend={() => {}} />,
			);
			expect(container).toMatchSnapshot();
		});

		test("Should transfer ETH to receiver Address", async () => {
			const { user } = setup(
				<Web3Connection.Provider value={web3}>
					<Web3Wallet />
				</Web3Connection.Provider>,
			);

			await waitFor(async () => {
				expect(toNumber(await screen.getByTestId("eth-balance").innerText)).toBeGreaterThan(0);
			});

			const fromInitBalance = toNumber(await screen.getByTestId("eth-balance").innerText);

			await user.selectOptions(screen.getByRole("combobox"), web3.getWallet().get(1)!.address);

			const toInitBalance = toNumber(await screen.getByTestId("eth-balance").innerText);

			await user.click(screen.getByTestId("send-button"));
			await user.type(screen.getByPlaceholderText("Address"), web3.getWallet().get(0)!.address);
			await user.type(screen.getByPlaceholderText("Amount (Eth)"), "1");

			await user.click(
				screen.getByRole("button", {
					name: /send/i,
				}),
			);

			await waitFor(async () => {
				expect(toNumber(screen.getByTestId("eth-balance").innerText)).toBeCloseTo(toInitBalance - 1);
			});

			await user.selectOptions(screen.getByRole("combobox"), web3.getWallet().get(0)!.address);

			await waitFor(async () => {
				expect(toNumber(screen.getByTestId("eth-balance").innerText)).toBeCloseTo(fromInitBalance + 1);
			});
		});

		test("Should expect a valid Address", async () => {
			const { user } = setup(
				<Web3Connection.Provider value={web3}>
					<Web3Wallet />
				</Web3Connection.Provider>,
			);

			await user.click(screen.getByTestId("send-button"));
			await user.type(screen.getByPlaceholderText("Address"), "0x04");
			await user.type(screen.getByPlaceholderText("Amount (Eth)"), "1");

			await user.click(
				screen.getByRole("button", {
					name: /send/i,
				}),
			);

			await waitFor(async () => {
				expect(screen.getByRole("alert").innerText).toBe("Returned error: The field to must have byte length of 20");
			});

			await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument(), { timeout: 4000 });
		});
	});

	describe("Deploy Contract", () => {
		test("Should render SendModal unchanged", async () => {
			const account = web3.getWallet().get(1)!;
			const { container } = render(
				<DeployModal web3={web3} fromAccount={account} onError={() => {}} onAccept={() => {}} />,
			);
			expect(container).toMatchSnapshot();
		});

		test("Should deploy Conntract and return Address", async () => {
			const { user } = setup(
				<Web3Connection.Provider value={web3}>
					<Web3Wallet />
				</Web3Connection.Provider>,
			);

			await waitFor(async () => {
				expect(toNumber(await screen.getByTestId("eth-balance").innerText)).toBeGreaterThan(0);
			});

			const file = readFileSync("__tests__/resources/HelloWorld.json").toString();

			const contract = new File([file], "HelloWorld.json", {
				type: "application/json",
			});

			await user.click(screen.getByTestId("deploy-button"));
			await user.upload(screen.getByTestId("file-input"), contract);

			await user.click(
				screen.getByRole("button", {
					name: /deploy/i,
				}),
			);

			await waitFor(
				async () => {
					expect(screen.getByTestId("contract-address")).toBeVisible();
				},
				{ timeout: 3000 },
			);

			const address = screen.getByTestId("contract-address").innerHTML;

			await user.click(
				screen.getByRole("button", {
					name: /ok/i,
				}),
			);

			expect(await web3.getCode(address)).toEqual(JSON.parse(file).deployedBytecode);
		});

		test("Should expect a file", async () => {
			const { user } = setup(
				<Web3Connection.Provider value={web3}>
					<Web3Wallet />
				</Web3Connection.Provider>,
			);

			await waitFor(async () => {
				expect(toNumber(await screen.getByTestId("eth-balance").innerText)).toBeGreaterThan(0);
			});

			await user.click(screen.getByTestId("deploy-button"));

			await user.click(
				screen.getByRole("button", {
					name: /deploy/i,
				}),
			);

			await waitFor(async () => {
				expect(screen.getByRole("alert").innerText).toBe("Select a file containing the Contract ABI and Bytecode");
			});

			await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument(), { timeout: 4000 });
		});

		test("Should expect a Contract file containing the ABI and Bytecode", async () => {
			const { user } = setup(
				<Web3Connection.Provider value={web3}>
					<Web3Wallet />
				</Web3Connection.Provider>,
			);

			await waitFor(async () => {
				expect(toNumber(await screen.getByTestId("eth-balance").innerText)).toBeGreaterThan(0);
			});

			const contract = new File(["{}"], "Invalid.json", {
				type: "application/json",
			});

			await user.click(screen.getByTestId("deploy-button"));
			await user.upload(screen.getByTestId("file-input"), contract);

			await user.click(
				screen.getByRole("button", {
					name: /deploy/i,
				}),
			);

			await waitFor(async () => {
				expect(screen.getByRole("alert").innerText).toBe("Select a file containing the Contract ABI and Bytecode");
			});

			await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument(), { timeout: 4000 });
		});

		test("Should expect a JSON file", async () => {
			const { user } = setup(
				<Web3Connection.Provider value={web3}>
					<Web3Wallet />
				</Web3Connection.Provider>,
			);

			await waitFor(async () => {
				expect(toNumber(await screen.getByTestId("eth-balance").innerText)).toBeGreaterThan(0);
			});

			const contract = new File(["invalid"], "Invalid.txt", {
				type: "plain/text",
			});

			await user.click(screen.getByTestId("deploy-button"));
			await user.upload(screen.getByTestId("file-input"), contract);

			await user.click(
				screen.getByRole("button", {
					name: /deploy/i,
				}),
			);

			await waitFor(async () => {
				expect(screen.getByRole("alert").innerText).toBe("Select a file containing the Contract ABI and Bytecode");
			});

			await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument(), { timeout: 4000 });
		});
	});
});
