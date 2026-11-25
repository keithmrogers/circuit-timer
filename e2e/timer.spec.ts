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
