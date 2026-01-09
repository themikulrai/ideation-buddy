import React from 'react';
import styles from './ModeSwitcher.module.css';

interface ModeSwitcherProps {
    mode: 'whiteboard' | 'pdf';
    onSwitch: (mode: 'whiteboard' | 'pdf') => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, onSwitch }) => {
    return (
        <div className={styles.container}>
            <div className={styles.bg} />
            <button
                className={`${styles.option} ${mode === 'pdf' ? styles.active : ''}`}
                onClick={() => onSwitch('pdf')}
            >
                PDF
            </button>
            <button
                className={`${styles.option} ${mode === 'whiteboard' ? styles.active : ''}`}
                onClick={() => onSwitch('whiteboard')}
            >
                Whiteboard
            </button>
            <div
                className={styles.indicator}
                style={{ transform: mode === 'whiteboard' ? 'translateX(100%)' : 'translateX(0)' }}
            />
        </div>
    );
};

export default ModeSwitcher;
