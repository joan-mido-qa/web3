import { render, screen, waitFor } from "@testing-library/react";
import Web3Wallet from "../app/wallet/components/Web3Wallet";
import { SendModal } from "../app/wallet/components/Web3Wallet";
import Web3, { WebSocketProvider } from "web3";
import userEvent from "@testing-library/user-event";

function setup(jsx: JSX.Element) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}

const toNumber = (balance: string) => Number(balance.split(" ")[0]);

let provider: WebSocketProvider;
let web3: Web3;

beforeAll(() => {
  provider = new WebSocketProvider("ws://localhost:8545");
  web3 = new Web3(provider);
  web3.eth.accounts.wallet.add("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d");
  web3.eth.accounts.wallet.add("0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1");
});

afterAll(async () => {
  await provider.safeDisconnect();
  web3.eth.accounts.wallet.clear();
});

test("renders wallet page unchanged", async () => {
  const { container } = render(<Web3Wallet web3={web3} wallet={web3.eth.accounts.wallet} />);
  expect(container).toMatchSnapshot();
});

test("renders send modal unchanged", async () => {
  const account = web3.eth.accounts.wallet.get(1)!;
  const { container } = render(<SendModal web3={web3} fromAccount={account} onSend={() => {}} />);
  expect(container).toMatchSnapshot();
});

test("send a transaction", async () => {
  const { user } = setup(<Web3Wallet web3={web3} wallet={web3.eth.accounts.wallet} />);

  await waitFor(async () => {
    expect(toNumber(await screen.getByTestId("eth-balance").innerText)).toBeGreaterThan(0);
  });

  const fromInitBalance = toNumber(await screen.getByTestId("eth-balance").innerText);

  await user.selectOptions(screen.getByRole("combobox"), web3.eth.accounts.wallet.get(1)!.address);

  const toInitBalance = toNumber(await screen.getByTestId("eth-balance").innerText);

  await user.click(screen.getByTestId("send-button"));
  await user.type(screen.getByPlaceholderText("Address"), web3.eth.accounts.wallet.get(0)!.address);
  await user.type(screen.getByPlaceholderText("Amount (Eth)"), "1");

  await user.click(
    screen.getByRole("button", {
      name: /send/i,
    })
  );

  await waitFor(async () => {
    expect(toNumber(screen.getByTestId("eth-balance").innerText)).toBeCloseTo(toInitBalance - 1);
  });

  await user.selectOptions(screen.getByRole("combobox"), web3.eth.accounts.wallet.get(0)!.address);

  await waitFor(async () => {
    expect(toNumber(screen.getByTestId("eth-balance").innerText)).toBeCloseTo(fromInitBalance + 1);
  });
});

test("error on send a transaction", async () => {
  const { user } = setup(<Web3Wallet web3={web3} wallet={web3.eth.accounts.wallet} />);

  await user.click(screen.getByTestId("send-button"));
  await user.type(screen.getByPlaceholderText("Address"), "0x04");
  await user.type(screen.getByPlaceholderText("Amount (Eth)"), "1");

  await user.click(
    screen.getByRole("button", {
      name: /send/i,
    })
  );

  await waitFor(async () => {
    expect(screen.getByRole("alert").innerText).toBe("Returned error: The field to must have byte length of 20");
  });
});
