// Gemini API Configuration
require('dotenv').config();

// API Key - use environment variable with fallback to the current key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// API URL for the Gemini model - updated with correct model name and API version
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Safety settings to ensure responses are appropriate for a health context
const SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  }
];

// Generation config for more deterministic medical responses
const GENERATION_CONFIG = {
  temperature: 0.4,
  maxOutputTokens: 1024,
};

module.exports = {
  GEMINI_API_KEY,
  GEMINI_API_URL,
  SAFETY_SETTINGS,
  GENERATION_CONFIG
};