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

function controls(page: Page) {
  return page.locator(".panel-controls");
}

function inspector(page: Page) {
  return page.locator(".panel-inspector");
}

function inspectorHeading(page: Page) {
  return inspector(page).locator("h2");
}

function watchPoints(page: Page) {
  return inspector(page).getByLabel("What to watch before playback");
}

async function clickControl(page: Page, name: string) {
  await controls(page).getByRole("button", { name, exact: true }).click();
}

async function clickNext(page: Page) {
  await clickControl(page, "Next");
}

async function loadScenario(page: Page, title: string) {
  await controls(page).getByText(title, { exact: true }).click();
}

async function advanceUntilHeading(
  page: Page,
  expectedHeading: string,
  maxSteps = 12,
) {
  for (let step = 0; step < maxSteps; step += 1) {
    if ((await inspectorHeading(page).textContent()) === expectedHeading) {
      return;
    }

    await clickNext(page);
  }

  await expect(inspectorHeading(page)).toHaveText(expectedHeading);
}

test("navigates all study pages", async ({ page }) => {
  await openApp(page);

  const pages = [
    ["Hash Table Collision", "Hash Table: Separate Chaining"],
    ["B-tree", "Normal B-tree"],
    ["B+ Tree", "Normal B+ Tree"],
    ["Bε Tree", "Bε Tree"],
    ["LSM-tree", "LSM-tree"],
    ["Bloom Filter", "Bloom Filter"],
    ["Write Amplification", "Write Amplification"],
    ["Buffer Pool", "Buffer Pool"],
    ["Paxos", "Paxos"],
    ["Consistent Hashing", "Hash Ring"],
    ["Chord", "Chord Finger Table"],
  ];

  for (const [topic, heading] of pages) {
    await selectTopic(page, topic);
    await expect(
      page.getByRole("heading", { name: heading, level: 1 }),
    ).toBeVisible();
  }
});

test("shows guided what-to-watch prompts before playback", async ({ page }) => {
  await openApp(page);

  const topics = [
    "Hash Table Collision",
    "B-tree",
    "B+ Tree",
    "Bε Tree",
    "LSM-tree",
    "Bloom Filter",
    "Write Amplification",
    "Buffer Pool",
    "Paxos",
    "Consistent Hashing",
    "Chord",
  ];

  for (const topic of topics) {
    await selectTopic(page, topic);
    await expect(watchPoints(page)).toBeVisible();
  }

  await selectTopic(page, "Bloom Filter");
  await loadScenario(page, "要素を挿入する");
  await expect(watchPoints(page)).toContainText("cherry 自体は保存されず");

  await clickNext(page);
  await expect(watchPoints(page)).not.toBeVisible();
});

test("runs Hash Table linear probing with shortcuts and C code view", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "Hash Table Collision");

  await clickControl(page, "Linear Probing");
  await expect(
    page.getByRole("heading", { name: "Hash Table: Linear Probing", level: 1 }),
  ).toBeVisible();

  await loadScenario(page, "tombstone を使う削除");
  await expect(inspectorHeading(page)).toHaveText("tombstone を使う削除");

  await page.keyboard.press("ArrowRight");
  await expect(inspectorHeading(page)).toHaveText("開始スロットを決定");

  await page.keyboard.press("ArrowRight");
  await expect(inspectorHeading(page)).toHaveText("削除対象を比較");

  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(inspectorHeading(page)).toHaveText("tombstone で削除");

  await page.keyboard.press("r");
  await expect(inspectorHeading(page)).toHaveText("tombstone を使う削除");

  const codePanel = page.locator(".panel-code");
  await codePanel.getByRole("button", { name: "C", exact: true }).click();
  await expect(codePanel).toContainText("Linear Probing Code");
  await expect(codePanel).toContainText("tombstone");
});

test("runs B-tree range scan and exposes cost comparison", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "B-tree");

  await controls(page).getByLabel("Start").fill("20");
  await controls(page).getByLabel("End").fill("50");
  await clickControl(page, "Range Scan");
  await expect(inspectorHeading(page)).toHaveText("RANGE 20..50");

  await clickNext(page);
  await expect(inspectorHeading(page)).toHaveText("範囲走査を開始");
  await expect(inspector(page)).toContainText("O(log n + k)");
  await expect(inspector(page)).toContainText("Step comparison");
});

