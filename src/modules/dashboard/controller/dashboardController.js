const mongoose = require("mongoose");
const FixedDepositModel = require("../../fixed-deposit/model/fixedDeposit");
const GoldModel = require("../../gold/model/goldModel");
const RealEstateModel = require("../../real-estate/model/realEstate");
const { formatAmount } = require("../../../utils/formatAmount");
const { statusCode, message } = require("../../../utils/api.response");
const logger = require("../../../service/logger.service");

//====================== DATE FILTER FUNCTION ======================//
const getDateFilters = (startDate, endDate) => {
  const filters = {};
  if (startDate) {
    filters["$gte"] = new Date(new Date(startDate).setHours(0, 0, 0, 0));
    logger.info("Start date filter applied", { startDate });
  }
  if (endDate) {
    filters["$lte"] = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    logger.info("End date filter applied", { endDate });
  }
  return filters;
};

//====================== DASHBOARD ANALYSIS ======================//
const dashboardAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    logger.info("Initiating dashboard analysis", { userId });

    // Create the match object for all models (FD, Gold, Real Estate)
    const match = { userId: new mongoose.Types.ObjectId(userId) };
    if (startDate || endDate) {
      match.createdAt = getDateFilters(startDate, endDate);
    }

    // Aggregate FD data
    logger.info("Aggregating Fixed Deposit data");
    const fdAnalysis = await FixedDepositModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalInvestedAmount: { $sum: "$totalInvestedAmount" },
          currentReturnAmount: { $sum: "$currentReturnAmount" },
          totalReturnAmount: { $sum: "$totalReturnedAmount" },
          profitAmount: {
            $sum: {
              $subtract: ["$currentReturnAmount", "$totalInvestedAmount"],
            },
          },
        },
      },
    ]);

    // Aggregate Gold data
    logger.info("Aggregating Gold data");
    const goldAnalysis = await GoldModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalInvestedAmount: { $sum: "$goldPurchasePrice" },
          currentReturnAmount: { $sum: "$totalReturnAmount" },
          totalReturnAmount: { $sum: "$totalReturnAmount" },
          profitAmount: { $sum: "$profit" },
        },
      },
    ]);

    // Aggregate Real Estate data
    logger.info("Aggregating Real Estate data");
    const realEstateAnalysis = await RealEstateModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalInvestedAmount: { $sum: "$purchasePrice" },
          currentReturnAmount: { $sum: "$currentValue" },
          totalReturnAmount: { $sum: "$currentValue" },
          profitAmount: { $sum: "$profit" },
        },
      },
    ]);

    // Combine FD, Gold, and Real Estate data
    const totalInvestedAmount =
      (fdAnalysis[0]?.totalInvestedAmount || 0) +
      (goldAnalysis[0]?.totalInvestedAmount || 0) +
      (realEstateAnalysis[0]?.totalInvestedAmount || 0);
    const currentReturnAmount =
      (fdAnalysis[0]?.currentReturnAmount || 0) +
      (goldAnalysis[0]?.currentReturnAmount || 0) +
      (realEstateAnalysis[0]?.currentReturnAmount || 0);
    const totalReturnAmount =
      (fdAnalysis[0]?.totalReturnAmount || 0) +
      (goldAnalysis[0]?.totalReturnAmount || 0) +
      (realEstateAnalysis[0]?.totalReturnAmount || 0);
    const profitAmount =
      (fdAnalysis[0]?.profitAmount || 0) +
      (goldAnalysis[0]?.profitAmount || 0) +
      (realEstateAnalysis[0]?.profitAmount || 0);

    logger.info("Data aggregation and combination completed", {
      totalInvestedAmount,
      currentReturnAmount,
      totalReturnAmount,
      profitAmount,
    });

    // Format the amounts and prepare response data
    const overallAnalysis = {
      totalInvestedAmount: formatAmount(totalInvestedAmount),
      currentReturnAmount: formatAmount(currentReturnAmount),
      totalReturnAmount: formatAmount(totalReturnAmount),
      totalProfitGained: formatAmount(profitAmount),
      userId: userId,
    };

    // Fetching top gainers
    logger.info(
      "Fetching top gainers for Fixed Deposits, Gold, and Real Estate"
    );
    const topGainersFD = await FixedDepositModel.aggregate([
      /* FD aggregation */
    ]);
    const topGainersGold = await GoldModel.aggregate([
      /* Gold aggregation */
    ]);
    const topGainersRealEstate = await RealEstateModel.aggregate([
      /* Real Estate aggregation */
    ]);

    // Combine and process top gainers
    let topGainers = [
      ...topGainersFD,
      ...topGainersGold,
      ...topGainersRealEstate,
    ];
    logger.info("Top gainers fetched successfully", {
      topGainersCount: topGainers.length,
    });

    // Send the response
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.overAllAnalysis,
      data: {
        overallAnalysis,
        topGainers,
        fdAnalysis,
        goldAnalysis,
        realEstateAnalysis,
      },
    });
    logger.info("Dashboard analysis completed successfully", { userId });
  } catch (error) {
    logger.error("Error occurred during dashboard analysis", {
      error: error.message,
    });
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorOverAllAnalysis,
      error: error.message,
    });
  }
};

