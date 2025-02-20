import puppeteer from "puppeteer";
import fs from "fs";

const URL = "https://www.angelone.in/top-gainers-bse";

async function fetchTopGainers() {
  console.log(`Fetching Top Gainers from BSE...`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });

  await page.goto(URL, { waitUntil: "networkidle0", timeout: 60000 });

  await page.waitForSelector("a.stock-link p.symbol", { timeout: 20000 });

  const stocks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a.stock-link p.symbol"))
      .map((el) => el.textContent.trim() + ".BO")
      .filter((symbol) => symbol);
  });

  await browser.close();

  fs.writeFileSync("stocks.json", JSON.stringify(stocks, null, 2));
  console.log(`Total Stocks Scraped: ${stocks.length}`);
  console.log(" Stocks saved in stocks.json");
}

fetchTopGainers().catch((error) => console.error("Error:", error));
