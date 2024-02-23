import { expect, test } from "@playwright/test";

const mnemonic =
  "myth like bonus scare over problem client lizard pioneer submit female collect";

const addresses = [
  "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
  "0xffcf8fdee72ac11b5c542428b35eef5769c409f0",
  "0x22d491bde2303f2f43325b2108d26f1eaba1e32b",
  "0xe11ba2b4d45eaed5996cd0823791e0c93114882d",
  "0xd03ea8624c8c5987235048901fb614fdca89b117",
  "0x95ced938f7991cd0dfcb48f0a06a40fa1af46ebc",
  "0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9",
  "0x28a8746e75304c0780e011bed21c72cd78cd535e",
  "0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e",
  "0x1df62f291b2e969fb0849d99d9ce41e2f137006e",
];

const short_address = (address: string) =>
  `${address.substring(0, 5)}...${address.substring(address.length - 5)}`;

test("use mnemonic and passphrase to login", async ({ page }) => {
  await page.goto("/home");

  for (const [i, word] of mnemonic.split(" ").entries()) {
    await page.getByPlaceholder(`Word ${i + 1}`, { exact: true }).fill(word);
  }

  await page.getByPlaceholder("Passphrase").fill("");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.locator("select")).toBeVisible();

  const accounts = page.locator("select").locator("option");

  for (const [i, account] of (await accounts.all()).entries()) {
    expect((await account.innerText()).toLowerCase()).toBe(
      short_address(addresses[i])
    );
  }
});