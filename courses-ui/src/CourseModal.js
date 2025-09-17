import React, { useState, useEffect } from 'react'
import ReactModal from 'react-modal'
import './CourseModal.css'

function CourseModal({ isOpen, onClose, selectedCourse }) {
  const API_BASE_URL = (() => {
    const env = process.env.REACT_APP_ENV
    if (env === 'dev') return 'https://courses.research-dev.artsci.wustl.edu/api/courses'
    if (env === 'stage') return 'https://courses.research-stage.artsci.wustl.edu/api/courses'
    if (env === 'prod') return 'https://courses.artsci.wustl.edu/api/courses'
    return 'http://localhost:3000/api/courses' // default for development
  })()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && selectedCourse && selectedCourse.row) {
      fetchCourses()
    }
  }, [isOpen, selectedCourse])

  const fetchCourses = async () => {
    if (!selectedCourse || !selectedCourse.row["Section Number"]) return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log("fetching courses", selectedCourse.row["Section Number"])
      const sectionNumber = selectedCourse.row["Section Number"]

      const response = await fetch(`${API_BASE_URL}/section/${sectionNumber}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setCourses(result.data || [])
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError('Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  // List of fields to show as common values
  const COMMON_FIELDS = [
    'Academic Period',
    'Program of Study',
    'Academic Requirement',
    'IQ Attributes',
    'Course Number',
    'Section Number',
    'Course Level',
    'Start Time',
    'End Time',
    'Days',
    'Course Section Owning AU', // Department
    'Minimum Credit Hours',
    'Maximum Credit Hours'
  ];

  // Group fields for columns
  const COMMON_FIELD_GROUPS = [
    [COMMON_FIELDS[0], COMMON_FIELDS[1], COMMON_FIELDS[3]],
    [COMMON_FIELDS[4], COMMON_FIELDS[5], COMMON_FIELDS[6]],
    [COMMON_FIELDS[7], COMMON_FIELDS[8], COMMON_FIELDS[9]],
    [COMMON_FIELDS[10], COMMON_FIELDS[11], COMMON_FIELDS[12]]
  ];

  // Helper to get common value or '(varies)'
  function getCommonValue(field) {
    if (!courses.length) return '';
    const first = courses[0][field];
    return courses.every(course => course[field] === first) ? first : '(varies)';
  }

  function getInfoRows(fields) {
    return fields.map(field => (
      <div key={field} className="common-course-info-row" >
        <span className="common-course-info-label">{getFieldLabel(field)}:</span>
        <span className="common-course-info-value">{getCommonValue(field)}</span>
      </div>
    ))
  }

  function getFieldLabel(field) {
    if (field === 'Course Section Owning AU') return 'Department'
    else if (field === 'IQ Attributes') return 'IQ Requirements'
    else return field
  }

  // Filter courses to only show those with the same Academic Period as the selected course
  const selectedPeriod = selectedCourse?.row?.['Academic Period'];
  const filteredCourses = selectedPeriod 
    ? courses.filter(course => course['Academic Period'] === selectedPeriod)
    : courses;

  // Get unique combinations for the filtered courses
  const uniqueGridRows = Array.from(
    new Map(
      filteredCourses.map(course => [
        [course['Program of Study'], course['Program of Study Type'], course['Academic Requirement'], course['Academic Requirement Type']].join('||'), course
      ])
    ).values()
  ).sort((a, b) => (a['Program of Study'] || '').localeCompare(b['Program of Study'] || ''));

  return (
    <ReactModal 
      isOpen={isOpen}
      contentLabel="Course Details"
    >
      <button onClick={onClose}>Return to Search</button>
      <div>
        <h1>
          {selectedCourse && selectedCourse.row["Section Number"] && selectedCourse.row["Section"]}
        </h1>
        {loading && <p>Loading course data...</p>}
        {error && <p style={{color: 'red'}}>{error}</p>}
        {!loading && !error && (
          <div>
            <h2>Common Section Information</h2>
            <div className="common-course-info-column">
              {COMMON_FIELD_GROUPS.map((group, idx) => (
                <div className="common-course-info-list" key={idx}>
                  {getInfoRows(group)}
                </div>
              ))}
            </div>
            <div className="course-description">
              <span className="description-info-label">
                Description:
              </span>
              <span className="common-course-info-value">{getCommonValue('Description')}</span>
            </div>
            <h3 style={{marginTop: 24}}>Cross Listing Details</h3>
            <table className="section-details-table">
              <thead>
                <tr>
                  <th>Program of Study</th>
                  <th>Program of Study Type</th>
                  <th>Academic Requirement</th>
                </tr>
              </thead>
              <tbody>
                {uniqueGridRows.map((course, idx) => (
                  <tr key={idx}>
                    <td>{course['Program of Study']}</td>
                    <td>{course['Program of Study Type']}</td>
                    <td>{course['Academic Requirement']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && courses.length === 0 && (
          <p>No courses found for this section.</p>
        )}
      </div>
    </ReactModal>
  )
}

export default CourseModal 
