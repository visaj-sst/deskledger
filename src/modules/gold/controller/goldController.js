const GoldModel = require("../model/goldModel.js");
const GoldMasterModel = require("../../admin/gold-master/model/goldMaster.js");
const GoldAnalysisModel = require("../model/goldAnalysis.js");
const { statusCode, message } = require("../../../utils/api.response.js");
const mongoose = require("mongoose");
const logger = require("../../../service/logger.service.js");

//====================== REGISTER GOLD INFO ======================//

exports.createGoldRecord = async (req, res) => {
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

    logger.info("Starting gold record creation", { userId, body: req.body });

    const goldMaster = await GoldMasterModel.findOne().sort({ createdAt: -1 });

    if (!goldMaster) {
      logger.warn("Gold master record not found", { userId });
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
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
      logger.warn("Gold record already exists", { userId, body: req.body });
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

    logger.info("Gold record created successfully", {
      userId,
      record: saveGoldInfo,
    });

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

exports.updateGoldRecord = async (req, res) => {
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

    logger.info("Starting gold record update", { userId, id, body: req.body });

    const existingGoldRecord = await GoldModel.findOne({ _id: id, userId });

    if (!existingGoldRecord) {
      logger.warn("Gold record not found for update", { userId, id });
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
        logger.warn("Gold master record not found for update", { userId });
        return res.status(statusCode.BAD_REQUEST).json({
          statusCode: statusCode.BAD_REQUEST,
          message: message.errorFetchingGoldMaster,
        });
      }

      const { goldRate22KPerGram, goldRate24KPerGram } = goldMaster;

      if (![22, 24].includes(updatedPurityOfGold)) {
        logger.warn("Invalid purity value during update", {
          userId,
          purityOfGold: updatedPurityOfGold,
        });
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
      logger.warn("Gold record not found after update attempt", {
        userId,
        id,
      });
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.goldNotFound,
      });
    }

    logger.info("Gold record updated successfully", {
      userId,
      id,
      record: updatedGoldRecord,
    });

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

exports.deleteGoldRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info("Starting gold record deletion", { userId, id });

    const deletedGoldRecord = await GoldModel.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deletedGoldRecord) {
      logger.warn("Gold record not found for deletion", { userId, id });
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.goldNotFound,
      });
    }

    logger.info("Gold record deleted successfully", { userId, id });

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
exports.deleteMultipleGoldRecords = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    logger.info(
      `Request to delete multiple gold records by user: ${userId}, IDs: ${JSON.stringify(
        ids
      )}`
    );

    if (!Array.isArray(ids) || ids.length === 0) {
      logger.warn(`Invalid IDs provided by user: ${userId}`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.invalidIds,
      });
    }

    const result = await GoldModel.deleteMany({ _id: { $in: ids }, userId });

    if (result.deletedCount === 0) {
      logger.warn(`No records found for deletion for user: ${userId}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.goldNotFound,
      });
    }

    logger.info(
      `Successfully deleted ${result.deletedCount} gold records for user: ${userId}`
    );
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
exports.getGoldAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`Fetching gold analysis for user: ${userId}`);

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
      logger.warn(`No gold analysis data found for user: ${userId}`);
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

    logger.info(`Gold analysis data successfully updated for user: ${userId}`);
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
      error: error.message,
    });
  }
};

//====================== VIEW GOLD INFO ======================//
exports.getAllGoldRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    logger.info(
      `Fetching gold records for user: ${userId}, specific ID: ${id || "All"}`
    );

    if (id) {
      const goldRecord = await GoldModel.findOne({ _id: id, userId });

      if (!goldRecord) {
        logger.warn(`Gold record with ID: ${id} not found for user: ${userId}`);
        return res.status(statusCode.NOT_FOUND).json({
          statusCode: statusCode.NOT_FOUND,
          message: message.goldNotFound,
        });
      }

      logger.info(
        `Gold record with ID: ${id} fetched successfully for user: ${userId}`
      );
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

    logger.info(`All gold records fetched successfully for user: ${userId}`);
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
      message: message.errorFetchingGoldRecords,
    });
  }
};
