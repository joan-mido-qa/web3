import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import Unlock from "../app/wallet/components/Unlock";
import Web3, { WebSocketProvider } from "web3";

let provider: WebSocketProvider;
let web3: Web3;

beforeAll(() => {
  provider = new WebSocketProvider("ws://localhost:8545");
  web3 = new Web3(provider);
});

afterEach(() => {
  localStorage.removeItem("web3js_wallet");
  web3.eth.accounts.wallet.clear();
});

afterAll(async () => {
  await provider.safeDisconnect();
});

test("renders mnemonic login page unchanged", async () => {
  const { container } = render(<Unlock web3={web3} isLogged={false} onUnlock={() => {}} />);
  expect(container).toMatchSnapshot();
});

test("renders passphrase login page unchanged", async () => {
  const { container } = render(<Unlock web3={web3} isLogged={true} onUnlock={() => {}} />);
  expect(container).toMatchSnapshot();
});

test("unlock wallet with mnemonic", async () => {
  const setWallet = jest.fn();
  const mnemonic = "myth like bonus scare over problem client lizard pioneer submit female collect";

  render(<Unlock web3={web3} isLogged={false} onUnlock={(wallet) => setWallet(wallet)} />);

  for (const [i, word] of mnemonic.split(" ").entries()) {
    fireEvent.change(screen.getByPlaceholderText(`Word ${i + 1}`), {
      target: { value: word },
    });
  }

  fireEvent.change(screen.getByPlaceholderText("Passphrase"), {
    target: { value: "secret" },
  });

  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    )
  );

  await waitFor(async () => {
    expect(setWallet).toHaveBeenCalledWith(web3.eth.accounts.wallet);
  });
}, 15000);

test("unlock wallet with incorrect mnemonic", async () => {
  const setWallet = jest.fn();
  const mnemonic = "myth like bonus scare over problem";

  render(<Unlock web3={web3} isLogged={false} onUnlock={(wallet) => setWallet(wallet)} />);

  for (const [i, word] of mnemonic.split(" ").entries()) {
    fireEvent.change(screen.getByPlaceholderText(`Word ${i + 1}`), {
      target: { value: word },
    });
  }

  fireEvent.change(screen.getByPlaceholderText("Passphrase"), {
    target: { value: "secret" },
  });

  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    )
  );

  expect(screen.getByRole("alert").innerText).toBe("Invalid mnemonic");
  expect(screen.getByPlaceholderText("Passphrase").getAttribute("value")).toBe("");
});

test("paste mnemonic", async () => {
  const mnemonic = "myth like bonus scare over problem client lizard pioneer submit female collect";

  render(<Unlock web3={web3} isLogged={false} onUnlock={() => {}} />);

  fireEvent.paste(screen.getByPlaceholderText("Word 1"), {
    clipboardData: { getData: () => mnemonic },
  });

  for (const [i, word] of mnemonic.split(" ").entries()) {
    expect(screen.getByPlaceholderText(`Word ${i + 1}`).getAttribute("value")).toBe(word);
  }
});

test("unlock wallet with passphrase", async () => {
  const setWallet = jest.fn();

  web3.eth.accounts.wallet?.create(1);

  await act(async () => await web3.eth.accounts.wallet?.save("secret"));

  render(<Unlock web3={web3} isLogged={true} onUnlock={(wallet) => setWallet(wallet)} />);

  fireEvent.change(screen.getByPlaceholderText("Passphrase"), {
    target: { value: "secret" },
  });

  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", {
        name: /unlock/i,
      })
    )
  );

  await waitFor(async () => {
    expect(setWallet).toHaveBeenCalledWith(web3.eth.accounts.wallet);
  });
});

test("unlock wallet with incorrect passphrase", async () => {
  web3.eth.accounts.wallet?.create(1);

  await act(async () => await web3.eth.accounts.wallet?.save("secret"));

  render(<Unlock web3={web3} isLogged={true} onUnlock={() => {}} />);

  fireEvent.change(screen.getByPlaceholderText("Passphrase"), {
    target: { value: "incorrect" },
  });

  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", {
        name: /unlock/i,
      })
    )
  );

  expect(screen.getByRole("alert").innerText).toBe("Key derivation failed - possibly wrong password");
  expect(screen.getByPlaceholderText("Passphrase").getAttribute("value")).toBe("");
});
