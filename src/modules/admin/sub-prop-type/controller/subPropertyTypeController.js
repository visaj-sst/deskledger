import SubPropertyTypeModel from "../model/subPropertyType.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD SUB PROPERTY TYPE  ======================//

export const subPropertyTypeRegister = async (req, res) => {
  try {
    const { subPropertyType, propertyTypeId } = req.body;

    logger.info(
      `Attempting to register a new Sub Property Type: ${subPropertyType}`
    );

    const subPropertyTypeExists = await SubPropertyTypeModel.findOne({
      subPropertyType,
      propertyTypeId,
    });

    if (subPropertyTypeExists) {
      logger.warn(
        `Sub Property Type ${subPropertyType} already exists for property type ID ${propertyTypeId}`
      );
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.subPropertyTypeAlreadyExists,
      });
    }

    const newSubPropertyType = new SubPropertyTypeModel({
      subPropertyType,
      propertyTypeId,
    });

    const savedSubPropertyType = await newSubPropertyType.save();

    const registeredSubProperty = await SubPropertyTypeModel.aggregate([
      { $match: { _id: savedSubPropertyType._id } },
      {
        $lookup: {
          from: "propertytypes",
          localField: "propertyTypeId",
          foreignField: "_id",
          as: "propertyTypesData",
        },
      },
      {
        $unwind: {
          path: "$propertyTypesData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          subPropertyType: 1,
          propertyTypeId: 1,
          propertyType: "$propertyTypesData.propertyType",
        },
      },
    ]);

    logger.info(
      `Sub Property Type ${subPropertyType} successfully registered with ID: ${savedSubPropertyType._id}`
    );
    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.subPropertyTypeAdded,
      data: registeredSubProperty[0],
    });
  } catch (error) {
    logger.error(`Error while registering Sub Property Type: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorAddingSubPropertyType,
      error: error.message,
    });
  }
};

//====================== UPDATE SUB PROPERTY TYPE  ======================//

export const updateSubPropertyType = async (req, res) => {
  try {
    const { id } = req.params;
    const { subPropertyType } = req.body;

    logger.info(`Attempting to update Sub Property Type with ID: ${id}`);

    const updatedSubPropertyType = await SubPropertyTypeModel.findByIdAndUpdate(
      id,
      { subPropertyType },
      { new: true }
    );

    if (!updatedSubPropertyType) {
      logger.warn(`Sub Property Type with ID ${id} not found`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.subPropertyTypeNotFound,
      });
    }

    const updatedSubPropertyTypeWithPropertyType =
      await SubPropertyTypeModel.aggregate([
        { $match: { _id: updatedSubPropertyType._id } },
        {
          $lookup: {
            from: "propertytypes",
            localField: "propertyTypeId",
            foreignField: "_id",
            as: "propertyTypesData",
          },
        },
        {
          $unwind: {
            path: "$propertyTypesData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            subPropertyType: 1,
            propertyTypeId: 1,
            propertyType: "$propertyTypesData.propertyType",
          },
        },
      ]);

    logger.info(`Sub Property Type with ID ${id} successfully updated`);
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.subPropertyTypeUpdated,
      data: updatedSubPropertyTypeWithPropertyType[0],
    });
  } catch (error) {
    logger.error(`Error while updating Sub Property Type: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUpdatingSubPropType,
      error: error.message,
    });
  }
};

//====================== DELETE SUB PROPERTY TYPE  ======================//

export const deleteSubPropertyType = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Attempting to delete Sub Property Type with ID: ${id}`);

    const deletedSubPropertyType = await SubPropertyTypeModel.findByIdAndDelete(
      id
    );

    if (!deletedSubPropertyType) {
      logger.warn(`Sub Property Type with ID ${id} not found`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.subPropertyTypeNotFound,
      });
    }

    logger.info(`Sub Property Type with ID ${id} successfully deleted`);
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.subPropertyTypeDeleted,
      data: deletedSubPropertyType,
    });
  } catch (error) {
    logger.error(`Error while deleting Sub Property Type: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingSubPropType,
      error: error.message,
    });
  }
};

//====================== VIEW SUB PROPERTY TYPE  ======================//

export const getSubPropertyType = async (req, res) => {
  try {
    logger.info("Fetching sub property types");

    const subpropertytypes = await SubPropertyTypeModel.aggregate([
      {
        $lookup: {
          from: "propertytypes",
          localField: "propertyTypeId",
          foreignField: "_id",
          as: "propertyTypesData",
        },
      },
      {
        $unwind: {
          path: "$propertyTypesData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          subPropertyType: 1,
          propertyTypeId: 1,
          propertyType: "$propertyTypesData.propertyType",
        },
      },
    ]);

    const subPropertyTypesWithSrNo = subpropertytypes.map(
      (subPropertyType, index) => ({
        srNo: index + 1,
        subPropertyType: {
          _id: subPropertyType._id,
          subPropertyType: subPropertyType.subPropertyType,
          propertyTypeId: subPropertyType.propertyTypeId,
          propertyType: subPropertyType.propertyType,
        },
      })
    );

    logger.info(
      `Successfully retrieved ${subPropertyTypesWithSrNo.length} sub property types`
    );

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.subPropertyTypeRetrieved,
      data: subPropertyTypesWithSrNo,
    });
  } catch (error) {
    logger.error(`Error while fetching sub property types: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingSubPropTypes,
      error: error.message,
    });
  }
};

//====================== DELETE MULTIPLE SUB PROPERTY TYPE  ======================//

export const deleteMultipleSubPropertyTypes = async (req, res) => {
  try {
    const { ids } = req.body;

    logger.info(
      `Attempting to delete multiple sub property types with IDs: ${ids.join(
        ", "
      )}`
    );

    const deletedMultipleSubPropertyTypes =
      await SubPropertyTypeModel.deleteMany({
        _id: { $in: ids },
      });

    if (deletedMultipleSubPropertyTypes.deletedCount === 0) {
      logger.warn(
        `No sub property types found for deletion with the given IDs: ${ids.join(
          ", "
        )}`
      );
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingSubPropTypes,
      });
    }

    logger.info(
      `Successfully deleted ${deletedMultipleSubPropertyTypes.deletedCount} sub property types`
    );

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.subPropertyTypesDeleted,
      deletedCount: deletedMultipleSubPropertyTypes.deletedCount,
    });
  } catch (error) {
    logger.error(
      `Error while deleting multiple sub property types: ${error.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingSubPropertyTypes,
    });
  }
};
