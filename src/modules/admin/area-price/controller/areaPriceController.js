import AreaPriceModel from "../model/areaPrice.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD AREA PRICE ======================//

export const createAreaPrice = async (req, res) => {
  try {
    const { cityId, stateId, areaName, pricePerSquareFoot } = req.body;

    const areaPriceExists = await AreaPriceModel.findOne({
      cityId,
      stateId,
      areaName,
      pricePerSquareFoot,
    });

    if (areaPriceExists) {
      logger.warn(`Area price already exists for : ${areaName}`);
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.areaPriceAlreadyExists,
      });
    }

    const newAreaPrice = new AreaPriceModel({
      cityId,
      stateId,
      areaName,
      pricePerSquareFoot,
    });

    logger.info(`Adding Area price for : ${areaName}`);
    const savedAreaPrice = await newAreaPrice.save();

    logger.info(`Area price successfully added for : ${areaName}`);
    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.areaPriceCreated,
      data: savedAreaPrice,
    });
  } catch (error) {
    logger.error(
      `Error adding Area price for: ${req.body.areaName}. Error: ${error.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorCreatingAreaPrice,
    });
  }
};

//====================== UPDATE AREA PRICE ======================//

export const updateAreaPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { cityId, stateId, areaName, pricePerSquareFoot } = req.body;

    logger.info(`Updating Area price for: ${areaName} with ID: ${id}`);
    const updatedAreaPrice = await AreaPriceModel.findByIdAndUpdate(
      id,
      { cityId, stateId, areaName, pricePerSquareFoot },
      { new: true }
    );

    if (!updatedAreaPrice) {
      logger.warn(`Area price with ID ${id} not found for update`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingAreaPrice,
      });
    }

    logger.info(`Area price updated successfully for ID: ${id}`);
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.areaPriceUpdated,
      data: updatedAreaPrice,
    });
  } catch (error) {
    logger.error(
      `Error updating Area price with ID ${req.params.id}: ${error.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUpdatingAreaPrice,
    });
  }
};

//====================== DELETE AREA PRICE ======================//

export const deleteAreaPrice = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Deleting Area price with ID: ${id}`);
    const deletedAreaPrice = await AreaPriceModel.findByIdAndDelete(id);

    if (!deletedAreaPrice) {
      logger.warn(`Area price with ID ${id} not found for deletion`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingAreaPrice,
      });
    }

    logger.info(`Area price successfully deleted for ID: ${id}`);
    res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.areaPriceDeleted });
  } catch (error) {
    logger.error(
      `Error deleting Area price with ID ${req.params.id}: ${error.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingAreaPrice,
    });
  }
};

//====================== VIEW AREA PRICE ======================//

export const getAreaPrices = async (req, res) => {
  try {
    logger.info("Fetching area prices with details...");

    const areaPrices = await AreaPriceModel.aggregate([
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
          areaName: 1,
          pricePerSquareFoot: 1,
          city: "$cityData.city",
          state: "$stateData.state",
        },
      },
    ]);

    const areaPricesWithSrNo = areaPrices.map((areaPrice, index) => ({
      srNo: index + 1,
      ...areaPrice,
    }));

    logger.info(
      `Successfully fetched ${areaPricesWithSrNo.length} area prices`
    );

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.areaPriceRetrieved,
      data: areaPricesWithSrNo,
    });
  } catch (error) {
    logger.error("Error fetching area prices: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingAreaPrice,
    });
  }
};

//====================== DELETE MULTIPLE AREA PRICE ======================//

export const deleteMultipleAreaPrices = async (req, res) => {
  try {
    const { ids } = req.body;
    logger.info(`Deleting multiple area prices with IDs: ${ids.join(", ")}`);

    const deletedAreaPrices = await AreaPriceModel.deleteMany({
      _id: { $in: ids },
    });

    if (deletedAreaPrices.deletedCount === 0) {
      logger.warn(
        `No area prices found to delete for the given IDs: ${ids.join(", ")}`
      );
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingAreaPrice,
      });
    }

    logger.info(
      `Successfully deleted ${deletedAreaPrices.deletedCount} area prices`
    );

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.areaPricesDeleted,
      deletedCount: deletedAreaPrices.deletedCount,
    });
  } catch (error) {
    logger.error("Error deleting multiple area prices: " + error.message);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingAreaPrice,
    });
  }
};
