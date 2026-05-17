import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function openApp(page: Page) {
  await page.goto("./");
  await expect(page.getByRole("navigation", { name: "Study pages" })).toBeVisible();
}

async function selectTopic(page: Page, topic: string) {
  await page
    .getByRole("navigation", { name: "Study pages" })
    .getByRole("button", { name: topic, exact: true })
    .click();
}

test("navigates representative study pages", async ({ page }) => {
  await openApp(page);

  await selectTopic(page, "Buffer Pool");
  await expect(page.getByRole("heading", { name: "Buffer Pool", level: 1 })).toBeVisible();

  await selectTopic(page, "Paxos");
  await expect(page.getByRole("heading", { name: "Paxos", level: 1 })).toBeVisible();

  await selectTopic(page, "LSM-tree");
  await expect(page.getByRole("heading", { name: "LSM-tree", level: 1 })).toBeVisible();
});

test("runs Buffer Pool CLOCK scenario and advances steps", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "Buffer Pool");

  await expect(page.getByText("Policy = LRU")).toBeVisible();
  await page.getByRole("button", { name: "CLOCK", exact: true }).click();
  await expect(page.getByText("Policy = CLOCK")).toBeVisible();

  await page.getByText("Sequential scan pressure", { exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Page 1 miss" })).toBeVisible();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Load page 1" })).toBeVisible();
  await expect(page.getByTestId("clock-hand")).toHaveCount(1);
});

test("marks a Buffer Pool update as dirty", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "Buffer Pool");

  await page.getByLabel("Page ID").fill("9");
  await page.getByRole("button", { name: "Update", exact: true }).click();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Page 9 miss" })).toBeVisible();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Load page 9" })).toBeVisible();
  await expect(page.getByTestId("dirty-frame")).toHaveCount(1);
});

test("keeps mobile panel order and playback dock", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await selectTopic(page, "Buffer Pool");

  await expect(page.locator(".mobile-playback-dock")).toBeVisible();

  const panelOrders = await page.evaluate(() =>
    [
      ".panel-controls",
      ".panel-visualizer",
      ".panel-inspector",
      ".panel-code",
    ].map((selector) => {
      const element = document.querySelector(selector);
      return element ? window.getComputedStyle(element).order : "missing";
    }),
  );

  expect(panelOrders).toEqual(["1", "2", "3", "4"]);
});
