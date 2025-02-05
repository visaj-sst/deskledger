import StockModel from "../model/stockModel.js";
import yahooFinance from "yahoo-finance2";
import { statusCode, message } from "../../../utils/api.response.js";
import logger from "../../../service/logger.service.js";

//====================== ADD STOCK ======================//

export const createStock = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      stockSymbol,
      stockName,
      purchasePrice,
      quantity,
      type,
      userId,
      buyDate,
      sellDate,
    } = req.body;
    const totalInvestedAmount = purchasePrice * quantity;

    const newStock = new StockModel({
      firstName,
      lastName,
      stockSymbol,
      stockName,
      purchasePrice,
      quantity,
      type,
      buyDate,
      sellDate,
      totalInvestedAmount,
      userId,
    });

    const savedStock = await newStock.save();

    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.stockCreated,
      data: savedStock,
    });
  } catch (error) {
    logger.error("Error while adding stock: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//====================== UPDATE STOCK ======================//

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      stockSymbol,
      stockName,
      purchasePrice,
      quantity,
      type,
      userId,
      buyDate,
      sellDate,
    } = req.body;

    // Fetch existing stock data to retain missing fields
    const existingStock = await StockModel.findById(id);
    if (!existingStock) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingStock,
      });
    }

    // Use existing values if fields are not provided in req.body
    const updatedPurchasePrice = purchasePrice ?? existingStock.purchasePrice;
    const updatedQuantity = quantity ?? existingStock.quantity;

    const totalInvestedAmount = updatedPurchasePrice * updatedQuantity;

    const updatedStock = await StockModel.findByIdAndUpdate(
      id,
      {
        firstName: firstName ?? existingStock.firstName,
        lastName: lastName ?? existingStock.lastName,
        stockSymbol: stockSymbol ?? existingStock.stockSymbol,
        stockName: stockName ?? existingStock.stockName,
        purchasePrice: updatedPurchasePrice,
        quantity: updatedQuantity,
        type: type ?? existingStock.type,
        userId: userId ?? existingStock.userId,
        buyDate: buyDate ?? existingStock.buyDate,
        sellDate: sellDate ?? existingStock.sellDate,
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
      return res
        .status(statusCode.BAD_REQUEST)
        .json({
          statusCode: statusCode.BAD_REQUEST,
          message: "Stock symbol is required",
        });
    }

    const stockData = await yahooFinance.quote(symbol);
    const historicalData = await yahooFinance.historical(symbol, {
      period1: "2024-01-01",
    });

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.tradingDataFetched,
      stockSymbol: symbol,
      stockName: stockData.shortName,
      currentPrice: stockData.regularMarketPrice,
      historicalData,
    });
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: "Error fetching stock data",
      error: error.message,
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

export const updateStockPricesfromYahoo = async (req, res) => {
  try {
    const stocks = await StockModel.find();

    for (let stock of stocks) {
      const stockData = await yahooFinance.quote(stock.stockSymbol);

      if (stockData?.regularMarketPrice) {
        stock.currentPrice = stockData.regularMarketPrice;
        stock.currentValue = stock.quantity * stock.currentPrice;
        stock.profitLoss = stock.currentValue - stock.totalInvestedAmount;
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
