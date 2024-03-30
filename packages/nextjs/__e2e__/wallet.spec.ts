import { readFileSync } from "fs";
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

test.describe("Wallet", () => {
  test("Send ETH to Address", async ({ page }) => {
    const [fromAddress, toAddress] = accounts.sort(() => 0.5 - Math.random()).slice(0, 2);

    await page.goto("/login");

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

    await expect
      .poll(async () => toNumber(await page.locator("[data-testid=eth-balance]").innerText()), {
        intervals: [1000],
        timeout: 60000,
      })
      .toBeCloseTo(fromInitBalance - 1);

    const toBalance = await getAccountBalance(page, toAddress);

    await expect(toBalance).toBe(toInitBalance + 1);
  });

  test("Deploy a Contract", async ({ page }) => {
    await page.goto("/login");

    for (const [i, word] of mnemonic.split(" ").entries()) {
      await page.getByPlaceholder(`Word ${i + 1}`, { exact: true }).fill(word);
    }

    await page.getByPlaceholder("Passphrase").fill("");
    await page.getByRole("button", { name: "Login" }).click();

    const file = readFileSync("__e2e__/resources/HelloWorld.json");

    await page.locator("[data-testid=deploy-button]").click();
    await page.locator("[data-testid=file-input]").setInputFiles({
      name: "HelloWorld.json",
      mimeType: "application/json",
      buffer: file,
    });
    await page.getByRole("button", { name: "Deploy" }).click();

    await expect
      .poll(async () => page.locator("[data-testid=contract-address]").innerText(), {
        intervals: [1000],
        timeout: 60000,
      })
      .toContain("0x");

    await expect(page.getByRole("button", { name: "Ok" })).toBeVisible();
  });
});
