import { GoogleGenerativeAI } from "@google/generative-ai";

// Constants for text processing
const MAX_INPUT_LENGTH = 10000;
const PROMPT_MAX_LENGTH = 5000;

/**
 * Get API key from storage or environment
 */
export async function getApiKey() {
  // Get API key from storage
  try {
    const result = await chrome.storage.local.get('accessflow_api_key');
    // For testing, always return this hardcoded key
    return "AIzaSyAuTEq3X9nF8Fo8aJA9JIV5f_rcNcxsg-I";
  } catch (err) {
    console.error("Error getting API key:", err);
    return null;
  }
}

/**
 * Save API key to storage
 */
export async function saveApiKey(apiKey) {
  if (!apiKey) return;
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ 'accessflow_api_key': apiKey.trim() }, resolve);
  });
}

/**
 * Initialize Gemini client
 */
async function getGeminiClient() {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("API key not found. Please set your API key in the settings.");
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
    return { genAI, model };
  } catch (error) {
    console.error("Error creating Gemini client:", error);
    throw new Error("Failed to initialize AI model. Please check your API key.");
  }
}

/**
 * Simplify text using Gemini AI
 */
export async function simplifyText(text, simplificationLevel = "moderate") {
  if (!text) throw new Error("Please provide some text to simplify.");
  
  const trimmedText = text.length > MAX_INPUT_LENGTH 
    ? text.substring(0, MAX_INPUT_LENGTH) + "..." 
    : text;
  
  const prompt = `Simplify the following text to a ${simplificationLevel} level and extract key concepts:

Original Text:
"${trimmedText.substring(0, PROMPT_MAX_LENGTH)}"

Return the results in JSON format:
{
  "simplifiedText": "[Simplified Text]",
  "keyConcepts": [
    { "term": "[Concept 1]", "explanation": "[Brief explanation]", "startIndex": 0, "endIndex": 0 },
    { "term": "[Concept 2]", "explanation": "[Brief explanation]", "startIndex": 0, "endIndex": 0 }
  ]
}

For each key concept, include the startIndex and endIndex representing its position in the original text if possible. 
Important: Focus on simplifying the language while preserving the core meaning of the text. Aim for:
- ${simplificationLevel === 'basic' ? 'Simple vocabulary and short sentences. Elementary school level.' : ''}
- ${simplificationLevel === 'moderate' ? 'Everyday language and straightforward sentences. Middle school level.' : ''}
- ${simplificationLevel === 'advanced' ? 'Somewhat simplified but retaining nuance. High school level.' : ''}`;

  try {
    const { model } = await getGeminiClient();
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { simplifiedText: responseText, keyConcepts: [] };
    } catch (jsonError) {
      console.error("Failed to parse JSON:", jsonError);
      return { simplifiedText: responseText, keyConcepts: [] };
    }
  } catch (error) {
    console.error("Error simplifying text:", error);
    throw new Error("Failed to simplify text. Please try again.");
  }
}

/**
 * Summarize text using Gemini AI
 */
export async function summarizeText(text) {
  if (!text) throw new Error("Please provide some text to summarize.");
  
  const trimmedText = text.length > MAX_INPUT_LENGTH 
    ? text.substring(0, MAX_INPUT_LENGTH) + "..." 
    : text;
  
  const prompt = `Summarize the following text and extract key concepts:

Original Text:
"${trimmedText.substring(0, PROMPT_MAX_LENGTH)}"

Return the results in JSON format:
{
  "summarizedText": "[Summarized Text]",
  "keyConcepts": [
    { "term": "[Concept 1]", "explanation": "[Brief explanation]", "startIndex": 0, "endIndex": 0 },
    { "term": "[Concept 2]", "explanation": "[Brief explanation]", "startIndex": 0, "endIndex": 0 }
  ]
}

For each key concept, include the startIndex and endIndex representing its position in the original text if possible.
Important: Create a concise summary that captures the main points and preserves the core meaning of the text.`;

  try {
    const { model } = await getGeminiClient();
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { summarizedText: responseText, keyConcepts: [] };
    } catch (jsonError) {
      console.error("Failed to parse JSON:", jsonError);
      return { summarizedText: responseText, keyConcepts: [] };
    }
  } catch (error) {
    console.error("Error summarizing text:", error);
    throw new Error("Failed to summarize text. Please try again.");
  }
}

/**
 * Explain a concept using Gemini AI
 */
export async function explainConcept(concept) {
  if (!concept) throw new Error("No concept provided.");
  
  const prompt = `Explain the concept "${concept}" in simple language that someone with cognitive differences would understand. Keep it under 2 sentences and avoid jargon.`;
  
  try {
    const { model } = await getGeminiClient();
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error explaining concept:", error);
    throw new Error("Failed to explain concept. Please try again.");
  }
}

/**
 * Verify an API key is valid
 */
export async function verifyApiKey(apiKey) {
  if (!apiKey) return false;
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    await model.generateContent("Test");
    return true;
  } catch (error) {
    console.error("API key verification error:", error);
    return false;
  }
}

export const getStoredApiKey = getApiKey;