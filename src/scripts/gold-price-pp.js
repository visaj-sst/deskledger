import { chromium } from "playwright";
import GoldMasterModel from "../modules/admin/gold-master/model/goldMaster.js";
import logger from "../service/logger.service.js";

const scrapeGoldPrices = async (url) => {
  let browser;
  try {
    logger.info("Starting gold price scraping...");

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-http2",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

    const goldPriceSeeder = async (goldRates) => {
      try {
        await GoldMasterModel.updateOne(
          {},
          {
            goldRate22KPerGram: goldRates.goldRate22K,
            goldRate24KPerGram: goldRates.goldRate24K,
          },
          { upsert: true }
        );
        logger.info("Gold prices seeded successfully.");
      } catch (error) {
        logger.error(`Error seeding gold prices: ${error.message}`);
        throw error;
      }
    };

    const data = await page.evaluate(() => {
      const extractGoldRate = (headingText) => {
        const heading = Array.from(document.querySelectorAll("h2")).find((el) =>
          el.textContent.includes(headingText)
        );

        if (!heading) return null;

        const table = heading.nextElementSibling?.querySelector("table");
        const firstRow = table?.querySelector("tbody tr:first-child");
        const todayCell = firstRow?.querySelector("td:nth-child(2) span");
        return parseInt(todayCell?.textContent.replace(/[^\d]/g, ""), 10);
      };

      return {
        goldRate22K: extractGoldRate("22 Carat Gold Rate"),
        goldRate24K: extractGoldRate("24 Carat Gold Rate"),
      };
    });

    if (!data.goldRate22K || !data.goldRate24K) {
      throw new Error("Failed to scrape gold prices. Data is incomplete.");
    }

    await GoldMasterModel.updateOne(
      {},
      {
        goldRate22KPerGram: data.goldRate22K,
        goldRate24KPerGram: data.goldRate24K,
      },
      { upsert: true }
    );

    await goldPriceSeeder(data);

    logger.info("Gold prices updated successfully.");
  } catch (error) {
    logger.error(`Error scraping gold prices: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
};

export const startGoldPriceScraping = async () => {
  const goldPriceUrl = "https://www.bankbazaar.com/gold-rate-ahmedabad.html";
  await scrapeGoldPrices(goldPriceUrl);
};
