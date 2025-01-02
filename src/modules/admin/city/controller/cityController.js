const CityModel = require("../model/city");
const { statusCode, message } = require("../../../../utils/api.response.js");
const logger = require("../../../../service/logger.service.js");

//====================== ADD CITY ======================//
const cityRegister = async (req, res) => {
  try {
    const { city, stateId } = req.body;

    logger.info(`Checking if city ${city} already exists...`);
    const cityExists = await CityModel.findOne({ city });
    if (cityExists) {
      logger.warn(`City already exists: ${city}`);
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.cityAlreadyExists,
      });
    }

    logger.info(`Adding new city: ${city}`);
    const newCity = new CityModel({
      city,
      stateId,
    });

    const savedCity = await newCity.save();

    logger.info(`City ${city} added successfully`);

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
const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { city, stateId } = req.body;

    logger.info(`Updating city with ID: ${id} to name: ${city}`);

    const updatedCity = await CityModel.findByIdAndUpdate(
      id,
      { city, stateId },
      { new: true }
    );

    if (!updatedCity) {
      logger.warn(`City with ID: ${id} not found`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.cityNotFound,
      });
    }

    logger.info(`Successfully updated city: ${updatedCity.city}`);

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

const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Deleting city with ID: ${id}`);

    const deletedCity = await CityModel.findByIdAndDelete(id);
    if (!deletedCity) {
      logger.warn(`City with ID: ${id} not found`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.cityNotFound,
      });
    }

    logger.info(`Successfully deleted city: ${deletedCity.city}`);
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

const getCity = async (req, res) => {
  try {
    logger.info("Fetching cities with state data...");

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

    logger.info(`Fetched ${citiesWithSrNo.length} cities successfully`);

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

const deleteMultipleCities = async (req, res) => {
  try {
    const { ids } = req.body;

    logger.info(`Deleting multiple cities with IDs: ${ids}`);

    const deletedCities = await CityModel.deleteMany({ _id: { $in: ids } });

    if (deletedCities.deletedCount === 0) {
      logger.warn("No cities found for deletion");
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.cityNotFound,
      });
    }

    logger.info(`Successfully deleted ${deletedCities.deletedCount} cities`);

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
      error: error.message,
    });
  }
};

module.exports = {
  cityRegister,
  getCity,
  updateCity,
  deleteCity,
  deleteMultipleCities,
};
