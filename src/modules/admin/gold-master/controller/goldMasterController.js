import GoldMasterModel from "../model/goldMaster.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD GOLD MASTER  ======================//

export const goldMasterInfoRegister = async (req, res) => {
  try {
    const { goldRate22KPerGram, goldRate24KPerGram } = req.body;

    const masterGoldInfoExists = await GoldMasterModel.findOne();

    if (masterGoldInfoExists) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ statusCode: statusCode.CONFLICT, message: message.goldExists });
    }

    const newGoldMasterInfo = new GoldMasterModel({
      goldRate22KPerGram,
      goldRate24KPerGram,
    });

    const saveGoldMasterInfo = await newGoldMasterInfo.save();

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
    });
  }
};

//====================== UPDATE GOLD MASTER  ======================//

export const updateGoldMasterInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { goldRate22KPerGram, goldRate24KPerGram } = req.body;

    const updateGoldInfo = await GoldMasterModel.findByIdAndUpdate(
      id,
      { goldRate22KPerGram, goldRate24KPerGram },
      { new: true }
    );

    if (!updateGoldInfo) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingGoldInfo,
      });
    }

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
    });
  }
};

//====================== DELETE GOLD MASTER  ======================//

export const deleteGoldMasterInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteGoldMasterInfo = await GoldMasterModel.findByIdAndDelete(id);

    if (!deleteGoldMasterInfo) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingGoldInfo,
      });
    }

    return res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.goldInfoDelete });
  } catch (error) {
    logger.error(`Error while deleting gold information: ${error.message}`);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingGoldInfo,
    });
  }
};

//====================== VIEW GOLD MASTER INFO ======================//

export const getGoldMasterInfo = async (req, res) => {
  try {
    const goldMasterInformation = await GoldMasterModel.find();

    const goldMasterWithSrNo = goldMasterInformation.map((record, index) => ({
      srNo: index + 1,
      ...record.toObject(),
    }));

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
    });
  }
};
