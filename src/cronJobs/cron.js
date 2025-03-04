import FixedDepositModel from "../modules/user/model/userModel.js";
import GoldMasterModel from "../modules/admin/gold-master/model/goldMaster.js";
import AreaPriceModel from "../modules/admin/area-price/model/areaPrice.js";
import RealEstateModel from "../modules/real-estate/model/realEstate.js";
import { updateFdAggregation } from "../helpers/aggregation.js";
import GoldModel from "../modules/gold/model/goldModel.js";
import { startGoldPriceScraping } from "../scripts/gold-price-pp.js";
import StockModel from "../modules/stock/model/stockModel.js";
import yahooFinance from "yahoo-finance2";
import logger from "../service/logger.service.js";

//====================== GOLD PRICE SCRAPING CRON ======================//

export const updateGoldPriceScraping = async () => {
  try {
    console.info("Starting daily gold price scraping...");
    await startGoldPriceScraping();
    console.info("Daily gold price scraping completed successfully.");
  } catch (error) {
    console.error("Error during daily gold price scraping:", error);
  }
};

//====================== FIXED DEPOSIT CRON  ======================//

export const updateFdData = async () => {
  try {
    const fixedDeposits = await FixedDepositModel.find();

    for (const fd of fixedDeposits) {
      const {
        _id: fdId,
        startDate,
        maturityDate,
        totalInvestedAmount,
        interestRate,
      } = fd;

      const aggregationPipeline = updateFdAggregation(
        fdId,
        startDate,
        maturityDate,
        totalInvestedAmount,
        interestRate
      );

      const result = await FixedDepositModel.aggregate(aggregationPipeline);

      if (result && result.length > 0) {
        const { currentReturnAmount, currentProfitAmount } = result[0];

        await FixedDepositModel.updateOne(
          { _id: fdId },
          {
            currentReturnAmount,
            currentProfitAmount,
          }
        );
      }
    }
  } catch (error) {
    console.error("Error while updating FD data:", error);
  }
};

//====================== GOLD CRON  ======================//

export const updateGoldData = async () => {
  try {
    const goldMaster = await GoldMasterModel.findOne();
    if (!goldMaster) {
      console.error("GoldMaster data not found");
      return;
    }

    const goldRate22KPerGram = goldMaster.goldRate22KPerGram;
    const goldRate24KPerGram = goldMaster.goldRate24KPerGram;

    if (isNaN(goldRate22KPerGram) || isNaN(goldRate24KPerGram)) {
      console.error("Invalid GoldMaster data. Exiting...");
      return;
    }

    const goldinfo = await GoldModel.find();

    for (const gold of goldinfo) {
      const { goldWeight, goldPurchasePrice, purityOfGold } = gold;

      if (
        isNaN(goldWeight) ||
        isNaN(goldPurchasePrice) ||
        isNaN(purityOfGold)
      ) {
        console.error(
          `Invalid data for gold record ID ${gold._id}. Skipping...`
        );
        continue;
      }

      const currentGoldPricePerGram =
        purityOfGold === 24 ? goldRate24KPerGram : goldRate22KPerGram;

      const totalReturnAmount = Math.round(
        currentGoldPricePerGram * goldWeight
      );

      const profit = Math.round(totalReturnAmount - goldPurchasePrice);

      gold.totalReturnAmount = totalReturnAmount;
      gold.profit = profit;

      await gold.save();
    }
  } catch (error) {
    console.error("Error while updating gold data:", error);
  }
};

//====================== REAL ESTATE CRON  ======================//

export const updateRealEstateData = async () => {
  try {
    const realEstates = await RealEstateModel.find({});

    if (!realEstates || realEstates.length === 0) {
      console.error("No real estate data found.");
      return;
    }

    for (const realEstate of realEstates) {
      const { areaName, cityId, stateId, areaInSquareFeet, purchasePrice } =
        realEstate;

      const areaPrice = await AreaPriceModel.findOne({
        areaName,
        cityId,
        stateId,
      });

      if (!areaPrice) {
        console.error(
          `Area price not found for ${areaName}, ${cityId}, ${stateId}`
        );
        continue;
      }

      const newCurrentValue = Math.round(
        areaPrice.pricePerSquareFoot * areaInSquareFeet
      );

      const newProfit = Math.round(newCurrentValue - purchasePrice);

      realEstate.currentValue = newCurrentValue;
      realEstate.profit = newProfit;

      await realEstate.save();
    }
  } catch (error) {
    console.error("Error updating real estate data:", error);
  }
};

// ====================== UPDATE DATA ACCORDING TO LATEST PRICES ======================//

export const updateStockPrices = async () => {
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
  } catch (error) {
    console.error("Error updating stock prices:", error);
  }
};
