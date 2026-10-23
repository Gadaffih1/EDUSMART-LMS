export function calculateKenyanPayrollDeductions(grossPay: number) {
  const nssf = 2160;
  const housingLevy = Math.round(grossPay * 0.015);
  const nhifShif = Math.round(grossPay * 0.0275);

  const taxablePay = grossPay - nssf;
  let tax = 0;
  if (taxablePay <= 24000) {
    tax = taxablePay * 0.10;
  } else if (taxablePay <= 32333) {
    tax = (24000 * 0.10) + ((taxablePay - 24000) * 0.25);
  } else if (taxablePay <= 500000) {
    tax = (24000 * 0.10) + (8333 * 0.25) + ((taxablePay - 32333) * 0.30);
  } else {
    tax = (24000 * 0.10) + (8333 * 0.25) + (467667 * 0.30) + ((taxablePay - 500000) * 0.325);
  }
  const personalRelief = 2400;
  const paye = Math.max(0, Math.round(tax - personalRelief));
  const totalDeductions = paye + nssf + nhifShif + housingLevy;

  return {
    paye,
    nssf,
    nhifShif,
    housingLevy,
    totalDeductions,
    netPay: grossPay - totalDeductions,
  };
}
