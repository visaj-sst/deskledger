const StateModel = require("../model/state");
const { statusCode, message } = require("../../../../utils/api.response.js");
const logger = require("../../../../service/logger.service.js");

//====================== ADD STATE  ======================//

const stateRegister = async (req, res) => {
  try {
    const { state } = req.body;

    logger.info(`Attempting to register new state: ${state}`);

    const stateExists = await StateModel.findOne({ state });
    if (stateExists) {
      logger.warn(`State already exists: ${state}`);
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.stateAlreadyExists,
      });
    }

    const newState = new StateModel({ state });

    const savedState = await newState.save();

    logger.info(`State registered successfully: ${state}`);
    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.stateCreated,
      data: savedState,
    });
  } catch (error) {
    logger.error(`Error while creating state: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorCreatingState,
      error: error.message,
    });
  }
};

//====================== UPDATE STATE  ======================//

const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;

    logger.info(`Attempting to update state with ID: ${id}`);

    const updatedState = await StateModel.findByIdAndUpdate(
      id,
      { state },
      { new: true }
    );

    if (!updatedState) {
      logger.warn(`No state found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingState,
      });
    }

    logger.info(`State updated successfully: ${state}`);
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.stateUpdated,
      data: updatedState,
    });
  } catch (error) {
    logger.error(`Error while updating state with ID ${id}: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUpdatingState,
      error: error.message,
    });
  }
};

//====================== DELETE STATE  ======================//

const deleteState = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Attempting to delete state with ID: ${id}`);

    const deletedState = await StateModel.findByIdAndDelete(id);

    if (!deletedState) {
      logger.warn(`No state found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingState,
      });
    }

    logger.info(`State deleted successfully with ID: ${id}`);
    res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.stateDeleted });
  } catch (error) {
    logger.error(`Error while deleting state with ID ${id}: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingState,
      error: error.message,
    });
  }
};

//====================== VIEW STATE  ======================//

const getState = async (req, res) => {
  try {
    logger.info("Attempting to fetch all states");

    const states = await StateModel.find();

    if (states.length == 0) {
      res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.statesView,
        data: statesWithSrNo,
      });
    }

    const statesWithSrNo = states.map((state, index) => ({
      srNo: index + 1,
      ...state.toObject(),
    }));

    logger.info(`Successfully fetched ${statesWithSrNo.length} states`);
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.statesView,
      data: statesWithSrNo,
    });
  } catch (error) {
    logger.error(`Error while fetching states: ${error}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingStates || "Error fetching states",
      error: error.message || error,
    });
  }
};

//====================== DELETE MULTIPLE STATES  ======================//

const deleteMultipleStates = async (req, res) => {
  try {
    const { ids } = req.body;

    logger.info(`Attempting to delete multiple states with IDs: ${ids}`);

    const deletedStates = await StateModel.deleteMany({ _id: { $in: ids } });

    if (deletedStates.deletedCount === 0) {
      logger.warn("No states found to delete");
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingState,
      });
    }

    logger.info(`${deletedStates.deletedCount} states deleted successfully`);
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.statesDeleted,
      deletedCount: deletedStates.deletedCount,
    });
  } catch (error) {
    logger.error(`Error while deleting states: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingState,
      error: error.message,
    });
  }
};

module.exports = {
  stateRegister,
  getState,
  updateState,
  deleteState,
  deleteMultipleStates,
};
