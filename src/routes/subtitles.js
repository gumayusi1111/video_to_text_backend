const express = require('express');
const router = express.Router();
const { 
  downloadSubtitles,
  analyzeVocabulary 
} = require('../controllers/subtitles');

/**
 * @route   POST /api/subtitles/download
 * @desc    Download subtitles from YouTube video
 * @access  Public
 */
router.post('/download', downloadSubtitles);

/**
 * @route   POST /api/subtitles/analyze
 * @desc    Analyze subtitle vocabulary
 * @access  Public
 */
router.post('/analyze', analyzeVocabulary);

module.exports = router; 