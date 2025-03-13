import StockModel from "../model/stockModel.js";
import yahooFinance from "yahoo-finance2";
import { statusCode, message } from "../../../utils/api.response.js";
import logger from "../../../service/logger.service.js";
import TransactionModel from "../model/transactionModel.js";
import { loadStocks, fetchStockPrices } from "../../../helpers/stockPrices.js";
import {
  BSE_API_URL,
  cache,
  fetchWithTimeout,
} from "../../../helpers/topMovers.js";
import TokenModel from "../../user/model/tokenModel.js";

//====================== DATE FILTERS ======================//

export const getDateFilters = (startDate, endDate) => {
  const filters = {};
  if (startDate) {
    filters["$gte"] = new Date(new Date(startDate).setHours(0, 0, 0, 0));
  }
  if (endDate) {
    filters["$lte"] = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }
  return filters;
};

//====================== ADD STOCK ======================//

export const createStock = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      stockSymbol,
      buyPrice,
      quantity,
      type,
      userId,
      sellPrice,
      buyDate,
      sellDate,
    } = req.body;

    let existingStock = await StockModel.findOne({
      userId,
      stockSymbol,
      firstName,
      lastName,
    });

    if (type === "buy") {
      const totalInvestedAmount = buyPrice * quantity;

      const transaction = new TransactionModel({
        firstName,
        lastName,
        stockSymbol,
        type: "buy",
        price: buyPrice,
        quantity,
        totalAmount: totalInvestedAmount,
        transactionDate: buyDate,
      });
      await transaction.save();

      if (existingStock) {
        const newTotalQuantity = existingStock.quantity + quantity;
        const newTotalInvestment =
          existingStock.totalInvestedAmount + totalInvestedAmount;

        existingStock.quantity = newTotalQuantity;
        existingStock.totalInvestedAmount = newTotalInvestment;
        existingStock.buyPrice = newTotalInvestment / newTotalQuantity;
        existingStock.buyDate = buyDate;
      } else {
        existingStock = new StockModel({
          firstName,
          lastName,
          stockSymbol,
          quantity,
          totalInvestedAmount,
          buyPrice,
          userId,
          buyDate,
          sellDate: sellDate,
          realizedProfitLoss: 0,
        });
      }

      await existingStock.save();
      return res.status(statusCode.CREATED).json({
        statusCode: statusCode.CREATED,
        message: message.stockCreated,
        data: existingStock,
      });
    }

    if (type === "sell") {
      if (!existingStock || existingStock.quantity < quantity) {
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: message.insufficientStock,
        });
      }

      const totalSaleAmount = sellPrice * quantity;
      const profitLoss = (sellPrice - existingStock.buyPrice) * quantity;
      const soldInvestmentAmount = existingStock.buyPrice * quantity;

      existingStock.realizedProfitLoss =
        (existingStock.realizedProfitLoss || 0) + profitLoss;
      existingStock.quantity -= quantity;
      existingStock.totalInvestedAmount -= soldInvestmentAmount;
      existingStock.sellPrice = sellPrice;
      existingStock.sellDate = sellDate;

      const transaction = new TransactionModel({
        firstName,
        lastName,
        stockSymbol,
        type: "sell",
        price: sellPrice,
        quantity,
        totalAmount: totalSaleAmount,
        transactionDate: sellDate,
      });
      await transaction.save();

      if (existingStock.quantity === 0) {
        await StockModel.findByIdAndDelete(existingStock._id);
      } else {
        await existingStock.save();
      }

      return res.status(statusCode.CREATED).json({
        statusCode: statusCode.CREATED,
        message: message.sellStockAdded,
        data: {
          ...existingStock.toObject(),
          sellPrice: sellPrice,
          totalSaleAmount: totalSaleAmount,
          realizedProfitLoss: profitLoss,
        },
      });
    }
  } catch (error) {
    logger.error("Error processing stock transaction:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};
//====================== UPDATE STOCK  ======================//

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, stockSymbol, price, quantity, type, userId } =
      req.body;

    const today = new Date().toISOString().split("T")[0];

    let existingStock = await StockModel.findById(id);
    if (!existingStock) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingStock,
      });
    }

    const updatedQuantity = existingStock.quantity + (quantity ?? 0);
    const updatedprice = price ?? existingStock.price;
    const totalInvestedAmount = updatedQuantity * updatedprice;

    const updatedStock = await StockModel.findByIdAndUpdate(
      id,
      {
        firstName: firstName ?? existingStock.firstName,
        lastName: lastName ?? existingStock.lastName,
        stockSymbol: stockSymbol ?? existingStock.stockSymbol,
        price: updatedprice,
        quantity: updatedQuantity,
        type: type ?? existingStock.type,
        userId: userId ?? existingStock.userId,
        buyDate,
        sellDate,
        totalInvestedAmount,
      },
      { new: true }
    );

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.stockUpdated,
      data: updatedStock,
    });
  } catch (error) {
    logger.error("Error while updating stock: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//====================== DELETE STOCK ======================//

export const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStock = await StockModel.findByIdAndDelete(id);

    if (!deletedStock) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingStock,
      });
    }

    await TransactionModel.deleteMany({
      stockSymbol: deletedStock.stockSymbol,
      firstName: deletedStock.firstName,
      lastName: deletedStock.lastName,
      userId,
    });

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.stockDeleted,
    });
  } catch (error) {
    logger.error("Error while deleting stock: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//====================== FOR TRADING VIEW ======================//

export const getStockData = async (req, res) => {
  try {
    const { symbol, startDate, endDate } = req.query;

    if (!symbol) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.stockSymbolisRequire,
      });
    }

    const stockData = await yahooFinance.quote(symbol);
    if (!stockData) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.stockDataNotFound,
      });
    }

    const now = new Date();

    const marketOpenIST = new Date();
    marketOpenIST.setHours(9, 15, 0, 0);
    const marketOpenUTC = new Date(
      marketOpenIST.getTime() - 5.5 * 60 * 60 * 1000
    );
    const marketOpenTimestamp = Math.floor(marketOpenUTC.getTime() / 1000);

    const marketCloseIST = new Date();
    marketCloseIST.setHours(15, 30, 0, 0);
    const marketCloseUTC = new Date(
      marketCloseIST.getTime() - 5.5 * 60 * 60 * 1000
    );
    const marketCloseTimestamp = Math.floor(marketCloseUTC.getTime() / 1000);

    const nowTimestamp = Math.floor(now.getTime() / 1000);
    const period2Intraday = Math.min(nowTimestamp, marketCloseTimestamp);

    let intradayData = await yahooFinance.chart(symbol, {
      period1: marketOpenTimestamp,
      period2: period2Intraday,
      interval: "1m",
    });

    if (
      !intradayData ||
      !intradayData.quotes ||
      intradayData.quotes.length === 0
    ) {
      intradayData = await yahooFinance.chart(symbol, {
        period1: marketOpenTimestamp,
        period2: period2Intraday,
        interval: "5m",
      });
    }

    const formattedIntradayData =
      intradayData.quotes?.map((point) => ({
        time: new Date(point.date).toISOString(),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume,
      })) || [];

    const isValidDate = (d) => d instanceof Date && !isNaN(d);

    let start, end;
    if (startDate) {
      start = new Date(startDate);
      if (!isValidDate(start)) {
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: "Invalid startDate",
        });
      }
    } else {
      start = new Date("2024-01-01");
    }

    if (endDate) {
      end = new Date(endDate);
      if (!isValidDate(end)) {
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: "Invalid endDate",
        });
      }
    } else {
      end = new Date();
    }

    if (startDate && endDate && startDate === endDate) {
      end.setDate(end.getDate() + 1);
    }

    const period1Historical = start.toISOString().split("T")[0];
    const period2Historical = end.toISOString().split("T")[0];

    const chartData = await yahooFinance.chart(symbol, {
      period1: period1Historical,
      period2: period2Historical,
      interval: "1d",
    });

    const historicalData =
      chartData.quotes?.map((point) => ({
        time: new Date(point.date).toISOString(),
        price: point.close,
      })) || [];

    const todayData = {
      date: new Date().toISOString().split("T")[0],
      time: new Date().toISOString(),
      open: stockData.regularMarketOpen,
      high: stockData.regularMarketDayHigh,
      low: stockData.regularMarketDayLow,
      close: stockData.regularMarketPrice,
    };

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.tradingDataFetched,
      stockSymbol: symbol,
      currentPrice: stockData.regularMarketPrice,
      todayData: todayData,
      intradayData: formattedIntradayData,
      historicalData: historicalData,
    });
  } catch (error) {
    logger.error("Error fetching stock data:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//====================== DELETE MULTIPLE STOCKS ======================//

export const deleteMultipleStocks = async (req, res) => {
  try {
    const { ids } = req.body;

    const deletedStocks = await StockModel.deleteMany({ _id: { $in: ids } });

    if (deletedStocks.deletedCount === 0) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingStock,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.stocksDeleted,
      deletedCount: deletedStocks.deletedCount,
    });
  } catch (error) {
    logger.error("Error while deleting multiple stocks: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//====================== UPDATE PRICES FROM YAHOO FINANCE API ======================//

export const getDatafromLiveStockPricesAndUpdate = async (req, res) => {
  try {
    const stocks = await StockModel.find();

    if (!stocks || stocks.length === 0) {
      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: "No stocks available for update.",
      });
    }

    for (let stock of stocks) {
      const symbol = stock.stockSymbol.endsWith(".BO")
        ? stock.stockSymbol
        : stock.stockSymbol + ".BO";

      const stockData = await yahooFinance.quote(symbol);

      if (stockData && stockData.regularMarketPrice != null) {
        const currentPrice = Number(stockData.regularMarketPrice);
        const quantity = Number(stock.quantity);
        const totalInvestedAmount = Number(stock.buyPrice) * quantity;

        stock.currentPrice = currentPrice;
        stock.totalReturnAmount = quantity * currentPrice;
        stock.unrealizedProfitLoss =
          stock.totalReturnAmount - totalInvestedAmount;

        if (typeof stock.realizedProfitLoss !== "number") {
          stock.realizedProfitLoss = 0;
        }

        await stock.save();
      } else {
        console.log(`No valid market price for ${stock.stockSymbol}`);
      }
    }

    const updatedStocks = await StockModel.find({
      unrealizedProfitLoss: { $gt: 0 },
    })
      .sort({ unrealizedProfitLoss: -1 })
      .limit(10);

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message:
        updatedStocks.length > 0
          ? "Stock prices updated successfully."
          : "No profitable stocks available.",
      stocks: updatedStocks.map((stock, index) => ({
        ...stock.toObject(),
        srNo: index + 1,
      })),
    });
  } catch (error) {
    logger.error("Error while updating stock prices:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: "Internal Server Error while updating stock prices.",
    });
  }
};

