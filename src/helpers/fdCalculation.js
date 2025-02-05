import { calculateTotalYears } from "../helpers/calculateYears.js";

export const calculateManualReturns = (
  startDate,
  maturityDate,
  totalInvestedAmount,
  interestRate
) => {
  const start = new Date(startDate);
  const maturity = new Date(maturityDate);
  const current = new Date();

  const msInYear = 1000 * 60 * 60 * 24 * 365;

  const tenureInYears = (maturity - start) / msInYear;
  const tenureCompletedYears = Math.min(
    (current - start) / msInYear,
    tenureInYears
  );

  const interestForCompletedYears =
    (totalInvestedAmount * interestRate * tenureCompletedYears) / 100;

  const interestForFullTenure =
    (totalInvestedAmount * interestRate * tenureInYears) / 100;

  const roundedInterestForCompletedYears = Math.trunc(
    interestForCompletedYears
  );
  const roundedInterestForFullTenure = Math.trunc(interestForFullTenure);

  const currentReturnAmount =
    totalInvestedAmount + roundedInterestForCompletedYears;

  const totalReturnedAmount =
    totalInvestedAmount +
    roundedInterestForFullTenure -
    ((totalInvestedAmount + roundedInterestForFullTenure) % 75);

  const currentProfitAmount = currentReturnAmount - totalInvestedAmount;

  const totalYears = calculateTotalYears(startDate, maturityDate);

  return {
    tenureInYears: Math.ceil(tenureInYears),
    tenureCompletedYears: Math.floor(tenureCompletedYears),
    currentReturnAmount,
    totalReturnedAmount,
    currentProfitAmount,
    totalYears,
  };
};
