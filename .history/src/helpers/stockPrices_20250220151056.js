import yahooFinance from "yahoo-finance2";
import logger from "../service/logger.service.js";
import fs from "fs/promises";

const BATCH_SIZE = 20;

//====================== LOAD STOCKS FROM JSON FILE ======================//

export const loadStocks = async () => {
  try {
    const data = await fs.readFile("./stocks.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    logger.error("Error reading stocks.json", error);
    return [];
  }
};

//====================== BATCH ARRAY ======================//

export const batchArray = (arr, size) => {
  const batches = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
};

//====================== FETCH STOCK PRICES IN BATCH ======================//

export const fetchStockPricesBatch = async (symbolsBatch) => {
  try {
    const symbolString = symbolsBatch.join(",");
    const quotes = await yahooFinance.quote(symbolString);
    const formattedQuotes = Array.isArray(quotes) ? quotes : [quotes];
    return formattedQuotes.map((stock) => ({
      symbol: stock.symbol,
      name: stock.shortName,
      price: stock.regularMarketPrice,
      change: stock.regularMarketChange,
      changePercent: stock.regularMarketChangePercent,
    }));
  } catch (error) {
    logger.error("Error fetching stock prices for batch", error);
    return [];
  }
};

//====================== FETCH STOCK PRICES ======================//

export const fetchStockPrices = async () => {
  try {
    const response = await axios.get(YOUR_STOCK_API_URL);

    // Log response to check if it's undefined
    console.log("API Response:", response.data);

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid API response format");
    }

    return response.data;
  } catch (error) {
    console.error("Error in fetchStockPrices:", error.message);
    return []; // Return empty array instead of undefined to prevent crashes
  }
};
