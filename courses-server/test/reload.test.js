// Regression tests for heap exhaustion on data reload: overlapping reloads each
// built a full copy of the data, on top of the copy still held from the last load.
//
// Run with: npm test
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DataLoader = require('../utils/data_loader');
const FileWatcher = require('../utils/data_watcher');

const REAL_CSV = path.join(__dirname, '../data/data.csv');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function writeFixtureCsv() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'courses-reload-'));
  const file = path.join(dir, 'data.csv');
  fs.writeFileSync(file, [
    'Program of Study,Academic Requirement,Section Number,Course Subject Abbreviation,Course Number,Academic Period,Description',
    'Prog,Prog_Electives,GENST3750-01,GENST,GENST3750,Spring 2027,Disability',
  ].join('\n'));
  return file;
}

// Redirect DataLoader's hard-coded data.csv read to csvPath, counting the reads.
function redirectReads(csvPath) {
  const realCreateReadStream = fs.createReadStream;
  const counter = { reads: 0 };
  fs.createReadStream = (p, ...rest) => {
    if (path.resolve(p) !== REAL_CSV) return realCreateReadStream(p, ...rest);
    counter.reads++;
    return realCreateReadStream(csvPath, ...rest);
  };
  counter.restore = () => { fs.createReadStream = realCreateReadStream; };
  return counter;
}

test('concurrent loadCourseData calls share one load', async () => {
  const counter = redirectReads(writeFixtureCsv());
  try {
    const loader = new DataLoader();
    await Promise.all([loader.loadCourseData(), loader.loadCourseData(), loader.loadCourseData()]);
    assert.strictEqual(counter.reads, 1);
    assert.strictEqual(loader.courseData.length, 1);

    // Once that load finishes, the next call reads the file again.
    await loader.loadCourseData();
    assert.strictEqual(counter.reads, 2);
  } finally {
    counter.restore();
  }
});

test('a reload releases the previous data before parsing the new file', async () => {
  const counter = redirectReads(writeFixtureCsv());
  try {
    const loader = new DataLoader();
    await loader.loadCourseData();
    const previous = loader.courseData;
    assert.strictEqual(previous.length, 1);

    const reload = loader.loadCourseData();
    assert.notStrictEqual(loader.courseData, previous, 'old rows should no longer be referenced');
    assert.strictEqual(loader.courseData.length, 0);
    assert.strictEqual(loader.descriptionIndex, null);
    assert.strictEqual(loader.isDataLoaded, false);
    assert.deepStrictEqual(loader.uniqueAcademicPeriods, ['Spring 2027'], 'dropdown lists stay available');

    await reload;
    assert.strictEqual(loader.courseData.length, 1);
    assert.strictEqual(loader.isDataLoaded, true);
  } finally {
    counter.restore();
  }
});

function slowLoader(ms) {
  const loader = { loads: 0, active: 0, maxActive: 0 };
  loader.loadCourseData = async () => {
    loader.loads++;
    loader.active++;
    loader.maxActive = Math.max(loader.maxActive, loader.active);
    await sleep(ms);
    loader.active--;
  };
  return loader;
}

function touch(file, secondsFromNow) {
  const t = new Date(Date.now() + secondsFromNow * 1000);
  fs.utimesSync(file, t, t);
}

test('a burst of file change events triggers one reload', async () => {
  const file = writeFixtureCsv();
  const loader = slowLoader(50);
  const watcher = new FileWatcher(loader, { dataFilePath: file, debounceMs: 30 });
  watcher.lastModified = fs.statSync(file).mtime.getTime();

  // Like an sftp upload: many change events, a few ms apart.
  for (let i = 0; i < 20; i++) {
    touch(file, i + 1);
    watcher.scheduleReload();
    await sleep(5);
  }
  await sleep(200);

  assert.strictEqual(loader.loads, 1);
  watcher.cleanupFileWatcher();
});

test('a change during a reload waits, then reloads once more', async () => {
  const file = writeFixtureCsv();
  const loader = slowLoader(150);
  const watcher = new FileWatcher(loader, { dataFilePath: file, debounceMs: 20 });
  watcher.lastModified = fs.statSync(file).mtime.getTime();

  touch(file, 1);
  watcher.handleFileChange();
  watcher.handleFileChange(); // overlapping call, e.g. polling + fs.watch
  await sleep(30);
  touch(file, 2); // file replaced again mid-reload
  watcher.handleFileChange();
  await sleep(400);

  assert.strictEqual(loader.maxActive, 1, 'reloads never overlap');
  assert.strictEqual(loader.loads, 2, 'the mid-reload change is picked up afterwards');
  watcher.cleanupFileWatcher();
});
