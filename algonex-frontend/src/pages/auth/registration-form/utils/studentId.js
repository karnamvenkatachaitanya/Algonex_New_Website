/**
 * Generates a unique student ID in the same format as the backend:
 * ALG + YYYYMMDD + 4 random digits
 * Example: ALG202606121234
 */
export function generateStudentId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  let randDigits = '';
  for (let i = 0; i < 4; i++) {
    randDigits += Math.floor(Math.random() * 10);
  }

  return `ALG${dateStr}${randDigits}`;
}
