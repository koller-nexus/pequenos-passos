import { expect, test } from "@playwright/test";

test("shows current progress and opens the browser print dialog", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Nome da criança" }).fill("Lia");
  await page
    .locator("section")
    .filter({ hasText: "Rotina de hoje" })
    .getByRole("checkbox", { name: "arrumar a cama" })
    .check();

  await page.getByRole("link", { name: "Ver relatório dos pais" }).click();
  await expect(page).toHaveURL(/\/familia$/);
  await expect(page.getByRole("heading", { name: "Para os pais" })).toBeVisible();
  await expect(page.getByText("Lia", { exact: true })).toBeVisible();
  await expect(page.locator(".parent-report-day")).toHaveCount(7);
  await expect(page.getByText("Sem registro neste dispositivo")).toHaveCount(6);
  await expect(page.getByText("1 de 29 concluídas")).toBeVisible();

  await page.evaluate(() => {
    window.print = () => {
      (window as typeof window & { __printCalled?: boolean }).__printCalled = true;
    };
  });
  await page.getByRole("button", { name: "Imprimir ou salvar em PDF" }).click();
  expect(
    await page.evaluate(
      () => (window as typeof window & { __printCalled?: boolean }).__printCalled,
    ),
  ).toBe(true);
});

test("opens the parent report offline after the first visit", async ({ page, context }) => {
  await page.goto("/familia");
  await expect(page.getByRole("heading", { name: "Para os pais" })).toBeVisible();
  await page.evaluate(async () => {
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.ready;
    }
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Para os pais" })).toBeVisible();
  await context.setOffline(false);
});
