import fs from "fs/promises";
import AreaPriceModel from "../modules/admin/area-price/model/areaPrice.js";
import CityModel from "../modules/admin/city/model/city.js";
import StateModel from "../modules/admin/state/model/state.js";
import logger from "../service/logger.service.js";
import { startScraping } from "./area-price-pp.js";

export const loadScrapedDataToDB = async () => {
  try {
    logger.info("Checking if areaPrices collection is empty...");

    const existingRecords = await AreaPriceModel.countDocuments();
    if (existingRecords > 0) {
      logger.info(
        "areaPrices collection already has data. Skipping data load."
      );
      return;
    }

    let rawData;
    try {
      await fs.access("scraped_data.json");
      logger.info("Found scraped_data.json. Loading data...");
      rawData = await fs.readFile("scraped_data.json", "utf-8");
    } catch (error) {
      logger.warn("scraped_data.json not found. Starting data scraping...");
      await startScraping();
      rawData = await fs.readFile("scraped_data.json", "utf-8");
      logger.info("Scraping completed and data loaded from JSON file.");
    }

    const data = JSON.parse(rawData);
    logger.info(`Parsed data: ${data.length} records found.`);

    const bulkOps = [];

    for (const item of data) {
      const state = await StateModel.findOneAndUpdate(
        { state: item.stateName },
        { state: item.stateName },
        { new: true, upsert: true }
      );

      const city = await CityModel.findOneAndUpdate(
        { city: item.cityName, stateId: state._id },
        { city: item.cityName, stateId: state._id },
        { new: true, upsert: true }
      );

      const existingAreaPrice = await AreaPriceModel.findOne({
        cityId: city._id,
        stateId: state._id,
        areaName: item.areaName,
      });

      if (!existingAreaPrice) {
        bulkOps.push({
          updateOne: {
            filter: {
              cityId: city._id,
              stateId: state._id,
              areaName: item.areaName,
            },
            update: { $set: { pricePerSquareFoot: item.pricePerSquareFoot } },
            upsert: true,
          },
        });
      }
    }

    if (bulkOps.length) {
      await AreaPriceModel.bulkWrite(bulkOps);
      logger.info(
        `Successfully loaded ${bulkOps.length} new records into the database.`
      );
    } else {
      logger.info("No new data to load into the database.");
    }
  } catch (error) {
    logger.error(`Error loading data to the database: ${error.message}`);
    throw error;
  }
};
