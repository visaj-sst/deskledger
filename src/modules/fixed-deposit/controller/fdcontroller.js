//fdcontroller.js

import FixedDepositModel from "../model/fixedDeposit.js";
import mongoose from "mongoose";
import moment from "moment";
import FdAnalysisModel from "../model/fixedDeposit.js";
import { statusCode, message } from "../../../utils/api.response.js";
import {
  registerFdAggregation,
  updateFdAggregation,
} from "../../../helpers/aggregation.js";
import { formatDate } from "../../../helpers/formatDate.js";
import { updateFdData } from "../../../cronJobs/cron.js";
import { calculateTotalYears } from "../../../helpers/calculateYears.js";
import logger from "../../../service/logger.service.js";

//====================== REGISTER FIXED DEPOSIT ======================//

export const fixedDepositRegister = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      fdNo,
      fdType,
      bankId,
      branchName,
      interestRate,
      startDate,
      maturityDate,
      totalInvestedAmount,
    } = req.body;

    const userId = req.user.id;

    if (String(req.user.id) !== String(userId)) {
      return res.status(statusCode.FORBIDDEN).json({
        statusCode: statusCode.FORBIDDEN,
        message: message.unAuthUser,
      });
    }

    const fdExists = await FixedDepositModel.findOne({ fdNo, userId });
    if (fdExists) {
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.fdAlreadyExists,
      });
    }

    const formattedStartDate = formatDate(startDate);
    const formattedMaturityDate = formatDate(maturityDate);

    const newFixedDeposit = new FixedDepositModel({
      firstName,
      lastName,
      fdNo,
      fdType,
      bankId,
      branchName,
      interestRate,
      startDate: formattedStartDate,
      maturityDate: formattedMaturityDate,
      totalInvestedAmount,
      userId,
    });

    await newFixedDeposit.save();

    const [updatedFd] = await FixedDepositModel.aggregate(
      registerFdAggregation(
        newFixedDeposit._id,
        startDate,
        maturityDate,
        totalInvestedAmount,
        interestRate
      )
    );

    if (!updatedFd) {
      logger.error("Aggregation returned no documents", {
        userId,
        fdId: newFixedDeposit._id,
      });
      return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: message.errorAddingFixedDeposit,
      });
    }

    const totalYears = calculateTotalYears(
      formattedStartDate,
      formattedMaturityDate
    );

    const updatedFdResult = await FixedDepositModel.findByIdAndUpdate(
      newFixedDeposit._id,
      {
        currentReturnAmount: updatedFd.currentReturnAmount || 0,
        totalReturnedAmount: updatedFd.totalReturnedAmount || 0,
        currentProfitAmount: updatedFd.currentProfitAmount || 0,
        tenureCompletedYears: updatedFd.tenureCompletedYears || 0,
        totalYears: totalYears,
      },
      { new: true }
    );

    if (!updatedFdResult) {
      logger.error("Failed to update FD after aggregation", {
        userId,
        fdId: newFixedDeposit._id,
      });
      return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: message.errorUpdatingFD,
      });
    }

    const responseData = {
      ...updatedFdResult.toObject(),
      startDate: formatDate(updatedFdResult.startDate),
      maturityDate: formatDate(updatedFdResult.maturityDate),
    };

    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.fdCreated,
      data: responseData,
    });
  } catch (error) {
    logger.error("Error registering FD", { error: error.message });
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorCreatingFD,
    });
  }
};

//====================== UPDATE FIXED DEPOSIT ======================//

export const updateFixedDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.errorUpdatingFD,
      });
    }

    const fixedDeposit = await FixedDepositModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!fixedDeposit) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingFD,
      });
    }

    const updatedFixedDeposit = await FixedDepositModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedFixedDeposit) {
      logger.error("Failed to update FD details", { userId, fdId: id });
      return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: message.errorUpdatingFD,
      });
    }

    const [updatedFd] = await FixedDepositModel.aggregate(
      updateFdAggregation(
        new mongoose.Types.ObjectId(id),
        updatedFixedDeposit.startDate,
        updatedFixedDeposit.maturityDate,
        updatedFixedDeposit.totalInvestedAmount,
        updatedFixedDeposit.interestRate
      )
    );

    if (!updatedFd) {
      logger.error("Aggregation returned no documents during update", {
        userId,
        fdId: id,
      });
      return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: message.errorUpdatingFD,
      });
    }

    const totalYears = calculateTotalYears(
      updatedFixedDeposit.startDate,
      updatedFixedDeposit.maturityDate
    );

    const updatedFdResult = await FixedDepositModel.findByIdAndUpdate(
      id,
      {
        currentReturnAmount: updatedFd.currentReturnAmount || 0,
        totalReturnedAmount: updatedFd.totalReturnedAmount || 0,
        currentProfitAmount: updatedFd.currentProfitAmount || 0,
        tenureCompletedYears: updatedFd.tenureCompletedYears || 0,
        totalYears: totalYears,
      },
      { new: true }
    );

    if (!updatedFdResult) {
      logger.error("Failed to update FD after aggregation", {
        userId,
        fdId: id,
      });
      return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: message.errorUpdatingFD,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.fdUpdated,
      data: updatedFdResult,
    });
  } catch (error) {
    logger.error("Error updating FD", { error: error.message });
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUpdatingFD,
    });
  }
};

//====================== DELETE FIXED DEPOSIT ======================//

