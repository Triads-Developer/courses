// Helper function to validate and sanitize pagination parameters
function validatePaginationParams(page, pageSize) {
  const validatedPage = parseInt(page);
  const validatedPageSize = parseInt(pageSize);
  
  return {
    page: isNaN(validatedPage) || validatedPage < 0 ? 0 : validatedPage,
    pageSize: isNaN(validatedPageSize) || validatedPageSize < 1 || validatedPageSize > 1000 ? 25 : validatedPageSize
  };
}

// Helper function to validate and sanitize string parameters
function validateStringParam(value, maxLength = 500) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

// Helper function to validate and sanitize array parameters
function validateArrayParam(value, maxItems = 50) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',')
    .slice(0, maxItems)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

// Helper function to validate data structure
function validateDataStructure(data, dataName) {
  if (!Array.isArray(data)) {
    console.error(`${dataName} is not an array`);
    return false;
  }
  return true;
}

module.exports = {
  validatePaginationParams,
  validateStringParam,
  validateArrayParam,
  validateDataStructure
};
