import StockModel from "../model/stockModel.js";
import yahooFinance from "yahoo-finance2";
import { statusCode, message } from "../../../utils/api.response.js";
import logger from "../../../service/logger.service.js";
import TransactionModel from "../model/transactionModel.js";
import { loadStocks, fetchStockPrices } from "../../../helpers/stockPrices.js";

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
      sellPrice,
    } = req.body;

    let existingStock = await StockModel.findOne({
      stockSymbol,
      firstName,
      lastName,
    });

    if (type === "buy") {
      const totalInvestedAmount = buyPrice * quantity;

      const transaction = new TransactionModel({
        stockSymbol,
        type: "buy",
        price: buyPrice,
        quantity,
        totalAmount: totalInvestedAmount,
      });
      await transaction.save();

      if (existingStock) {
        const newTotalQuantity = existingStock.quantity + quantity;
        const newTotalInvestment =
          existingStock.totalInvestedAmount + totalInvestedAmount;

        existingStock.totalInvestedAmount = newTotalInvestment;
        existingStock.quantity = newTotalQuantity;
        existingStock.buyPrice = newTotalInvestment / newTotalQuantity;
      } else {
        existingStock = new StockModel({
          firstName,
          lastName,
          stockSymbol,
          quantity,
          totalInvestedAmount,
          buyPrice,
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

      existingStock.realizedProfitLoss += profitLoss;
      existingStock.quantity -= quantity;
      existingStock.totalInvestedAmount -= soldInvestmentAmount;

      const transaction = new TransactionModel({
        stockSymbol,
        type: "sell",
        price: sellPrice,
        quantity,
        totalAmount: totalSaleAmount,
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
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
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
    const { symbol } = req.query;

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
    const period2 = Math.min(nowTimestamp, marketCloseTimestamp);

    let intradayData = await yahooFinance.chart(symbol, {
      period1: marketOpenTimestamp,
      period2: period2,
      interval: "1m",
    });

    if (
      !intradayData ||
      !intradayData.quotes ||
      intradayData.quotes.length === 0
    ) {
      intradayData = await yahooFinance.chart(symbol, {
        period1: marketOpenTimestamp,
        period2: period2,
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

    const chartData = await yahooFinance.chart(symbol, {
      period1: "2025-01-01",
      period2: new Date().toISOString().split("T")[0],
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

    if (stocks.length === 0) {
      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: "No stocks available for update.",
      });
    }

    for (let stock of stocks) {
      const stockData = await yahooFinance.quote(stock.stockSymbol + ".BO");

      if (stockData?.regularMarketPrice) {
        stock.currentPrice = stockData.regularMarketPrice;
        stock.totalReturnAmount = stock.quantity * stock.currentPrice;

        // Calculate Unrealized Profit/Loss (For stocks still held)
        stock.unrealizedProfitLoss =
          stock.totalReturnAmount - stock.totalInvestedAmount;

        // If stock has been sold, calculate realized profit/loss
        if (stock.sellPrice) {
          let realizedProfitLoss =
            (stock.sellPrice - stock.buyPrice) * stock.quantity;
          stock.realizedProfitLoss = realizedProfitLoss;
        }

        await stock.save();
      }
    }

    // Fetch stocks again to send updated response with srNo
    const updatedStocks = await StockModel.find();

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: "Stock prices updated successfully.",
      stocks: updatedStocks.map((stock, index) => ({
        ...stock.toObject(),
        srNo: index + 1, // Adding serial number
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

    let transactions;

    if (stockSymbol) {
      transactions = await TransactionModel.find({ stockSymbol });
    } else {
      transactions = await TransactionModel.find();
    }

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

//====================== TOP GAINERS ======================//
export const getTopGainers = async (req, res) => {
  try {
    const stocks = await loadStocks();
    if (!stocks.length) throw new Error("No stocks found in JSON file.");

    let stockPrices = await fetchStockPrices(stocks);
    if (!stockPrices.length)
      throw new Error("No stock data returned from API.");

    console.log("Fetched Stock Prices:", stockPrices);

    // Remove stocks with zero price change
    stockPrices = stockPrices.filter((stock) => stock.change !== 0);

    // Sort by changePercent in descending order
    const sortedGainers = stockPrices.sort(
      (a, b) => b.changePercent - a.changePercent
    );

    // Ensure we always return 5 gainers (even if some have small % gains)
    const topGainers = sortedGainers.slice(0, 5);

    console.log("Filtered & Sorted Top Gainers:", topGainers);

    return res.status(200).json({
      statusCode: 200,
      message: "Top Gainers fetched successfully",
      data: topGainers.map((gainer, index) => ({
        ...gainer,
        srNo: index + 1,
      })),
    });
  } catch (error) {
    console.error("Error fetching Top Gainers:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error while fetching Top Gainers",
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

    // Remove stocks with 0% change
    stockPrices = stockPrices.filter((stock) => stock.changePercent !== 0);

    // Sort in ascending order (lowest % change first)
    const sortedLosers = stockPrices
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5); // Take only top 5 losers

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: "Top Losers fetched successfully",
      data: sortedLosers.map((loser, index) => ({
        ...loser,
        srNo: index + 1,
      })),
    });
  } catch (error) {
    logger.error("Error fetching Top Losers", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: "Internal Server Error while fetching Top Losers",
    });
  }
};

//====================== WORKING 20TH FEB 2025 10 : 54 AM  ======================//
