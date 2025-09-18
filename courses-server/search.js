const Fuse = require('fuse.js');

function search(data, filters) {
  // Validate input parameters
  if (!data || !Array.isArray(data)) {
    console.error('search: Invalid data parameter - expected array');
    return [];
  }

  if (!filters || typeof filters !== 'object') {
    console.error('search: Invalid filters parameter - expected object');
    return data; // Return all data if no valid filters
  }

  const { days, levels, searchTerms, department, description, iqAttributes, academicRequirements, startTimes, semesters, courseSectionOwningAU } = filters;
  let filteredData = data;

  try {
    // Apply exact filters with defensive checks
    if (days && Array.isArray(days) && days.length > 0) {
      filteredData = filteredData.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const itemDays = item.Days;
        return itemDays !== undefined && itemDays !== null && days.includes(itemDays);
      });
    }

    if (levels && Array.isArray(levels) && levels.length > 0) {
      filteredData = filteredData.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const itemLevel = item['Course Level'];
        return itemLevel !== undefined && itemLevel !== null && levels.includes(itemLevel);
      });
    }

    if (academicRequirements && Array.isArray(academicRequirements) && academicRequirements.length > 0) {
      mergedAcademicRequirements = academicRequirements.join(', ');
      filteredData = filteredData.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const itemRequirement = item['Academic Requirement'];
        return itemRequirement !== undefined && itemRequirement !== null && mergedAcademicRequirements.includes(itemRequirement);
      });
    }

    if (startTimes && Array.isArray(startTimes) && startTimes.length > 0) {
      filteredData = filteredData.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const itemStartTime = item['Start Time'];
        return itemStartTime !== undefined && itemStartTime !== null && startTimes.includes(itemStartTime);
      });
    }

    if (semesters && Array.isArray(semesters) && semesters.length > 0) {
      filteredData = filteredData.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const itemAcademicPeriod = item['Academic Period'];
        return itemAcademicPeriod !== undefined && itemAcademicPeriod !== null && semesters.includes(itemAcademicPeriod);
      });
    }

    if (department && typeof department === 'string' && department.trim() !== '') {
      filteredData = filteredData.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const itemProgram = item['Program of Study'];
        return itemProgram !== undefined && itemProgram !== null && 
               typeof itemProgram === 'string' && 
               itemProgram.toLowerCase().includes(department.toLowerCase());
      });
    }

    if (courseSectionOwningAU && Array.isArray(courseSectionOwningAU) && courseSectionOwningAU.length > 0) {
      filteredData = filteredData.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const itemDepartment = item['Course Section Owning AU'];
        return itemDepartment !== undefined && itemDepartment !== null && 
               courseSectionOwningAU.includes(itemDepartment);
      });
    }

    if (description && typeof description === 'string' && description.trim() !== '') {
      try {
        filteredData = filterByValue(filteredData, ['Description'], description);
      } catch (error) {
        console.error('search: Error in description filtering:', error);
        // Continue with current filteredData if search fails
      }
    }

    // Filter by IQ Attributes with defensive checks
    if (iqAttributes && Array.isArray(iqAttributes) && iqAttributes.length > 0) {
      filteredData = filteredData.filter(item => {
        if (!item || typeof item !== 'object') return false;
        
        const itemIQAttributes = item.iqAttributes;
        if (!itemIQAttributes || !Array.isArray(itemIQAttributes)) return false;

        try {
          if (iqAttributes.length === 1) {
            return itemIQAttributes.includes(iqAttributes[0]);
          } else {
            // Ensure both arrays contain only strings and are properly sorted
            const validItemAttrs = itemIQAttributes
              .filter(attr => attr !== null && attr !== undefined && typeof attr === 'string')
              .map(attr => attr.trim())
              .filter(attr => attr.length > 0)
              .sort();
            
            const validFilterAttrs = iqAttributes
              .filter(attr => attr !== null && attr !== undefined && typeof attr === 'string')
              .map(attr => attr.trim())
              .filter(attr => attr.length > 0)
              .sort();
            
              return validFilterAttrs.every(attr => validItemAttrs.includes(attr));
          }
        } catch (error) {
          console.error('search: Error in IQ attributes filtering:', error);
          return false;
        }
      });
    }
    
    if (searchTerms && typeof searchTerms === 'string' && searchTerms.trim() !== '') {
      try {
        filteredData = filterByValue(filteredData, ['Section', 'Course Subject Abbreviation', 'Course Number', 'Course Title'], searchTerms, 0.3);
      } catch (error) {
        console.error('search: Error in searchTerms filtering:', error);
        // Continue with current filteredData if search fails
      }
    }
  } catch (error) {
    console.error('search: Unexpected error during filtering:', error);
    return []; // Return empty array on critical error
  }

  return filteredData;
}

function filterByValue(data, filterKeys, searchTerms, threshold = 0.5) {
  // Validate input parameters
  if (!data || !Array.isArray(data)) {
    console.error('filterByValue: Invalid data parameter');
    return [];
  }

  if (!filterKeys || !Array.isArray(filterKeys) || filterKeys.length === 0) {
    console.error('filterByValue: Invalid filterKeys parameter');
    return data;
  }

  if (!searchTerms || typeof searchTerms !== 'string' || searchTerms.trim() === '') {
    console.error('filterByValue: Invalid searchTerms parameter');
    return data;
  }

  // Validate threshold
  if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
    console.warn('filterByValue: Invalid threshold, using default 0.5');
    threshold = 0.5;
  }

  try {
    // Configure Fuse.js for fuzzy search
    const options = {
      keys: filterKeys,
      threshold: threshold,
      includeScore: true
    };

    const fuse = new Fuse(data, options);
    const searchResults = fuse.search(searchTerms);

    // Safely extract items from search results
    if (!Array.isArray(searchResults)) {
      console.error('filterByValue: Fuse.js returned non-array result');
      return data;
    }

    return searchResults
      .filter(result => result && typeof result === 'object' && result.item)
      .map(result => result.item);

  } catch (error) {
    console.error('filterByValue: Error during fuzzy search:', error);
    return data; // Return original data if search fails
  }
}

module.exports = search; 