test("runs B+ Tree leaf-chain range scan", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "B+ Tree");

  await loadScenario(page, "複数の葉をまたいで範囲走査する");
  await expect(inspectorHeading(page)).toHaveText(
    "複数の葉をまたいで範囲走査する",
  );

  await clickNext(page);
  await expect(inspectorHeading(page)).toHaveText("範囲走査を開始");
  await expect(inspector(page)).toContainText("leaf chain");

  await advanceUntilHeading(page, "次の葉へ移動");
  await expect(inspector(page)).toContainText("O(log n + k)");
});

test("runs Bloom Filter manual insert and query", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "Bloom Filter");

  await controls(page).getByLabel("Item").fill("grape");
  await clickControl(page, "Insert");
  await expect(inspectorHeading(page)).toHaveText("INSERT grape");

  await clickNext(page);
  await expect(inspectorHeading(page)).toHaveText("ハッシュ値を計算");
  await expect(inspector(page)).toContainText("Hash count");

  await clickControl(page, "Reset");
  await clickControl(page, "Query");
  await expect(inspectorHeading(page)).toHaveText("QUERY grape");

  await clickNext(page);
  await expect(inspectorHeading(page)).toHaveText("照会位置を計算");
  await expect(inspector(page)).toContainText("Bloom Filter は false positive");
});

test("runs LSM-tree flush and compaction scenarios", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "LSM-tree");

  await loadScenario(page, "Memtable を SSTable に flush する");
  await clickNext(page);
  await expect(inspectorHeading(page)).toHaveText("Freeze memtable");

  await clickNext(page);
  await expect(inspectorHeading(page)).toHaveText("Write SSTable");
  await expect(inspector(page)).toContainText("SSTables");

  await loadScenario(page, "Compaction で obsolete record を落とす");
  await clickNext(page);
  await expect(inspectorHeading(page)).toHaveText("Read SSTables for compaction");
});

test("runs Paxos competing proposer flow", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "Paxos");

  await loadScenario(page, "Competing proposers: 高い番号が優先される");
  await clickNext(page);
  await expect(inspectorHeading(page)).toHaveText("P1 gets promises for n=1");
  await expect(inspector(page)).toContainText("Promises");

  await clickNext(page);
  await expect(inspectorHeading(page)).toHaveText("P2 preempts with higher n=2");
  await expect(inspector(page)).toContainText("Current phase");
});

test("runs Chord lookup and shows finger table details", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "Chord");

  await expect(inspector(page)).toContainText("Finger table");
  await loadScenario(page, "finger で大きくジャンプする");

  await clickNext(page);
  await expect(inspectorHeading(page)).toHaveText("リソース位置を求める");

  await advanceUntilHeading(page, "フィンガーテーブルでジャンプ");
  await expect(inspector(page)).toContainText("Lookup path");
  await expect(inspector(page)).toContainText("successor");
});

test("runs Buffer Pool CLOCK scenario and advances steps", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "Buffer Pool");

  await expect(page.getByText("Policy = LRU")).toBeVisible();
  await clickControl(page, "CLOCK");
  await expect(page.getByText("Policy = CLOCK")).toBeVisible();

  await loadScenario(page, "Sequential scan pressure");
  await clickNext(page);
  await expect(page.getByRole("heading", { name: "Page 1 miss" })).toBeVisible();

  await clickNext(page);
  await expect(page.getByRole("heading", { name: "Load page 1" })).toBeVisible();
  await expect(page.getByTestId("clock-hand")).toHaveCount(1);
});

test("marks a Buffer Pool update as dirty", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "Buffer Pool");

  await page.getByLabel("Page ID").fill("9");
  await clickControl(page, "Update");

  await clickNext(page);
  await expect(page.getByRole("heading", { name: "Page 9 miss" })).toBeVisible();

  await clickNext(page);
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
