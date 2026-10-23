const Fuse = require('fuse.js');

function search(data, filters, descriptionIndex) {
  // Validate input parameters
  if (!data || !Array.isArray(data)) {
    console.error('search: Invalid data parameter - expected array');
    return [];
  }

  if (!filters || typeof filters !== 'object') {
    console.error('search: Invalid filters parameter - expected object');
    return data; // Return all data if no valid filters
  }

  const { days, levels, searchTerms, department, description, iqAttributes, integrationAttributes, academicRequirements, startTimes, semesters, courseSectionOwningAU } = filters;
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
      filteredData = filteredData.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const itemRequirement = item['Academic Requirement'];
        return itemRequirement !== undefined && itemRequirement !== null && academicRequirements.includes(itemRequirement);
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

    // Filter by Integration Attributes with defensive checks
    if (integrationAttributes && Array.isArray(integrationAttributes) && integrationAttributes.length > 0) {
      filteredData = filteredData.filter(item => {
        if (!item || typeof item !== 'object') return false;
        
        const itemIntegrationAttributes = item.integrationAttributes;
        if (!itemIntegrationAttributes || !Array.isArray(itemIntegrationAttributes)) return false;

        try {
          if (integrationAttributes.length === 1) {
            return itemIntegrationAttributes.includes(integrationAttributes[0]);
          } else {
            // Ensure both arrays contain only strings and are properly sorted
            const validItemAttrs = itemIntegrationAttributes
              .filter(attr => attr !== null && attr !== undefined && typeof attr === 'string')
              .map(attr => attr.trim())
              .filter(attr => attr.length > 0)
              .sort();
            
            const validFilterAttrs = integrationAttributes
              .filter(attr => attr !== null && attr !== undefined && typeof attr === 'string')
              .map(attr => attr.trim())
              .filter(attr => attr.length > 0)
              .sort();
            
              return validFilterAttrs.every(attr => validItemAttrs.includes(attr));
          }
        } catch (error) {
          console.error('search: Error in Integration attributes filtering:', error);
          return false;
        }
      });
    }

    // Every per-row filter above has run, so collapse to one row per section before
    // the text searches. Description and the fuzzy-search fields are the same on
    // every row of a section, so this doesn't change what matches -- it just keeps
    // Fuse from scanning each section once per requirement it's listed under.
    filteredData = collapseToOneRowPerSection(filteredData);

    if (description && typeof description === 'string' && description.trim() !== '') {
      try {
        filteredData = filterByDescription(filteredData, description, descriptionIndex);
      } catch (error) {
        console.error('search: Error in description filtering:', error);
        // Continue with current filteredData if search fails
      }
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

// The data has one row per (section, Program of Study, Academic Requirement,
// meeting time). Results show one row per section per semester; the full list of
// programs/requirements for a section comes from the /section endpoint when a row
// is clicked. Keeps the first row, i.e. one that matched the active filters.
function collapseToOneRowPerSection(data) {
  const seen = new Set();
  return data.filter(item => {
    const key = `${item['Section Number']}|${item['Academic Period'] || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

// Full-text search over the Description field, scoped to whatever survived the
// other filters. Queries the persistent MiniSearch index (built once at CSV-load
// time over the deduplicated course list, see data_loader.js) rather than
// rebuilding an index per request, then maps matches back onto filteredData by
// commonID. Requires every query term to match (combineWith: 'AND') so
// multi-word queries like "hip hop" behave like a phrase search rather than
// Fuse's edit-distance fuzziness diluting relevance.
function filterByDescription(data, query, descriptionIndex) {
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  if (!query || typeof query !== 'string' || query.trim() === '') return data;

  if (!descriptionIndex) {
    console.error('filterByDescription: No description index available');
    return data;
  }

  try {
    const results = descriptionIndex.search(query, { combineWith: 'AND', prefix: true });
    const matchedCommonIds = new Set(results.map(result => result.id));

    return data.filter(item => matchedCommonIds.has(item.commonID));
  } catch (error) {
    console.error('filterByDescription: Error during search:', error);
    return data;
  }
}

module.exports = search;
