// Regression tests for: GENST 3750-01 was missing from results for
//   semester "Spring 2027" + requirement
//   "Public Health and Society Major_Social, Cultural, Historical Analysis of Health, Illness, and Wellness Electives"
// but showed up for "Public Health and Society Major_Electives". The loader was
// dropping every row after the first for a section within a program, so only one
// of its requirements survived.
//
// Run with: npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');

const DataLoader = require('../utils/data_loader');
const createCourseRoutes = require('../routes/courses');

const SEMESTER = 'Spring 2027';
const OTHER_SEMESTER = 'Fall 2026';
const PROGRAM = 'Public Health and Society Major';
const ELECTIVES_REQ = `${PROGRAM}_Electives`;
const SOCIAL_REQ = `${PROGRAM}_Social, Cultural, Historical Analysis of Health, Illness, and Wellness Electives`;
const SECTION = 'GENST 3750-01 - Disability, Quality of Life & Community Responsibility';
const SECTION_NUMBER = 'GENST3750-01';

const REAL_CSV = path.join(__dirname, '../data/data.csv');

// Load a CSV through the real DataLoader. loadCourseData() reads a hard-coded
// path, so redirect that one read to the given file.
async function loadFrom(csvPath) {
  const realCreateReadStream = fs.createReadStream;
  fs.createReadStream = (p, ...rest) =>
    realCreateReadStream(path.resolve(p) === REAL_CSV ? csvPath : p, ...rest);
  try {
    const loader = new DataLoader();
    await loader.loadCourseData();
    return loader;
  } finally {
    fs.createReadStream = realCreateReadStream;
  }
}

function csvRow(fields) {
  return fields.map(f => `"${String(f ?? '').replace(/"/g, '""')}"`).join(',');
}

const HEADERS = ['Section + Acad Req UniqueID', 'Program of Study', 'Academic Requirement',
  'Section', 'Section Number', 'Course Subject Abbreviation', 'Course Number',
  'Days', 'Start Time', 'End Time', 'Academic Period', 'Description',
  'IQ Attributes', 'Integration Attribute', 'Course Level', 'Course Section Owning AU'];

function fixtureRow({ requirement, program = PROGRAM, period = SEMESTER, days = 'Mon/Wed',
  start = '4:00 PM', end = '5:20 PM', section = SECTION, sectionNumber = SECTION_NUMBER,
  description = 'Disability studies course', iq = 'SSC, SC', integration = '', level = '3000',
  owningAU = 'Women, Gender, and Sexuality Studies' }) {
  return [`${period}${requirement}${section}`, program, requirement, section, sectionNumber,
    sectionNumber.replace(/\d.*/, ''), sectionNumber.replace(/-.*/, ''),
    days, start, end, period, description, iq, integration, level, owningAU];
}

function writeFixture(rows) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'courses-test-'));
  const file = path.join(dir, 'data.csv');
  fs.writeFileSync(file, [HEADERS, ...rows.map(fixtureRow)].map(csvRow).join('\n'));
  return file;
}

// One express app for the whole file (routes/courses.js uses a module-level
// router), pointed at whichever loader the current test sets.
let currentLoader;
let server;
let baseUrl;

