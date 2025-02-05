import mongoose from "mongoose";
import FixedDepositModel from "../../fixed-deposit/model/fixedDeposit.js";
import GoldModel from "../../gold/model/goldModel.js";
import RealEstateModel from "../../real-estate/model/realEstate.js";
import { formatAmount } from "../../../utils/formatAmount.js";
import { statusCode, message } from "../../../utils/api.response.js";

// Utility function to get date filters
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

// Dashboard Analysis
export const dashboardAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const match = { userId: new mongoose.Types.ObjectId(userId) };

    if (startDate || endDate) {
      match.createdAt = getDateFilters(startDate, endDate);
    }

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

    const overallAnalysis = {
      totalInvestedAmount: formatAmount(totalInvestedAmount),
      currentReturnAmount: formatAmount(currentReturnAmount),
      totalReturnAmount: formatAmount(totalReturnAmount),
      totalProfitGained: formatAmount(profitAmount),
      userId: userId,
    };

    function removeDuplicates(data, key) {
      const seen = new Set();
      return data.filter((item) => {
        const uniqueValue = key(item);
        if (seen.has(uniqueValue)) {
          return false;
        } else {
          seen.add(uniqueValue);
          return true;
        }
      });
    }

    const topGainersFD = await FixedDepositModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          ...(startDate || endDate
            ? { createdAt: getDateFilters(startDate, endDate) }
            : {}),
        },
      },
      {
        $addFields: {
          profit: {
            $subtract: ["$currentReturnAmount", "$totalInvestedAmount"],
          },
        },
      },
      { $sort: { profit: -1 } },
      { $limit: 5 },
      {
        $project: {
          investmentType: { $literal: "Fixed Deposit" },
          sector: { $literal: "Banking" },
          firstName: 1,
          lastName: 1,
          totalInvestedAmount: 1,
          currentReturnAmount: 1,
          profit: 1,
          fdType: 1,
          interestRate: 1,
        },
      },
    ]);

    const topGainersGold = await GoldModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          ...(startDate || endDate
            ? { createdAt: getDateFilters(startDate, endDate) }
            : {}),
        },
      },
      {
        $addFields: {
          profit: { $subtract: ["$totalReturnAmount", "$goldPurchasePrice"] },
        },
      },
      { $sort: { profit: -1 } },
      { $limit: 5 },
      {
        $project: {
          investmentType: { $literal: "Gold" },
          sector: { $literal: "Gold" },
          firstName: 1,
          lastName: 1,
          formOfGold: 1,
          purityOfGold: 1,
          goldWeight: 1,
          totalInvestedAmount: "$goldPurchasePrice",
          currentReturnAmount: "$totalReturnAmount",
          profit: 1,
        },
      },
    ]);

    const topGainersRealEstate = await RealEstateModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          ...(startDate || endDate
            ? { createdAt: getDateFilters(startDate, endDate) }
            : {}),
        },
      },
      {
        $addFields: {
          profit: { $subtract: ["$currentValue", "$purchasePrice"] },
        },
      },
      { $sort: { profit: -1 } },
      { $limit: 5 },
      {
        $project: {
          investmentType: { $literal: "Real Estate" },
          sector: { $literal: "Real Estate" },
          totalInvestedAmount: "$purchasePrice",
          currentReturnAmount: "$currentValue",
          profit: 1,
          areaName: 1,
          firstName: 1,
          lastName: 1,
          state: 1,
          city: 1,
          propertyType: 1,
          subPropertyType: 1,
          areaInSquareFeet: 1,
          purchasePrice: 1,
        },
      },
    ]);

    let topGainers = [
      ...topGainersFD,
      ...topGainersGold,
      ...topGainersRealEstate,
    ];

    topGainers = removeDuplicates(
      topGainers,
      (item) => `${item.userId}-${item.profit}`
    );

    topGainers = topGainers.sort((a, b) => b.profit - a.profit).slice(0, 10);

    topGainers.forEach((item, index) => {
      item.srNo = index + 1;
    });

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.overAllAnalysis,
      data: {
        overallAnalysis,
        topGainers,
        fdAnalysis: {
          totalInvestedAmountOfFds: Math.round(
            fdAnalysis[0]?.totalInvestedAmount || 0
          ),
          currentReturnAmountOfFds: Math.round(
            fdAnalysis[0]?.currentReturnAmount || 0
          ),
          totalReturnAmountOfFds: Math.round(
            fdAnalysis[0]?.totalReturnAmount || 0
          ),
          totalProfitGainedOfFds: Math.round(fdAnalysis[0]?.profitAmount || 0),
        },
        goldAnalysis: {
          totalInvestedAmountOfGold: Math.round(
            goldAnalysis[0]?.totalInvestedAmount || 0
          ),
          currentReturnAmountOfGold: Math.round(
            goldAnalysis[0]?.currentReturnAmount || 0
          ),
          totalReturnAmountOfGold: Math.round(
            goldAnalysis[0]?.totalReturnAmount || 0
          ),
          totalProfitGainedOfGold: Math.round(
            goldAnalysis[0]?.profitAmount || 0
          ),
        },
        realEstateAnalysis: {
          totalInvestedAmountOfRealEstate: Math.round(
            realEstateAnalysis[0]?.totalInvestedAmount || 0
          ),
          currentReturnAmountOfRealEstate: Math.round(
            realEstateAnalysis[0]?.currentReturnAmount || 0
          ),
          totalReturnAmountOfRealEstate: Math.round(
            realEstateAnalysis[0]?.totalReturnAmount || 0
          ),
          totalProfitGainedOfRealEstate: Math.round(
            realEstateAnalysis[0]?.profitAmount || 0
          ),
        },
      },
    });
  } catch (error) {
    console.error("Error in dashboardAnalysis:", error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorOverAllAnalysis,
    });
  }
};

