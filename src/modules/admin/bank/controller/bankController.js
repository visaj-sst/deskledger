import BankModel from "../model/bank.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD BANK ======================//

export const createBank = async (req, res) => {
  try {
    const { bankName } = req.body;

    const bankExists = await BankModel.findOne({ bankName });
    if (bankExists) {
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.bankAlreadyExists,
      });
    }

    const newBank = new BankModel({ bankName });
    const savedBank = await newBank.save();

    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.bankCreated,
      data: savedBank,
    });
  } catch (error) {
    logger.error("Error while adding bank: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorCreatingBank,
    });
  }
};

//====================== UPDATE BANK ======================//

export const updateBank = async (req, res) => {
  try {
    const { id } = req.params;
    const { bankName } = req.body;

    const updatedBank = await BankModel.findByIdAndUpdate(
      id,
      { bankName },
      { new: true }
    );

    if (!updatedBank) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingBank,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.bankUpdated,
      data: updatedBank,
    });
  } catch (error) {
    logger.error("Error while updating bank: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUpdatingBank,
    });
  }
};

//====================== DELETE BANK ======================//

export const deleteBank = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBank = await BankModel.findByIdAndDelete(id);

    if (!deletedBank) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingBank,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.bankDeleted,
    });
  } catch (error) {
    logger.error("Error while deleting bank: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingBank,
    });
  }
};

//====================== VIEW BANKS ======================//

export const getBanks = async (req, res) => {
  try {
    const banks = await BankModel.find();

    const banksWithSrNo = banks.map((bank, index) => ({
      srNo: index + 1,
      ...bank.toObject(),
    }));

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.banksView,
      data: banksWithSrNo,
    });
  } catch (error) {
    logger.error("Error while fetching banks: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingBanks,
    });
  }
};

//====================== DELETE MULTIPLE BANKS ======================//

export const deleteMultipleBanks = async (req, res) => {
  try {
    const { ids } = req.body;

    const deletedBanks = await BankModel.deleteMany({ _id: { $in: ids } });

    if (deletedBanks.deletedCount === 0) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingBank,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.banksDeleted,
      deletedCount: deletedBanks.deletedCount,
    });
  } catch (error) {
    logger.error("Error while deleting multiple banks: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingBanks,
    });
  }
};
