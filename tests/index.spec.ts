import { test, expect } from "@playwright/test";
import { SecureThis } from "../src/type";

// matches value used in the SecureLocal class!
const DEFAULT_SECURE_SECTION = "secure-local";

declare const SecureLocal: new (section?: string) => SecureThis;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

// 1. Adding of single key item
// 2. Adding of multiple keys at once
// 3. Getting all data with null
// 4. Deleting keys using remove
// 5. Clearing the whole store
// 6. Using different sections

test("has environment up & running", async ({ page }) => {
  await expect(page).toHaveTitle(/Secure Local Test Environment/);
  const section = await page.evaluate(() => {
    const m = new SecureLocal();
    return m.section;
  });
  expect(section).toEqual(DEFAULT_SECURE_SECTION);
});

test("should add single key item", async ({ page }) => {
  const testData = { color: "red" };
  const response = await page.evaluate(async (testData) => {
    const secure = new SecureLocal();
    await secure.set(testData);
    const res = await secure.get("color");
    return res.color;
  }, testData);
  expect(response).toEqual(testData.color);
});

test("should add multiple keys at once", async ({ page }) => {
  const testData = { color: "blue", pref: { show: true, style: "wide" } };
  await page.evaluate(async (testData) => {
    const secure = new SecureLocal();
    await secure.set(testData);
  }, testData);
  const response = await page.evaluate(async () => {
    const secure = new SecureLocal();
    const color = (await secure.get("color")).color;
    const pref = (await secure.get("pref")).pref;
    return { color, pref };
  });
  expect(response).toEqual(testData);
});

test("should return all keys when null is passed to get", async ({ page }) => {
  const testData = { one: "one", two: false, three: { four: "four" }, five: 5 };
  await page.evaluate(async (testData) => {
    const secure = new SecureLocal();
    await secure.set(testData);
  }, testData);
  const response = await page.evaluate(async () => {
    const secure = new SecureLocal();
    return await secure.get(null);
  });
  expect(response).toEqual(testData);
});

test("should delete a key using remove", async ({ page }) => {
  const testData = { one: "one", two: false, three: { four: "four" }, five: 5 };
  await page.evaluate(async (testData) => {
    const secure = new SecureLocal();
    await secure.set(testData);
  }, testData);
  const response = await page.evaluate(async () => {
    const secure = new SecureLocal();
    await secure.remove("three");
    return await secure.get(null);
  });
  expect(response).toEqual({ ...testData, three: undefined });

  const response1 = await page.evaluate(async () => {
    const secure = new SecureLocal();
    await secure.remove(["one", "two"]);
    return await secure.get(null);
  });
  expect(response1).toEqual({ five: 5 });
});

test("should clear the whole storage", async ({ page }) => {
  const testData = { one: "one", two: false, three: { four: "four" }, five: 5 };
  await page.evaluate(async (testData) => {
    const secure = new SecureLocal();
    await secure.set(testData);
  }, testData);
  const response = await page.evaluate(async () => {
    const secure = new SecureLocal();
    await secure.clear();
    return await secure.get(null);
  });
  expect(response).toEqual({});
});

test("should use different sections for adding items", async ({ page }) => {
  const privateSectionData = { key: "private-key" };
  const publicSectionData = { key: "public-key" };
  const response = await page.evaluate(
    async (testData) => {
      const private_section = new SecureLocal("private");
      await private_section.set(testData.privateSectionData);
      const private_res = await private_section.get("key");

      const public_section = new SecureLocal("public");
      await public_section.set(testData.publicSectionData);
      const public_res = await public_section.get("key");

      return { private_res, public_res };
    },
    { privateSectionData, publicSectionData }
  );
  expect(response).toMatchObject({
    private_res: privateSectionData,
    public_res: publicSectionData,
  });
});
