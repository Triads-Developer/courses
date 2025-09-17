const fs = require('fs');
const path = require('path');

class FileWatcher {
  constructor(dataLoader) {
    this.dataLoader = dataLoader;
    this.fileWatcher = null;
    this.lastModified = null;
    this.reloadInProgress = false;
    this.pollingInterval = null;
  }

  setupFileWatcher() {
    const dataFilePath = path.join(__dirname, '../data/data.csv');
    
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
        // Add a small delay to ensure file is fully written
        setTimeout(() => {
          this.handleFileChange();
        }, 100);
      }
    });

    // Set up polling as backup (check every 24 hours)
    this.pollingInterval = setInterval(() => {
      try {
        const currentModified = fs.statSync(dataFilePath).mtime.getTime();
        if (currentModified !== this.lastModified) {
          console.log('File change detected via polling');
          this.handleFileChange();
        }
      } catch (error) {
        console.error('Error in polling check:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log('File watcher and polling set up for data.csv');
  }

  handleFileChange() {
    if (this.reloadInProgress) {
      console.log('Reload already in progress, skipping');
      return;
    }

    const dataFilePath = path.join(__dirname, '../data/data.csv');
    
    // Add delay to ensure file is fully written
    setTimeout(async () => {
      try {
        const currentModified = fs.statSync(dataFilePath).mtime.getTime();
        
        if (currentModified === this.lastModified) {
          console.log('File modification time unchanged, skipping reload');
          return;
        }

        this.reloadInProgress = true;
        console.log('File change detected, reloading data...');
        
        // Set data as not loaded
        this.dataLoader.isDataLoaded = false;
        
        // Reload the data
        await this.dataLoader.loadCourseData();
        
        // Update last modified time
        this.lastModified = currentModified;
        
        console.log('Data reloaded successfully');
      } catch (error) {
        console.error('Error reloading data:', error);
      } finally {
        this.reloadInProgress = false;
      }
    }, 200);
  }

  cleanupFileWatcher() {
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
