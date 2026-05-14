/**
 * Function to generate a unique enrollment ID
 * @returns {string} A unique enrollment ID
 */
function generateEnrollmentID() {
  // Timestamp + Random suffix for uniqueness in tight loops
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ENR${timestamp}${random}`;
}

module.exports = {
  generateEnrollmentID,
};