export const fixedDepositDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "Invalid FD ID format",
      });
    }

    const fixedDeposit = await FixedDepositModel.findOne({
      _id: id,
      userId,
    });
    if (!fixedDeposit) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: "FD not found or not authorized to delete",
      });
    }

    await FixedDepositModel.findByIdAndDelete(id);
    await FdAnalysisModel.deleteOne({ fdId: id, userId });

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: "FD deleted successfully",
    });
  } catch (error) {
    logger.error("Error while deleting Fixed Deposit", {
      userId,
      fdId: id,
    });
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: "Error deleting FD",
      error: error.message || error,
    });
  }
};

//====================== VIEW FIXED DEPOSIT ======================//
export const getFdDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const pipeline = [
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "banks",
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
    ];

    if (id) {
      pipeline.unshift({
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          userId: new mongoose.Types.ObjectId(userId),
        },
      });
    }

    const fdDetails = await FixedDepositModel.aggregate(pipeline);

    // if (!fdDetails.length) {
    //   logger.info("No FD records found for user", { userId });
    // } else {
    //   logger.info("FD records retrieved successfully", {
    //     userId,
    //     count: fdDetails.length,
    //   });
    // }

    const formattedFdDetails = fdDetails.map((fd, index) => ({
      srNo: index + 1,
      ...fd,
      createdAt: moment(fd.createdAt).format("YYYY-MM-DD"),
      updatedAt: moment(fd.updatedAt).format("YYYY-MM-DD"),
      maturityDate: moment(fd.maturityDate).format("YYYY-MM-DD"),
      startDate: moment(fd.startDate).format("YYYY-MM-DD"),
    }));

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: fdDetails.length ? message.fdsView : message.noFdsFound,
      data: formattedFdDetails,
    });
  } catch (error) {
    logger.error("Error while fetching FD details", {
      userId,
      fdId: id || "all",
    });
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingFDs,
      error: error.message || error,
    });
  }
};

//====================== DELETE MULTIPLE FIXED DEPOSITS ======================//

export const deleteMultipleFDs = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    if (
      !Array.isArray(ids) ||
      ids.some((id) => !mongoose.Types.ObjectId.isValid(id))
    ) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "Invalid FD ID format in the provided list",
      });
    }

    const fdsToDelete = await FixedDepositModel.find({
      _id: { $in: ids },
      userId,
    });

    if (fdsToDelete.length !== ids.length) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: "Some FDs not found or not authorized to delete",
      });
    }

    await FixedDepositModel.deleteMany({ _id: { $in: ids }, userId });
    await FdAnalysisModel.deleteMany({ fdId: { $in: ids }, userId });

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: "FDs deleted successfully",
    });
  } catch (error) {
    logger.error("Error while deleting multiple FDs", {
      userId,
      fdIds: ids,
    });
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: "Error deleting FDs",
      error: error.message || error,
    });
  }
};

//====================== FIXED DEPOSIT ANALYSIS BY NUMBER ======================//

export const getFdAnalysisbyNumber = async (req, res) => {
  try {
    const userId = req.user.id;

    const fdAnalysis = await FixedDepositModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $addFields: {
          tenureInYears: {
            $divide: [
              { $subtract: ["$maturityDate", "$startDate"] },
              1000 * 60 * 60 * 24 * 365,
            ],
          },
          tenureCompletedYears: {
            $divide: [
              { $subtract: [new Date(), "$startDate"] },
              1000 * 60 * 60 * 24 * 365,
            ],
          },
        },
      },
      {
        $addFields: {
          totalReturnedAmount: {
            $trunc: {
              $add: [
                "$totalInvestedAmount",
                {
                  $multiply: [
                    "$totalInvestedAmount",
                    { $multiply: ["$interestRate", "$tenureInYears", 0.01] },
                  ],
                },
              ],
            },
          },
          currentReturnAmount: {
            $trunc: {
              $add: [
                "$totalInvestedAmount",
                {
                  $multiply: [
                    "$totalInvestedAmount",
                    {
                      $multiply: [
                        "$interestRate",
                        "$tenureCompletedYears",
                        0.01,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalInvestedAmountOfFds: { $sum: "$totalInvestedAmount" },
          currentReturnAmountOfFds: { $sum: "$currentReturnAmount" },
          totalReturnAmountofFds: { $sum: "$totalReturnedAmount" },
        },
      },
      {
        $addFields: {
          totalProfitGainedOfFds: {
            $trunc: {
              $subtract: [
                "$currentReturnAmountOfFds",
                "$totalInvestedAmountOfFds",
              ],
            },
          },
        },
      },
    ]);

    if (!fdAnalysis || fdAnalysis.length === 0) {
      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.errorFetchingFD,
      });
    }

    const rawData = {
      totalInvestedAmountOfFds: Math.round(
        fdAnalysis[0].totalInvestedAmountOfFds
      ),
      currentReturnAmountOfFds: Math.round(
        fdAnalysis[0].currentReturnAmountOfFds
      ),
      totalReturnAmountofFds: Math.round(fdAnalysis[0].totalReturnAmountofFds),
      totalProfitGainedOfFds: Math.round(fdAnalysis[0].totalProfitGainedOfFds),
      userId: new mongoose.Types.ObjectId(userId),
    };

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.analysisReportofFd,
      data: rawData,
    });
  } catch (error) {
    logger.error("Error while fetching FD analysis by number", {
      userId,
    });
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFdAnalytics,
    });
  }
};
