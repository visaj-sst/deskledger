import fs from "fs/promises";
import { chromium } from "playwright";
import logger from "../service/logger.service.js";
import pLimit from "p-limit";

// Helper functions for sleeping and retrying
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomSleep = async (min = 3000, max = 7000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await sleep(delay);
};

const retryOperation = async (operation, maxRetries = 3, delayMs = 5000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      logger.warn(`Attempt ${attempt} failed: ${error.message}. Retrying...`);
      await sleep(delayMs);
    }
  }
};

const scrapeCityData = async (context, url, cityName, stateName) => {
  let page;
  try {
    page = await context.newPage();
    await retryOperation(
      () =>
        page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 180000, // Increased timeout to 3 minutes
        }),
      3,
      5000
    );

    logger.info(`Successfully navigated to ${url}`);
    await randomSleep();

    const data = await page.evaluate(() => {
      const areaElements = document.querySelectorAll(".rT__ptTuple");
      if (!areaElements.length) {
        throw new Error("No area elements found");
      }

      return Array.from(areaElements)
        .map((el) => {
          const areaName =
            el.querySelector('a[itemprop="url"]')?.textContent?.trim() || "";
          const pricePerSquareFootText =
            el.querySelector("div.rT__shs")?.textContent || "";
          const pricePerSquareFoot =
            parseInt(pricePerSquareFootText.replace(/[^\d]/g, ""), 10) || 0;

          return { areaName, pricePerSquareFoot };
        })
        .filter((item) => item.areaName && item.pricePerSquareFoot > 0);
    });

    return data.map((item) => ({
      stateName,
      cityName,
      areaName: item.areaName,
      pricePerSquareFoot: item.pricePerSquareFoot,
    }));
  } catch (error) {
    logger.error(`Error scraping ${cityName} (${url}): ${error.message}`);
    throw error;
  } finally {
    if (page) await page.close();
  }
};