//====================== TRANSACTION HISTORY ======================//

export const getTransactionHistory = async (req, res) => {
  try {
    const { stockSymbol } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilters = getDateFilters(startDate, endDate);
    const query = {};

    if (stockSymbol) {
      query.stockSymbol = stockSymbol;
    }

    if (startDate || endDate) {
      query.transactionDate = dateFilters;
    }

    const transactions = await TransactionModel.find(query);

    if (!transactions || transactions.length === 0) {
      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.transactionHistory,
        transactions: [],
      });
    }

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.transactionHistory,
      transactions: transactions.map((transaction, index) => ({
        ...transaction.toObject(),
        srNo: index + 1,
      })),
    });
  } catch (error) {
    logger.error("Error fetching Transaction History:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//====================== GET TOP GAINERS AND LOSERS  ======================//

export const getBseTopGainersAndLosers = async (req, res) => {
  const cacheKey = "bse_top_movers";

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, cachedData });
  }

  try {
    const data = await fetchWithTimeout(BSE_API_URL);

    const topGainersRaw = data.topGainers || [];
    const topLosersRaw = data.topLooser || [];

    const topGainers = topGainersRaw
      .filter((item) => item?.price && item?.percentChange)
      .sort((a, b) => parseFloat(b.percentChange) - parseFloat(a.percentChange))
      .slice(0, 5)
      .map((item) => ({
        symbol: item.ric || "N/A",
        name: item.displayName || "Unknown",
        price: parseFloat(item.price) || 0,
        changePercent: parseFloat(item.percentChange) || 0,
      }));

    const topLosers = topLosersRaw
      .filter((item) => item?.price && item?.percentChange)
      .sort((a, b) => parseFloat(a.percentChange) - parseFloat(b.percentChange))
      .slice(0, 5)
      .map((item) => ({
        symbol: item.ric || "N/A",
        name: item.displayName || "Unknown",
        price: parseFloat(item.price) || 0,
        changePercent: parseFloat(item.percentChange) || 0,
      }));

    const responseData = {
      success: true,
      data: {
        topGainers: topGainers.length > 0 ? topGainers : [],
        topLosers: topLosers.length > 0 ? topLosers : [],
      },
      lastUpdated:
        data.topGainers[0]?.date && data.topGainers[0]?.time
          ? `${data.topGainers[0].date}T${data.topGainers[0].time}Z`
          : new Date().toISOString(),
      source: "BSE via LiveMint",
      cached: false,
    };

    cache.set(cacheKey, { ...responseData, cached: true });

    res.status(statusCode.OK).json({ statusCode: statusCode.OK, responseData });
  } catch (error) {
    const staleData = cache.get(cacheKey);
    if (staleData) {
      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        ...staleData,
      });
    }

    res.status(statusCode.SERVICE_UNAVAILABLE).json({
      statusCode: statusCode.SERVICE_UNAVAILABLE,
      message: message.failfetchTopMovers,
    });
  }
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