before(async () => {
  const app = express();
  app.use('/api/courses', createCourseRoutes({ getData: () => currentLoader.getData() }));
  await new Promise(resolve => { server = app.listen(0, resolve); });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/courses`;
});

after(() => server.close());

// Query /courses the way Controls.js does: academicRequirements as a raw string,
// semesters (and other multi-selects) as JSON arrays.
async function searchCourses({ requirement = '', days = [], searchTerms = '', semester = SEMESTER,
  department = '', description = '', iqAttributes = [], integrationAttributes = [], startTimes = [],
  levels = [], courseSectionOwningAU = [] } = {}) {
  const params = new URLSearchParams({
    academicRequirements: requirement,
    semesters: JSON.stringify([semester]),
    days: JSON.stringify(days),
    searchTerms,
    department,
    description,
    iqAttributes: JSON.stringify(iqAttributes),
    integrationAttributes: JSON.stringify(integrationAttributes),
    startTimes: JSON.stringify(startTimes),
    levels: JSON.stringify(levels),
    courseSectionOwningAU: JSON.stringify(courseSectionOwningAU),
    pageSize: 1000,
  });
  const res = await fetch(`${baseUrl}/courses?${params}`);
  assert.strictEqual(res.status, 200);
  return res.json();
}

async function sectionRows(sectionNumber, academicPeriod) {
  const params = new URLSearchParams(academicPeriod ? { academicPeriod } : {});
  const res = await fetch(`${baseUrl}/section/${encodeURIComponent(sectionNumber)}?${params}`);
  assert.strictEqual(res.status, 200);
  return (await res.json()).data;
}

const sections = result => result.data.map(r => r.Section);

test('section listed under two requirements of the same program is found by both', async () => {
  currentLoader = await loadFrom(writeFixture([
    { requirement: ELECTIVES_REQ },
    { requirement: SOCIAL_REQ },
  ]));

  assert.deepStrictEqual(sections(await searchCourses({ requirement: ELECTIVES_REQ })), [SECTION]);
  assert.deepStrictEqual(sections(await searchCourses({ requirement: SOCIAL_REQ })), [SECTION]);
});

test('results show one row per section per semester', async () => {
  currentLoader = await loadFrom(writeFixture([
    { requirement: ELECTIVES_REQ },
    { requirement: SOCIAL_REQ },
    { requirement: `${PROGRAM.replace('Major', 'Minor')}_Electives`, program: PROGRAM.replace('Major', 'Minor') },
  ]));

  const all = await searchCourses();
  assert.deepStrictEqual(sections(all), [SECTION]);
  assert.strictEqual(all.total, 1);

  // The title search runs after the collapse, so it also returns the section once.
  assert.deepStrictEqual(sections(await searchCourses({ searchTerms: 'Disability' })), [SECTION]);
});

test('requirement filter is an exact match, not a substring match', async () => {
  // "Electives" is a substring of the selected requirement name; it used to match.
  currentLoader = await loadFrom(writeFixture([
    { requirement: 'Electives', program: 'Other Program', section: 'OTHER 1000-01 - Other', sectionNumber: 'OTHER1000-01' },
    { requirement: ELECTIVES_REQ },
  ]));

  assert.deepStrictEqual(sections(await searchCourses({ requirement: ELECTIVES_REQ })), [SECTION]);
});

test('a section with two meeting times matches a filter on either one', async () => {
  currentLoader = await loadFrom(writeFixture([
    { requirement: ELECTIVES_REQ, days: 'Mon/Wed/Fri', start: '9:00 AM', end: '10:30 AM' },
    { requirement: ELECTIVES_REQ, days: 'Wed', start: '5:00 PM', end: '7:00 PM' },
  ]));

  const wed = await searchCourses({ days: ['Wed'] });
  assert.deepStrictEqual(sections(wed), [SECTION]);
  assert.strictEqual(wed.data[0].Days, 'Wed', 'the row shown should be the meeting that matched');
});

test('every other dropdown and search box finds the section once, and excludes a non-matching one', async () => {
  // GENST 3750 is listed under three requirements (so three rows); OTHER 1000 differs
  // from it in every field the filters look at.
  const other = {
    requirement: 'Other Program_Electives', program: 'Other Program', section: 'OTHER 1000-01 - Intro to Other',
    sectionNumber: 'OTHER1000-01', days: 'Tue/Thu', start: '10:00 AM', end: '11:20 AM',
    description: 'Chemistry laboratory', iq: 'NSM', integration: 'ArtSci Integration – Example, NSM',
    level: '1000', owningAU: 'Chemistry',
  };
  currentLoader = await loadFrom(writeFixture([
    { requirement: ELECTIVES_REQ },
    { requirement: SOCIAL_REQ },
    { requirement: `${PROGRAM.replace('Major', 'Minor')}_Electives`, program: PROGRAM.replace('Major', 'Minor') },
    other,
  ]));

  const cases = {
    'Program of Study': { department: PROGRAM },
    'IQ Requirements': { iqAttributes: ['SSC'] },
    'Days': { days: ['Mon/Wed'] },
    'Start Time': { startTimes: ['4:00 PM'] },
    'Level': { levels: ['3000'] },
    'Offering Department': { courseSectionOwningAU: ['Women, Gender, and Sexuality Studies'] },
    'Course Title or Number': { searchTerms: 'GENST 3750' },
    'Description': { description: 'disability' },
  };
  for (const [dropdown, query] of Object.entries(cases)) {
    assert.deepStrictEqual(sections(await searchCourses(query)), [SECTION], dropdown);
  }

  assert.deepStrictEqual(
    sections(await searchCourses({ integrationAttributes: [other.integration] })), [other.section],
    'IQ Integration');
});

test('/section returns every row for the section, limited to the requested semester', async () => {
  // 30 requirements in each of two semesters: more than the old 25-row page.
  const rows = [];
  for (let i = 0; i < 30; i++) {
    rows.push({ requirement: `${PROGRAM}_Requirement ${i}` });
    rows.push({ requirement: `${PROGRAM}_Requirement ${i}`, period: OTHER_SEMESTER });
  }
  currentLoader = await loadFrom(writeFixture(rows));

  const spring = await sectionRows(SECTION_NUMBER, SEMESTER);
  assert.strictEqual(spring.length, 30);
  assert.ok(spring.every(r => r['Academic Period'] === SEMESTER));

  assert.strictEqual((await sectionRows(SECTION_NUMBER)).length, 60);
});

test('real data.csv: GENST 3750 shows for Spring 2027 + both Public Health Major requirements',
  { skip: !fs.existsSync(REAL_CSV) && 'data/data.csv not present' },
  async () => {
    currentLoader = await loadFrom(REAL_CSV);

    assert.ok(sections(await searchCourses({ requirement: ELECTIVES_REQ })).includes(SECTION),
      'expected GENST 3750 under Electives (control case)');
    assert.ok(sections(await searchCourses({ requirement: SOCIAL_REQ })).includes(SECTION),
      'expected GENST 3750 under Social, Cultural, Historical ... Electives');

    const popup = await sectionRows(SECTION_NUMBER, SEMESTER);
    assert.ok(popup.some(r => r['Academic Requirement'] === SOCIAL_REQ),
      'expected the course popup to list the Social, Cultural, Historical ... requirement');
  });
