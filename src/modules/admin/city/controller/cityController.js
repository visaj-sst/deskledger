import CityModel from "../model/city.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD CITY ======================//
export const cityRegister = async (req, res) => {
  try {
    const { city, stateId } = req.body;

    const cityExists = await CityModel.findOne({ city });
    if (cityExists) {
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.cityAlreadyExists,
      });
    }

    const newCity = new CityModel({
      city,
      stateId,
    });

    const savedCity = await newCity.save();

    const registeredCity = await CityModel.aggregate([
      {
        $match: { _id: savedCity._id },
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
          path: "$stateData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          city: 1,
          stateId: 1,
          state: "$stateData.state",
        },
      },
    ]);

    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.cityCreated,
      data: registeredCity[0],
    });
  } catch (error) {
    logger.error(`Error while adding city: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorCreatingCity,
    });
  }
};

//====================== UPDATE CITY ======================//
export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { city, stateId } = req.body;

    const updatedCity = await CityModel.findByIdAndUpdate(
      id,
      { city, stateId },
      { new: true }
    );

    if (!updatedCity) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.cityNotFound,
      });
    }

    const updatedCityWithState = await CityModel.aggregate([
      {
        $match: { _id: updatedCity._id },
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
          path: "$stateData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          city: 1,
          stateId: 1,
          state: "$stateData.state",
        },
      },
    ]);

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.cityUpdated,
      data: updatedCityWithState[0],
    });
  } catch (error) {
    logger.error(`Error while updating city: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUpdatingCity,
    });
  }
};

//====================== DELETE CITY ======================//

export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCity = await CityModel.findByIdAndDelete(id);
    if (!deletedCity) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.cityNotFound,
      });
    }

    const deletedCityWithState = await CityModel.aggregate([
      {
        $match: { _id: deletedCity._id },
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
          path: "$stateData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          city: 1,
          stateId: 1,
          state: "$stateData.state",
        },
      },
    ]);

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.cityDeleted,
      data: deletedCityWithState[0],
    });
  } catch (error) {
    logger.error(`Error while deleting city: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingCity,
    });
  }
};

//====================== VIEW CITY ======================//

export const getCity = async (req, res) => {
  try {
    const cities = await CityModel.aggregate([
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
          path: "$stateData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          city: 1,
          stateId: 1,
          state: "$stateData.state",
        },
      },
    ]);

    const citiesWithSrNo = cities.map((city, index) => ({
      srNo: index + 1,
      city,
    }));

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.citiesView,
      data: citiesWithSrNo,
    });
  } catch (error) {
    logger.error(`Error while fetching cities: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingCities,
    });
  }
};

//====================== DELETE MULTIPLE CITIES ======================//

export const deleteMultipleCities = async (req, res) => {
  try {
    const { ids } = req.body;

    const deletedCities = await CityModel.deleteMany({ _id: { $in: ids } });

    if (deletedCities.deletedCount === 0) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.cityNotFound,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.citiesDeleted,
      deletedCount: deletedCities.deletedCount,
    });
  } catch (error) {
    logger.error(`Error while deleting multiple cities: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingCity,
    });
  }
};
