export const formatAmount = (amount) => {
  amount = Number(amount);

  if (amount < 1000) {
    return amount.toString();
  }

  return amount.toLocaleString("en-IN");
};
