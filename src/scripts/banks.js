import BankModel from '../models/bank.js'; // Adjust the path

const indianBanks = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Yes Bank",
  "Union Bank of India",
  "Canara Bank",
  "IDFC First Bank",
  "Federal Bank",
  "Bank of India",
  "Central Bank of India",
  "Indian Bank",
  "Indian Overseas Bank",
  "UCO Bank",
  "Punjab & Sind Bank",
  "Bank of Maharashtra",
  "RBL Bank",
  "Dhanlaxmi Bank",
  "South Indian Bank",
  "Karur Vysya Bank",
  "Tamilnad Mercantile Bank",
  "City Union Bank",
  "Lakshmi Vilas Bank",
  "IDBI Bank",
  "Jammu & Kashmir Bank",
  "Karnataka Bank",
  "Suryoday Small Finance Bank",
  "Utkarsh Small Finance Bank",
  "AU Small Finance Bank",
  "Equitas Small Finance Bank",
  "Ujjivan Small Finance Bank",
  "ESAF Small Finance Bank",
  "North East Small Finance Bank",
  "Bandhan Bank",
  "Fincare Small Finance Bank",
  "Jana Small Finance Bank",
];

async function insertIndianBanks() {
  try {
    const existingBanks = await BankModel.countDocuments();
    if (existingBanks > 0) {
      console.log("Bank data already exists, skipping seeding.");
      return;
    }

    const bankDataArray = indianBanks.map((bank) => ({ bankName: bank }));
    await BankModel.insertMany(bankDataArray);

    console.log("Bank data seeded successfully.");
  } catch (err) {
    console.error("Error inserting bank data:", err.message);
  }
}

export default insertIndianBanks;
