import AreaPriceModel from "../../admin/area-price/model/areaPrice.js";
import RealEstateModel from "../model/realEstate.js";
import RealEstateAnalysisModel from "../model/realEstateAnalysis.js";
import { statusCode, message } from "../../../utils/api.response.js";
import mongoose from "mongoose";
import logger from "../../../service/logger.service.js";

//====================== REGISTER REAL ESTATE INFO ======================//
export const createRealEstate = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    const {
      firstName,
      lastName,
      propertyTypeId,
      subPropertyTypeId,
      propertyAddress,
      cityId,
      stateId,
      areaName,
      areaInSquareFeet,
      purchasePrice,
    } = req.body;

    if (
      !userId ||
      !propertyTypeId ||
      !subPropertyTypeId ||
      !cityId ||
      !stateId
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(cityId) ||
      !mongoose.Types.ObjectId.isValid(stateId)
    ) {
      return res.status(400).json({
        message: "Invalid city or state ID format",
      });
    }

    const existingRealEstate = await RealEstateModel.findOne({
      firstName,
      lastName,
      propertyTypeId,
      subPropertyTypeId,
      propertyAddress,
      cityId,
      stateId,
      areaName,
      areaInSquareFeet,
      purchasePrice,
      userId,
    });

    if (existingRealEstate) {
      return res.status(409).json({
        message: "Property already exists",
      });
    }

    const areaPrice = await AreaPriceModel.findOne({
      areaName,
      cityId,
      stateId,
    });

    if (!areaPrice) {
      return res.status(404).json({
        message: "Area price not found",
      });
    }

    const currentValue = Math.round(
      areaPrice.pricePerSquareFoot * areaInSquareFeet
    );
    const profit = Math.round(currentValue - purchasePrice);

    const newRealEstate = new RealEstateModel({
      firstName,
      lastName,
      propertyTypeId,
      subPropertyTypeId,
      propertyAddress,
      cityId,
      stateId,
      areaName,
      areaInSquareFeet,
      purchasePrice,
      currentValue,
      profit,
      userId,
    });

    const savedRealEstate = await newRealEstate.save();

    return res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: "Property added successfully",
      data: savedRealEstate,
    });
  } catch (error) {
    logger.error(
      `Error creating real estate record for user: ${userId} - ${error.message}`
    );
    return res.status(500).json({
      message: "Error creating real estate record",
    });
  }
};

//====================== UPDATE REAL ESTATE INFO ======================//
export const updateRealEstate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      propertyTypeId,
      subPropertyTypeId,
      propertyAddress,
      cityId,
      stateId,
      areaName,
      areaInSquareFeet,
      purchasePrice,
    } = req.body;
    const userId = req.user.id;

    let newCurrentValue, newProfit;

    const existingRealEstate = await RealEstateModel.findOne({
      _id: id,
      userId,
    });

    if (!existingRealEstate) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.propertyNotFound,
      });
    }

    const resolvedCityId = cityId || existingRealEstate.cityId;
    const resolvedStateId = stateId || existingRealEstate.stateId;
    const resolvedAreaName = areaName || existingRealEstate.areaName;
    const updatedAreaInSquareFeet =
      areaInSquareFeet || existingRealEstate.areaInSquareFeet;
    const updatedPurchasePrice =
      purchasePrice || existingRealEstate.purchasePrice;

    if (updatedAreaInSquareFeet || updatedPurchasePrice || areaName) {
      const areaPrice = await AreaPriceModel.findOne({
        areaName: resolvedAreaName,
        cityId: resolvedCityId,
        stateId: resolvedStateId,
      });

      if (!areaPrice) {
        return res.status(statusCode.NOT_FOUND).json({
          statusCode: statusCode.NOT_FOUND,
          message: message.areaPriceNotFound,
        });
      }

      newCurrentValue = areaPrice.pricePerSquareFoot * updatedAreaInSquareFeet;
      newProfit = newCurrentValue - updatedPurchasePrice;
    }

    const updatedRealEstate = await RealEstateModel.findOneAndUpdate(
      { _id: id, userId },
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(propertyTypeId && { propertyTypeId }),
        ...(subPropertyTypeId && { subPropertyTypeId }),
        ...(propertyAddress && { propertyAddress }),
        ...(cityId && { cityId: resolvedCityId }),
        ...(stateId && { stateId: resolvedStateId }),
        ...(areaName && { areaName: resolvedAreaName }),
        ...(areaInSquareFeet && { areaInSquareFeet: updatedAreaInSquareFeet }),
        ...(purchasePrice && { purchasePrice: updatedPurchasePrice }),
        ...(newCurrentValue !== undefined && { currentValue: newCurrentValue }),
        ...(newProfit !== undefined && { profit: newProfit }),
      },
      { new: true }
    );

    if (!updatedRealEstate) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.propertyNotFound,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.propertyUpdated,
      data: updatedRealEstate,
    });
  } catch (error) {
    logger.error(
      `Error updating real estate record for user: ${userId} - ${error.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUpdatingProperty,
    });
  }
};

//====================== DELETE REAL ESTATE INFO ======================//
export const deleteRealEstate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deletedRealEstate = await RealEstateModel.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deletedRealEstate) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.propertyNotFound,
      });
    }

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.propertyDeleted,
    });
  } catch (error) {
    logger.error(
      `Error deleting real estate with ID: ${id} for user: ${userId} - ${error.message}`
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingProperty,
    });
  }
};

//====================== VIEW REAL ESTATE INFO ======================//

export const getAllRealEstate = async (req, res) => {
  try {
    const userId = req.user.id;
    const realestates = await RealEstateModel.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
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
      {
        $unwind: {
          path: "$cityData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$stateData",
          preserveNullAndEmptyArrays: true,
        },
      },
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

    const realEstatesWithSrNo = realestates.map((realEstate, index) => ({
      srNo: index + 1,
      ...realEstate,
    }));

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.propertiesView,
      data: realEstatesWithSrNo,
    });
  } catch (error) {
    logger.error(`Error fetching real estate records: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingProperties,
    });
  }
};

