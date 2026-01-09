// Azure OpenAI Service with localStorage-based API key management

const STORAGE_KEY = 'azure_openai_config';

export interface AzureConfig {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
    speechKey?: string;
    speechRegion?: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface AnalysisResult {
    response: string;
    newMessage: ChatMessage;
    assistantMessage: ChatMessage;
}

// Configuration management
export function getConfig(): AzureConfig | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

export function saveConfig(config: AzureConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function isConfigured(): boolean {
    const config = getConfig();
    return !!(config?.endpoint && config?.apiKey && config?.deploymentName);
}

// Azure OpenAI API calls
export async function analyzeWithAzure(
    imageData: string,
    prompt: string,
    conversationHistory: ChatMessage[]
): Promise<AnalysisResult> {
    const config = getConfig();
    if (!config) {
        throw new Error('Azure OpenAI is not configured. Please add your API credentials.');
    }

    const { endpoint, apiKey, deploymentName } = config;

    // Build the new user message
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    if (imageData) {
        userContent.push({
            type: 'image_url',
            image_url: { url: imageData }
        });
    }

    userContent.push({
        type: 'text',
        text: prompt
    });

    const newMessage: ChatMessage = {
        role: 'user',
        content: userContent
    };

    // Build messages array with history
    const messages: ChatMessage[] = [
        {
            role: 'system',
            content: 'You are a helpful AI assistant that analyzes images and provides creative insights. Be concise but thorough.'
        },
        ...conversationHistory,
        newMessage
    ];

    const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
        },
        body: JSON.stringify({
            messages,
            max_tokens: 1000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Azure OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || 'No response generated.';

    const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseText
    };

    return {
        response: responseText,
        newMessage,
        assistantMessage
    };
}

// Speech synthesis
let currentAudio: HTMLAudioElement | null = null;

export async function synthesizeSpeech(text: string): Promise<void> {
    const config = getConfig();
    if (!config?.speechKey || !config?.speechRegion) {
        console.log('Speech synthesis not configured, skipping...');
        return;
    }

    const { speechKey, speechRegion } = config;

    const url = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const ssml = `
    <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
      <voice name='en-US-JennyNeural'>
        ${text}
      </voice>
    </speak>
  `;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': speechKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        body: ssml
    });

    if (!response.ok) {
        console.error('Speech synthesis failed:', await response.text());
        return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    currentAudio = new Audio(audioUrl);
    await currentAudio.play();
}

export function stopAllProcessing(): void {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}
