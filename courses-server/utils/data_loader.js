const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const MiniSearch = require('minisearch');

class DataLoader {
  constructor() {
    this.courseData = []; // Larger dataset with all courses
    this.uniqueCourseData = []; // Smaller dataset with duplicates removed based on commonId
    this.descriptionIndex = null; // MiniSearch index over uniqueCourseData, built once per load
    this.isDataLoaded = false;
    this.uniqueProgramsOfStudy = [];
    this.uniqueAcademicRequirements = [];
    this.uniqueStartTimes = [];
    this.uniqueAcademicPeriods = [];
    this.loadPromise = null; // In-flight loadCourseData(), shared by concurrent callers
  }

  // Function to generate a unique ID for a course row. Must include Academic
  // Requirement and the meeting pattern: a section is listed once per requirement
  // it satisfies (and once per meeting time), and dropping any of those rows hides
  // the section from that requirement's search. Results are collapsed to one row
  // per section after filtering instead (see collapseToOneRowPerSection in search.js).
  generateCourseId(row) {
    return `${row['Program of Study']}-${row['Course Subject Abbreviation']}-${row['Course Number']}-${row['Section Number']}-${row['Academic Period'] || ''}-${row['Academic Requirement']}-${row['Days']}-${row['Start Time']}-${row['End Time']}`;
  }

  generateCommonID(row) {
    return `${row['Course Subject Abbreviation']}-${row['Course Number']}-${row['Section Number']}`;
  }

  removeDuplicatesByCommonId(data) {
    const uniqueKeys = new Set();
    return data.filter(row => {
      if (!uniqueKeys.has(row['commonID'])) {
        uniqueKeys.add(row['commonID']);
        return true;
      } 
      return false;
    });
  }

  // Function to parse IQ Attributes from string to array
  parseIQAttributes(iqAttributesString) {
    if (!iqAttributesString || iqAttributesString.trim() === '') {
      return [];
    }
    // Split by comma and trim whitespace, filter out empty strings
    return iqAttributesString.split(',').map(attr => attr.trim()).filter(attr => attr.length > 0);
  }

  // Function to parse Integration Attributes from string to array
  // Note: Integration Attributes are complete values, not comma-separated lists
  // Each value is a full integration attribute specification (e.g., "ArtSci Integration – IQ, Life and Physical Sciences, NSM")
  parseIntegrationAttributes(integrationAttributesString) {
    if (!integrationAttributesString || integrationAttributesString.trim() === '') {
      return [];
    }
    // Return the complete value as a single-item array (not split by comma)
    return [integrationAttributesString.trim()];
  }

  // Function to sort time strings properly (AM first, then PM, each group sorted numerically)
  sortTimeStrings(times) {
    return times.sort((a, b) => {
      // Extract AM/PM from both times
      const aIsPM = a.includes('PM');
      const bIsPM = b.includes('PM');
      
      // AM comes before PM
      if (aIsPM && !bIsPM) return 1;
      if (!aIsPM && bIsPM) return -1;
      
      // Both are same period (AM or PM), sort numerically
      const aTime = a.replace(/\s*(AM|PM)/, '');
      const bTime = b.replace(/\s*(AM|PM)/, '');
      
      // Convert to minutes for proper numerical comparison
      const aMinutes = this.convertTimeToMinutes(aTime);
      const bMinutes = this.convertTimeToMinutes(bTime);
      
      return aMinutes - bMinutes;
    });
  }

  // Helper function to convert time string to minutes
  convertTimeToMinutes(timeStr) {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let totalMinutes = hours * 60 + minutes;
    
    // Convert to 24-hour format for proper sorting
    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes = minutes; // 12:00 AM = 0:00
    }
    
