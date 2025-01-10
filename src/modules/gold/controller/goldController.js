import GoldModel from "../model/goldModel.js";
import GoldMasterModel from "../../admin/gold-master/model/goldMaster.js";
import GoldAnalysisModel from "../model/goldAnalysis.js";
import { statusCode, message } from "../../../utils/api.response.js";
import mongoose from "mongoose";
import logger from "../../../service/logger.service.js";

//====================== REGISTER GOLD INFO ======================//

export const createGoldRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      goldWeight,
      goldPurchasePrice,
      formOfGold,
      purityOfGold,
    } = req.body;

    const goldMaster = await GoldMasterModel.findOne().sort({ createdAt: -1 });

    if (!goldMaster) {
      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.goldMasterNotFound,
      });
    }

    const existingGoldRecord = await GoldModel.findOne({
      firstName,
      lastName,
      goldWeight,
      goldPurchasePrice,
      formOfGold,
      purityOfGold,
      userId,
    });

    if (existingGoldRecord) {
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: "Gold information already exists",
      });
    }

    const { goldRate22KPerGram, goldRate24KPerGram } = goldMaster;
    const goldCurrentPricePerGram =
      purityOfGold === 22 ? goldRate22KPerGram : goldRate24KPerGram;

    const goldCurrentValue = goldCurrentPricePerGram * goldWeight;
    const totalReturnAmount = Math.round(goldCurrentValue);
    const profit = Math.round(totalReturnAmount - goldPurchasePrice);

    const newGoldRecord = new GoldModel({
      firstName,
      lastName,
      goldWeight,
      goldPurchasePrice,
      formOfGold,
      purityOfGold,
      totalReturnAmount,
      profit,
      userId,
    });

    const saveGoldInfo = await newGoldRecord.save();

    return res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.goldInfoRegister,
      data: saveGoldInfo,
    });
  } catch (error) {
    logger.error("Error while creating gold record", { error: error.message });
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorCreatingGoldInfo,
    });
  }
};

//====================== UPDATING GOLD INFO ======================//

export const updateGoldRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      goldWeight,
      goldPurchasePrice,
      formOfGold,
      purityOfGold,
    } = req.body;
    const userId = req.user.id;

    const existingGoldRecord = await GoldModel.findOne({ _id: id, userId });

    if (!existingGoldRecord) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.goldNotFound,
      });
    }

    const updatedGoldWeight = goldWeight || existingGoldRecord.goldWeight;
    const updatedGoldPurchasePrice =
      goldPurchasePrice || existingGoldRecord.goldPurchasePrice;
    const updatedPurityOfGold = purityOfGold || existingGoldRecord.purityOfGold;

    let goldCurrentPricePerGram, totalReturnAmount, profit;

    if (updatedPurityOfGold) {
      const goldMaster = await GoldMasterModel.findOne().sort({
        createdAt: -1,
      });

      if (!goldMaster) {
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: message.errorFetchingGoldMaster,
        });
      }

      const { goldRate22KPerGram, goldRate24KPerGram } = goldMaster;

      if (![22, 24].includes(updatedPurityOfGold)) {
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: message.errorUpdatingGoldInfo,
        });
      }

      goldCurrentPricePerGram =
        updatedPurityOfGold === 22 ? goldRate22KPerGram : goldRate24KPerGram;

      const goldCurrentValue = goldCurrentPricePerGram * updatedGoldWeight;
      totalReturnAmount = Math.round(goldCurrentValue);
      profit = Math.round(totalReturnAmount - updatedGoldPurchasePrice);
    }

    const updatedGoldRecord = await GoldModel.findOneAndUpdate(
      { _id: id, userId },
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(goldWeight && { goldWeight: updatedGoldWeight }),
        ...(goldPurchasePrice && {
          goldPurchasePrice: updatedGoldPurchasePrice,
        }),
        ...(formOfGold && { formOfGold }),
        ...(purityOfGold && { purityOfGold: updatedPurityOfGold }),
        ...(totalReturnAmount && { totalReturnAmount }),
        ...(profit && { profit }),
      },
      { new: true }
    );

    if (!updatedGoldRecord) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.goldNotFound,
      });
    }

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.goldInfoUpdate,
      data: updatedGoldRecord,
    });
  } catch (error) {
    logger.error("Error updating gold record", { error: error.message });
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUpdatingGoldInfo,
    });
  }
};

