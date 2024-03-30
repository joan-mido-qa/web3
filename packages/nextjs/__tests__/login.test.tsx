import { render, screen, waitFor } from "@testing-library/react";
import { WebSocketProvider } from "web3";
import userEvent from "@testing-library/user-event";
import Login from "@/app/login/page";
import { useRouter } from "next/navigation";
import { Web3Connection, Web3Context } from "@/app/Web3Provider";
import "@testing-library/jest-dom";

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
});

afterAll(async () => {
  await provider.safeDisconnect();
});

describe("Login", () => {
  afterEach(() => {
    web3.clearWallet();
    localStorage.removeItem("web3js_wallet");
  });

  test("Should redirect to Wallet if logged in", async () => {
    web3.addAccount("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d");

    await web3.saveWallet("secret");

    setup(
      <Web3Connection.Provider value={web3}>
        <Login />
      </Web3Connection.Provider>
    );

    expect(mockPush.push).toHaveBeenCalledWith("/wallet");
  });

  describe("With Mnemonic", () => {
    test("Should render Login page unchanged", async () => {
      const { container } = setup(
        <Web3Connection.Provider value={web3}>
          <Login />
        </Web3Connection.Provider>
      );
      expect(container).toMatchSnapshot();
    });

    test("Should save Wallet to LocalStorage", async () => {
      const mnemonic = "myth like bonus scare over problem client lizard pioneer submit female collect";

      const { user } = setup(
        <Web3Connection.Provider value={web3}>
          <Login />
        </Web3Connection.Provider>
      );

      for (const [i, word] of mnemonic.split(" ").entries()) {
        await user.type(screen.getByPlaceholderText(`Word ${i + 1}`), word);
      }

      await user.type(screen.getByPlaceholderText("Passphrase"), "secret");

      await user.click(
        screen.getByRole("button", {
          name: /login/i,
        })
      );

      expect(mockPush.push).toHaveBeenCalledWith("/wallet");
    });

    test("Should expect correct Mnemonic", async () => {
      const mnemonic = "myth like bonus scare over problem";

      const { user } = setup(
        <Web3Connection.Provider value={web3}>
          <Login />
        </Web3Connection.Provider>
      );

      for (const [i, word] of mnemonic.split(" ").entries()) {
        await user.type(screen.getByPlaceholderText(`Word ${i + 1}`), word);
      }

      await user.type(screen.getByPlaceholderText("Passphrase"), "secret");

      await user.click(
        screen.getByRole("button", {
          name: /login/i,
        })
      );

      expect(screen.getByRole("alert").innerText).toBe("Invalid mnemonic");

      await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument(), { timeout: 4000 });
    });

    test("Shoudl fill mnemonic inputs on paste", async () => {
      const mnemonic = "myth like bonus scare over problem client lizard pioneer submit female collect";

      const { user } = setup(
        <Web3Connection.Provider value={web3}>
          <Login />
        </Web3Connection.Provider>
      );

      await user.click(screen.getByPlaceholderText("Word 1"));
      await user.paste({
        getData: () => mnemonic,
      });

      for (const [i, word] of mnemonic.split(" ").entries()) {
        expect(screen.getByPlaceholderText(`Word ${i + 1}`).getAttribute("value")).toBe(word);
      }
    });
  });
  describe("With Passphrase", () => {
    beforeEach(async () => {
      web3.addAccount("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d");
      await web3.saveWallet("secret");
      web3.clearWallet();
    });

    test("Should render Login page unchanged", async () => {
      const { container } = setup(
        <Web3Connection.Provider value={web3}>
          <Login />
        </Web3Connection.Provider>
      );
      expect(container).toMatchSnapshot();
    });

    test("Should load Wallet from LocalStorage", async () => {
      const { user } = setup(
        <Web3Connection.Provider value={web3}>
          <Login />
        </Web3Connection.Provider>
      );

      await user.type(screen.getByPlaceholderText("Passphrase"), "secret");

      await user.click(
        screen.getByRole("button", {
          name: /unlock/i,
        })
      );

      expect(mockPush.push).toHaveBeenCalledWith("/wallet");
    });

    test("Should expect a correct Passphrase", async () => {
      const { user } = setup(
        <Web3Connection.Provider value={web3}>
          <Login />
        </Web3Connection.Provider>
      );

      await user.type(screen.getByPlaceholderText("Passphrase"), "incorrect");

      await user.click(
        screen.getByRole("button", {
          name: /unlock/i,
        })
      );

      expect(screen.getByRole("alert").innerText).toBe("Key derivation failed - possibly wrong password");

      await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument(), { timeout: 4000 });
    });
  });
});
