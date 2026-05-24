import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function openApp(page: Page) {
  await page.goto("./");
  await expect(page.getByRole("navigation", { name: "Study pages" })).toBeVisible();
}

async function selectTopic(page: Page, topic: string) {
  const studyNav = page.getByRole("navigation", { name: "Study pages" });
  const topicButton = studyNav.getByRole("button", { name: topic, exact: true });

  if (!(await topicButton.isVisible())) {
    await studyNav.getByRole("button", { name: /Change topic/ }).click();
  }

  await topicButton.click();
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

async function clickMobileNext(page: Page) {
  await page
    .locator(".mobile-playback-dock")
    .getByRole("button", { name: "Next", exact: true })
    .click();
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

test("shows a clickable step timeline with named milestones", async ({ page }) => {
  await openApp(page);
  await selectTopic(page, "B-tree");

  await loadScenario(page, "根ノードを分割する");

  const timeline = page.getByLabel("Step timeline");
  await expect(timeline).toBeVisible();
  await expect(timeline).toContainText("根ノードを分割");

  await timeline
    .getByRole("button", { name: "Step 2: 内部ノードを走査" })
    .click();

  await expect(inspectorHeading(page)).toHaveText("内部ノードを走査");
  await expect(timeline.locator("[aria-current='step']")).toContainText(
    "内部ノードを走査",
  );
  await expect(page.locator(".panel-code")).toContainText(
    "現在ノードのキーを順に比べ",
  );
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
  await selectTopic(page, "Hash Table Collision");
  await loadScenario(page, "衝突なしの挿入");

  await expect(page.locator(".mobile-playback-dock")).toBeVisible();

  const layout = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      const bounds = element?.getBoundingClientRect();

      return bounds
        ? {
            top: bounds.top + window.scrollY,
            bottom: bounds.bottom + window.scrollY,
            height: bounds.height,
            order: window.getComputedStyle(element).order,
          }
        : null;
    };

    return {
      controls: rect(".panel-controls"),
      visualizer: rect(".panel-visualizer"),
      inspector: rect(".panel-inspector"),
      timeline: rect(".panel-timeline"),
      code: rect(".panel-code"),
      dock: rect(".mobile-playback-dock"),
    };
  });

  expect(layout.controls?.order).toBe("1");
  expect(layout.visualizer?.order).toBe("2");
  expect(layout.inspector?.order).toBe("3");
  expect(layout.timeline?.order).toBe("4");
  expect(layout.code?.order).toBe("5");
  expect(layout.visualizer?.top).toBeLessThan(1200);
  expect(layout.dock?.height).toBeLessThanOrEqual(72);

  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await expect(page.locator(".mobile-playback-dock")).toHaveClass(
    /is-reading-content/,
  );
  await expect
    .poll(async () =>
      Number(
        await page
          .locator(".mobile-playback-dock")
          .evaluate((element) => window.getComputedStyle(element).opacity),
      ),
    )
    .toBeLessThan(1);
  await expect
    .poll(async () =>
      await page
        .locator(".mobile-playback-dock")
        .evaluate((element) => window.getComputedStyle(element).transform),
    )
    .not.toBe("none");
});

