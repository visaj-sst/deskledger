export function calculateTotalYears(startDate, maturityDate) {
  const start = new Date(startDate);
  const maturity = new Date(maturityDate);

  let years = maturity.getFullYear() - start.getFullYear();

  let months = maturity.getMonth() - start.getMonth();
  let days = maturity.getDate() - start.getDate();

  if (years > 0 && months > 0) {
    return `${years}y ${months}M`;
  } else if (years > 0) {
    return `${years}y`;
  } else if (months > 0) {
    return `${months}M`;
  } else {
    return "0M";
  }
}
