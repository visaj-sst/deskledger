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

export const fetchStockPrices = async (stocks) => {
  const batches = batchArray(stocks, BATCH_SIZE);
  const results = await Promise.all(batches.map(fetchStockPricesBatch));
  return results.flat();
};

//====================== TOP GAINERS ======================//

export const getTopGainers = async (req, res) => {
  try {
    const stocks = await loadStocks();
    if (!stocks.length) throw new Error("No stocks found in JSON file.");

    let stockPrices = await fetchStockPrices(stocks);
    if (!stockPrices.length)
      throw new Error("No stock data returned from API.");

    stockPrices = stockPrices.filter((stock) => stock.change !== 0);

    const sortedGainers = stockPrices.sort(
      (a, b) => b.changePercent - a.changePercent
    );

    const topGainers = sortedGainers.slice(0, 5);

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.topGainers,
      data: topGainers.map((gainer, index) => ({
        ...gainer,
        srNo: index + 1,
      })),
    });
  } catch (error) {
    logger.error("Error fetching Top Gainers:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//====================== TOP LOSERS  ======================//

export const getTopLosers = async (req, res) => {
  try {
    const stocks = await loadStocks();
    if (!stocks.length) throw new Error("No stocks found in JSON file.");

    let stockPrices = await fetchStockPrices(stocks);
    if (!stockPrices.length)
      throw new Error("No stock data returned from API.");

    stockPrices = stockPrices.filter((stock) => stock.changePercent !== 0);

    const sortedLosers = stockPrices
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.stockTopLosers,
      data: sortedLosers.map((loser, index) => ({
        ...loser,
        srNo: index + 1,
      })),
    });
  } catch (error) {
    logger.error("Error fetching Top Losers", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};