//====================== DELETE GOLD INFO ======================//

export const deleteGoldRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deletedGoldRecord = await GoldModel.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deletedGoldRecord) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.goldNotFound,
      });
    }

    return res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.goldInfoDelete });
  } catch (error) {
    logger.error("Error deleting gold record", { error: error.message });
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingGoldInfo,
    });
  }
};

//====================== DELETE MULTIPLE GOLD INFO ======================//
export const deleteMultipleGoldRecords = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.invalidIds,
      });
    }

    const result = await GoldModel.deleteMany({ _id: { $in: ids }, userId });

    if (result.deletedCount === 0) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.goldNotFound,
      });
    }

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: `${result.deletedCount} gold records have been successfully deleted.`,
    });
  } catch (error) {
    logger.error(
      `Error deleting multiple gold records for user: ${userId} - ${error.message}`
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingGoldInfo,
    });
  }
};

//====================== VIEW GOLD ANALYSIS ======================//
export const getGoldAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;

    const goldAnalysis = await GoldModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $addFields: {
          totalInvestedAmount: "$goldPurchasePrice",
          currentReturnAmount: "$totalReturnAmount",
          profit: "$profit",
        },
      },
      {
        $group: {
          _id: null,
          totalInvestedAmountOfGold: { $sum: "$totalInvestedAmount" },
          currentReturnAmountOfGold: { $sum: "$currentReturnAmount" },
          totalProfitGainedOfGold: { $sum: "$profit" },
        },
      },
    ]);

    if (!goldAnalysis || goldAnalysis.length === 0) {
      return res.status(statusCode.NO_CONTENT).json({
        statusCode: statusCode.NO_CONTENT,
        message: message.goldNotFetch,
      });
    }

    const analysisData = {
      totalInvestedAmountOfGold: Math.round(
        goldAnalysis[0].totalInvestedAmountOfGold
      ),
      currentReturnAmountOfGold: Math.round(
        goldAnalysis[0].currentReturnAmountOfGold
      ),
      totalProfitGainedOfGold: Math.round(
        goldAnalysis[0].totalProfitGainedOfGold
      ),
      userId: new mongoose.Types.ObjectId(userId),
    };

    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    const update = { $set: analysisData };
    const options = { upsert: true, new: true };
    const updatedGoldAnalysis = await GoldAnalysisModel.findOneAndUpdate(
      filter,
      update,
      options
    );

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.analysisReportofGold,
      data: analysisData,
    });
  } catch (error) {
    logger.error(
      `Error fetching gold analysis for user: ${userId} - ${error.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorGoldAnalytics,
    });
  }
};

//====================== VIEW GOLD INFO ======================//
export const getAllGoldRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (id) {
      const goldRecord = await GoldModel.findOne({ _id: id, userId });

      if (!goldRecord) {
        return res.status(statusCode.NOT_FOUND).json({
          statusCode: statusCode.NOT_FOUND,
          message: message.goldNotFound,
        });
      }

      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.goldRecordFetched,
        data: goldRecord,
      });
    }

    const goldRecords = await GoldModel.find({ userId });

    const goldRecordsWithSrNo = goldRecords.map((record, index) => {
      const recordObj = record.toObject();
      return {
        ...recordObj,
        srNo: index + 1,
      };
    });

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.goldRecordsFetched,
      data: goldRecordsWithSrNo,
    });
  } catch (error) {
    logger.error(
      `Error fetching gold records for user: ${userId} - ${error.message}`
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};