export const startScraping = async () => {
  try {
    logger.info("Starting scraping for all cities...");
    const cityUrls = [
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-bangalore-prffid",
      //   cityName: "Bangalore",
      //   stateName: "Karnataka",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-mumbai-prffid",
      //   cityName: "Mumbai",
      //   stateName: "Maharashtra",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-delhi-prffid",
      //   cityName: "Delhi",
      //   stateName: "Delhi",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-pune-prffid",
      //   cityName: "Pune",
      //   stateName: "Maharashtra",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-chennai-prffid",
      //   cityName: "Chennai",
      //   stateName: "Tamil Nadu",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-hyderabad-prffid",
      //   cityName: "Hyderabad",
      //   stateName: "Telangana",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-kolkata-prffid",
      //   cityName: "Kolkata",
      //   stateName: "West Bengal",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-navi-mumbai-prffid",
      //   cityName: "Navi Mumbai",
      //   stateName: "Maharashtra",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-gurgaon-prffid",
      //   cityName: "Gurgaon",
      //   stateName: "Haryana",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-noida-prffid",
      //   cityName: "Noida",
      //   stateName: "Uttar Pradesh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-greater-noida-prffid",
      //   cityName: "Greater Noida",
      //   stateName: "Uttar Pradesh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-ghaziabad-prffid",
      //   cityName: "Ghaziabad",
      //   stateName: "Uttar Pradesh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-ahmedabad-prffid",
      //   cityName: "Ahmedabad",
      //   stateName: "Gujarat",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-lucknow-prffid",
      //   cityName: "Lucknow",
      //   stateName: "Uttar Pradesh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-nagpur-prffid",
      //   cityName: "Nagpur",
      //   stateName: "Maharashtra",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-jaipur-prffid",
      //   cityName: "Jaipur",
      //   stateName: "Rajasthan",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-faridabad-prffid",
      //   cityName: "Faridabad",
      //   stateName: "Haryana",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-coimbatore-prffid",
      //   cityName: "Coimbatore",
      //   stateName: "Tamil Nadu",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-mohali-prffid",
      //   cityName: "Mohali",
      //   stateName: "Punjab",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-indore-prffid",
      //   cityName: "Indore",
      //   stateName: "Madhya Pradesh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-mumbai-thane-prffid",
      //   cityName: "Thane",
      //   stateName: "Maharashtra",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-mumbai-beyond-thane-prffid",
      //   cityName: "Beyond Thane",
      //   stateName: "Maharashtra",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-bhubaneswar-prffid",
      //   cityName: "Bhubaneswar",
      //   stateName: "Odisha",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-dehradun-prffid",
      //   cityName: "Dehradun",
      //   stateName: "Uttarakhand",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-vadodara-prffid",
      //   cityName: "Vadodara",
      //   stateName: "Gujarat",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-visakhapatnam-prffid",
      //   cityName: "Visakhapatnam",
      //   stateName: "Andhra Pradesh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-raipur-prffid",
      //   cityName: "Raipur",
      //   stateName: "Chhattisgarh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-secunderabad-prffid",
      //   cityName: "Secunderabad",
      //   stateName: "Telangana",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-surat-prffid",
      //   cityName: "Surat",
      //   stateName: "Gujarat",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-kochi-prffid",
      //   cityName: "Kochi",
      //   stateName: "Kerala",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-mira-road-and-beyond-prffid",
      //   cityName: "Mira Road",
      //   stateName: "Maharashtra",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-guwahati-prffid",
      //   cityName: "Guwahati",
      //   stateName: "Assam",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-chandigarh-prffid",
      //   cityName: "Chandigarh",
      //   stateName: "Chandigarh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-kanpur-prffid",
      //   cityName: "Kanpur",
      //   stateName: "Uttar Pradesh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-panchkula-prffid",
      //   cityName: "Panchkula",
      //   stateName: "Haryana",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-bhopal-prffid",
      //   cityName: "Bhopal",
      //   stateName: "Madhya Pradesh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-patna-prffid",
      //   cityName: "Patna",
      //   stateName: "Bihar",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-varanasi-prffid",
      //   cityName: "Varanasi",
      //   stateName: "Uttar Pradesh",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-ranchi-prffid",
      //   cityName: "Ranchi",
      //   stateName: "Jharkhand",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-mangalore-prffid",
      //   cityName: "Mangalore",
      //   stateName: "Karnataka",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-siliguri-prffid",
      //   cityName: "Siliguri",
      //   stateName: "West Bengal",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-trivandrum-prffid",
      //   cityName: "Thiruvananthapuram",
      //   stateName: "Kerala",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-north-goa-prffid",
      //   cityName: "North Goa",
      //   stateName: "Goa",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-nashik-prffid",
      //   cityName: "Nashik",
      //   stateName: "Maharashtra",
      // },
      // {
      //   url: "https://www.99acres.com/property-rates-and-price-trends-in-durgapur-prffid",
      //   cityName: "Durgapur",
      //   stateName: "West Bengal",
      // },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-agra-prffid",
        cityName: "Agra",
        stateName: "Uttar Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-gandhinagar-prffid",
        cityName: "Gandhinagar",
        stateName: "Gujarat",
      },
    ];

    const browser = await chromium.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-http2",
        "--disable-extensions",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        "accept-language": "en-US,en;q=0.9",
      },
    });

    const limit = pLimit(3);
    const allData = await Promise.all(
      cityUrls.map(({ url, cityName, stateName }) =>
        limit(() => scrapeCityData(context, url, cityName, stateName))
      )
    );

    // Read existing data from JSON to append new scraped data
    let existingData = [];
    try {
      const rawData = await fs.readFile("scraped_data.json", "utf-8");
      existingData = JSON.parse(rawData);
    } catch (error) {
      logger.warn("No existing data found. Starting with new data.");
    }

    // Filter out already existing data in the JSON file (avoid duplicates)
    const mergedData = [
      ...existingData,
      ...allData
        .flat()
        .filter(
          (newItem) =>
            !existingData.some(
              (existingItem) =>
                existingItem.cityName === newItem.cityName &&
                existingItem.areaName === newItem.areaName
            )
        ),
    ];

    // Save all data to JSON file (no duplicates)
    await fs.writeFile(
      "scraped_data.json",
      JSON.stringify(mergedData, null, 2)
    );
    logger.info("Scraped data successfully saved to JSON file.");

    await context.close();
    await browser.close();
  } catch (error) {
    logger.error(`Error during scraping: ${error.message}`);
    throw error;
  }
};
