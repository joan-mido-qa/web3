import { render, screen, waitFor } from "@testing-library/react";
import { WebSocketProvider } from "web3";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { Web3Connection, Web3Context } from "@/app/Web3Provider";
import "@testing-library/jest-dom";
import Web3Wallet from "@/app/wallet/page";
import SendModal from "@/app/wallet/components/SendModal";

function setup(jsx: JSX.Element) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}

let provider: WebSocketProvider;
let web3: Web3Context;

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = { push: jest.fn() };

(useRouter as jest.Mock).mockReturnValue(mockPush);

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

const toNumber = (balance: string) => Number(balance.split(" ")[0]);

describe("Wallet", () => {
  test("Should redirect to login if not logged in", async () => {
    web3.clearWallet();
    localStorage.removeItem("web3js_wallet");

    setup(
      <Web3Connection.Provider value={web3}>
        <Web3Wallet />
      </Web3Connection.Provider>
    );

    expect(mockPush.push).toHaveBeenCalledWith("/login");

    web3.addAccount("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d");
    web3.addAccount("0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1");

    await web3.saveWallet("secret");
  });

  test("Should render wallet page unchanged", async () => {
    const { container } = setup(
      <Web3Connection.Provider value={web3}>
        <Web3Wallet />
      </Web3Connection.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test("Should render send modal unchanged", async () => {
    const account = web3.getWallet().get(1)!;
    const { container } = render(<SendModal web3={web3} fromAccount={account} onSend={() => {}} />);
    expect(container).toMatchSnapshot();
  });

  test("Should send a transaction when address and amount are correct", async () => {
    const { user } = setup(
      <Web3Connection.Provider value={web3}>
        <Web3Wallet />
      </Web3Connection.Provider>
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
      })
    );

    await waitFor(async () => {
      expect(toNumber(screen.getByTestId("eth-balance").innerText)).toBeCloseTo(toInitBalance - 1);
    });

    await user.selectOptions(screen.getByRole("combobox"), web3.getWallet().get(0)!.address);

    await waitFor(async () => {
      expect(toNumber(screen.getByTestId("eth-balance").innerText)).toBeCloseTo(fromInitBalance + 1);
    });
  });

  test("Should not send a transaction when the address is incorrect", async () => {
    const { user } = setup(
      <Web3Connection.Provider value={web3}>
        <Web3Wallet />
      </Web3Connection.Provider>
    );

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

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument(), { timeout: 4000 });
  });
});
