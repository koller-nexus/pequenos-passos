import { expect, test } from "@playwright/test";

async function waitForPlanner(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: "Pequenos Passos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rotina de hoje" })).toBeVisible();
}

function routineSection(page: import("@playwright/test").Page) {
  return page.locator("section").filter({ hasText: "Rotina de hoje" });
}

test("keeps checked tasks after reload and allows unchecking", async ({ page }) => {
  await page.goto("/");
  await waitForPlanner(page);

  const task = routineSection(page).getByRole("checkbox", { name: "arrumar a cama" });
  await task.check();
  await expect(task).toBeChecked();
  await page.reload();
  await waitForPlanner(page);
  await expect(routineSection(page).getByRole("checkbox", { name: "arrumar a cama" })).toBeChecked();

  await routineSection(page).getByRole("checkbox", { name: "arrumar a cama" }).uncheck();
  await page.reload();
  await waitForPlanner(page);
  await expect(routineSection(page).getByRole("checkbox", { name: "arrumar a cama" })).not.toBeChecked();
});

test("keeps the child name after reload", async ({ page }) => {
  await page.goto("/");
  await waitForPlanner(page);

  const nameInput = page.getByRole("textbox", { name: "Nome da criança" });
  await nameInput.fill("Lia");
  await page.reload();
  await waitForPlanner(page);
  await expect(page.getByRole("textbox", { name: "Nome da criança" })).toHaveValue("Lia");
});

test("shows other routines as read-only", async ({ page }) => {
  await page.goto("/");
  await waitForPlanner(page);

  const todayButton = page.locator('button[aria-current="date"]');
  await expect(todayButton).toHaveCount(1);
  const todayLabel = await todayButton.innerText();
  const otherButton = page
    .getByRole("navigation", { name: "Rotinas da semana" })
    .getByRole("button")
    .filter({ hasNotText: todayLabel.trim() })
    .first();
  await otherButton.click();

  await expect(page.getByText("Consulta: somente as tarefas do dia atual podem ser marcadas.")).toBeVisible();
  await expect(routineSection(page).getByRole("checkbox").first()).toBeDisabled();
  await todayButton.click();
  await expect(routineSection(page).getByRole("checkbox").first()).toBeEnabled();
});

test("requires confirmation before resetting the day", async ({ page }) => {
  await page.goto("/");
  await waitForPlanner(page);

  const task = routineSection(page).getByRole("checkbox", { name: "arrumar a cama" });
  await task.check();
  await page.getByRole("button", { name: "Recomeçar o dia" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(task).toBeChecked();

  await page.getByRole("button", { name: "Recomeçar o dia" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Recomeçar" }).click();
  await expect(task).not.toBeChecked();
});

test("supports keyboard interaction", async ({ page }) => {
  await page.goto("/");
  await waitForPlanner(page);

  const task = routineSection(page).getByRole("checkbox", { name: "arrumar a cama" });
  await task.focus();
  await page.keyboard.press("Space");
  await expect(task).toBeChecked();
  await page.keyboard.press("Space");
  await expect(task).not.toBeChecked();
});

test("synchronizes changes across open tabs", async ({ page, context }) => {
  await page.goto("/");
  await waitForPlanner(page);
  const secondPage = await context.newPage();
  await secondPage.goto("/");
  await waitForPlanner(secondPage);

  const firstTask = routineSection(page).getByRole("checkbox", { name: "arrumar a cama" });
  const secondTask = routineSection(secondPage).getByRole("checkbox", { name: "arrumar a cama" });
  await firstTask.check();
  await expect(secondTask).toBeChecked();
  await secondTask.uncheck();
  await expect(firstTask).not.toBeChecked();
  await secondPage.close();
});

test("reloads offline after the first visit", async ({ page, context }) => {
  await page.goto("/");
  await waitForPlanner(page);
  await page.evaluate(async () => {
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.ready;
    }
    const cache = await caches.open("pequenos-passos-v3");
    await cache.match("/");
  });

  await context.setOffline(true);
  await page.reload();
  await waitForPlanner(page);
  await context.setOffline(false);
});

test("remains usable when service worker registration is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      get: () => undefined,
    });
  });
  await page.goto("/");
  await waitForPlanner(page);
  await expect(routineSection(page).getByRole("checkbox").first()).toBeEnabled();
});
