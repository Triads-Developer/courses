const fs = require('fs');
const path = require('path');

function setupSSL() {
  const triadsPath = "/exports/nfsdrupal/TRIADS/";
  let sslOptions = null;
  let useSSL = false;

  try {
    // Check if SSL files exist before attempting to read them
    const keyPath = path.join(triadsPath, 'ssl', 'private.key');
    const certPath = path.join(triadsPath, 'ssl', 'certificate.crt');
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      sslOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      useSSL = true;
      console.log('SSL certificates loaded successfully');
    } else {
      throw new Error('SSL certificate files not found');
    }
  } catch (error) {
    console.log('SSL certificates not found or invalid, running in HTTP mode:', error.message);
    useSSL = false;
    sslOptions = null;
  }

  return { sslOptions, useSSL };
}

module.exports = { setupSSL };
