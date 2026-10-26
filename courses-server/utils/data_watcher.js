const fs = require('fs');
const path = require('path');

// Uploading data.csv (sftp put in the deploy scripts) fires a 'change' event for
// every chunk written. Wait until the file has been quiet this long before
// reloading, so one upload means one reload of the finished file.
const RELOAD_DEBOUNCE_MS = 5000;

class FileWatcher {
  constructor(dataLoader, { dataFilePath = path.join(__dirname, '../data/data.csv'), debounceMs = RELOAD_DEBOUNCE_MS } = {}) {
    this.dataLoader = dataLoader;
    this.dataFilePath = dataFilePath;
    this.debounceMs = debounceMs;
    this.fileWatcher = null;
    this.lastModified = null;
    this.reloadInProgress = false;
    this.reloadPending = false; // A change arrived mid-reload; reload again when done
    this.debounceTimer = null;
    this.pollingInterval = null;
  }

  setupFileWatcher() {
    const dataFilePath = this.dataFilePath;

    // Check if file exists
    if (!fs.existsSync(dataFilePath)) {
      console.log('data.csv not found, file watcher not set up');
      return;
    }

    // Get initial modification time
    try {
      this.lastModified = fs.statSync(dataFilePath).mtime.getTime();
      console.log('File watcher set up for data.csv');
    } catch (error) {
      console.error('Error getting file stats:', error);
      return;
    }

    // Set up file watcher with persistent option
    this.fileWatcher = fs.watch(dataFilePath, { persistent: true }, (eventType, filename) => {
      console.log(`File event detected: ${eventType} for ${filename}`);
      
      // Handle both 'change' and 'rename' events (rename happens when file is replaced)
      if (eventType === 'change' || eventType === 'rename') {
        this.scheduleReload();
      }
    });

    // Set up polling as backup (check every 24 hours)
    this.pollingInterval = setInterval(() => {
      try {
        const currentModified = fs.statSync(dataFilePath).mtime.getTime();
        if (currentModified !== this.lastModified) {
          console.log('File change detected via polling');
          this.scheduleReload();
        }
      } catch (error) {
        console.error('Error in polling check:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log('File watcher and polling set up for data.csv');
  }

  // Restart the quiet-period timer on every event; reload once events stop.
  scheduleReload() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.handleFileChange();
    }, this.debounceMs);
  }

  async handleFileChange() {
    // Set synchronously, before any await, so overlapping calls can't both start
    // a reload (each one holds a full copy of the data while it parses).
    if (this.reloadInProgress) {
      console.log('Reload already in progress, will reload again when it finishes');
      this.reloadPending = true;
      return;
    }
    this.reloadInProgress = true;

    try {
      const currentModified = fs.statSync(this.dataFilePath).mtime.getTime();

      if (currentModified === this.lastModified) {
        console.log('File modification time unchanged, skipping reload');
        return;
      }

      console.log('File change detected, reloading data...');
      await this.dataLoader.loadCourseData();
      this.lastModified = currentModified;
      console.log('Data reloaded successfully');
    } catch (error) {
      console.error('Error reloading data:', error);
    } finally {
      this.reloadInProgress = false;
      if (this.reloadPending) {
        this.reloadPending = false;
        this.scheduleReload();
      }
    }
  }

  cleanupFileWatcher() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = null;

    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
      console.log('File watcher closed');
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Polling interval cleared');
    }
  }
}

module.exports = FileWatcher;
