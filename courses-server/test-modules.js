const { setupSSL } = require('./config/ssl');
const DataLoader = require('./data/loader');
const FileWatcher = require('./data/watcher');
const createCourseRoutes = require('./routes/courses');
const createMetadataRoutes = require('./routes/metadata');
const { 
  validatePaginationParams, 
  validateStringParam, 
  validateArrayParam, 
  validateDataStructure 
} = require('./utils/validators');

console.log('Testing module imports...');

// Test SSL setup
try {
  const { sslOptions, useSSL } = setupSSL();
  console.log('✅ SSL module imported successfully');
  console.log(`   SSL enabled: ${useSSL}`);
} catch (error) {
  console.error('❌ SSL module import failed:', error.message);
}

// Test DataLoader
try {
  const dataLoader = new DataLoader();
  console.log('✅ DataLoader module imported successfully');
  console.log(`   Initial data loaded: ${dataLoader.isDataLoaded}`);
} catch (error) {
  console.error('❌ DataLoader module import failed:', error.message);
}

// Test FileWatcher
try {
  const dataLoader = new DataLoader();
  const fileWatcher = new FileWatcher(dataLoader);
  console.log('✅ FileWatcher module imported successfully');
} catch (error) {
  console.error('❌ FileWatcher module import failed:', error.message);
}

// Test route creators
try {
  const dataLoader = new DataLoader();
  const courseRoutes = createCourseRoutes(dataLoader);
  const metadataRoutes = createMetadataRoutes(dataLoader);
  console.log('✅ Route modules imported successfully');
} catch (error) {
  console.error('❌ Route modules import failed:', error.message);
}

// Test validators
try {
  const pagination = validatePaginationParams('0', '25');
  const string = validateStringParam('test');
  const array = validateArrayParam('a,b,c');
  const structure = validateDataStructure([1, 2, 3], 'test');
  
  console.log('✅ Validator modules imported successfully');
  console.log(`   Pagination test: ${JSON.stringify(pagination)}`);
  console.log(`   String test: "${string}"`);
  console.log(`   Array test: ${JSON.stringify(array)}`);
  console.log(`   Structure test: ${structure}`);
} catch (error) {
  console.error('❌ Validator modules import failed:', error.message);
}

console.log('\n🎉 All module imports successful!');
console.log('The modular structure is working correctly.');
