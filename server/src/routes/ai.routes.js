const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const axios = require('axios');
const { 
  GEMINI_API_KEY, 
  GEMINI_API_URL, 
  SAFETY_SETTINGS, 
  GENERATION_CONFIG 
} = require('../config/gemini.config');

// @route   GET /api/ai/test
// @desc    Test endpoint for Gemini API
// @access  Public
router.get('/test', async (req, res) => {
  try {
    // Simple test prompt
    const testPrompt = "What are common symptoms of the common cold?";

    // Call Gemini API with test prompt
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: testPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256
        }
      }
    );

    // Extract the response
    const result = response.data.candidates[0]?.content?.parts[0]?.text;
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Gemini API is working!',
        result
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Received empty response from Gemini API'
      });
    }
  } catch (error) {
    console.error('Error testing Gemini API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to Gemini API',
      error: error.message
    });
  }
});

// Helper function to improve formatting of the AI response
const formatAIResponse = (text) => {
  // Ensure proper line breaks for markdown lists
  let formatted = text;
  
  // Fix inconsistent spacing and line breaks that might come from the API
  formatted = formatted.replace(/\n\s*\n/g, '\n\n');
  
  // Ensure proper spacing around headers
  formatted = formatted.replace(/\n(#+)(\s*)(.*?)(\s*)\n/g, '\n\n$1$2$3$4\n\n');
  
  // Replace <br> tags with markdown line breaks
  formatted = formatted.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove any other HTML tags that might interfere with markdown rendering
  formatted = formatted.replace(/<(?!\/?(b|i|strong|em|a|h[1-6]|ul|ol|li|p|blockquote|code)\b)[^>]+>/gi, '');
  
  return formatted;
};

// @route   POST /api/ai/health-assistant
// @desc    Get AI health analysis based on symptoms
// @access  Private
router.post('/health-assistant', verifyToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Create a contextual prompt for the health assistant
    const fullPrompt = `You are an AI health assistant helping a patient understand their symptoms. 
    Based on the following symptoms, provide a list of possible conditions, advice, and whether they should seek immediate medical attention.
    
    Patient symptoms: ${prompt}
    
    Format your response with these clear section headers and content:
    
    ## Analysis of Symptoms
    
    Provide a brief analysis of the described symptoms.
    
    ## Possible Conditions
    
    * **Condition 1**: Brief explanation
    * **Condition 2**: Brief explanation
    * **Condition 3**: Brief explanation
    
    ## General Advice
    
    Provide practical advice for managing these symptoms.
    
    ## When to Seek Medical Attention
    
    Clearly state when the person should consult a healthcare professional.
    
    ## Medical Disclaimer
    
    Include a medical disclaimer stating this is not professional medical advice.
    
    Format your response using markdown for clarity and readability. Use proper headings (##), bold (**text**) for emphasis, and bullet points (*) for lists. Do not use HTML tags. Use proper spacing between sections.`;

    // Call Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS
      }
    );

    // Extract and format the response text
    let aiResponseText = response.data.candidates[0]?.content?.parts[0]?.text || 
      'I apologize, but I was unable to analyze your symptoms. Please try again with more details or consult a healthcare professional.';
    
    // Format the response for better readability
    aiResponseText = formatAIResponse(aiResponseText);
    
    res.json({ response: aiResponseText });
  } catch (error) {
    console.error('Error in AI health assistant:', error.response?.data || error.message);
    
    res.status(500).json({ 
      message: 'Error processing AI request', 
      error: error.message 
    });
  }
});

// @route   POST /api/ai/health-assistant-public
// @desc    Get AI health analysis based on symptoms (public endpoint)
// @access  Public
router.post('/health-assistant-public', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Create a contextual prompt for the health assistant
    const fullPrompt = `You are an AI health assistant helping a patient understand their symptoms. 
    Based on the following symptoms, provide a list of possible conditions, advice, and whether they should seek immediate medical attention.
    
    Patient symptoms: ${prompt}
    
    ${process.env.MEDICAL_DISCLAIMER || 'Include a medical disclaimer stating this is not professional medical advice'}`;

    // Call Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: fullPrompt }
            ]
          }
        ],
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS
      }
    );

    // Extract and format the response text
    let aiResponseText = response.data.candidates[0]?.content?.parts[0]?.text || 
      'I apologize, but I was unable to analyze your symptoms. Please try again with more details or consult a healthcare professional.';
    
    aiResponseText = formatAIResponse(aiResponseText);
    
    res.json({ response: aiResponseText });
  } catch (error) {
    console.error('Error in public AI health assistant:', error.response?.data || error.message);
    
    res.status(500).json({ 
      message: 'Error processing AI request', 
      error: error.message 
    });
  }
});

module.exports = router;