// HIGHEST GROWTH PIE CHART
export const getHighestGrowthInSector = async (req, res) => {
  const { sector } = req.params;
  const { startDate, endDate } = req.query;
  const dateFilters = getDateFilters(startDate, endDate);
  const userId = req.user.id;

  if (!sector) {
    return res.status(statusCode.BAD_REQUEST).json({
      statusCode: statusCode.BAD_REQUEST,
      message: message.sectorRequired,
    });
  }

  try {
    let highestGrowthInvestment = null;
    const query = { userId: new mongoose.Types.ObjectId(userId) };

    if (Object.keys(dateFilters).length > 0) {
      query.createdAt = dateFilters;
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
          {
            $sort: { growth: -1 },
          },
          { $limit: 1 },
          {
            $project: {
              bankDetails: 0,
            },
          },
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
          {
            $sort: { growth: -1 },
          },
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
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: message.errorFetchingSector,
        });
    }

    if (!highestGrowthInvestment || !highestGrowthInvestment.length) {
      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.noInvestmentFound,
        data: [],
      });
    }

    const result = highestGrowthInvestment[0];
    result.srNo = 1; // Add srNo as 1 since it's the highest growth investment
    result.sector = sector.charAt(0).toUpperCase() + sector.slice(1);

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.highestGrowthinSector,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching highest growth investment:", error.message);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingInvBySector,
    });
  }
};

// INVESTMENT IN SECTOR
export const getInvestmentsBySector = async (req, res) => {
  const { sector } = req.params;
  const { startDate, endDate } = req.query;
  const dateFilters = getDateFilters(startDate, endDate);
  const userId = req.user.id;

  if (!sector) {
    return res.status(statusCode.BAD_REQUEST).json({
      statusCode: statusCode.BAD_REQUEST,
      message: message.sectorRequired,
    });
  }

  try {
    let investments = [];
    const query = { userId: new mongoose.Types.ObjectId(userId) };

    // Optional date filtering
    if (Object.keys(dateFilters).length > 0) {
      query.createdAt = dateFilters;
    }

    switch (sector.toLowerCase()) {
      case "banking":
        investments = await FixedDepositModel.aggregate([
          {
            $match: query,
          },
          {
            $lookup: {
              from: "banks", // Collection name for BankModel
              localField: "bankId",
              foreignField: "_id",
              as: "bankDetails",
            },
          },
          {
            $unwind: {
              path: "$bankDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              bankName: "$bankDetails.bankName",
            },
          },
          {
            $project: {
              bankDetails: 0,
            },
          },
          {
            $sort: { createdAt: 1 },
          },
        ]);
        break;

      case "gold":
        investments = await GoldModel.find(query).lean();
        break;

      case "realestate":
        // Add aggregation with city and state data
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
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: message.errorFetchingSector,
        });
    }

    if (!investments.length) {
      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.noInvestmentFound,
        data: [],
      });
    }

    // Add srNo and sector to all investments
    investments = investments.map((item, index) => {
      return {
        srNo: index + 1,
        sector: sector.charAt(0).toUpperCase() + sector.slice(1),
        ...item,
      };
    });

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.investmentBySector,
      data: investments,
    });
  } catch (error) {
    console.error("Error fetching investments by sector:", error.message);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingInvBySector,
    });
  }
};
