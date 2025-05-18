const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Get configuration based on environment variables
 * @returns {object} - Configuration object
 */
const getConfig = () => {
  return {
    // DeepSeek API settings
    api: {
      baseUrl: process.env.API_BASE_URL || 'https://dseek.aikeji.vip/v1',
      key: process.env.API_KEY || 'sk-yOXwIRBRZWgOB9SuXNiH07v9X8YIUE4rKq6NhPgEGwfJHIdr',
      model: process.env.API_MODEL || 'deepseek-v3-250324',
      endpoint: process.env.API_ENDPOINT || '/chat/completions',
    },
    
    // Vocabulary analysis settings
    vocabulary: {
      // Difficulty level thresholds (CEFR levels approximation)
      difficultyLevels: {
        easy: ['A1', 'A2', 'B1'], // Levels 1-3
        medium: ['B2', 'C1'],     // Levels 4-5
        hard: ['C2']              // Level 6+
      },
      
      // User's current English level range (3-4 means B1-B2, equivalent to IELTS 5.5)
      userLevel: {
        min: parseInt(process.env.USER_LEVEL_MIN, 10) || 3, // B1
        max: parseInt(process.env.USER_LEVEL_MAX, 10) || 4  // B2
      }
    },
    
    // Word analysis settings
    wordAnalysis: {
      minLength: parseInt(process.env.WORD_MIN_LENGTH, 10) || 3,
      difficultyThreshold: parseInt(process.env.DIFFICULTY_THRESHOLD, 10) || 3,
      ignoredWords: process.env.IGNORED_WORDS 
        ? process.env.IGNORED_WORDS.split(',')
        : ['the', 'and', 'that', 'this', 'with', 'from', 'they', 'have', 'will'],
    },
    
    // Supported subtitle file formats
    supportedFormats: process.env.SUPPORTED_FORMATS
      ? process.env.SUPPORTED_FORMATS.split(',')
      : ['.srt', '.vtt', '.txt'],
    
    // Maximum file size in bytes (default: 5MB)
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024
  };
};

module.exports = {
  getConfig
}; 