import { useState, useEffect } from 'react';
import { getStoredCredentials, setCredentials, testConnection, getStoredDeployments, setStoredDeployments } from '../../services/azure';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [deployments, setDeployments] = useState(getStoredDeployments());
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const stored = getStoredCredentials();
            const storedDeps = getStoredDeployments();
            if (stored) {
                setApiKey(stored.apiKey);
                setBaseUrl(stored.baseUrl);
            } else {
                setApiKey('');
                setBaseUrl('https://YOUR-RESOURCE.cognitiveservices.azure.com');
            }
            setDeployments(storedDeps);
            setTestStatus('idle');
        }
    }, [isOpen]);

    const handleSave = () => {
        if (apiKey.trim() && baseUrl.trim()) {
            setCredentials(apiKey.trim(), baseUrl.trim());
            setStoredDeployments(deployments);
            onSave();
            onClose();
        }
    };

    const handleTestConnection = async () => {
        if (!apiKey.trim() || !baseUrl.trim()) return;
        setTestStatus('testing');
        const success = await testConnection(
            apiKey.trim(),
            baseUrl.trim(),
            deployments.CHAT
        );
        setTestStatus(success ? 'success' : 'error');
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
                            Your Azure OpenAI resource endpoint
                        </span>
                    </div>

                    <div className={styles.testSection}>
                        <button
                            type="button"
                            className={`${styles.testButton} ${testStatus === 'success' ? styles.success : testStatus === 'error' ? styles.error : ''}`}
                            onClick={handleTestConnection}
                            disabled={!canSave || testStatus === 'testing'}
                        >
                            {testStatus === 'testing' ? 'Testing...' :
                                testStatus === 'success' ? '✅ Connection Verified' :
                                    testStatus === 'error' ? '❌ Connection Failed' :
                                        'Test Connection'}
                        </button>
                        {testStatus === 'error' && <p className={styles.errorText}>Check your Key and Endpoint. Make sure your resource is accessible.</p>}
                    </div>

                    <div className={styles.advancedToggle} onClick={() => setShowAdvanced(!showAdvanced)}>
                        <span>{showAdvanced ? '▼' : '▶'} Advanced: Deployment Names</span>
                    </div>

                    {showAdvanced && (
                        <div className={styles.advancedSection}>
                            <div className={styles.field}>
                                <label className={styles.label}>Chat Deployment</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={deployments.CHAT}
                                    onChange={e => setDeployments({ ...deployments, CHAT: e.target.value })}
                                    placeholder="e.g. gpt-4o"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>STT Deployment</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={deployments.STT}
                                    onChange={e => setDeployments({ ...deployments, STT: e.target.value })}
                                    placeholder="e.g. whisper"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>TTS Deployment</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={deployments.TTS}
                                    onChange={e => setDeployments({ ...deployments, TTS: e.target.value })}
                                    placeholder="e.g. tts"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>API Version</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={deployments.API_VERSION || ''}
                                    onChange={e => setDeployments({
                                        ...deployments,
                                        API_VERSION: e.target.value
                                    })}
                                    placeholder="e.g. 2024-05-01-preview"
                                />
                                <span className={styles.hint}>
                                    Target API version for your region/model
                                </span>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttons}>
                        <button
                            type="button"
                            className={`${styles.button} ${styles.cancelButton}`}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
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
