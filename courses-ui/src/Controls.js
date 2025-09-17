import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import ResultsGrid from './ResultsGrid.js'
import Dropdown from './Dropdown.js'
import * as Constants from './Constants.js'
import CourseModal from './CourseModal.js'
import LinearProgress from '@mui/material/LinearProgress'

// Get the API base URL from environment or use production URL
const API_BASE_URL = (() => {
  const env = process.env.REACT_APP_ENV
  if (env === 'dev') return 'https://courses.research-dev.artsci.wustl.edu/api/courses'
  if (env === 'stage') return 'https://courses.research-stage.artsci.wustl.edu/api/courses'
  if (env === 'prod') return 'https://courses.artsci.wustl.edu/api/courses'
  return 'http://localhost:3000/api/courses' // default for development
})()

function Controls() {
  const [searchTerms, setSearchTerms] = React.useState('')
  const [department, setDepartment] = React.useState('')
  const [selectedDays, setSelectedDays] = React.useState([])
  const [hideFilters, setHideFilters] = React.useState(false)
  const [selectedLevels, setSelectedLevels] = React.useState([])
  const [rows, setRows] = React.useState([])
  const [filteredRows, setFilteredRows] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [totalCount, setTotalCount] = React.useState(null)
  const [showModal, setShowModal] = React.useState(false)
  const [selectedCourse, setSelectedCourse] = React.useState(null)
  const [description, setDescription] = React.useState('')
  const [majorRequirement, setMajorRequirement] = React.useState([])
  const [selectedIQAttributes, setSelectedIQAttributes] = React.useState([])
  const [iqAttributesOptions, setIqAttributesOptions] = React.useState([])
  const [academicRequirements, setAcademicRequirements] = React.useState('')
  const [programsOfStudyOptions, setProgramsOfStudyOptions] = React.useState([])
  const [academicRequirementsOptions, setAcademicRequirementsOptions] = React.useState([])
  const [startTimes, setStartTimes] = React.useState([])
  const [semesters, setSemesters] = React.useState([])
  const [semestersOptions, setSemestersOptions] = React.useState([])
  const [semesterMapping, setSemesterMapping] = React.useState({})
  const [courseSectionOwningAU, setCourseSectionOwningAU] = React.useState([])
  const [departmentsOptions, setDepartmentsOptions] = React.useState([])
  const [searchPerformed, setSearchPerformed] = React.useState(false)
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 500
  })
  const [filterModel, setFilterModel] = React.useState({
    items: []
  })

  // Function to control scrolling based on results
  const updateScrollBehavior = (hasResults) => {
    if (hasResults) {
      document.body.classList.remove('no-results')
      document.body.classList.add('has-results')
    } else {
      document.body.classList.remove('has-results')
      document.body.classList.add('no-results')
    }
  }

  // Function to fetch IQ Attributes from API
  const fetchIQAttributes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/iq-attributes`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setIqAttributesOptions(data.iqAttributes)
    } catch (error) {
      console.error('Error fetching IQ Attributes:', error)
    }
  }

  // Function to fetch Academic Requirements from API
  const fetchAcademicRequirements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/academic-requirements`)
      const data = await response.json()
      setAcademicRequirementsOptions(data.academicRequirements)
    } catch (error) {
      console.error('Error fetching Academic Requirements:', error)
    }
  }

  // Function to fetch Semesters from API and create Season/Year mapping
  const fetchSemesters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/semesters`)
      const data = await response.json()
      const allPeriods = data.semesters || []
      
      // Parse periods to create Season/Year options and mapping
      const seasonYearOptions = new Set()
      const mapping = {}
      
      allPeriods.forEach(period => {
        if (period && typeof period === 'string') {
          // Extract year (4 digits)
          const yearMatch = period.match(/\b(20\d{2})\b/)
          if (yearMatch) {
            const year = yearMatch[1]
            
            // Check for Fall, Spring, Summer, Winter
            const seasonChecks = [
              { keyword: 'fall', season: 'Fall' },
              { keyword: 'spring', season: 'Spring' },
              { keyword: 'summer', season: 'Summer' },
              { keyword: 'winter', season: 'Winter' }
            ]
            
            seasonChecks.forEach(({ keyword, season }) => {
              if (period.toLowerCase().includes(keyword)) {
                const seasonYear = `${season} ${year}`
                seasonYearOptions.add(seasonYear)
                
                if (!mapping[seasonYear]) {
                  mapping[seasonYear] = []
                }
                mapping[seasonYear].push(period)
              }
            })
          }
        }
      })
      
      // Convert to sorted array
      const sortedOptions = Array.from(seasonYearOptions).sort((a, b) => {
        // Sort by year first, then by season (Fall, Winter, Spring, Summer)
        const [seasonA, yearA] = a.split(' ')
        const [seasonB, yearB] = b.split(' ')
        
        if (yearA !== yearB) {
          return yearA.localeCompare(yearB)
        }
        
        // Same year, sort by season order: Fall, Winter, Spring, Summer
        const seasonOrder = { 'Fall': 1, 'Winter': 2, 'Spring': 3, 'Summer': 4 }
        const orderA = seasonOrder[seasonA] || 999
        const orderB = seasonOrder[seasonB] || 999
        
        return orderA - orderB
      })
      
      setSemestersOptions(sortedOptions)
      setSemesterMapping(mapping)
    } catch (error) {
      console.error('Error fetching Semesters:', error)
      setSemestersOptions([])
      setSemesterMapping({})
    }
  }

  // Function to fetch Departments from API
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/departments`)
      const data = await response.json()
      setDepartmentsOptions(data.departments || [])
    } catch (error) {
      console.error('Error fetching Departments:', error)
      setDepartmentsOptions([])
    }
  }

  // Function to fetch course data
  const fetchProgramsOfStudy = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/programs`)
      const data = await response.json()
      setProgramsOfStudyOptions(data.programsOfStudy)
    } catch (error) {
      console.error('Error fetching Programs of Study:', error)
    }
  }

  const fetchCourseData = async () => {
    try {      
      // Convert selected Season/Year options to full period array
      const selectedPeriods = []
      semesters.forEach(seasonYear => {
        if (semesterMapping[seasonYear]) {
          selectedPeriods.push(...semesterMapping[seasonYear])
        }
      })
      
      const params = new URLSearchParams({
        searchTerms: searchTerms,
        department: department,
        description: description,
        days: selectedDays.join(','),
        levels: selectedLevels.join(','),
        page: paginationModel.page,
        iqAttributes: selectedIQAttributes.join(','),
        academicRequirements: academicRequirements,
        startTimes: startTimes.join(','),
        semesters: selectedPeriods.join(','),
        courseSectionOwningAU: courseSectionOwningAU.join(','),
        pageSize: paginationModel.pageSize
      })

      const coursesResponse = await fetch(`${API_BASE_URL}/courses?${params}`)
      if (!coursesResponse.ok) {
        throw new Error(`HTTP error! status: ${coursesResponse.status}`)
      }
      const data = await coursesResponse.json()
      setFilteredRows(data.data)
      setTotalCount(data.total)

      // Show the filters if there are results, otherwise hide them
      setHideFilters(data.total !== 0)

      // Update scroll behavior based on results
      updateScrollBehavior(data.data.length > 0)
    } catch (error) {
      console.error('Error fetching course data:', error)
      setError(error.message)
      // Update scroll behavior when there's an error (no results)
      updateScrollBehavior(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchClick = () => {
    setLoading(true)
    fetchCourseData()
    setSearchPerformed(true)
  }

  const resetFilters = () => {
    setSearchTerms('')
    setDescription('')
    setDepartment('')
    setSelectedDays([])
    setSelectedLevels([])
    setMajorRequirement([])
    setSelectedIQAttributes([])
    setAcademicRequirements('')
    setHideFilters(false)
    setTotalCount(null)
    setFilteredRows(rows)
    setStartTimes([])
    setSemesters([])
    setCourseSectionOwningAU([])
    // Update scroll behavior when filters are reset (no results)
    updateScrollBehavior(false)
    setSearchPerformed(false)
  }

  const handleHideFilterClick = () => {
    setHideFilters(!hideFilters)
  }

  const handleSelectedStartTimesChange = (event) => {
    if (event) {
      if (event.target.value.indexOf('clear') !== -1) {
        setStartTimes([])
      } else if (event.target.value.indexOf('all') !== -1) {
        setStartTimes(Constants.startTimeOptions)
      } else {
        setStartTimes(event.target.value)
      }
    }
  }

  const handleSelectedDaysChange = (event) => {
    if (event) {
      if (event.target.value.indexOf('clear') !== -1) {
        setSelectedDays([])
      } else if (event.target.value.indexOf('all') !== -1) {
        setSelectedDays(Constants.dayOptions)
      } else {
        setSelectedDays(event.target.value)
      }
    }
  }

  const handleSelectedLevelsChange = (event) => {
    if (event) {
      if (event.target.value.indexOf('clear') !== -1) {
        setSelectedLevels([])
      } else if (event.target.value.indexOf('all') !== -1) {
        setSelectedLevels(Constants.levelOptions)
      } else {
        setSelectedLevels(event.target.value)
      }
    }
  }

  const handleSelectedIQAttributesChange = (event) => {
    if (event) {
      if (event.target.value.indexOf('clear') !== -1) {
        setSelectedIQAttributes([])
      } else if (event.target.value.indexOf('all') !== -1) {
        setSelectedIQAttributes(iqAttributesOptions)
      } else {
        setSelectedIQAttributes(event.target.value)
      }
    }
  }

  const handleSelectedSemestersChange = (event) => {
    if (event) {
      if (event.target.value.indexOf('clear') !== -1) {
        setSemesters([])
      } else if (event.target.value.indexOf('all') !== -1) {
        setSemesters(semestersOptions)
      } else {
        setSemesters(event.target.value)
      }
    }
  }

  const handleSelectedDepartmentsChange = (event) => {
    if (event) {
      if (event.target.value.indexOf('clear') !== -1) {
        setCourseSectionOwningAU([])
      } else if (event.target.value.indexOf('all') !== -1) {
        setCourseSectionOwningAU(departmentsOptions)
      } else {
        setCourseSectionOwningAU(event.target.value)
      }
    }
  }

  const handlePaginationModelChange = (newModel) => {
    setPaginationModel(newModel)
  }

  const handleFilterModelChange = (newModel) => {
    setFilterModel(newModel)
  }

  const handleRowClick = (row) => {
    setSelectedCourse(row)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  React.useEffect(() => {
    if (paginationModel && searchPerformed) {
      fetchCourseData()
    }
  }, [paginationModel.page, paginationModel.pageSize])

  // Fetch IQ Attributes on component mount
  React.useEffect(() => {
    fetchIQAttributes()
    fetchProgramsOfStudy()
    fetchAcademicRequirements()
    fetchSemesters()
    fetchDepartments()
  }, [])

  // Initialize scroll behavior on component mount
  React.useEffect(() => {
    // Start with no scrolling allowed
    updateScrollBehavior(false)
    
    // Cleanup function to reset scroll behavior when component unmounts
    return () => {
      document.body.classList.remove('no-results', 'has-results')
    }
  }, [])

  return (
    <>
      <div className={filteredRows.length === 0 ? 'search-fields search-fields-base' : 'search-fields'}>
        <Box className={hideFilters || showModal ? 'search-fields-form hidden' : 'search-fields-form'} sx={{ m: 3, marginTop: '25px' }}>
          <Autocomplete
            sx={{ width: '100%', mb: 2 }}
            id='outlined-controlled'
            label='Search by A&S Program of Study'
            value={department}
            onChange={(event, newValue) => {
              if (newValue) {
                setDepartment(newValue)
              } else {
                setDepartment('')
              }
            }}
            inputValue={department}
            onInputChange={(event, newInputValue) => {
              if (newInputValue) {
                setDepartment(newInputValue)
              } else {
                setDepartment('')
              }
            }}
            getOptionLabel={(option) => option}
            options={programsOfStudyOptions}
            renderInput={(params) => <TextField {...params} slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              },
            }} 
            label='Search by A&S Program of Study' />}
          />

          <Dropdown
            label='Filter by A&S IQ Requirements'
            val={selectedIQAttributes}
            handleValChange={handleSelectedIQAttributesChange}
            options={iqAttributesOptions}
            allowMultiple={true}
          />          
          
          <Autocomplete
            sx={{ width: '100%', mb: 2 }}
            id="tags-standard"
            options={academicRequirementsOptions}
            getOptionLabel={(option) => option}
            value={academicRequirements}
            onChange={(event, newValue) => {
              if (newValue) {
                setAcademicRequirements(newValue)
              } else {
                setAcademicRequirements('')
              }
            }}
            onInputChange={(event, newInputValue) => {
              if (newInputValue) {
                setAcademicRequirements(newInputValue)
              } else {
                setAcademicRequirements('')
              }
            }}
            renderInput={(params) => <TextField {...params} label="Filter by Academic Requirements" placeholder="Academic Requirements" />}
          />

          <TextField
            sx={{ width: '100%', mb: 2 }}
            id='outlined-controlled'
            label='Search by Course Title or Number'
            value={searchTerms}
            onChange={(event) => {
              setSearchTerms(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearchClick()
              }
            }}
          />

          {false && <TextField
            sx={{ width: '100%', mb: 2 }}
            id='outlined-controlled'
            label='Search by Description'
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearchClick()
              }
            }}
          /> }

          <Dropdown
            label='Filter by Days'
            val={selectedDays}
            handleValChange={handleSelectedDaysChange}
            options={Constants.dayOptions}
            allowMultiple={true}
          />

          <Dropdown
            label='Filter by Start Time'
            val={startTimes}
            handleValChange={handleSelectedStartTimesChange}
            options={Constants.startTimeOptions}
            allowMultiple={true}
          />

          <Dropdown
            label='Filter by Level'
            val={selectedLevels}
            handleValChange={handleSelectedLevelsChange}
            options={Constants.levelOptions}
            allowMultiple={true}
          />

          {semestersOptions.length > 1 && (
            <Dropdown
              label='Filter by Academic Period'
              val={semesters}
              handleValChange={handleSelectedSemestersChange}
              options={semestersOptions}
              allowMultiple={true}
            />
          )}

          {departmentsOptions.length > 1 && (
            <Dropdown
              label='Filter by Offering Department'
              val={courseSectionOwningAU}
              handleValChange={handleSelectedDepartmentsChange}
              options={departmentsOptions}
              allowMultiple={true}
            />
          )}
        </Box>

        <Box className='filter-buttons'>
          <Button className="search-button" variant='text' sx={{ margin: '20px' }} onClick={resetFilters}>
            Reset Filters
          </Button>

          <Button className="search-button" variant='text' sx={{ margin: '20px' }} onClick={handleHideFilterClick}>
            {hideFilters ? 'Show Filters' : 'Hide Filters'}
          </Button>

          <Button className="search-button" variant='text' sx={{ margin: '20px' }} onClick={handleSearchClick}>
            Search
          </Button>
          { loading && (
            <div className='loading'>
              <LinearProgress />
            </div>
          )}
        </Box>
          {filteredRows.length === 0 && !loading && searchPerformed && (
          <div className='no-results'>
            <h1>No results found</h1>
          </div>
      )}
      </div>
      <CourseModal 
        isOpen={showModal}
        onClose={handleCloseModal}
        selectedCourse={selectedCourse}
      />
        { filteredRows.length > 0 && (
      <ResultsGrid 
        disableRowSelectionOnClick
        rows={filteredRows} 
        loading={loading} 
        error={error}
        onRowClick={handleRowClick}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        rowCount={totalCount}
        filterModel={filterModel}
        onFilterModelChange={handleFilterModelChange}
        semestersOptionsLength={semestersOptions.length}
      />
      )}
    </>
  )
}

export default Controls
