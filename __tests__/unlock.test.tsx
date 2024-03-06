import { render } from "@testing-library/react";
import Unlock from "../app/wallet/components/Unlock";
import Web3, { WebSocketProvider } from "web3";

let provider: WebSocketProvider;
let web3: Web3;

beforeAll(() => {
  provider = new WebSocketProvider("ws://localhost:8545");
  web3 = new Web3(provider);
});

afterAll(async () => {
  await provider.safeDisconnect();
});

test("renders mnemonic login page unchanged", async () => {
  const { container } = render(
    <Unlock web3={web3} isLogged={false} onUnlock={() => {}} />
  );
  expect(container).toMatchSnapshot();
});

test("renders passphrase login page unchanged", async () => {
  const { container } = render(
    <Unlock web3={web3} isLogged={true} onUnlock={() => {}} />
  );
  expect(container).toMatchSnapshot();
});
