import test, { Page, expect } from "@playwright/test";
import { accounts, mnemonic } from "./utils";

const toNumber = (balance: string) => Number(balance.split(" ")[0]);

const getAccountBalance = (page: Page, address: string) =>
  page
    .locator("select")
    .selectOption({ value: address })
    // Wait update Account Balance
    .then(async () => await new Promise((resolve) => setTimeout(resolve, 5000)))
    .then(async () => await page.locator("[data-testid=eth-balance]").innerText())
    .then((balance) => toNumber(balance));

test("send a transaction", async ({ page }) => {
  const [fromAddress, toAddress] = accounts.sort(() => 0.5 - Math.random()).slice(0, 2);

  await page.goto("/wallet");

  for (const [i, word] of mnemonic.split(" ").entries()) {
    await page.getByPlaceholder(`Word ${i + 1}`, { exact: true }).fill(word);
  }

  await page.getByPlaceholder("Passphrase").fill("");
  await page.getByRole("button", { name: "Login" }).click();

  const toInitBalance = await getAccountBalance(page, toAddress);
  const fromInitBalance = await getAccountBalance(page, fromAddress);

  await page.locator("[data-testid=send-button]").click();
  await page.getByPlaceholder("Address").fill(toAddress);
  await page.getByPlaceholder("Amount (Eth)").fill("1");
  await page.getByRole("button", { name: "Send" }).click();

  // TODO: Update balance returns initial balance less
  // the Gas fee.

  await expect
    .poll(async () => toNumber(await page.locator("[data-testid=eth-balance]").innerText()), {
      intervals: [1000],
      timeout: 60000,
    })
    .toBeCloseTo(fromInitBalance - 1);

  const toBalance = await getAccountBalance(page, toAddress);

  await expect(toBalance).toBe(toInitBalance + 1);
});
