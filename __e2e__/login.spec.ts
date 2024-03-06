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
        .then((options) =>
          Promise.all(options.map((option) => option.getAttribute("value")))
        )
        .then((accs) => toLowerSorted(accs))
    );

test("use mnemonic and passphrase to login", async ({ page }) => {
  await page.goto("/wallet");

  for (const [i, word] of mnemonic.split(" ").entries()) {
    await page.getByPlaceholder(`Word ${i + 1}`, { exact: true }).fill(word);
  }

  await page.getByPlaceholder("Passphrase").fill("");
  await page.getByRole("button", { name: "Login" }).click();

  expect(await getAccounts(page)).toEqual(toLowerSorted(accounts));
});

test("use passphrase to login", async ({ page }) => {
  await page.goto("/wallet");

  for (const [i, word] of mnemonic.split(" ").entries()) {
    await page.getByPlaceholder(`Word ${i + 1}`, { exact: true }).fill(word);
  }

  await page.getByPlaceholder("Passphrase").fill("secure-password");
  await page.getByRole("button", { name: "Login" }).click();

  await page.reload({ timeout: 50000 });

  await page.getByPlaceholder("Passphrase").fill("secure-password");
  await page.getByRole("button", { name: "Unlock" }).click();

  expect(await getAccounts(page)).toEqual(toLowerSorted(accounts));
});