//====================== HIGHEST GROWTH PIE CHART ======================//
const getHighestGrowthInSector = async (req, res) => {
  const { sector } = req.params;
  const { startDate, endDate } = req.query;
  const dateFilters = getDateFilters(startDate, endDate);
  const userId = req.user.id;

  if (!sector) {
    logger.warn("Sector parameter is missing", { userId });
    return res.status(statusCode.BAD_REQUEST).json({
      statusCode: statusCode.BAD_REQUEST,
      message: message.sectorRequired,
    });
  }

  try {
    logger.info("Fetching highest growth investment", { userId, sector });
    let highestGrowthInvestment = null;
    const query = { userId: new mongoose.Types.ObjectId(userId) };

    if (Object.keys(dateFilters).length > 0) {
      query.createdAt = dateFilters;
      logger.info("Date filters applied", { dateFilters });
    }

    switch (sector.toLowerCase()) {
      case "banking":
        highestGrowthInvestment = await FixedDepositModel.aggregate([
          { $match: query },
          {
            $lookup: {
              from: "banks",
              localField: "bankId",
              foreignField: "_id",
              as: "bankDetails",
            },
          },
          {
            $unwind: { path: "$bankDetails", preserveNullAndEmptyArrays: true },
          },
          {
            $addFields: {
              bankName: "$bankDetails.bankName",
              growth: {
                $subtract: ["$currentReturnAmount", "$totalInvestedAmount"],
              },
            },
          },
          { $sort: { growth: -1 } },
          { $limit: 1 },
          { $project: { bankDetails: 0 } },
        ]);
        break;

      case "gold":
        highestGrowthInvestment = await GoldModel.find(query)
          .sort({ profit: -1 })
          .limit(1)
          .lean();
        break;

      case "realestate":
        highestGrowthInvestment = await RealEstateModel.aggregate([
          { $match: query },
          {
            $lookup: {
              from: "propertytypes",
              localField: "propertyTypeId",
              foreignField: "_id",
              as: "propertyTypesData",
            },
          },
          {
            $lookup: {
              from: "subpropertytypes",
              localField: "subPropertyTypeId",
              foreignField: "_id",
              as: "subPropertyTypesData",
            },
          },
          {
            $lookup: {
              from: "cities",
              localField: "cityId",
              foreignField: "_id",
              as: "cityData",
            },
          },
          {
            $lookup: {
              from: "states",
              localField: "stateId",
              foreignField: "_id",
              as: "stateData",
            },
          },
          {
            $unwind: {
              path: "$propertyTypesData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: "$subPropertyTypesData",
              preserveNullAndEmptyArrays: true,
            },
          },
          { $unwind: { path: "$cityData", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$stateData", preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              growth: { $subtract: ["$currentValue", "$purchasePrice"] },
            },
          },
          { $sort: { growth: -1 } },
          { $limit: 1 },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              propertyType: "$propertyTypesData.propertyType",
              subPropertyType: "$subPropertyTypesData.subPropertyType",
              city: "$cityData.city",
              state: "$stateData.state",
              propertyAddress: 1,
              areaName: 1,
              areaInSquareFeet: 1,
              purchasePrice: 1,
              currentValue: 1,
              profit: 1,
              growth: 1,
            },
          },
        ]);
        break;

      default:
        logger.warn("Invalid sector specified", { userId, sector });
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: message.errorFetchingSector,
        });
    }

    if (!highestGrowthInvestment || !highestGrowthInvestment.length) {
      logger.info("No investments found for the given sector", {
        userId,
        sector,
      });
      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.noInvestmentFound,
        data: [],
      });
    }

    const result = highestGrowthInvestment[0];
    result.srNo = 1; // Add srNo as 1 since it's the highest growth investment
    result.sector = sector.charAt(0).toUpperCase() + sector.slice(1);

    logger.info("Successfully fetched highest growth investment", {
      userId,
      sector,
    });
    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.highestGrowthinSector,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching highest growth investment", {
      error: error.message,
      userId,
      sector,
    });
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingInvBySector,
    });
  }
};

