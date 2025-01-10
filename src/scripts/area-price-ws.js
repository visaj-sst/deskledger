import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AreaPriceModel from "../modules/admin/area-price/model/areaPrice.js";
import CityModel from "../modules/admin/city/model/city.js";
import StateModel from "../modules/admin/state/model/state.js";
import logger from "../service/logger.service.js";

puppeteer.use(StealthPlugin());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeCityData = async (url, cityName, stateName) => {
  let browser; // Declare browser outside the try block for cleanup
  try {
    // Launch browser with additional stability options
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
    const page = await browser.newPage();

    let state = await StateModel.findOne({ state: stateName });
    if (!state) {
      state = await StateModel.create({ state: stateName });
    }

    let city = await CityModel.findOne({ city: cityName, stateId: state._id });
    if (!city) {
      city = await CityModel.create({ city: cityName, stateId: state._id });
    }

    const existingAreas = await AreaPriceModel.findOne({ cityId: city._id });
    if (existingAreas) return;

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36"
    );
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });

    await sleep(5000);

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

    for (const item of data) {
      await AreaPriceModel.create({
        cityId: city._id,
        stateId: state._id,
        areaName: item.areaName,
        pricePerSquareFoot: item.pricePerSquareFoot,
      });
    }
  } catch (error) {
    logger.error(`Error scraping ${cityName}: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
};

export const startScraping = async () => {
  try {
    logger.info("Starting scraping for all cities...");
    const cityUrls = [
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-bangalore-prffid",
        cityName: "Bangalore",
        stateName: "Karnataka",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-mumbai-prffid",
        cityName: "Mumbai",
        stateName: "Maharashtra",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-delhi-prffid",
        cityName: "Delhi",
        stateName: "Delhi",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-pune-prffid",
        cityName: "Pune",
        stateName: "Maharashtra",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-chennai-prffid",
        cityName: "Chennai",
        stateName: "Tamil Nadu",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-hyderabad-prffid",
        cityName: "Hyderabad",
        stateName: "Telangana",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-kolkata-prffid",
        cityName: "Kolkata",
        stateName: "West Bengal",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-navi-mumbai-prffid",
        cityName: "Navi Mumbai",
        stateName: "Maharashtra",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-gurgaon-prffid",
        cityName: "Gurgaon",
        stateName: "Haryana",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-noida-prffid",
        cityName: "Noida",
        stateName: "Uttar Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-greater-noida-prffid",
        cityName: "Greater Noida",
        stateName: "Uttar Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-ghaziabad-prffid",
        cityName: "Ghaziabad",
        stateName: "Uttar Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-ahmedabad-prffid",
        cityName: "Ahmedabad",
        stateName: "Gujarat",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-lucknow-prffid",
        cityName: "Lucknow",
        stateName: "Uttar Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-nagpur-prffid",
        cityName: "Nagpur",
        stateName: "Maharashtra",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-jaipur-prffid",
        cityName: "Jaipur",
        stateName: "Rajasthan",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-faridabad-prffid",
        cityName: "Faridabad",
        stateName: "Haryana",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-coimbatore-prffid",
        cityName: "Coimbatore",
        stateName: "Tamil Nadu",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-mohali-prffid",
        cityName: "Mohali",
        stateName: "Punjab",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-indore-prffid",
        cityName: "Indore",
        stateName: "Madhya Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-mumbai-thane-prffid",
        cityName: "Thane",
        stateName: "Maharashtra",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-mumbai-beyond-thane-prffid",
        cityName: "Beyond Thane",
        stateName: "Maharashtra",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-bhubaneswar-prffid",
        cityName: "Bhubaneswar",
        stateName: "Odisha",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-dehradun-prffid",
        cityName: "Dehradun",
        stateName: "Uttarakhand",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-vadodara-prffid",
        cityName: "Vadodara",
        stateName: "Gujarat",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-visakhapatnam-prffid",
        cityName: "Visakhapatnam",
        stateName: "Andhra Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-raipur-prffid",
        cityName: "Raipur",
        stateName: "Chhattisgarh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-secunderabad-prffid",
        cityName: "Secunderabad",
        stateName: "Telangana",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-surat-prffid",
        cityName: "Surat",
        stateName: "Gujarat",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-kochi-prffid",
        cityName: "Kochi",
        stateName: "Kerala",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-mira-road-and-beyond-prffid",
        cityName: "Mira Road",
        stateName: "Maharashtra",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-guwahati-prffid",
        cityName: "Guwahati",
        stateName: "Assam",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-chandigarh-prffid",
        cityName: "Chandigarh",
        stateName: "Chandigarh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-mysore-prffid",
        cityName: "Mysore",
        stateName: "Karnataka",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-trichi-prffid",
        cityName: "Tiruchirappalli",
        stateName: "Tamil Nadu",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-kanpur-prffid",
        cityName: "Kanpur",
        stateName: "Uttar Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-panchkula-prffid",
        cityName: "Panchkula",
        stateName: "Haryana",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-bhopal-prffid",
        cityName: "Bhopal",
        stateName: "Madhya Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-patna-prffid",
        cityName: "Patna",
        stateName: "Bihar",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-vijaywada-prffid",
        cityName: "Vijayawada",
        stateName: "Andhra Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-varanasi-prffid",
        cityName: "Varanasi",
        stateName: "Uttar Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-ranchi-prffid",
        cityName: "Ranchi",
        stateName: "Jharkhand",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-mangalore-prffid",
        cityName: "Mangalore",
        stateName: "Karnataka",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-siliguri-prffid",
        cityName: "Siliguri",
        stateName: "West Bengal",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-trivandrum-prffid",
        cityName: "Thiruvananthapuram",
        stateName: "Kerala",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-north-goa-prffid",
        cityName: "North Goa",
        stateName: "Goa",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-nashik-prffid",
        cityName: "Nashik",
        stateName: "Maharashtra",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-durgapur-prffid",
        cityName: "Durgapur",
        stateName: "West Bengal",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-agra-prffid",
        cityName: "Agra",
        stateName: "Uttar Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-madurai-prffid",
        cityName: "Madurai",
        stateName: "Tamil Nadu",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-gandhinagar-prffid",
        cityName: "Gandhinagar",
        stateName: "Gujarat",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-guntur-prffid",
        cityName: "Guntur",
        stateName: "Andhra Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-thrissur-prffid",
        cityName: "Thrissur",
        stateName: "Kerala",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-jabalpur-prffid",
        cityName: "Jabalpur",
        stateName: "Madhya Pradesh",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-rajkot-prffid",
        cityName: "Rajkot",
        stateName: "Gujarat",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-pondicherry-prffid",
        cityName: "Pondicherry",
        stateName: "Puducherry",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-udaipur-prffid",
        cityName: "Udaipur",
        stateName: "Rajasthan",
      },
      {
        url: "https://www.99acres.com/property-rates-and-price-trends-in-mathura-prffid",
        cityName: "Mathura",
        stateName: "Uttar Pradesh",
      },
    ];

    for (const { url, cityName, stateName } of cityUrls) {
      await scrapeCityData(url, cityName, stateName);
    }

    logger.info("All cities scraped successfully.");
  } catch (error) {
    logger.error(`Error during scraping: ${error.message}`);
  }
};
