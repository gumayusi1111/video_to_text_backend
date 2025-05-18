const { OpenAI } = require('openai');
const { getConfig } = require('../config');

let openai;

// Initialize OpenAI client
const initClient = () => {
  const config = getConfig();
  
  if (!openai && config.api.key) {
    openai = new OpenAI({
      apiKey: config.api.key,
      baseURL: config.api.baseUrl,
    });
  }
  
  return openai;
};

/**
 * Analyze text using the DeepSeek AI API
 * @param {string} text - The text to analyze
 * @returns {object} - The analysis results
 */
const analyzeText = async (text) => {
  try {
    // Get client
    const client = initClient();
    const config = getConfig();
    
    if (!client) {
      throw new Error('API client not initialized. API key may be missing.');
    }
    
    // Split text into sentences (basic split on periods, but good enough for now)
    const sentences = text
      .split(/(?<=[.?!])\s+/g)
      .filter(s => s.trim().length > 0)
      .slice(0, 50); // Limit to 50 sentences for performance
    
    // Process each sentence
    const results = [];
    for (const sentence of sentences) {
      const result = await analyzeVocabulary(sentence, client, config);
      results.push(result);
      
      // Pause between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  } catch (error) {
    console.error('Error in analyzeText:', error);
    throw error;
  }
};

/**
 * Analyze vocabulary in a sentence
 * @param {string} sentence - The sentence to analyze
 * @param {object} client - The OpenAI client
 * @param {object} config - The configuration object
 * @returns {object} - The analysis results
 */
const analyzeVocabulary = async (sentence, client, config) => {
  try {
    // Check for empty sentence
    if (!sentence || sentence.trim().length === 0) {
      return {
        text: sentence,
        words: [],
        nativeExpressions: []
      };
    }
    
    const response = await client.chat.completions.create({
      model: config.api.model,
      messages: [
        {
          role: "system",
          content: "You are a language analysis assistant that helps English learners (CEFR levels B1-B2) understand vocabulary in video subtitles. For each sentence, identify important or difficult words based on the user's level, and provide detailed information about them. Also identify any idioms, slang, or native expressions and explain how native speakers use them. You MUST ONLY respond with a valid JSON object and nothing else. Do not include any explanatory text or markdown formatting."
        },
        {
          role: "user",
          content: `Analyze the following subtitle text for a student with English level ${config.vocabulary.userLevel.min}-${config.vocabulary.userLevel.max} (B1-B2, IELTS 5.5): "${sentence}"\n\nProvide the analysis ONLY in JSON format with the following structure. Do not include any explanatory text before or after the JSON:\n{\n  "text": "${sentence}",\n  "words": [\n    {\n      "word": "difficult_word",\n      "phonetic": "/fəˈnetɪk/",\n      "difficulty": 4,\n      "meanings": [\n        {"partOfSpeech": "n.", "definition": "meaning as noun"},\n        {"partOfSpeech": "v.", "definition": "meaning as verb"}\n      ],\n      "examples": ["Example sentence using the word."],\n      "similar": ["synonym1", "synonym2", "related_phrase"]\n    }\n  ],\n  "nativeExpressions": [\n    {\n      "expression": "native_expression_or_idiom",\n      "meaning": "what this expression means",\n      "usage": "how and when native speakers use this expression",\n      "examples": ["Example sentence showing usage"]\n    }\n  ]\n}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    // Parse response content
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid API response: No content found');
    }
    
    try {
      // Try to parse the JSON response
      return JSON.parse(content.trim());
    } catch (parseError) {
      // If we can't parse it as JSON, return a simplified structure
      console.error('Error parsing API response as JSON:', parseError);
      console.log('Raw response:', content);
      
      return {
        text: sentence,
        words: [],
        nativeExpressions: [],
        error: 'Failed to parse API response'
      };
    }
  } catch (error) {
    console.error('Error in analyzeVocabulary:', error);
    
    // Return a fallback object
    return {
      text: sentence,
      words: [],
      nativeExpressions: [],
      error: error.message
    };
  }
};

module.exports = {
  analyzeText
}; 