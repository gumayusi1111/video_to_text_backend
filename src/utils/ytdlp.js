const { exec } = require('child_process');
const util = require('util');

// Convert exec to Promise-based
const execPromise = util.promisify(exec);

// Cache for yt-dlp installation status
let ytDlpInstalled = null;
let ytDlpVersion = null;

/**
 * Check if yt-dlp is installed
 * @returns {Promise<boolean>} - Whether yt-dlp is installed
 */
const checkYtDlpInstalled = async () => {
  // Return cached result if available
  if (ytDlpInstalled !== null) {
    return ytDlpInstalled;
  }
  
  try {
    const { stdout } = await execPromise('yt-dlp --version');
    ytDlpVersion = stdout.toString().trim();
    console.log(`Found yt-dlp version: ${ytDlpVersion}`);
    ytDlpInstalled = true;
    return true;
  } catch (error) {
    console.error('yt-dlp is not installed or not in PATH:', error.message);
    ytDlpInstalled = false;
    return false;
  }
};

/**
 * Get the version of yt-dlp if installed
 * @returns {Promise<string|null>} - The version of yt-dlp, or null if not installed
 */
const getYtDlpVersion = async () => {
  if (ytDlpVersion) {
    return ytDlpVersion;
  }
  
  const isInstalled = await checkYtDlpInstalled();
  return isInstalled ? ytDlpVersion : null;
};

module.exports = {
  checkYtDlpInstalled,
  getYtDlpVersion
}; 