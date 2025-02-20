import yahooFinance from "yahoo-finance2";
import logger from "../service/logger.service.js";
import fs from "fs/promises";
import axios from "axios";

const BATCH_SIZE = 20;

//====================== LOAD STOCKS FROM JSON FILE ======================//

export const loadStocks = async () => {
  try {
    const data = await fs.readFile("./stocks.json", "utf8");

    if (!data) throw new Error("stocks.json is empty.");

    const stocks = JSON.parse(data);

    if (!Array.isArray(stocks) || stocks.length === 0) {
      throw new Error("No stocks found in stocks.json.");
    }

    return stocks.filter((stock) => stock.symbol); // Ensure only valid stocks
  } catch (error) {
    logger.error("Error reading stocks.json", error);
    return []; // Return empty array to prevent crashes
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
    if (!symbolsBatch.length) {
      throw new Error("Stock symbols batch is empty.");
    }

    const quotes = await yahooFinance.quote(symbolsBatch);

    // Validate response
    if (!quotes || (Array.isArray(quotes) && quotes.length === 0)) {
      throw new Error("Yahoo Finance API returned an empty response.");
    }

    const formattedQuotes = Array.isArray(quotes) ? quotes : [quotes];

    return formattedQuotes
      .filter((stock) => stock && stock.symbol) // Ensure valid stock data
      .map((stock) => ({
        symbol: stock.symbol,
        name: stock.shortName || "N/A",
        price: stock.regularMarketPrice ?? 0,
        change: stock.regularMarketChange ?? 0,
        changePercent: stock.regularMarketChangePercent ?? 0,
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

    const stockSymbols = stocks.map((stockSymbol) => stockSymbol.symbol);
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
