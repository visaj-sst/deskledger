import PropertyTypeModel from "../model/propertyType.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD PROPERTY TYPE  ======================//

export const propertyTypeRegister = async (req, res) => {
  try {
    const { propertyType } = req.body;

    logger.info(`Checking if property type ${propertyType} already exists...`);

    const PropertyTypeExists = await PropertyTypeModel.findOne({
      propertyType,
    });
    if (PropertyTypeExists) {
      logger.warn(`Property type ${propertyType} already exists`);
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.propertyTypeAlreadyExists,
      });
    }

    logger.info("Creating new property type...");
    const newPropertyType = new PropertyTypeModel({ propertyType });
    const savedPropertyType = await newPropertyType.save();

    logger.info("Property type created successfully");
    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.propertyTypeCreated,
      data: savedPropertyType,
    });
  } catch (error) {
    logger.error(`Error while creating property type: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorRegisterPropertyType,
      error: error.message,
    });
  }
};

//====================== UPDATE PROPERTY TYPE  ======================//

export const updatePropertyType = async (req, res) => {
  try {
    const id = req.params.id;
    const { propertyType } = req.body;

    logger.info(`Updating property type with ID: ${id}`);

    const updatedPropertyType = await PropertyTypeModel.findByIdAndUpdate(
      id,
      { propertyType },
      { new: true }
    );

    if (!updatedPropertyType) {
      logger.warn(`No record found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.propertyTypeNotFound,
      });
    }

    logger.info("Property type updated successfully");
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.propertyTypeUpdated,
      data: updatedPropertyType,
    });
  } catch (error) {
    logger.error(`Error while updating property type: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUpdatingProperty,
      error: error.message,
    });
  }
};

//====================== DELETE PROPERTY TYPE  ======================//

export const deletePropertyType = async (req, res) => {
  try {
    const id = req.params.id;

    logger.info(`Deleting property type with ID: ${id}`);

    const deletedState = await PropertyTypeModel.findByIdAndDelete(id);

    if (!deletedState) {
      logger.warn(`No record found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.propertyTypeNotFound,
      });
    }

    logger.info("Property type deleted successfully");
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.propertyTypeDeleted,
    });
  } catch (error) {
    logger.error(`Error while deleting property type: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingPropertyType,
      error: error.message,
    });
  }
};

//====================== VIEW PROPERTY TYPE  ======================//

export const getPropertyType = async (req, res) => {
  try {
    logger.info("Fetching all property types...");

    const propertyTypes = await PropertyTypeModel.find();

    const propertyTypesWithSrNo = propertyTypes.map((propertyType, index) => ({
      srNo: index + 1,
      ...propertyType.toObject(),
    }));

    logger.info("Successfully fetched property types");
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.propertyTypeView,
      data: propertyTypesWithSrNo,
    });
  } catch (error) {
    logger.error(`Error while fetching property types: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingPropertyType,
      error: error.message,
    });
  }
};

//====================== DELETE MULTIPLE PROPERTY TYPES  ======================//

export const deleteMultiplePropertyTypes = async (req, res) => {
  try {
    const { ids } = req.body;

    logger.info(`Deleting multiple property types with IDs: ${ids.join(", ")}`);

    const deletedPropertyTypes = await PropertyTypeModel.deleteMany({
      _id: { $in: ids },
    });

    if (deletedPropertyTypes.deletedCount === 0) {
      logger.warn("No property types found for deletion");
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingPropertyType,
      });
    }

    logger.info(
      `${deletedPropertyTypes.deletedCount} property types deleted successfully`
    );
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.propertyTypesDeleted,
      deletedCount: deletedPropertyTypes.deletedCount,
    });
  } catch (error) {
    logger.error(
      `Error while deleting multiple property types: ${error.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingPropertyTypes,
      error: error.message,
    });
  }
};
