import React from 'react';
import styles from './Toolbar.module.css';

interface ToolbarProps {
    currentTool: 'pen' | 'eraser';
    onToolChange: (tool: 'pen' | 'eraser') => void;
    onClear: () => void;
    penColor?: 'white' | 'black';
    onPenColorChange?: (color: 'white' | 'black') => void;
    showSave?: boolean;
    onSave?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    currentTool,
    onToolChange,
    onClear,
    penColor = 'white',
    onPenColorChange,
    showSave = false,
    onSave
}) => {
    return (
        <div className={styles.container}>
            <button
                className={`${styles.tool} ${currentTool === 'pen' ? styles.active : ''}`}
                onClick={() => onToolChange('pen')}
                aria-label="Pen"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                    <path d="M2 2l7.586 7.586"></path>
                    <circle cx="11" cy="11" r="2"></circle>
                </svg>
            </button>

            {/* Color picker - only show when pen is selected */}
            {currentTool === 'pen' && onPenColorChange && (
                <>
                    <button
                        className={`${styles.colorTool} ${penColor === 'white' ? styles.active : ''}`}
                        onClick={() => onPenColorChange('white')}
                        aria-label="White Pen"
                        style={{ backgroundColor: '#ffffff', border: '2px solid #666' }}
                    />
                    <button
                        className={`${styles.colorTool} ${penColor === 'black' ? styles.active : ''}`}
                        onClick={() => onPenColorChange('black')}
                        aria-label="Black Pen"
                        style={{ backgroundColor: '#000000', border: '2px solid #666' }}
                    />
                </>
            )}

            <button
                className={`${styles.tool} ${currentTool === 'eraser' ? styles.active : ''}`}
                onClick={() => onToolChange('eraser')}
                aria-label="Eraser"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path>
                    <path d="M17 17L7 7"></path>
                </svg>
            </button>
            <div className={styles.divider} />
            <button
                className={styles.tool}
                onClick={onClear}
                aria-label="Clear All"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>

            {/* Save button - only show in PDF mode with file loaded */}
            {showSave && onSave && (
                <>
                    <div className={styles.divider} />
                    <button
                        className={styles.tool}
                        onClick={onSave}
                        aria-label="Save PDF"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
};

export default Toolbar;

