import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import mongoose from "mongoose";
import GoldMasterModel from "../modules/admin/gold-master/model/goldMaster.js";
import logger from "../service/logger.service.js";

puppeteer.use(StealthPlugin());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeGoldPrices = async (url) => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();

  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/investment", {});

    logger.info("Starting gold price scraping...");
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36"
    );
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });

    await sleep(5000);

    const data = await page.evaluate(() => {
      const extractGoldRate = (headingText) => {
        const heading = Array.from(document.querySelectorAll("h2")).find((el) =>
          el.textContent.includes(headingText)
        );

        if (!heading) return null;

        const table = heading.nextElementSibling.querySelector("table");
        const firstRow = table.querySelector("tbody tr:first-child");
        const todayCell = firstRow.querySelector("td:nth-child(2) span");
        return parseInt(todayCell.textContent.replace(/[^\d]/g, ""), 10);
      };

      const goldRate22K = extractGoldRate("22 Carat Gold Rate");
      const goldRate24K = extractGoldRate("24 Carat Gold Rate");

      return { goldRate22K, goldRate24K };
    });

    if (!data.goldRate22K || !data.goldRate24K) {
      throw new Error("Failed to scrape gold prices. Data is incomplete.");
    }

    let goldData = await GoldMasterModel.findOne();
    if (goldData) {
      goldData.goldRate22KPerGram = data.goldRate22K;
      goldData.goldRate24KPerGram = data.goldRate24K;
      await goldData.save();

      logger.info("Gold prices updated successfully.");
    } else {
      await GoldMasterModel.create({
        goldRate22KPerGram: data.goldRate22K,
        goldRate24KPerGram: data.goldRate24K,
      });
      logger.info("Gold prices added to the database successfully.");
    }
  } catch (error) {
    logger.error(`Error scraping gold prices: ${error.message}`);
  } finally {
    if (browser) await browser.close();
    await mongoose.disconnect();
  }
};

export const startGoldPriceScraping = async () => {
  const goldPriceUrl = "https://www.bankbazaar.com/gold-rate-ahmedabad.html";
  await scrapeGoldPrices(goldPriceUrl);
};
