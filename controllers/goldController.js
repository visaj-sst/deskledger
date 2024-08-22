const GoldModel = require('../models/goldModel');
const GoldMasterModel = require('../models/goldMaster');
const { message, statusCode } = require('../utils/api.response');

// Create a new gold record
exports.createGoldRecord = async (req, res) => {
    try {
        const { firstName, lastName, goldWeight, goldPurchasePrice, formOfGold, purityOfGold } = req.body;
        const userId = req.user.id; // Get the user ID from the authenticated request

        // Fetch the latest gold master data
        const goldMaster = await GoldMasterModel.findOne().sort({ createdAt: -1 });

        if (!goldMaster) {
            return res.status(statusCode.BAD_REQUEST).json({ message: message.goldRegisterError });
        }

        // Destructure values from goldMaster
        const { goldRate22KPerGram, goldRate24KPerGram, gst, makingChargesPerGram } = goldMaster;

        // Determine the gold rate based on purity
        const goldCurrentPricePerGram = purityOfGold === 22 ? goldRate22KPerGram : goldRate24KPerGram;

        // Perform calculations using provided making charges
        const goldCurrentValue = goldCurrentPricePerGram * goldWeight;
        const calculatedMakingCharges = (goldCurrentPricePerGram * goldWeight) * (makingChargesPerGram / 100);
        const totalGoldPrice = calculatedMakingCharges + goldCurrentValue;
        const calculatedGst = (gst / 100) * totalGoldPrice;
        let totalReturnAmount = totalGoldPrice + calculatedGst;
        let profit = totalReturnAmount - goldPurchasePrice;

        // Round the values to remove decimal places
        totalReturnAmount = Math.round(totalReturnAmount);
        profit = Math.round(profit);

        // Create a new gold record
        const newGoldRecord = new GoldModel({
            firstName,
            lastName,
            goldWeight,
            goldPurchasePrice,
            formOfGold,
            purityOfGold,
            totalReturnAmount,
            profit,
            userId // Associate the gold record with the authenticated user
        });

        // Save the new record to the database
        const saveGoldInfo = await newGoldRecord.save();

        return res.status(statusCode.CREATED).json({ message: message.goldInfoRegister, data: saveGoldInfo });

    } catch (error) {
        console.error(error);
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({ message: message.internalError });
    }
};

// Get all gold records for the authenticated user
exports.getAllGoldRecords = async (req, res) => {
    try {
        const userId = req.user.id; // Get the user ID from the authenticated request
        const goldRecords = await GoldModel.find({ userId }); // Fetch records for this user

        // Add srNo to each record
        const goldRecordsWithSrNo = goldRecords.map((record, index) => {
            const recordObj = record.toObject(); // Convert Mongoose document to plain object
            return {
                ...recordObj,
                srNo: index + 1 // Add srNo starting from 1
            };
        });

        return res.status(200).json({ message: "Gold records fetched successfully", data: goldRecordsWithSrNo });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// Get a single gold record by ID
exports.getGoldRecordById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id; // Get the user ID from the authenticated request
        const goldRecord = await GoldModel.findOne({ _id: id, userId }); // Ensure the record belongs to the user

        if (!goldRecord) {
            return res.status(statusCode.NOT_FOUND).json({ message: message.goldNotFound });
        }

        return res.status(statusCode.OK).json({ message: message.goldRecords, data: goldRecord });
    } catch (error) {
        console.error(error);
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({ message: message.internalError });
    }
};

// Update a gold record
exports.updateGoldRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, goldWeight, goldPurchasePrice, formOfGold, purityOfGold } = req.body;
        const userId = req.user.id;

        let goldCurrentPricePerGram, totalReturnAmount, profit;

        // Fetch the existing gold record to get existing values if not provided in the request
        const existingGoldRecord = await GoldModel.findOne({ _id: id, userId });

        if (!existingGoldRecord) {
            return res.status(404).json({ message: "Gold record not found" });
        }

        // Use existing values if not provided in the request body
        const updatedGoldWeight = goldWeight || existingGoldRecord.goldWeight;
        const updatedGoldPurchasePrice = goldPurchasePrice || existingGoldRecord.goldPurchasePrice;
        const updatedPurityOfGold = purityOfGold || existingGoldRecord.purityOfGold;

        // Fetch the latest gold master data if purityOfGold or calculations are needed
        if (updatedPurityOfGold) {
            const goldMaster = await GoldMasterModel.findOne().sort({ createdAt: -1 });

            if (!goldMaster) {
                return res.status(400).json({ message: "Unable to fetch gold master data" });
            }

            const { goldRate22KPerGram, goldRate24KPerGram, gst, makingChargesPerGram } = goldMaster;

            // Validate purityOfGold
            if (![22, 24].includes(updatedPurityOfGold)) {
                return res.status(400).json({ message: "Invalid purity of gold" });
            }

            goldCurrentPricePerGram = updatedPurityOfGold === 22 ? goldRate22KPerGram : goldRate24KPerGram;

            // Perform calculations if necessary values are available
            if (updatedGoldWeight && updatedGoldPurchasePrice) {
                const goldCurrentValue = goldCurrentPricePerGram * updatedGoldWeight;
                const calculatedMakingCharges = goldCurrentValue * (makingChargesPerGram / 100);
                const totalGoldPrice = calculatedMakingCharges + goldCurrentValue;
                const calculatedGst = (gst / 100) * totalGoldPrice;
                totalReturnAmount = Math.round(totalGoldPrice + calculatedGst);
                profit = Math.round(totalReturnAmount - updatedGoldPurchasePrice);
            }
        }

        // Update the gold record, ensuring it belongs to the authenticated user
        const updatedGoldRecord = await GoldModel.findOneAndUpdate(
            { _id: id, userId },
            {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(goldWeight && { goldWeight: updatedGoldWeight }),
                ...(goldPurchasePrice && { goldPurchasePrice: updatedGoldPurchasePrice }),
                ...(formOfGold && { formOfGold }),
                ...(purityOfGold && { purityOfGold: updatedPurityOfGold }),
                ...(totalReturnAmount && { totalReturnAmount }),
                ...(profit && { profit }),
            },
            { new: true }
        );

        if (!updatedGoldRecord) {
            return res.status(404).json({ message: "Gold record not found" });
        }

        return res.status(200).json({ message: "Gold information updated", data: updatedGoldRecord });
    } catch (error) {
        console.error("Error updating gold record:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// Delete a gold record
exports.deleteGoldRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id; // Get the user ID from the authenticated request

        // Ensure the gold record belongs to the authenticated user
        const deletedGoldRecord = await GoldModel.findOneAndDelete({ _id: id, userId });

        if (!deletedGoldRecord) {
            return res.status(statusCode.NOT_FOUND).json({ message: message.goldNotFound });
        }

        return res.status(statusCode.OK).json({ message: message.goldInfoDelete });
    } catch (error) {
        console.error(error);
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({ message: message.internalError });
    }
};