//====================== DELETE MULTIPLE REAL ESTATES ======================//

export const deleteMultipleRealEstates = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.invalidRealEstateid,
      });
    }

    const result = await RealEstateModel.deleteMany({
      _id: { $in: ids },
      userId,
    });

    if (result.deletedCount === 0) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.propertyNotFound,
      });
    }

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: `${result.deletedCount} real estate properties have been successfully deleted.`,
    });
  } catch (error) {
    logger.error(`Error deleting real estate records: ${error.message}`);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: "Error occurred while deleting real estate records",
    });
  }
};

//====================== VIEW REAL ESTATE ANALYSIS ======================//

export const getRealEstateAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;

    const realEstateAnalysis = await RealEstateModel.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $addFields: {
          totalInvestedAmount: "$purchasePrice",
          currentReturnAmount: "$currentValue",
          totalProfit: { $subtract: ["$currentValue", "$purchasePrice"] },
        },
      },
      {
        $group: {
          _id: null,
          totalInvestedAmountOfRealEstate: { $sum: "$totalInvestedAmount" },
          currentReturnAmountOfRealEstate: { $sum: "$currentReturnAmount" },
          totalProfitGainedOfRealEstate: { $sum: "$totalProfit" },
        },
      },
    ]);

    if (!realEstateAnalysis || realEstateAnalysis.length === 0) {
      return res.status(statusCode.NO_CONTENT).json({
        statusCode: statusCode.NO_CONTENT,
        message: message.errorFetchingPropertyAnalysis,
      });
    }

    const analysisData = {
      totalInvestedAmountOfRealEstate: Math.round(
        realEstateAnalysis[0].totalInvestedAmountOfRealEstate
      ),
      currentReturnAmountOfRealEstate: Math.round(
        realEstateAnalysis[0].currentReturnAmountOfRealEstate
      ),
      totalProfitGainedOfRealEstate: Math.round(
        realEstateAnalysis[0].totalProfitGainedOfRealEstate
      ),
      userId: new mongoose.Types.ObjectId(userId),
    };

    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    const update = { $set: analysisData };
    const options = { upsert: true, new: true };

    const updatedRealEstateAnalysis =
      await RealEstateAnalysisModel.findOneAndUpdate(filter, update, options);

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.analysisReportOfRealEstate,
      data: updatedRealEstateAnalysis,
    });
  } catch (error) {
    logger.error(
      `Error calculating Real Estate analytics for user ${userId}: ${error.message}`
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingRealEstateAnalytics,
    });
  }
};
