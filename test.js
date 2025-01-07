import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Chromium\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto("https://google.com");

  console.log("Page title:", await page.title());

  await browser.close();
})();
