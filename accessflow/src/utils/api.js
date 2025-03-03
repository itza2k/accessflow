const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// Constants for text processing
const MAX_INPUT_LENGTH = 10000;
const PROMPT_MAX_LENGTH = 5000;

async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get('accessflow_api_key', (result) => {
            resolve(result.accessflow_api_key || '');
        });
    });
}

async function saveApiKey(apiKey) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ 'accessflow_api_key': apiKey }, () => {
            resolve(); 
        });
    });
}

async function makeGeminiRequest(prompt, generationConfig = {
    temperature: 0.2,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
}) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        throw new Error("API key not found. Please set your API key in the settings.");
    }

    const url = `${API_BASE_URL}?key=${apiKey}`;
    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
    };

    try {
        console.log("Making API request to Gemini...");
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Response:", errorText);

            if (response.status === 401 || response.status === 403) {
                throw new Error("Invalid API key. Please check your API key in settings.");
            } else if (response.status === 429) {
                throw new Error("Rate limit exceeded. Please try again later.");
            } else if (response.status >= 500) {
                throw new Error(`Server error (status ${response.status}).`);
            } else {
                throw new Error(`API request failed with status: ${response.status}`);
            }
        }

        const data = await response.json();

        // error form gemini
        if (data.error) {
            throw new Error(`Gemini API Error: ${data.error.message} (code ${data.error.code})`);
        }

        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            throw new Error("Received an empty or unexpected response from Gemini API.");
        }

        const content = data.candidates[0].content;
        if (!content.parts || content.parts.length === 0 || !content.parts[0].text) {
            throw new Error("No text content in the API response.");
        }

        return content.parts[0].text;

    } catch (error) {
        if (error.message.startsWith("Failed to fetch")) {
            throw new Error("Network error. Please check your internet connection.");
        }
        throw error; // Re-throw other errors
    }
}

async function simplifyText(text, simplificationLevel = "moderate") {
    if (!text?.trim()) {
        throw new Error("Please provide some text to simplify.");
    }

    const trimmedText = text.length > MAX_INPUT_LENGTH ? text.substring(0, MAX_INPUT_LENGTH) + "..." : text;

    const prompt = `Simplify the following text to a ${simplificationLevel} level, making it easier to understand while preserving the original meaning. Also, extract 3-5 key concepts from the text and return their explanations.

Original Text:
"${trimmedText.substring(0, PROMPT_MAX_LENGTH)}"

Return the results in JSON format:
{
  "simplifiedText": "[Simplified Text]",
  "keyConcepts": [
    { "term": "[Concept 1]", "explanation": "[Brief explanation]" },
    { "term": "[Concept 2]", "explanation": "[Brief explanation]" },
    ...
  ]
}`;

    const result = await makeGeminiRequest(prompt);
    console.log("Simplification result received");
    
    try {
        // Extract JSON from response - sometimes API might wrap it in markdown or other text
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        // Fallback for non-JSON responses
        return { simplifiedText: result, keyConcepts: [] };
    } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError, result);
        return { simplifiedText: result, keyConcepts: [] };
    }
}

async function summarizeText(text) {
    if (!text?.trim()) {
        throw new Error("Please provide some text to summarize.");
    }

    const trimmedText = text.length > MAX_INPUT_LENGTH ? text.substring(0, MAX_INPUT_LENGTH) + "..." : text;

    const prompt = `Provide a concise summary of the following text, highlighting the main points. Also, extract 3-5 key concepts from the text and return their explanations.

Original Text:
"${trimmedText.substring(0, PROMPT_MAX_LENGTH)}"

Return the results in JSON format:
{
  "summarizedText": "[Summarized Text]",
  "keyConcepts": [
    { "term": "[Concept 1]", "explanation": "[Brief explanation]" },
    { "term": "[Concept 2]", "explanation": "[Brief explanation]" },
    ...
  ]
}`;

    const result = await makeGeminiRequest(prompt);
    console.log("Summarization result received");
    
    try {
        // Extract the json
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return { summarizedText: result, keyConcepts: [] };
    } catch (jsonError) {// non json fallback
        console.error("Failed to parse JSON response:", jsonError, result);
        return { summarizedText: result, keyConcepts: [] };
    }
}

async function explainConcept(concept) {
    if (!concept?.trim()) {
        throw new Error("No concept provided for explanation.");
    }

    const prompt = `Provide a simple, clear explanation of the following concept in 1-2 sentences:

Concept: "${concept}"`;

    return await makeGeminiRequest(prompt);
}


async function verifyApiKey(apiKey) { // verify api
    if (!apiKey?.trim()) {
        return false;
    }

    const url = `${API_BASE_URL}?key=${apiKey}`;
    const requestBody = { 
        contents: [{ parts: [{ text: "test" }] }], 
        generationConfig: { maxOutputTokens: 5 } 
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });
        return response.ok; // True if 200-299 otherwise false 

    } catch (error) {
        console.error("API key verification error:", error);
        return false;
    }
}

export { simplifyText, summarizeText, explainConcept, getApiKey, saveApiKey, verifyApiKey };