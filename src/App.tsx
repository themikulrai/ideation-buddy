import { useState, useRef, useEffect } from 'react';
import Canvas, { type CanvasHandle } from './components/Whiteboard/Canvas';
import PDFLayer, { type PDFLayerHandle } from './components/Whiteboard/PDFLayer';
import FloatingBar from './components/UI/FloatingBar';
import ModeSwitcher from './components/UI/ModeSwitcher';
import Toolbar from './components/UI/Toolbar';
import SettingsModal, { SettingsButton } from './components/UI/SettingsModal';
import { analyzeWithAzure, synthesizeSpeech, stopAllProcessing, hasCredentials, type ChatMessage } from './services/azure';
import type { PDFAnnotations } from './types/annotationTypes';
import styles from './components/Whiteboard/PDFViewer.module.css';
import './App.css';

function App() {
  const [mode, setMode] = useState<'whiteboard' | 'pdf'>('whiteboard');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<'white' | 'black'>('white');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfAnnotations, setPdfAnnotations] = useState<PDFAnnotations>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const canvasRef = useRef<CanvasHandle>(null);
  const pdfLayerRef = useRef<PDFLayerHandle>(null);

  useEffect(() => {
    // Check for credentials on mount
    if (!hasCredentials()) {
      setIsSettingsOpen(true);
    }
  }, []);

  // Helper to get the appropriate image based on current mode
  const getCapturedImage = (): string => {
    if (mode === 'pdf' && pdfFile && pdfLayerRef.current) {
      return pdfLayerRef.current.captureCurrentPage();
    }
    return canvasRef.current ? canvasRef.current.getDataURL() : '';
  };

  const handleSendMessage = async (text: string) => {
    setIsProcessing(true);
    try {
      const capturedImage = getCapturedImage();
      console.log("Captured image data URL:", capturedImage ? capturedImage.substring(0, 100) + "..." : "EMPTY");
      console.log("Image data length:", capturedImage.length);
      console.log("Conversation history length:", conversationHistory.length);

      const result = await analyzeWithAzure(
        capturedImage.length > 100 ? capturedImage : '',
        text,
        conversationHistory
      );

      // Update conversation history with new messages
      setConversationHistory(prev => [...prev, result.newMessage, result.assistantMessage]);

      await synthesizeSpeech(result.response);
    } catch (error) {
      console.error("Error processing request:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapture = async () => {
    const imageData = getCapturedImage();
    if (imageData) {
      setIsProcessing(true);
      try {
        const prompt = mode === 'pdf'
          ? "Analyze this PDF page and any annotations. Provide helpful insights."
          : "Analyze this drawing and give me ideas.";
        const result = await analyzeWithAzure(imageData, prompt, conversationHistory);

        // Update conversation history
        setConversationHistory(prev => [...prev, result.newMessage, result.assistantMessage]);

        await synthesizeSpeech(result.response);
      } catch (error) {
        console.error("Capture error:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };



  const handleStop = () => {
    stopAllProcessing();
    setIsProcessing(false);
  };

  const handleClearConversation = () => {
    setConversationHistory([]);
    console.log("Conversation history cleared");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfAnnotations({}); // Reset annotations for new PDF
    }
  };

  const handleClear = () => {
    if (mode === 'whiteboard') {
      canvasRef.current?.clear();
    } else {
      // Clear all PDF annotations
      setPdfAnnotations({});
    }
  };

  const handleSavePdf = () => {
    if (pdfLayerRef.current) {
      pdfLayerRef.current.exportPdf();
    }
  };

  const currentColor = penColor === 'white' ? '#ffffff' : '#000000';

  return (
    <div className="app-container">
      <ModeSwitcher mode={mode} onSwitch={setMode} />

      <SettingsButton onClick={() => setIsSettingsOpen(true)} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => console.log('Settings saved')}
      />

      <div className="content-area">
        {/* Whiteboard background - only in whiteboard mode */}
        {mode === 'whiteboard' && <div className="whiteboard-bg" />}

        {/* Canvas - always rendered but hidden in PDF mode to preserve state */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: mode === 'whiteboard' ? 10 : -1,
          visibility: mode === 'whiteboard' ? 'visible' : 'hidden',
          pointerEvents: mode === 'whiteboard' ? 'auto' : 'none'
        }}>
          <Canvas ref={canvasRef} tool={tool} color={currentColor} />
        </div>

        {/* PDF mode: show PDF with per-page annotation canvases */}
        {mode === 'pdf' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            overflow: 'auto'
          }}>
            {pdfFile ? (
              <PDFLayer
                ref={pdfLayerRef}
                file={pdfFile}
                tool={tool}
                color={currentColor}
                annotations={pdfAnnotations}
                onAnnotationsChange={setPdfAnnotations}
              />
            ) : (
              <div className={styles.placeholder}>
                <div className={styles.uploadBox}>
                  <p>Upload a PDF to discuss</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Toolbar
        currentTool={tool}
        onToolChange={setTool}
        onClear={handleClear}
        penColor={penColor}
        onPenColorChange={setPenColor}
        showSave={mode === 'pdf' && !!pdfFile}
        onSave={handleSavePdf}
      />

      <FloatingBar
        onSendMessage={handleSendMessage}
        onCapture={handleCapture}
        onStop={handleStop}
        onClearContext={handleClearConversation}
        isProcessing={isProcessing}
        hasContext={conversationHistory.length > 0}
      />
    </div>
  );
}

export default App;


