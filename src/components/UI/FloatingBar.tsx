import React, { useState } from 'react';
import styles from './FloatingBar.module.css';

interface FloatingBarProps {
    onSendMessage: (text: string) => void;
    onCapture: () => void;
    onStop: () => void;
    onClearContext: () => void;
    isProcessing?: boolean;
    hasContext?: boolean;
}

const FloatingBar: React.FC<FloatingBarProps> = ({
    onSendMessage,
    onCapture,
    onStop,
    onClearContext,
    isProcessing = false,
    hasContext = false
}) => {
    const [inputText, setInputText] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.inputGroup}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Ask AI anything..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing}
                />
            </div>

            {/* Stop button - visible when processing */}
            {isProcessing && (
                <button
                    className={styles.stopButton}
                    onClick={onStop}
                    aria-label="Stop Processing"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                </button>
            )}

            {/* Clear context button - visible when there's conversation history */}
            {hasContext && !isProcessing && (
                <button
                    className={styles.clearContextButton}
                    onClick={onClearContext}
                    aria-label="Clear Conversation History"
                    title="Start New Chat"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M8 16H3v5" />
                    </svg>
                </button>
            )}

            <button
                className={`${styles.cameraButton} ${isProcessing ? styles.processing : ''}`}
                onClick={onCapture}
                aria-label="Capture and Analyze"
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <div className={styles.spinner} />
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                )}
            </button>
        </div>
    );
};

export default FloatingBar;

