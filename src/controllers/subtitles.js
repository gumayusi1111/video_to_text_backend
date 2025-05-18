const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { analyzeText } = require('../services/ai');
const { checkYtDlpInstalled } = require('../utils/ytdlp');

/**
 * Download subtitles from YouTube
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
const downloadSubtitles = async (req, res) => {
  try {
    // Check if yt-dlp is installed
    const ytDlpInstalled = await checkYtDlpInstalled();
    if (!ytDlpInstalled) {
      return res.status(500).json({ 
        success: false, 
        message: 'yt-dlp is not installed. Please install it using: brew install yt-dlp'
      });
    }

    const { youtubeUrl, language, autoTranslate } = req.body;
    
    console.log('Received request with:', { youtubeUrl, language, autoTranslate });

    if (!youtubeUrl) {
      return res.status(400).json({ success: false, message: 'YouTube URL is required' });
    }
    
    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid YouTube URL format' });
    }
    
    // Generate unique ID for this download
    const downloadId = uuidv4();
    const tempDir = path.join(__dirname, '../../temp');
    const outputDir = path.join(tempDir, downloadId);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Build yt-dlp command
    let command = `yt-dlp --cookies-from-browser chrome --write-subs --skip-download --no-check-certificate`;
    
    // Add language option if specified
    if (language && language !== 'auto') {
      command += ` --sub-langs ${language}`;
    } else if (autoTranslate) {
      // If auto-detect and auto-translate are both enabled
      command += ` --sub-langs en`;
    }
    
    // Add auto-generated subtitles option if needed
    if (autoTranslate) {
      command += ` --write-auto-subs`;
    }
    
    // Add convert subs option
    command += ` --sub-format srt --convert-subs srt`;
    
    // Add output directory and URL
    command += ` -o "${outputDir}/%(title)s" "${youtubeUrl}"`;
    
    console.log(`Executing command: ${command}`);
    
    // Execute command with increased timeout
    const execOptions = {
      timeout: 60000, // 60 seconds timeout
      maxBuffer: 2 * 1024 * 1024 // 2MB buffer size
    };
    
    exec(command, execOptions, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing yt-dlp: ${error.message}`);
        console.error(`Command output: ${stdout}`);
        console.error(`Command error: ${stderr}`);
        
        // Check for specific error types
        if (stderr.includes('Unable to download webpage')) {
          return res.status(500).json({ 
            success: false, 
            message: 'Unable to access the YouTube video. Please check the URL and your internet connection.',
            error: stderr
          });
        } else if (stderr.includes('No subtitles found')) {
          return res.status(404).json({ 
            success: false, 
            message: 'No subtitles found for this video in the specified language.',
            error: stderr
          });
        } else {
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to download subtitles',
            error: error.message,
            stderr: stderr
          });
        }
      }
      
      // Check if subtitle file exists
      fs.readdir(outputDir, (err, files) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Error reading output directory',
            error: err.message
          });
        }
        
        console.log('Files in output directory:', files);
        
        // Find subtitle file (SRT)
        const subtitleFile = files.find(file => file.endsWith('.srt'));
        
        if (!subtitleFile) {
          return res.status(404).json({ 
            success: false, 
            message: 'No subtitles found for this video in the specified language',
            files: files
          });
        }
        
        const subtitlePath = path.join(outputDir, subtitleFile);
        
        // Read subtitle content
        fs.readFile(subtitlePath, 'utf8', (err, data) => {
          if (err) {
            return res.status(500).json({ 
              success: false, 
              message: 'Error reading subtitle file',
              error: err.message
            });
          }
          
          // Send subtitle content and file info
          const videoTitle = subtitleFile.replace('.srt', '');
          res.json({
            success: true,
            message: 'Subtitles downloaded successfully',
            data: {
              content: data,
              title: videoTitle,
              language: language || 'auto',
              format: 'srt'
            }
          });
          
          // Clean up after sending response
          fs.rm(outputDir, { recursive: true }, (err) => {
            if (err) {
              console.error(`Error cleaning up ${outputDir}:`, err);
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('Unexpected error in download endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Analyze vocabulary in subtitle text
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
const analyzeVocabulary = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Text content is required for analysis'
      });
    }
    
    // Analyze text using AI service
    const result = await analyzeText(text);
    
    res.json({
      success: true,
      message: 'Text analyzed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error analyzing text:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze text',
      error: error.message
    });
  }
};

module.exports = {
  downloadSubtitles,
  analyzeVocabulary
}; 