import BankModel from "../model/bank.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD BANK ======================//

export const createBank = async (req, res) => {
  try {
    const { bankName } = req.body;

    const bankExists = await BankModel.findOne({ bankName });
    if (bankExists) {
      logger.warn(`Bank already exists: ${bankName}`);
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.bankAlreadyExists,
      });
    }

    const newBank = new BankModel({ bankName });
    logger.info(`Adding new bank: ${bankName}`);
    const savedBank = await newBank.save();

    logger.info(`Successfully created bank: ${savedBank.bankName}`);
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

    logger.info(`Updating bank with ID: ${id} to name: ${bankName}`);

    const updatedBank = await BankModel.findByIdAndUpdate(
      id,
      { bankName },
      { new: true }
    );

    if (!updatedBank) {
      logger.warn(`Bank with ID: ${id} not found`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingBank,
      });
    }

    logger.info(`Successfully updated bank: ${updatedBank.bankName}`);
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

    logger.info(`Deleting bank with ID: ${id}`);

    const deletedBank = await BankModel.findByIdAndDelete(id);

    if (!deletedBank) {
      logger.warn(`Bank with ID: ${id} not found`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingBank,
      });
    }

    logger.info(`Successfully deleted bank: ${deletedBank.bankName}`);
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
    logger.info("Fetching list of banks...");

    const banks = await BankModel.find();

    const banksWithSrNo = banks.map((bank, index) => ({
      srNo: index + 1,
      ...bank.toObject(),
    }));

    logger.info(`Successfully fetched ${banksWithSrNo.length} banks`);
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

    logger.info(`Deleting multiple banks with IDs: ${ids.join(", ")}`);

    const deletedBanks = await BankModel.deleteMany({ _id: { $in: ids } });

    if (deletedBanks.deletedCount === 0) {
      logger.warn(`No banks found to delete for IDs: ${ids.join(", ")}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingBank,
      });
    }

    logger.info(`Successfully deleted ${deletedBanks.deletedCount} banks`);
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
