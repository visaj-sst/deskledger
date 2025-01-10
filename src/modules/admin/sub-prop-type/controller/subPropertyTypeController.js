import SubPropertyTypeModel from "../model/subPropertyType.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD SUB PROPERTY TYPE  ======================//

export const subPropertyTypeRegister = async (req, res) => {
  try {
    const { subPropertyType, propertyTypeId } = req.body;

    const subPropertyTypeExists = await SubPropertyTypeModel.findOne({
      subPropertyType,
      propertyTypeId,
    });

    if (subPropertyTypeExists) {
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
    });
  }
};

//====================== UPDATE SUB PROPERTY TYPE  ======================//

export const updateSubPropertyType = async (req, res) => {
  try {
    const { id } = req.params;
    const { subPropertyType } = req.body;

    const updatedSubPropertyType = await SubPropertyTypeModel.findByIdAndUpdate(
      id,
      { subPropertyType },
      { new: true }
    );

    if (!updatedSubPropertyType) {
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
    });
  }
};

//====================== DELETE SUB PROPERTY TYPE  ======================//

export const deleteSubPropertyType = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSubPropertyType = await SubPropertyTypeModel.findByIdAndDelete(
      id
    );

    if (!deletedSubPropertyType) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.subPropertyTypeNotFound,
      });
    }

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
    });
  }
};

//====================== VIEW SUB PROPERTY TYPE  ======================//

export const getSubPropertyType = async (req, res) => {
  try {
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
    });
  }
};

//====================== DELETE MULTIPLE SUB PROPERTY TYPE  ======================//

export const deleteMultipleSubPropertyTypes = async (req, res) => {
  try {
    const { ids } = req.body;

    const deletedMultipleSubPropertyTypes =
      await SubPropertyTypeModel.deleteMany({
        _id: { $in: ids },
      });

    if (deletedMultipleSubPropertyTypes.deletedCount === 0) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingSubPropTypes,
      });
    }

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
