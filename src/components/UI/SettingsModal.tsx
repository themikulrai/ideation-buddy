import { useState, useEffect } from 'react';
import { getConfig, saveConfig, testConnection, type AzureConfig } from '../../services/azure';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    canClose?: boolean;
}

export default function SettingsModal({ isOpen, onClose, onSave, canClose = true }: SettingsModalProps) {
    const [endpoint, setEndpoint] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [deploymentName, setDeploymentName] = useState('');
    const [speechKey, setSpeechKey] = useState('');
    const [speechRegion, setSpeechRegion] = useState('');
    const [error, setError] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            const config = getConfig();
            if (config) {
                setEndpoint(config.endpoint || '');
                setApiKey(config.apiKey || '');
                setDeploymentName(config.deploymentName || '');
                setSpeechKey(config.speechKey || '');
                setSpeechRegion(config.speechRegion || '');
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!endpoint || !apiKey || !deploymentName) {
            setError('Please fill in all required fields.');
            return;
        }

        const config: AzureConfig = {
            endpoint: endpoint.trim(),
            apiKey: apiKey.trim(),
            deploymentName: deploymentName.trim(),
            speechKey: speechKey.trim() || undefined,
            speechRegion: speechRegion.trim() || undefined,
        };

        saveConfig(config);
        setError('');
        onSave();
        onClose();
    };

    const handleTestConnection = async () => {
        if (!endpoint || !apiKey || !deploymentName) {
            setError('Please fill in all required fields.');
            return;
        }

        setTestStatus('testing');
        setTestMessage('');
        setError('');

        const result = await testConnection({
            endpoint: endpoint.trim(),
            apiKey: apiKey.trim(),
            deploymentName: deploymentName.trim()
        });

        if (result.success) {
            setTestStatus('success');
            setTestMessage(result.message);
        } else {
            setTestStatus('error');
            setTestMessage(result.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={canClose ? onClose : undefined}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2 className={styles.title}>Azure OpenAI Settings</h2>
                <p className={styles.subtitle}>
                    Enter your Azure OpenAI credentials to use this app. Your keys are stored locally in your browser.
                </p>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.form}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Endpoint <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="https://your-resource.openai.azure.com"
                            value={endpoint}
                            onChange={e => setEndpoint(e.target.value)}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            API Key <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="Enter your API key"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Deployment Name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="gpt-4o"
                            value={deploymentName}
                            onChange={e => setDeploymentName(e.target.value)}
                        />
                    </div>

                    <hr className={styles.divider} />
                    <p className={styles.sectionLabel}>Speech (Optional)</p>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Speech Key <span className={styles.optional}>(optional)</span>
                        </label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="For text-to-speech"
                            value={speechKey}
                            onChange={e => setSpeechKey(e.target.value)}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Speech Region <span className={styles.optional}>(optional)</span>
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="e.g., eastus"
                            value={speechRegion}
                            onChange={e => setSpeechRegion(e.target.value)}
                        />
                    </div>

                    <div className={styles.buttons}>
                        <button
                            className={styles.testButton}
                            onClick={handleTestConnection}
                            disabled={!endpoint || !apiKey || !deploymentName || testStatus === 'testing'}
                        >
                            {testStatus === 'testing' ? '⏳ Testing...' : '🔌 Test Connection'}
                        </button>
                        {canClose && (
                            <button className={styles.cancelButton} onClick={onClose}>
                                Cancel
                            </button>
                        )}
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                            disabled={!endpoint || !apiKey || !deploymentName}
                        >
                            Save Settings
                        </button>
                    </div>
                    {testStatus !== 'idle' && (
                        <div className={testStatus === 'success' ? styles.success : styles.error}>
                            {testMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
