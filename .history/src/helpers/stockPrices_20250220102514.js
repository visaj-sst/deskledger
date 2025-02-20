import StockModel from "../model/stockModel.js";
import yahooFinance from "yahoo-finance2";
import { statusCode, message } from "../../../utils/api.response.js";
import logger from "../../../service/logger.service.js";
import TransactionModel from "../model/transactionModel.js";
import fs from "fs/promises";

const BATCH_SIZE = 20;

//====================== LOAD STOCKS FROM JSON FILE ======================//

const loadStocks = async () => {
  try {
    const data = await fs.readFile("./stocks.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    logger.error("Error reading stocks.json", error);
    return [];
  }
};

//====================== BATCH ARRAY ======================//

const batchArray = (arr, size) => {
  const batches = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
};

//====================== FETCH STOCK PRICES IN BATCH ======================//

const fetchStockPricesBatch = async (symbolsBatch) => {
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

const fetchStockPrices = async (stocks) => {
  const batches = batchArray(stocks, BATCH_SIZE);
  const results = await Promise.all(batches.map(fetchStockPricesBatch));
  return results.flat();
};
