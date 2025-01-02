import GoldMasterModel from "../model/goldMaster.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD GOLD MASTER  ======================//

export const goldMasterInfoRegister = async (req, res) => {
  try {
    const { goldRate22KPerGram, goldRate24KPerGram } = req.body;

    logger.info("Checking if gold master information already exists...");

    const masterGoldInfoExists = await GoldMasterModel.findOne();

    if (masterGoldInfoExists) {
      logger.warn("Gold master information already exists");
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ statusCode: statusCode.CONFLICT, message: message.goldExists });
    }

    logger.info("Creating new gold master information...");
    const newGoldMasterInfo = new GoldMasterModel({
      goldRate22KPerGram,
      goldRate24KPerGram,
    });

    const saveGoldMasterInfo = await newGoldMasterInfo.save();
    logger.info("Gold master information created successfully");

    return res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.goldInfoRegister,
      data: saveGoldMasterInfo,
    });
  } catch (error) {
    logger.error(`Error while creating gold information: ${error.message}`);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.goldRegisterError,
      error: error.message,
    });
  }
};

//====================== UPDATE GOLD MASTER  ======================//

export const updateGoldMasterInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { goldRate22KPerGram, goldRate24KPerGram } = req.body;

    logger.info(`Updating gold master information with ID: ${id}`);

    const updateGoldInfo = await GoldMasterModel.findByIdAndUpdate(
      id,
      { goldRate22KPerGram, goldRate24KPerGram },
      { new: true }
    );

    if (!updateGoldInfo) {
      logger.warn(`No record found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingGoldInfo,
      });
    }

    logger.info("Gold master information updated successfully");
    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.goldInfoUpdate,
      data: updateGoldInfo,
    });
  } catch (error) {
    logger.error(`Error while updating gold information: ${error.message}`);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUpdatingGoldInfo,
      error: error.message,
    });
  }
};

//====================== DELETE GOLD MASTER  ======================//

export const deleteGoldMasterInfo = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Deleting gold master information with ID: ${id}`);

    const deleteGoldMasterInfo = await GoldMasterModel.findByIdAndDelete(id);

    if (!deleteGoldMasterInfo) {
      logger.warn(`No record found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingGoldInfo,
      });
    }

    logger.info("Gold master information deleted successfully");
    return res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.goldInfoDelete });
  } catch (error) {
    logger.error(`Error while deleting gold information: ${error.message}`);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingGoldInfo,
      error: error.message,
    });
  }
};

//====================== VIEW GOLD MASTER INFO ======================//

export const getGoldMasterInfo = async (req, res) => {
  try {
    logger.info("Fetching gold master information...");

    const goldMasterInformation = await GoldMasterModel.find();

    const goldMasterWithSrNo = goldMasterInformation.map((record, index) => ({
      srNo: index + 1,
      ...record.toObject(),
    }));

    logger.info("Gold master information fetched successfully");
    return res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, data: goldMasterWithSrNo });
  } catch (error) {
    logger.error(
      `Error while fetching gold master information: ${error.message}`
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingGoldInfo,
      error: error.message,
    });
  }
};
