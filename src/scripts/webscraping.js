const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const mongoose = require("mongoose");
const AreaPriceModel = require("../models/areaPrice");

puppeteer.use(StealthPlugin());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeWebsite = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 768 });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });

    await sleep(5000);

    await page.screenshot({ path: "screenshot.png" });

    await page.waitForSelector(
      'a[itemprop="url"].section_header_semiBold.spacer2',
      { timeout: 60000 }
    );

    const data = await page.evaluate(() => {
      const areaElements = document.querySelectorAll(".rT__ptTuple");
      return Array.from(areaElements).map((el) => {
        const areaName =
          el.querySelector('a[itemprop="url"]')?.textContent.trim() || "";
        const pricePerSquareFootText =
          el.querySelector("div.rT__shs")?.textContent || "";
        const pricePerSquareFoot =
          parseInt(pricePerSquareFootText.replace(/[^\d]/g, ""), 10) || 0;
        return { areaName, pricePerSquareFoot };
      });
    });

    await browser.close();

    await mongoose.connect("mongodb://127.0.0.1:27017/investment", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    for (const item of data) {
      const existingArea = await AreaPriceModel.findOne({
        areaName: item.areaName,
      });

      if (existingArea) {
        existingArea.pricePerSquareFoot = item.pricePerSquareFoot;
        await existingArea.save();
      } else {
        await AreaPriceModel.create({
          cityId: new mongoose.Types.ObjectId("66ebcdf4702776bb6735e336"),
          stateId: new mongoose.Types.ObjectId("66ebb9e84936ceda081bd820"),
          areaName: item.areaName,
          pricePerSquareFoot: item.pricePerSquareFoot,
        });
        console.log(`Inserted: ${item.areaName}`);
      }
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error during scraping or DB operation: ", error);
    if (browser) await browser.close();
    await mongoose.disconnect();
  }
};

scrapeWebsite(
  "https://www.99acres.com/property-rates-and-price-trends-in-ahmedabad-prffid"
);
