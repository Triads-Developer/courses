const search = require('./search.js');

console.log('Testing search function import...');

// Test data
const testData = [
  {
    'Course Subject Abbreviation': 'CS',
    'Course Number': '101',
    'Section Number': '001',
    'Days': 'MWF',
    'Course Level': 'Undergraduate',
    'Academic Requirement': 'Core',
    'Start Time': '9:00 AM',
    'Program of Study': 'Computer Science',
    'Description': 'Introduction to programming',
    'Section': 'CS 101 - Introduction to Programming',
    'iqAttributes': ['Programming', 'Logic']
  }
];

// Test filters
const filters = {
  days: ['MWF'],
  levels: ['Undergraduate'],
  searchTerms: 'CS',
  department: 'Computer',
  description: 'programming',
  iqAttributes: ['Programming'],
  academicRequirements: ['Core'],
  startTimes: ['9:00 AM']
};

try {
  const result = search(testData, filters);
  console.log('✅ Search function works correctly');
  console.log('Result:', result);
} catch (error) {
  console.error('❌ Search function error:', error);
}
