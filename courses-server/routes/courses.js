const express = require('express');
const router = express.Router();
const search = require('../search.js');
const { 
  validatePaginationParams, 
  validateStringParam, 
  validateArrayParam, 
  validateDataStructure 
} = require('../utils/validators');

function createCourseRoutes(dataLoader) {
  // GET /api/courses/courses - Main course search endpoint
  router.get('/courses', async (req, res) => {
    try {
      const { page = 0, pageSize = 25, searchTerms = '', days = '', levels = '', department = '', description = '', academicRequirements = '', iqAttributes = '', startTimes = '', semesters = '', courseSectionOwningAU = '' } = req.query;

      // Validate and sanitize parameters
      const { page: validatedPage, pageSize: validatedPageSize } = validatePaginationParams(page, pageSize);
      const validatedSearchTerms = validateStringParam(searchTerms);
      const validatedDays = validateArrayParam(days);
      const validatedLevels = validateArrayParam(levels);
      const validatedDepartment = validateStringParam(department);
      const validatedDescription = validateStringParam(description);
      const validatedAcademicRequirements = validateArrayParam(academicRequirements);
      const validatedIqAttributes = validateArrayParam(iqAttributes);
      const validatedStartTimes = validateArrayParam(startTimes);
      const validatedSemesters = validateArrayParam(semesters);
      const validatedCourseSectionOwningAU = validateArrayParam(courseSectionOwningAU);

      // Get data from loader
      const { courseData, isDataLoaded } = dataLoader.getData();
      
      if (!validateDataStructure(courseData, 'courseData')) {
        return res.status(500).json({ error: 'Course data not available' });
      }

      if (!isDataLoaded) {
        return res.status(503).json({ error: 'Data is still loading' });
      }

      // Apply filters
      const filters = {
        days: validatedDays,
        levels: validatedLevels,
        academicRequirements: validatedAcademicRequirements,
        startTimes: validatedStartTimes,
        iqAttributes: validatedIqAttributes,
        semesters: validatedSemesters,
        courseSectionOwningAU: validatedCourseSectionOwningAU
      };

      // Combine all filters into a single object for the search function
      const searchFilters = {
        ...filters,
        searchTerms: validatedSearchTerms,
        department: validatedDepartment,
        description: validatedDescription
      };
      
      let filteredData = search(courseData, searchFilters);

      // Apply pagination
      const startIndex = validatedPage * validatedPageSize;
      const endIndex = startIndex + validatedPageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      res.json({
        data: paginatedData,
        total: filteredData.length,
        page: validatedPage,
        pageSize: validatedPageSize,
        totalPages: Math.ceil(filteredData.length / validatedPageSize)
      });

    } catch (error) {
      console.error('Error in /courses endpoint:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/courses/section/:sectionNumber - Get courses by section number
  router.get('/section/:sectionNumber', async (req, res) => {
    try {
      const { page = 0, pageSize = 25 } = req.query;
      const sectionNumber = req.params.sectionNumber;

      // Validate and sanitize parameters
      const { page: validatedPage, pageSize: validatedPageSize } = validatePaginationParams(page, pageSize);
      const validatedSectionNumber = validateStringParam(sectionNumber);

      if (!validatedSectionNumber) {
        return res.status(400).json({ error: 'Invalid section number' });
      }

      // Get data from loader
      const { courseData, isDataLoaded } = dataLoader.getData();
      
      if (!validateDataStructure(courseData, 'courseData')) {
        return res.status(500).json({ error: 'Course data not available' });
      }

      if (!isDataLoaded) {
        return res.status(503).json({ error: 'Data is still loading' });
      }

      // Filter by section number
      const filteredData = courseData.filter(course => 
        course['Section Number'] && course['Section Number'].toString() === validatedSectionNumber
      );

      // Apply pagination
      const startIndex = validatedPage * validatedPageSize;
      const endIndex = startIndex + validatedPageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      res.json({
        data: paginatedData,
        total: filteredData.length,
        page: validatedPage,
        pageSize: validatedPageSize,
        totalPages: Math.ceil(filteredData.length / validatedPageSize)
      });

    } catch (error) {
      console.error('Error in /section endpoint:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/courses/reload - Manual data reload endpoint
  router.post('/reload', async (req, res) => {
    try {
      console.log('Manual data reload requested');
      
      // Reload the data
      await dataLoader.loadCourseData();
      
      res.json({ 
        message: 'Data reloaded successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in manual reload:', error);
      res.status(500).json({ error: 'Failed to reload data' });
    }
  });

  return router;
}

module.exports = createCourseRoutes;
