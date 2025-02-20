import yahooFinance from "yahoo-finance2";
import logger from "../service/logger.service.js";
import fs from "fs/promises";
import axios from "axios";

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

export const fetchStockPrices = async (stocks) => {
  try {
    if (!stocks || stocks.length === 0) {
      throw new Error("No stocks available to fetch.");
    }

    const stockSymbols = stocks.map((stock) => stock.symbol);
    const batches = batchArray(stockSymbols, BATCH_SIZE);

    let allStockPrices = [];

    for (const batch of batches) {
      const batchPrices = await fetchStockPricesBatch(batch);
      allStockPrices = allStockPrices.concat(batchPrices);
    }

    return allStockPrices;
  } catch (error) {
    logger.error("Error in fetchStockPrices", error);
    return [];
  }
};
