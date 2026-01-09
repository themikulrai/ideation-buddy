// Storage keys
const STORAGE_KEYS = {
    API_KEY: 'azure_api_key',
    BASE_URL: 'azure_base_url'
};

// Default base URL (user can change this)
const DEFAULT_BASE_URL = "https://YOUR-RESOURCE.cognitiveservices.azure.com";

// Helper to clean base URL
const cleanBaseUrl = (url: string): string => {
    try {
        // If user pasted a full URL with processing path, strip it
        if (url.includes('/openai/deployments')) {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}`;
        }
        // Remove trailing slash
        return url.replace(/\/$/, '');
    } catch (e) {
        return url;
    }
};

// Credential management functions
export const getStoredCredentials = (): { apiKey: string; baseUrl: string } | null => {
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const baseUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);

    if (!apiKey || !baseUrl) {
        return null;
    }

    return { apiKey, baseUrl };
};

export const setCredentials = (apiKey: string, baseUrl: string): void => {
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    localStorage.setItem(STORAGE_KEYS.BASE_URL, baseUrl);
};

export const hasCredentials = (): boolean => {
    return getStoredCredentials() !== null;
};

export const clearCredentials = (): void => {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.removeItem(STORAGE_KEYS.BASE_URL);
};

// Get endpoints dynamically based on stored credentials
const getEndpoints = () => {
    const credentials = getStoredCredentials();
    const rawBaseUrl = credentials?.baseUrl || DEFAULT_BASE_URL;
    const baseUrl = cleanBaseUrl(rawBaseUrl);

    return {
        STT: `${baseUrl}/openai/deployments/gpt-4o-transcribe-diarize/audio/transcriptions?api-version=2025-03-01-preview`,
        TTS: `${baseUrl}/openai/deployments/gpt-4o-mini-tts/audio/speech?api-version=2025-03-01-preview`,
        CHAT: `${baseUrl}/openai/deployments/gpt-5.2-chat/chat/completions?api-version=2025-04-01-preview`
    };
};

// Get API key for requests
const getApiKey = (): string => {
    const credentials = getStoredCredentials();
    return credentials?.apiKey || '';
};

// Abort controller for canceling ongoing requests
let currentAbortController: AbortController | null = null;

// Current audio element for stopping playback
let currentAudio: HTMLAudioElement | null = null;

// Stop all ongoing processing
export const stopAllProcessing = () => {
    // Abort any ongoing fetch requests
    if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
        console.log('Aborted ongoing requests');
    }

    // Stop any playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        console.log('Stopped audio playback');
    }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    // File name required for multipart/form-data
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "gpt-4o-transcribe-diarize");

    const response = await fetch(getEndpoints().STT, {
        method: "POST",
        headers: {
            "api-key": getApiKey()
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error(`STT Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text;
};

export const synthesizeSpeech = async (text: string): Promise<void> => {
    if (!text || text.trim().length === 0) {
        console.warn("TTS skipped: Input text is empty");
        return;
    }

    console.log("Synthesizing speech for:", text);

    // Create new abort controller for this request
    currentAbortController = new AbortController();

    try {
        const response = await fetch(getEndpoints().TTS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": getApiKey()
            },
            body: JSON.stringify({
                model: "gpt-4o-mini-tts",
                input: text,
                voice: "alloy",
                response_format: "mp3"
            }),
            signal: currentAbortController.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`TTS Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const audioBlob = await response.blob();
        console.log("Audio blob received:", audioBlob.type, audioBlob.size);

        if (audioBlob.size === 0) {
            console.error("Received empty audio blob");
            return;
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Store reference for stop functionality
        currentAudio = audio;

        // Return a promise that resolves when audio finishes
        return new Promise((resolve) => {
            let hasStarted = false;

            audio.onended = () => {
                console.log("Audio playback finished");
                currentAudio = null;
                resolve();
            };

            audio.onerror = (e) => {
                console.error("Error loading audio:", e);
                currentAudio = null;
                resolve();
            };

            // Handle when audio is paused (e.g., by stop button)
            audio.onpause = () => {
                if (audio.currentTime === 0) {
                    // Audio was stopped/reset, not just paused
                    console.log("Audio was stopped");
                    currentAudio = null;
                    resolve();
                }
            };

            audio.oncanplaythrough = () => {
                // Only start audio once
                if (hasStarted) return;
                hasStarted = true;

                console.log("Audio ready to play");
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => console.log("Audio playing started"))
                        .catch(error => {
                            console.error("Audio playback interrupted/failed:", error);
                            currentAudio = null;
                            resolve();
                        });
                }
            };
        });

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Speech synthesis was aborted');
        } else {
            console.error("Synthesize Speech Failed:", error);
        }
    }
};

// Check if audio is currently playing
export const isAudioPlaying = (): boolean => {
    return currentAudio !== null && !currentAudio.paused;
};

// Message type for conversation history
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export const analyzeWithAzure = async (
    imageData: string,
    prompt: string,
    conversationHistory: ChatMessage[] = []
): Promise<{ response: string; newMessage: ChatMessage; assistantMessage: ChatMessage }> => {
    // Create new abort controller for this request
    currentAbortController = new AbortController();

    // Build user content - include image only if valid
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: prompt }
    ];

    // Only include image if it's a valid data URL
    if (imageData && imageData.startsWith('data:')) {
        userContent.push({ type: "image_url", image_url: { url: imageData } });
    }

    // Build messages array with system message, conversation history, and new user message
    const messages: ChatMessage[] = [
        {
            role: "system",
            content: "You are a helpful creative assistant. Analyze the user's drawing or PDF content and spoken prompt. Provide helpful, concise ideas. Remember the context of the conversation."
        },
        ...conversationHistory,
        {
            role: "user",
            content: userContent
        }
    ];

    const payload = {
        messages,
        max_completion_tokens: 20000
    };

    const response = await fetch(getEndpoints().CHAT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": getApiKey()
        },
        body: JSON.stringify(payload),
        signal: currentAbortController.signal
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vision Error: ${response.statusText} - ${error}`);
    }

    const data = await response.json();
    console.log("Vision API Response (Full):", JSON.stringify(data, null, 2));

    const choice = data.choices[0];
    if (!choice) {
        throw new Error("No choices returned from API");
    }

    if (choice.finish_reason === 'content_filter') {
        console.warn("Content filter triggered");
        return {
            response: "I cannot describe this image due to safety filters.",
            newMessage: { role: "user", content: userContent },
            assistantMessage: { role: "assistant", content: "I cannot describe this image due to safety filters." }
        };
    }

    const content = choice.message?.content || choice.message?.refusal || "";

    if (!content) {
        console.warn("Vision API returned empty content. Finish reason:", choice.finish_reason);
    }

    return {
        response: content,
        newMessage: { role: "user", content: userContent },
        assistantMessage: { role: "assistant", content }
    };
};
