import { expect, test, type Page } from "@playwright/test";

const MOVES = [
  "Squats",
  "Wall push-ups",
  "Glute bridges",
  "Bear crawl",
  "Plank",
  "Step-back lunges",
  "Flamingo balance",
];

async function open(page: Page) {
  await page.clock.install();
  await page.goto("/");
  await page.getByLabel("Sounds and voice").uncheck(); // headless has no audio anyway
}

test("setup shows every move and the workout length", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("heading", { name: "My Strength Circuit" })).toBeVisible();
  const list = page.getByRole("list", { name: "The moves" });
  for (const name of MOVES) await expect(list.getByText(name, { exact: true })).toBeVisible();

  // 2 rounds x 30 s: 5 + 120 + 14x30 + 12x20 + 60 + 60 = 905 s; 3 rounds = 1295 s
  await expect(page.locator("#total")).toHaveText("About 15 minutes");
  await page.locator('label:has(input[name="rounds"][value="3"])').click();
  await expect(page.locator("#total")).toHaveText("About 22 minutes");
});

test("phases follow the plan as time passes", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Start" }).click();

  const name = page.locator("#move-name");
  const seconds = page.getByRole("timer");
  await expect(name).toHaveText("Get ready");
  await expect(seconds).toHaveText("5");

  await page.clock.runFor(2_000);
  await expect(seconds).toHaveText("3");

  await page.clock.runFor(3_100);
  await expect(name).toHaveText("Warm up");
  await expect(page.locator("#next")).toHaveText("Next: Squats");

  await page.clock.runFor(120_100);
  await expect(name).toHaveText("Squats");
  await expect(page.locator("#round")).toHaveText("Round 1 of 2");
  await expect(seconds).toHaveText("30");
  await expect(page.getByRole("img", { name: "Drawing of Squats" })).toBeVisible();

  await page.clock.runFor(30_100);
  await expect(name).toHaveText("Rest");
  await expect(seconds).toHaveText("20");
  await expect(page.locator("#next")).toHaveText("Next: Wall push-ups");

  await page.clock.runFor(20_100);
  await expect(name).toHaveText("Wall push-ups");
});

test("pause stops the clock and Go resumes it", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Skip" }).click(); // to the warm up
  await page.clock.runFor(10_000);
  await expect(page.getByRole("timer")).toHaveText("110");

  await page.getByRole("button", { name: "Pause" }).click();
  await page.clock.runFor(30_000);
  await expect(page.getByRole("timer")).toHaveText("110");

  await page.getByRole("button", { name: "Go" }).click();
  await page.clock.runFor(5_000);
  await expect(page.getByRole("timer")).toHaveText("105");
});

test("one round runs every move, then the cool down, then Great job", async ({ page }) => {
  await open(page);
  await page.locator('label:has(input[name="rounds"][value="1"])').click();
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Skip" }).click(); // ready
  await page.getByRole("button", { name: "Skip" }).click(); // warm up

  const name = page.locator("#move-name");
  for (const [i, move] of MOVES.entries()) {
    await expect(name).toHaveText(move);
    await page.getByRole("button", { name: "Skip" }).click();
    if (i < MOVES.length - 1) {
      await expect(name).toHaveText("Rest");
      await page.getByRole("button", { name: "Skip" }).click();
    }
  }
  await expect(name).toHaveText("Cool down");
  await expect(page.locator("#next")).toHaveText("Last one!");

  await page.clock.runFor(60_100);
  await expect(page.getByRole("heading", { name: "Great job!" })).toBeVisible();
  await expect(page.locator("#done-summary")).toHaveText("You did 1 round of 7 moves.");

  await page.getByRole("button", { name: "Back to start" }).click();
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
});

test("Stop goes back to the start screen", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
  await expect(page.getByRole("timer")).toBeHidden();
});

test.describe("routines", () => {
  const CHAIR_MOVES = [
    "Sit-to-stand",
    "Counter push-ups",
    "Seated shoulder press",
    "Side leg raises",
    "Band pull-aparts",
    "Counter kickbacks",
    "Seated march",
    "Calf raises",
  ];

  test("picking a routine swaps the moves, timings and title, and is remembered", async ({ page }) => {
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("My Strength Circuit");

    await page.locator('label:has(input[name="routine"][value="chair-counter"])').click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chair & Counter Strength");
    await expect(page.locator("#equipment")).toContainText("sturdy chair");
    const list = page.getByRole("list", { name: "The moves" });
    for (const name of CHAIR_MOVES) await expect(list.getByText(name, { exact: true })).toBeVisible();
    await expect(list.getByText("Bear crawl")).toHaveCount(0);
    // 5 + 180 + 16x30 work + 14x30 rest + 120 between rounds + 180 = 1385 s
    await expect(page.locator("#total")).toHaveText("About 23 minutes");

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chair & Counter Strength");
  });

  test("?routine= opens that routine", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?routine=chair-counter");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chair & Counter Strength");
  });

  test("chair routine: 30 s rests and a switch-sides call halfway", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?routine=chair-counter");
    await page.getByLabel("Sounds and voice").uncheck();
    await page.getByRole("button", { name: "Start" }).click();
    const name = page.locator("#move-name");
    const skip = page.getByRole("button", { name: "Skip" });

    await skip.click(); // ready
    await expect(name).toHaveText("Warm up");
    await expect(page.getByRole("timer")).toHaveText("180");
    await skip.click();
    await expect(name).toHaveText("Sit-to-stand");
    await page.clock.runFor(30_100);
    await expect(name).toHaveText("Rest");
    await expect(page.getByRole("timer")).toHaveText("30");
    await expect(page.locator("#cue")).toHaveText("Sit down, breathe, sip some water.");

    await skip.click(); // rest
    await skip.click(); // counter push-ups
    await skip.click(); // rest
    await skip.click(); // shoulder press
    await skip.click(); // rest
    await expect(name).toHaveText("Side leg raises");
    const banner = page.getByText("Switch sides!");
    await expect(banner).toBeHidden();
    await page.clock.runFor(14_000);
    await expect(banner).toBeHidden();
    await page.clock.runFor(1_200);
    await expect(banner).toBeVisible();
    await page.clock.runFor(15_000);
    await expect(name).toHaveText("Rest");
    await expect(banner).toBeHidden();
  });
});