test("switches mobile layout into playback mode after stepping", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await selectTopic(page, "Hash Table Collision");
  await loadScenario(page, "衝突なしの挿入");

  const playbackDock = page.locator(".mobile-playback-dock");
  await expect(page.locator("body")).not.toHaveClass(/mobile-playback-active/);
  await expect(playbackDock).toContainText("Ready /");
  await expect(playbackDock).toContainText("Ready for playback");

  await clickMobileNext(page);

  await expect(page.locator("body")).toHaveClass(/mobile-playback-active/);
  await expect(playbackDock).toContainText("Step 1 /");
  await expect(playbackDock).toContainText("ハッシュ値を計算");

  const playbackLayout = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      const bounds = element?.getBoundingClientRect();

      return bounds
        ? {
            top: bounds.top + window.scrollY,
            order: window.getComputedStyle(element).order,
          }
        : null;
    };

    return {
      controls: rect(".panel-controls"),
      visualizer: rect(".panel-visualizer"),
      inspector: rect(".panel-inspector"),
      timeline: rect(".panel-timeline"),
    };
  });

  expect(playbackLayout.visualizer?.order).toBe("1");
  expect(playbackLayout.inspector?.order).toBe("2");
  expect(playbackLayout.timeline?.order).toBe("3");
  expect(playbackLayout.controls?.order).toBe("4");
  expect(playbackLayout.visualizer?.top).toBeLessThan(
    playbackLayout.controls?.top ?? Number.POSITIVE_INFINITY,
  );

  await playbackDock.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator("body")).not.toHaveClass(/mobile-playback-active/);

  const resetLayout = await page.evaluate(() => {
    const controls = document
      .querySelector(".panel-controls")
      ?.getBoundingClientRect();

    return {
      controlsTop: controls?.top ?? 0,
      controlsOrder: window.getComputedStyle(
        document.querySelector(".panel-controls") as Element,
      ).order,
    };
  });

  expect(resetLayout.controlsOrder).toBe("1");
  expect(resetLayout.controlsTop).toBeGreaterThan(0);
});

test("keeps mobile topic navigation compact and selectable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  const studyNav = page.getByRole("navigation", { name: "Study pages" });
  const topicToggle = studyNav.getByRole("button", { name: /Change topic/ });
  const chordButton = studyNav.getByRole("button", {
    name: "Chord",
    exact: true,
  });

  await expect(topicToggle).toBeVisible();
  await expect(topicToggle).toContainText("Hash Table Collision");
  await expect(chordButton).toBeHidden();

  const compactHeight = await studyNav.evaluate(
    (element) => element.getBoundingClientRect().height,
  );
  expect(compactHeight).toBeLessThan(86);

  await topicToggle.click();
  await expect(chordButton).toBeVisible();
  await chordButton.click();

  await expect(
    page.getByRole("heading", { name: "Chord Finger Table", level: 1 }),
  ).toBeVisible();
  await expect(topicToggle).toContainText("Chord");
  await expect(chordButton).toBeHidden();
});

test("compresses mobile first viewport behind study tools", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);

  const tools = page.locator(".mobile-study-tools");
  const panels = tools.locator(".mobile-study-tools-panels");

  await expect(tools).toBeVisible();
  await expect(page.locator(".learning-support")).toBeHidden();
  await expect(panels).toBeHidden();

  const compactLayout = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      const bounds = element?.getBoundingClientRect();

      return bounds
        ? {
            top: bounds.top,
            bottom: bounds.bottom,
            height: bounds.height,
          }
        : null;
    };

    return {
      topic: rect(".top-nav"),
      jumps: rect(".section-jump-nav"),
      tools: rect(".mobile-study-tools"),
      hero: rect(".hero"),
      controls: rect(".panel-controls"),
      viewportHeight: window.innerHeight,
    };
  });

  expect(compactLayout.topic?.height).toBeLessThan(72);
  expect(compactLayout.jumps?.height).toBeLessThan(46);
  expect(compactLayout.tools?.height).toBeLessThan(50);
  expect(compactLayout.hero?.height).toBeLessThan(140);
  expect(compactLayout.controls?.top).toBeLessThan(
    compactLayout.viewportHeight - 120,
  );

  await tools.locator(".mobile-study-tools-summary").click();
  await expect(panels).toBeVisible();
  await expect(panels.getByText("Learning map", { exact: true })).toBeVisible();
  await expect(panels.getByText("Glossary", { exact: true })).toBeVisible();
  await expect(panels.getByText("Study note", { exact: true })).toBeVisible();
});

