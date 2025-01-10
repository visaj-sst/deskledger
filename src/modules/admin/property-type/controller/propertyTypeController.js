import PropertyTypeModel from "../model/propertyType.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD PROPERTY TYPE  ======================//

export const propertyTypeRegister = async (req, res) => {
  try {
    const { propertyType } = req.body;

    const PropertyTypeExists = await PropertyTypeModel.findOne({
      propertyType,
    });
    if (PropertyTypeExists) {
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.propertyTypeAlreadyExists,
      });
    }

    const newPropertyType = new PropertyTypeModel({ propertyType });
    const savedPropertyType = await newPropertyType.save();

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
    });
  }
};

//====================== UPDATE PROPERTY TYPE  ======================//

export const updatePropertyType = async (req, res) => {
  try {
    const id = req.params.id;
    const { propertyType } = req.body;

    const updatedPropertyType = await PropertyTypeModel.findByIdAndUpdate(
      id,
      { propertyType },
      { new: true }
    );

    if (!updatedPropertyType) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.propertyTypeNotFound,
      });
    }

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
    });
  }
};

//====================== DELETE PROPERTY TYPE  ======================//

export const deletePropertyType = async (req, res) => {
  try {
    const id = req.params.id;

    const deletedState = await PropertyTypeModel.findByIdAndDelete(id);

    if (!deletedState) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.propertyTypeNotFound,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.propertyTypeDeleted,
    });
  } catch (error) {
    logger.error(`Error while deleting property type: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingPropertyType,
    });
  }
};

//====================== VIEW PROPERTY TYPE  ======================//

export const getPropertyType = async (req, res) => {
  try {
    const propertyTypes = await PropertyTypeModel.find();

    const propertyTypesWithSrNo = propertyTypes.map((propertyType, index) => ({
      srNo: index + 1,
      ...propertyType.toObject(),
    }));

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
    });
  }
};

//====================== DELETE MULTIPLE PROPERTY TYPES  ======================//

export const deleteMultiplePropertyTypes = async (req, res) => {
  try {
    const { ids } = req.body;

    const deletedPropertyTypes = await PropertyTypeModel.deleteMany({
      _id: { $in: ids },
    });

    if (deletedPropertyTypes.deletedCount === 0) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingPropertyType,
      });
    }

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
    });
  }
};
