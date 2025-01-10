import StateModel from "../model/state.js";
import { statusCode, message } from "../../../../utils/api.response.js";
import logger from "../../../../service/logger.service.js";

//====================== ADD STATE  ======================//

export const stateRegister = async (req, res) => {
  try {
    const { state } = req.body;

    const stateExists = await StateModel.findOne({ state });
    if (stateExists) {
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.stateAlreadyExists,
      });
    }

    const newState = new StateModel({ state });

    const savedState = await newState.save();

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
    });
  }
};

//====================== UPDATE STATE  ======================//

export const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;

    const updatedState = await StateModel.findByIdAndUpdate(
      id,
      { state },
      { new: true }
    );

    if (!updatedState) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingState,
      });
    }

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
    });
  }
};

//====================== DELETE STATE  ======================//

export const deleteState = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedState = await StateModel.findByIdAndDelete(id);

    if (!deletedState) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingState,
      });
    }

    res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.stateDeleted });
  } catch (error) {
    logger.error(`Error while deleting state with ID ${id}: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorDeletingState,
    });
  }
};

//====================== VIEW STATE  ======================//

export const getState = async (req, res) => {
  try {
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

export const deleteMultipleStates = async (req, res) => {
  try {
    const { ids } = req.body;

    const deletedStates = await StateModel.deleteMany({ _id: { $in: ids } });

    if (deletedStates.deletedCount === 0) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.errorFetchingState,
      });
    }

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
    });
  }
};