test("keeps mobile Step Log compact and expandable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await selectTopic(page, "B-tree");
  await loadScenario(page, "根ノードを分割する");

  const timeline = page.getByLabel("Step timeline");
  await expect(timeline).toBeVisible();
  await expect
    .poll(async () =>
      await timeline.evaluate((element) => (element as HTMLDetailsElement).open),
    )
    .toBe(false);
  await expect(timeline.locator(".step-timeline-active-title")).toHaveText(
    "Ready for playback",
  );
  await expect(timeline.locator(".step-timeline-next")).toContainText(
    "First:",
  );
  await expect(
    timeline.getByRole("button", { name: "Step 2: 内部ノードを走査" }),
  ).toBeHidden();

  const compactLayout = await timeline.evaluate((element) => {
    const bounds = element.getBoundingClientRect();

    return {
      height: bounds.height,
      bottom: bounds.bottom + window.scrollY,
    };
  });

  expect(compactLayout.height).toBeLessThan(150);

  await timeline.locator("summary").click();
  await expect
    .poll(async () =>
      await timeline.evaluate((element) => (element as HTMLDetailsElement).open),
    )
    .toBe(true);
  await timeline
    .getByRole("button", { name: "Step 2: 内部ノードを走査" })
    .click();

  await expect(inspectorHeading(page)).toHaveText("内部ノードを走査");
  await expect(timeline.locator(".step-timeline-active-title")).toHaveText(
    "内部ノードを走査",
  );
  await expect
    .poll(async () =>
      await timeline.evaluate((element) => (element as HTMLDetailsElement).open),
    )
    .toBe(false);
});

test("adds mobile affordance to horizontal visual strips", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await selectTopic(page, "Buffer Pool");
  await loadScenario(page, "Sequential scan pressure");
  await clickMobileNext(page);
  await clickMobileNext(page);

  const strip = await page.evaluate(() => {
    const element = document.querySelector(".buffer-frame-grid");
    const style = element ? window.getComputedStyle(element) : null;

    return {
      scrollWidth: element?.scrollWidth ?? 0,
      clientWidth: element?.clientWidth ?? 0,
      scrollSnapType: style?.scrollSnapType ?? "",
      maskImage: style?.maskImage ?? "",
    };
  });

  expect(strip.scrollWidth).toBeGreaterThan(strip.clientWidth);
  expect(strip.scrollSnapType).toContain("x");
  expect(strip.maskImage).not.toBe("none");
  expect(strip.maskImage).not.toBe("");
});

test("keeps iPad mini landscape Step Log close to Visualization", async ({ page }) => {
  await page.setViewportSize({ width: 1133, height: 744 });
  await openApp(page);
  await selectTopic(page, "Hash Table Collision");
  await loadScenario(page, "同一バケットへの連続挿入");

  const layout = await page.evaluate(() => {
    const visualizer = document
      .querySelector(".panel-visualizer")
      ?.getBoundingClientRect();
    const inspector = document
      .querySelector(".panel-inspector")
      ?.getBoundingClientRect();
    const code = document.querySelector(".panel-code")?.getBoundingClientRect();

    return {
      visualizerBottom: visualizer?.bottom ?? 0,
      inspectorTop: inspector?.top ?? 0,
      inspectorLeft: inspector?.left ?? 0,
      inspectorRight: inspector?.right ?? 0,
      codeTop: code?.top ?? 0,
      visualizerRight: visualizer?.right ?? 0,
      visualizerLeft: visualizer?.left ?? 0,
      viewportWidth: window.innerWidth,
    };
  });

  expect(layout.inspectorTop).toBeGreaterThan(layout.visualizerBottom);
  expect(layout.inspectorTop - layout.visualizerBottom).toBeLessThan(40);
  expect(layout.inspectorTop).toBeLessThan(layout.codeTop);
  expect(layout.inspectorLeft).toBeGreaterThanOrEqual(layout.visualizerLeft);
  expect(layout.inspectorRight).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.visualizerRight).toBeLessThanOrEqual(layout.viewportWidth);
});
