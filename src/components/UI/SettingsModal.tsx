import { useState, useEffect } from 'react';
import { getStoredCredentials, setCredentials, hasCredentials } from '../../services/azure';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        if (isOpen) {
            const stored = getStoredCredentials();
            if (stored) {
                setApiKey(stored.apiKey);
                setBaseUrl(stored.baseUrl);
            } else {
                setApiKey('');
                setBaseUrl('https://YOUR-RESOURCE.cognitiveservices.azure.com');
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        if (apiKey.trim() && baseUrl.trim()) {
            setCredentials(apiKey.trim(), baseUrl.trim());
            onSave();
            onClose();
        }
    };

    const canSave = apiKey.trim().length > 0 && baseUrl.trim().length > 0;

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2 className={styles.title}>
                    ⚙️ Azure OpenAI Settings
                </h2>
                <p className={styles.subtitle}>
                    Enter your Azure OpenAI credentials. They'll be stored locally in your browser.
                </p>

                <div className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label}>API Key</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="Enter your Azure OpenAI API key"
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Endpoint URL</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={baseUrl}
                            onChange={e => setBaseUrl(e.target.value)}
                            placeholder="https://your-resource.cognitiveservices.azure.com"
                        />
                        <span className={styles.hint}>
                            Your Azure OpenAI resource endpoint (without /openai/...)
                        </span>
                    </div>

                    <div className={styles.buttons}>
                        {hasCredentials() && (
                            <button
                                type="button"
                                className={`${styles.button} ${styles.cancelButton}`}
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="button"
                            className={`${styles.button} ${styles.saveButton}`}
                            onClick={handleSave}
                            disabled={!canSave}
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Settings button component for opening the modal
export function SettingsButton({ onClick }: { onClick: () => void }) {
    return (
        <button className={styles.settingsButton} onClick={onClick} title="Settings">
            ⚙️
        </button>
    );
}