    return totalMinutes;
  }

  // Function to load and parse CSV data. Concurrent callers (file watcher, manual
  // /reload) share the one load already in progress rather than each building a
  // full copy of the data side by side -- that's what blew the heap on reload.
  loadCourseData() {
    if (!this.loadPromise) {
      this.loadPromise = this.readCourseData().finally(() => {
        this.loadPromise = null;
      });
    }
    return this.loadPromise;
  }

  readCourseData() {
    // Release the previous load before parsing the new one, so a reload peaks at
    // one copy of the data instead of two. Routes already answer 503 while
    // isDataLoaded is false, so the old copy wasn't being served anyway. The small
    // dropdown lists (uniqueProgramsOfStudy etc.) are kept so the UI stays usable.
    this.isDataLoaded = false;
    this.courseData = [];
    this.uniqueCourseData = [];
    this.descriptionIndex = null;

    return new Promise((resolve, reject) => {
      const data = [];
      const uniqueKeys = new Set(); // Track unique combinations
      const uniquePrograms = [];
      const uniqueRequirements = [];
      const startTimes = [];
      const academicPeriods = [];
      let duplicateCount = 0;

      // The CSV repeats each section once per Program of Study / Academic
      // Requirement, so most cell values are repeats -- Description alone is over
      // half the file's text. The parser hands back a fresh string for every cell;
      // map each value to one shared copy so repeats cost a pointer, not the text.
      const strings = new Map();
      const intern = value => {
        const existing = strings.get(value);
        if (existing !== undefined) return existing;
        strings.set(value, value);
        return value;
      };

      fs.createReadStream(path.join(__dirname, '../data/data.csv'))
        .pipe(csv.parse({ headers: true }))
        .on('error', error => reject(error))
        .on('data', parsedRow => {
          const row = {};
          for (const key in parsedRow) row[key] = intern(parsedRow[key]);

          // Generate unique ID
          const courseId = this.generateCourseId(row);
          const commonID = this.generateCommonID(row);

          // Parse IQ Attributes
          const iqAttributes = this.parseIQAttributes(row['IQ Attributes']);

          // Parse Integration Attributes
          const integrationAttributes = this.parseIntegrationAttributes(row['Integration Attribute']);

          // Add program of study to uniqueProgramOfStudy if it's not already in the array
          if (!uniquePrograms.includes(row['Program of Study'])) {
            uniquePrograms.push(row['Program of Study']);
          }

          // Add academic requirements to uniqueAcademicRequirements if it's not already in the array
          if (!uniqueRequirements.includes(row['Academic Requirement'])) {
            uniqueRequirements.push(row['Academic Requirement']);
          }

          // Add start times to uniqueStartTimes if it's not already in the array
          if (!startTimes.includes(row['Start Time'])) {
            startTimes.push(row['Start Time']);
          }

          // Add academic periods to uniqueAcademicPeriods if it's not already in the array
          // Only if Academic Period column exists and has a value
          if (row['Academic Period'] && !academicPeriods.includes(row['Academic Period'])) {
            academicPeriods.push(row['Academic Period']);
          }

          // Only add if we haven't seen this combination before
          if (!uniqueKeys.has(courseId)) {
            uniqueKeys.add(courseId);
            data.push({
              ...row,
              id: courseId,
              commonID: commonID,
              iqAttributes: iqAttributes, // Add parsed IQ Attributes as an array
              integrationAttributes: integrationAttributes // Add parsed Integration Attributes as an array
            });
          } else {
            duplicateCount++;
          }
        })
        .on('end', () => {  
          this.courseData = data; // Store the larger dataset
          this.uniqueCourseData = this.removeDuplicatesByCommonId(data); // Create smaller dataset

          // Build the Description search index once per load, over the deduplicated
          // set only -- courseData repeats the same Description text once per Program
          // of Study/Academic Requirement a section satisfies, so indexing it directly
          // would tokenize the same text dozens of times over for no benefit.
          this.descriptionIndex = new MiniSearch({
            idField: 'commonID',
            fields: ['Description']
          });
          this.descriptionIndex.addAll(this.uniqueCourseData);

          this.uniqueProgramsOfStudy = uniquePrograms.sort();
          this.uniqueAcademicRequirements = uniqueRequirements.sort();
          this.uniqueStartTimes = this.sortTimeStrings(startTimes); // Sort times
          this.uniqueAcademicPeriods = academicPeriods.sort();
          this.isDataLoaded = true;
          console.log(`Loaded ${data.length} total courses (${duplicateCount} duplicates filtered out)`);
          console.log(`Unique courses (by commonId): ${this.uniqueCourseData.length}`);
          resolve();
        });
    });
  }

  // Getter methods for accessing data
  getData() {
    return {
      courseData: this.courseData,
      uniqueCourseData: this.uniqueCourseData,
      descriptionIndex: this.descriptionIndex,
      isDataLoaded: this.isDataLoaded,
      uniqueProgramsOfStudy: this.uniqueProgramsOfStudy,
      uniqueAcademicRequirements: this.uniqueAcademicRequirements,
      uniqueStartTimes: this.uniqueStartTimes,
      uniqueAcademicPeriods: this.uniqueAcademicPeriods
    };
  }
}

module.exports = DataLoader;
