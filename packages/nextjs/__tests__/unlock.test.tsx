import { render, screen, waitFor } from "@testing-library/react";
import Unlock from "../app/wallet/components/Unlock";
import Web3, { WebSocketProvider } from "web3";
import userEvent from "@testing-library/user-event";

function setup(jsx: JSX.Element) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}

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

  const { user } = setup(<Unlock web3={web3} isLogged={false} onUnlock={(wallet) => setWallet(wallet)} />);

  for (const [i, word] of mnemonic.split(" ").entries()) {
    await user.type(screen.getByPlaceholderText(`Word ${i + 1}`), word);
  }

  await user.type(screen.getByPlaceholderText("Passphrase"), "secret");

  await user.click(
    screen.getByRole("button", {
      name: /login/i,
    })
  );

  await waitFor(async () => {
    expect(setWallet).toHaveBeenCalledWith(web3.eth.accounts.wallet);
  });
}, 15000);

test("unlock wallet with incorrect mnemonic", async () => {
  const setWallet = jest.fn();
  const mnemonic = "myth like bonus scare over problem";

  const { user } = setup(<Unlock web3={web3} isLogged={false} onUnlock={(wallet) => setWallet(wallet)} />);

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
  expect(screen.getByPlaceholderText("Passphrase").getAttribute("value")).toBe("");
});

test("paste mnemonic", async () => {
  const mnemonic = "myth like bonus scare over problem client lizard pioneer submit female collect";

  const { user } = setup(<Unlock web3={web3} isLogged={false} onUnlock={() => {}} />);

  await user.click(screen.getByPlaceholderText("Word 1"));
  await user.paste({
    getData: () => mnemonic,
  });

  for (const [i, word] of mnemonic.split(" ").entries()) {
    expect(screen.getByPlaceholderText(`Word ${i + 1}`).getAttribute("value")).toBe(word);
  }
});

test("unlock wallet with passphrase", async () => {
  const setWallet = jest.fn();

  web3.eth.accounts.wallet?.create(1);

  await web3.eth.accounts.wallet?.save("secret");

  const { user } = setup(<Unlock web3={web3} isLogged={true} onUnlock={(wallet) => setWallet(wallet)} />);

  await user.type(screen.getByPlaceholderText("Passphrase"), "secret");

  await user.click(
    screen.getByRole("button", {
      name: /unlock/i,
    })
  );

  await waitFor(async () => {
    expect(setWallet).toHaveBeenCalledWith(web3.eth.accounts.wallet);
  });
});

test("unlock wallet with incorrect passphrase", async () => {
  web3.eth.accounts.wallet?.create(1);

  await web3.eth.accounts.wallet?.save("secret");

  const { user } = setup(<Unlock web3={web3} isLogged={true} onUnlock={() => {}} />);

  await user.type(screen.getByPlaceholderText("Passphrase"), "incorrect");

  await user.click(
    screen.getByRole("button", {
      name: /unlock/i,
    })
  );

  expect(screen.getByRole("alert").innerText).toBe("Key derivation failed - possibly wrong password");
  expect(screen.getByPlaceholderText("Passphrase").getAttribute("value")).toBe("");
});
