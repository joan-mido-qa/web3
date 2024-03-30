import { Page, expect, test } from "@playwright/test";
import { accounts, mnemonic, toLowerSorted } from "./utils";

const getAccounts = (page: Page) =>
  expect(page.locator("select"))
    .toBeVisible()
    .then(() =>
      page
        .locator("select")
        .locator("option")
        .all()
        .then((options) => Promise.all(options.map((option) => option.getAttribute("value"))))
        .then((accs) => toLowerSorted(accs)),
    );

test.describe("Login", () => {
  test("Use Mnemonic and Passphrase to save Wallet", async ({ page }) => {
    await page.goto("/login");

    for (const [i, word] of mnemonic.split(" ").entries()) {
      await page.getByPlaceholder(`Word ${i + 1}`, { exact: true }).fill(word);
    }

    await page.getByPlaceholder("Passphrase").fill("");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/\/wallet/);

    expect(await getAccounts(page)).toEqual(toLowerSorted(accounts));
  });

  test("Use Passphrase to unlock when Wallet is already saved", async ({ page }) => {
    await page.goto("/wallet");

    for (const [i, word] of mnemonic.split(" ").entries()) {
      await page.getByPlaceholder(`Word ${i + 1}`, { exact: true }).fill(word);
    }

    await page.getByPlaceholder("Passphrase").fill("secure-password");
    await page.getByRole("button", { name: "Login" }).click();

    await page.reload({ timeout: 50000 });

    await page.getByPlaceholder("Passphrase").fill("secure-password");
    await page.getByRole("button", { name: "Unlock" }).click();

    await expect(page).toHaveURL(/\/wallet/);

    expect(await getAccounts(page)).toEqual(toLowerSorted(accounts));
  });
});