//====================== INVESTMENT IN SECTOR   ======================//
const getInvestmentsBySector = async (req, res) => {
  const { sector } = req.params;
  const { startDate, endDate } = req.query;
  const dateFilters = getDateFilters(startDate, endDate);
  const userId = req.user.id;

  if (!sector) {
    logger.warn("Sector parameter is missing", { userId });
    return res.status(statusCode.BAD_REQUEST).json({
      statusCode: statusCode.BAD_REQUEST,
      message: message.sectorRequired,
    });
  }

  try {
    logger.info("Fetching investments by sector", { userId, sector });
    let investments = [];
    const query = { userId: new mongoose.Types.ObjectId(userId) };

    // Apply date filters if available
    if (Object.keys(dateFilters).length > 0) {
      query.createdAt = dateFilters;
      logger.info("Date filters applied", { dateFilters });
    }

    switch (sector.toLowerCase()) {
      case "banking":
        investments = await FixedDepositModel.aggregate([
          { $match: query },
          {
            $lookup: {
              from: "banks",
              localField: "bankId",
              foreignField: "_id",
              as: "bankDetails",
            },
          },
          {
            $unwind: { path: "$bankDetails", preserveNullAndEmptyArrays: true },
          },
          {
            $addFields: {
              bankName: "$bankDetails.bankName",
            },
          },
          { $project: { bankDetails: 0 } },
          { $sort: { createdAt: 1 } },
        ]);
        break;

      case "gold":
        investments = await GoldModel.find(query).lean();
        break;

      case "realestate":
        investments = await RealEstateModel.aggregate([
          { $match: query },
          {
            $lookup: {
              from: "propertytypes",
              localField: "propertyTypeId",
              foreignField: "_id",
              as: "propertyTypesData",
            },
          },
          {
            $lookup: {
              from: "subpropertytypes",
              localField: "subPropertyTypeId",
              foreignField: "_id",
              as: "subPropertyTypesData",
            },
          },
          {
            $lookup: {
              from: "cities",
              localField: "cityId",
              foreignField: "_id",
              as: "cityData",
            },
          },
          {
            $lookup: {
              from: "states",
              localField: "stateId",
              foreignField: "_id",
              as: "stateData",
            },
          },
          {
            $unwind: {
              path: "$propertyTypesData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: "$subPropertyTypesData",
              preserveNullAndEmptyArrays: true,
            },
          },
          { $unwind: { path: "$cityData", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$stateData", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              propertyTypeId: 1,
              propertyType: "$propertyTypesData.propertyType",
              subPropertyType: "$subPropertyTypesData.subPropertyType",
              city: "$cityData.city",
              state: "$stateData.state",
              propertyAddress: 1,
              areaName: 1,
              areaInSquareFeet: 1,
              purchasePrice: 1,
              currentValue: 1,
              profit: 1,
              sector: 1,
              userId: 1,
            },
          },
        ]);
        break;

      default:
        logger.warn("Invalid sector specified", { userId, sector });
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: message.errorFetchingSector,
        });
    }

    if (!investments.length) {
      logger.info("No investments found for the given sector", {
        userId,
        sector,
      });
      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.noInvestmentFound,
        data: [],
      });
    }

    // Add srNo and sector to all investments
    investments = investments.map((item, index) => ({
      srNo: index + 1,
      sector: sector.charAt(0).toUpperCase() + sector.slice(1),
      ...item,
    }));

    logger.info("Successfully fetched investments by sector", {
      userId,
      sector,
    });
    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.investmentBySector,
      data: investments,
    });
  } catch (error) {
    logger.error("Error fetching investments by sector", {
      error: error.message,
      userId,
      sector,
    });
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingInvBySector,
    });
  }
};

module.exports = {
  dashboardAnalysis,
  getHighestGrowthInSector,
  getInvestmentsBySector,
};
