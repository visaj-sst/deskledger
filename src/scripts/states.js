import StateModel from "../models/state.js";

const states = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttarakhand",
  "Uttar Pradesh",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

async function insertStates() {
  try {
    const existingStates = await StateModel.countDocuments();
    if (existingStates > 0) {
      console.log("States already exist, skipping seeding.");
      return;
    }

    const stateData = states.map((state) => ({ state }));
    await StateModel.insertMany(stateData);

    console.log("States seeded successfully.");
  } catch (err) {
    console.error("Error inserting states:", err.message);
  }
}

export default insertStates;
