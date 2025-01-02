const formatAmount = (amount) => {
    // Convert to number in case it's a string
    amount = Number(amount);

    // If the amount is less than 1000, return it as is
    if (amount < 1000) {
        return amount.toString();
    }

    // Format the number with commas
    return amount.toLocaleString('en-IN');
};

module.exports = { formatAmount };
