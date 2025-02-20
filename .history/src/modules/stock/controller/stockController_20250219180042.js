import StockModel from "../model/stockModel.js";
import yahooFinance from "yahoo-finance2";
import { statusCode, message } from "../../../utils/api.response.js";
import logger from "../../../service/logger.service.js";

//====================== ADD STOCK ======================//

export const createStock = async (req, res) => {
  // Input the data from the user
  try {
    const {
      firstName,
      lastName,
      stockSymbol,
      buyPrice,
      sellPrice,
      quantity,
      type,
      userId,
      buyDate,
      sellDate,
    } = req.body;

    // check if the stock exist
    let existingStock = await StockModel.findOne({
      stockSymbol,
      userId,
      firstName,
      lastName,
    });

    if (type === "buy") {
      // check if the stock already exist, if yes then update the existing
      if (existingStock) {
        const updatedQuantity = existingStock.quantity + quantity;
        const totalInvestedAmount =
          existingStock.totalInvestedAmount + buyPrice * quantity;
        const avgBuyPrice = totalInvestedAmount / updatedQuantity;

        existingStock = await StockModel.findByIdAndUpdate(
          existingStock._id,
          {
            quantity: updatedQuantity,
            totalInvestedAmount,
            buyPrice: avgBuyPrice,
            buyDate,
          },
          { new: true }
        );

        // sending message if bought the stock for the 2nd time
        return res.status(statusCode.OK).json({
          statusCode: statusCode.OK,
          message: message.stockUpdated,
          data: existingStock,
        });
      }

      // if existing stock does not exist then create a new one
      const newStock = new StockModel({
        firstName,
        lastName,
        stockSymbol,
        buyPrice,
        quantity,
        type,
        userId,
        buyDate,
        totalInvestedAmount: buyPrice * quantity,
      });

      const savedStock = await newStock.save();
      return res.status(statusCode.CREATED).json({
        statusCode: statusCode.CREATED,
        message: message.stockCreated,
        data: savedStock,
      });
    }

    if (type === "sell") {
      // if we are selling the stock which we didnt buy then throw "stock not found"
      if (!existingStock) {
        return res.status(statusCode.NOT_FOUND).json({
          statusCode: statusCode.NOT_FOUND,
          message: message.stockNotFound,
        });
      }

      if (existingStock.quantity < quantity) {
        // if the existing quantity is less then throw the error
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: message.insufficientStock,
        });
      }

      let existingSellStock = await StockModel.findOne({
        // if the sell stock already exist
        stockSymbol,
        firstName,
        lastName,
        type: "sell",
      });

      if (existingSellStock) {
        // then update the existing selled stock
        existingSellStock.quantity += quantity; // update  quantity
        existingSellStock.totalInvestedAmount += sellPrice * quantity; // updated invested amount
        existingSellStock.sellDate = sellDate; // updated the sell date
        await existingSellStock.save();
      } else {
        existingSellStock = new StockModel({
          firstName,
          lastName,
          stockSymbol,
          sellPrice,
          quantity,
          type: "sell",
          userId,
          sellDate,
          totalInvestedAmount: sellPrice * quantity,
        });
        await existingSellStock.save(); //  creating new sell stock entry
      }

      // making the changes in already purchased stock
      const updatedQuantity = existingStock.quantity - quantity;
      const totalInvestedAmount =
        existingStock.totalInvestedAmount - existingStock.buyPrice * quantity;
      // const updatedBuyPrice =
      //   updatedQuantity > 0 ? totalInvestedAmount / updatedQuantity : 0;

      if (updatedQuantity === 0) {
      } else {
        await StockModel.findByIdAndUpdate(
          existingStock._id,
          {
            quantity: updatedQuantity,
            totalInvestedAmount,
            buyPrice: updatedBuyPrice,
          },
          { new: true }
        );
      }

      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.sellStockAdded,
        data: existingSellStock,
      });
    }

    res.status(statusCode.BAD_REQUEST).json({
      statusCode: statusCode.BAD_REQUEST,
      message: message.invalidStockType,
    });
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

//====================== UPDATE STOCK PRICES (Yahoo Finance API) ======================//

export const getDatafromLiveStockPricesAndUpdate = async (req, res) => {
  try {
    const stocks = await StockModel.find();

    if (stocks.length === 0) {
      res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.stockPricesUpdated,
      });
    }

    for (let stock of stocks) {
      const stockData = await yahooFinance.quote(stock.stockSymbol);

      if (stockData?.regularMarketPrice) {
        stock.currentPrice = stockData.regularMarketPrice;

        if (stock.type === "buy") {
          stock.totalReturnAmount = stock.quantity * stock.currentPrice;
          stock.profitLoss =
            stock.totalReturnAmount - stock.totalInvestedAmount;
        } else if (stock.type === "sell") {
          let remainingSellQuantity = stock.quantity;
          let totalInvestedAmount = 0;
          let totalProfitLoss = 0;

          const buyTransactions = await StockModel.find({
            stockSymbol: stock.stockSymbol,
            userId: stock.userId,
            type: "buy",
          }).sort({ buyDate: 1 });

          for (let buy of buyTransactions) {
            if (remainingSellQuantity <= 0) break;

            let matchedQuantity = Math.min(buy.quantity, remainingSellQuantity);
            let profitForThisBatch =
              (stock.sellPrice - buy.buyPrice) * matchedQuantity;

            totalProfitLoss += profitForThisBatch;
            totalInvestedAmount += buy.buyPrice * matchedQuantity;
            remainingSellQuantity -= matchedQuantity;
          }

          stock.totalInvestedAmount = stock.sellPrice * stock.quantity;
          stock.profitLoss = totalProfitLoss;
          stock.totalReturnAmount = stock.sellPrice * stock.quantity;
        }

        await stock.save();
      }
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.stockPricesUpdated,
      stocks,
    });
  } catch (error) {
    logger.error("Error while updating stock prices: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
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
