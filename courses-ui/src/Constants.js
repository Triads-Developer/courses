export const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon/Wed', 'Mon/Wed/Fri', 'Mon/Fri', 'Tue/Thu']

export const levelOptions = ['1000', '2000', '3000', '4000']

export const requirementOptions = ['Social Contrasts', 'Humanities', 'Natual Science and Mathematics', 'Writing Intensive', 'Applied Numeracy', 'Language & Cultural Diversity']

export const majorRequirementOptions = ['Major', 'Minor', 'A&S IQ Requirement']

// IQ Attributes options - these will be populated from the API
export const iqAttributesOptions = {
  'AN' : 'Applied Numeracy',
  'HUM' : 'Humanities',
  'LCD' : 'Language & Cultural Diversity',
  'NSM' : 'Natural Sciences & Mathematics',
  'SC' : 'Social Contrasts',
  'SSC' : 'Social & Behavioral Sciences',
  'WI' : 'Writing Intensive'
}

export const startTimeOptions = [
  '8:00 AM',
  '8:30 AM',
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
  '5:00 PM',
  '5:30 PM',
  '6:00 PM',
  '6:30 PM',
  '7:00 PM',
  '7:30 PM',
  '8:00 PM',
  '8:30 PM'
]

export const excludedCourseFields = [
  'Most Recent Change',
  'Is Duplicate Row?',
  'Program of Study Type',
  'Course Subject Abbreviation',
  'Section Status',
  'Academic Level',
  'Instructional Format',
  'Delivery Mode',
  'Section Capacity',
  'Enrollment Count',
  'Waitlist Count',
  'Wait List Capacity',
  'Variable Credit Course',
  'id',
  'Section',
  'Student Eligibility Rule',
  'IQ Attributes' // Exclude the raw IQ Attributes field since we're using the parsed array
]
