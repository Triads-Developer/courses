const express = require('express');
const router = express.Router();
const { validateDataStructure } = require('../utils/validators');

function createMetadataRoutes(dataLoader) {
  // Get all unique program of study
  router.get('/programs', (req, res) => {
    try {
      const { uniqueProgramsOfStudy } = dataLoader.getData();
      
      if (!validateDataStructure(uniqueProgramsOfStudy, 'uniqueProgramsOfStudy')) {
        return res.status(500).json({ error: 'Programs data not available' });
      }
      res.json({ programsOfStudy: uniqueProgramsOfStudy });
    } catch (error) {
      console.error('Error in /api/courses/programs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/academic-requirements', (req, res) => {
    try {
      const { uniqueAcademicRequirements } = dataLoader.getData();
      
      if (!validateDataStructure(uniqueAcademicRequirements, 'uniqueAcademicRequirements')) {
        return res.status(500).json({ error: 'Academic requirements data not available' });
      }
      res.json({ academicRequirements: uniqueAcademicRequirements });
    } catch (error) {
      console.error('Error in /api/courses/academic-requirements:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/start-times', (req, res) => {
    try {
      const { uniqueStartTimes } = dataLoader.getData();
      
      if (!validateDataStructure(uniqueStartTimes, 'uniqueStartTimes')) {
        return res.status(500).json({ error: 'Start times data not available' });
      }
      res.json({ startTimes: uniqueStartTimes });
    } catch (error) {
      console.error('Error in /api/courses/start-times:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/semesters', (req, res) => {
    try {
      const { uniqueAcademicPeriods } = dataLoader.getData();
      
      if (!validateDataStructure(uniqueAcademicPeriods, 'uniqueAcademicPeriods')) {
        return res.status(500).json({ error: 'Academic Periods data not available' });
      }
      
      res.json({ 
        semesters: uniqueAcademicPeriods
      });
    } catch (error) {
      console.error('Error in /api/courses/semesters:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get unique IQ Attributes for filtering
  router.get('/iq-attributes', (req, res) => {
    try {
      const { isDataLoaded, uniqueCourseData } = dataLoader.getData();
      
      if (!isDataLoaded) {
        return res.status(503).json({ error: 'Data is still loading' });
      }

      // Validate uniqueCourseData
      if (!validateDataStructure(uniqueCourseData, 'uniqueCourseData')) {
        return res.status(500).json({ error: 'Data format error' });
      }

      const allIQAttributes = new Set();
      uniqueCourseData.forEach(course => {
        try {
          if (course && typeof course === 'object' && course.iqAttributes && Array.isArray(course.iqAttributes)) {
            course.iqAttributes.forEach(attr => {
              if (attr && typeof attr === 'string' && attr.trim()) {
                allIQAttributes.add(attr.trim());
              }
            });
          }
        } catch (error) {
          console.error('Error processing course IQ attributes:', error);
          // Continue processing other courses
        }
      });

      res.json({ 
        iqAttributes: Array.from(allIQAttributes).sort() 
      });
    } catch (error) {
      console.error('Error in /api/courses/iq-attributes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get unique Course Section Owning AU (Departments) for filtering
  router.get('/departments', (req, res) => {
    try {
      const { isDataLoaded, courseData } = dataLoader.getData();
      
      if (!isDataLoaded) {
        return res.status(503).json({ error: 'Data is still loading' });
      }

      // Validate courseData
      if (!validateDataStructure(courseData, 'courseData')) {
        return res.status(500).json({ error: 'Data format error' });
      }

      const allDepartments = new Set();
      courseData.forEach(course => {
        try {
          if (course && typeof course === 'object' && course['Course Section Owning AU']) {
            const department = course['Course Section Owning AU'].trim();
            if (department && department.length > 0) {
              allDepartments.add(department);
            }
          }
        } catch (error) {
          console.error('Error processing course department:', error);
          // Continue processing other courses
        }
      });

      res.json({ 
        departments: Array.from(allDepartments).sort() 
      });
    } catch (error) {
      console.error('Error in /api/courses/departments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/health', (req, res) => {
    try {
      const { isDataLoaded, courseData } = dataLoader.getData();
      
      res.json({ 
        status: 'ok',
        dataLoaded: isDataLoaded,
        totalRecords: Array.isArray(courseData) ? courseData.length : 0
      });
    } catch (error) {
      console.error('Error in /api/courses/health:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = createMetadataRoutes;
