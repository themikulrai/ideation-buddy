import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import PageCanvas, { type PageCanvasHandle } from './PageCanvas';
import type { Stroke, PDFAnnotations } from '../../types/annotationTypes';
import styles from './PDFLayer.module.css';

// Configure worker via CDN for better compatibility
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface PDFLayerHandle {
    exportPdf: () => void;
    captureCurrentPage: () => string;
}

interface PDFLayerProps {
    file: File | string | null;
    tool: 'pen' | 'eraser';
    color?: string;
    annotations: PDFAnnotations;
    onAnnotationsChange: (annotations: PDFAnnotations) => void;
}

const PDFLayer = forwardRef<PDFLayerHandle, PDFLayerProps>(({
    file,
    tool,
    color = '#ffffff',
    annotations,
    onAnnotationsChange
}, ref) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const pageWidth = window.innerWidth > 1000 ? 800 : window.innerWidth * 0.9;
    const containerRef = useRef<HTMLDivElement>(null);
    const pageCanvasRefs = useRef<Map<number, PageCanvasHandle>>(new Map());

    useImperativeHandle(ref, () => ({
        captureCurrentPage: () => {
            // Find the first visible page wrapper
            const container = containerRef.current;
            console.log('captureCurrentPage: container =', container);
            if (!container) {
                console.warn('captureCurrentPage: No container ref');
                return '';
            }

            // Get the first page's wrapper
            const pageWrapper = container.querySelector(`.${styles.pageWrapper}`) as HTMLElement;
            console.log('captureCurrentPage: pageWrapper =', pageWrapper);
            if (!pageWrapper) {
                console.warn('captureCurrentPage: No page wrapper found');
                // Try finding any div with relative positioning
                const allDivs = container.querySelectorAll('div');
                console.log('captureCurrentPage: Found divs:', allDivs.length);
                return '';
            }

            // Get the PDF canvas (rendered by react-pdf) - try multiple selectors
            let pdfCanvas = pageWrapper.querySelector('canvas.react-pdf__Page__canvas') as HTMLCanvasElement;
            if (!pdfCanvas) {
                // Try finding any canvas in the page wrapper
                const allCanvases = pageWrapper.querySelectorAll('canvas');
                console.log('captureCurrentPage: Found canvases:', allCanvases.length);
                if (allCanvases.length > 0) {
                    pdfCanvas = allCanvases[0] as HTMLCanvasElement;
                }
            }

            console.log('captureCurrentPage: pdfCanvas =', pdfCanvas);
            if (!pdfCanvas) {
                console.warn('No PDF canvas found for capture');
                return '';
            }

            console.log('captureCurrentPage: PDF canvas size:', pdfCanvas.width, 'x', pdfCanvas.height);

            // Create a combined canvas
            const combinedCanvas = document.createElement('canvas');
            const width = pdfCanvas.width;
            const height = pdfCanvas.height;
            combinedCanvas.width = width;
            combinedCanvas.height = height;

            const ctx = combinedCanvas.getContext('2d');
            if (!ctx) {
                console.warn('captureCurrentPage: Could not get canvas context');
                return '';
            }

            // Draw the PDF page first
            ctx.drawImage(pdfCanvas, 0, 0);

            // Overlay the annotation canvas if we have annotations
            const annotationCanvasHandle = pageCanvasRefs.current.get(1);
            if (annotationCanvasHandle) {
                // Find our annotation canvas (the second canvas in the wrapper)
                const allCanvases = pageWrapper.querySelectorAll('canvas');
                if (allCanvases.length > 1) {
                    const annotationCanvas = allCanvases[1] as HTMLCanvasElement;
                    ctx.drawImage(annotationCanvas, 0, 0, width, height);
                }
            }

            const result = combinedCanvas.toDataURL('image/png');
            console.log('captureCurrentPage: Result length:', result.length);
            return result;
        },
        exportPdf: async () => {
            if (!file) return;

            try {
                // Read the original PDF
                let pdfBytes: ArrayBuffer;
                if (file instanceof File) {
                    pdfBytes = await file.arrayBuffer();
                } else {
                    const response = await fetch(file);
                    pdfBytes = await response.arrayBuffer();
                }

                // Load the PDF with pdf-lib
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const pages = pdfDoc.getPages();

                // Embed annotations for each page
                for (let i = 0; i < pages.length; i++) {
                    const pageNumber = i + 1;
                    const canvasHandle = pageCanvasRefs.current.get(pageNumber);

                    if (canvasHandle && annotations[pageNumber]?.length > 0) {
                        const dataUrl = canvasHandle.getDataURL();
                        const pngImageBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
                        const pngImage = await pdfDoc.embedPng(pngImageBytes);

                        const page = pages[i];
                        const { width, height } = page.getSize();

                        // Draw the annotation image on top of the page
                        page.drawImage(pngImage, {
                            x: 0,
                            y: 0,
                            width: width,
                            height: height,
                        });
                    }
                }

                // Save the modified PDF
                const modifiedPdfBytes = await pdfDoc.save();

                // Create download link
                const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'annotated.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                console.log('PDF saved successfully!');
            } catch (err) {
                console.error('Error exporting PDF:', err);
                alert('Error saving PDF. See console for details.');
            }
        }
    }));

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setError(null);
    }

    function onDocumentLoadError(err: Error) {
        console.error("PDF Load Error:", err);
        setError(err.message);
    }

    const handleStrokesChange = (pageNumber: number, strokes: Stroke[]) => {
        const newAnnotations = { ...annotations, [pageNumber]: strokes };
        onAnnotationsChange(newAnnotations);
    };

    if (!file) {
        return (
            <div className={styles.placeholder}>
                <p>No PDF loaded</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.error}>
                <p>Failed to load PDF</p>
                <small>{error}</small>
            </div>
        );
    }

    return (
        <div className={styles.container} ref={containerRef}>
            <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                className={styles.document}
            >
                {/* Render all pages with annotation canvas overlays */}
                {Array.from(new Array(numPages), (_, index) => {
                    const pageNumber = index + 1;
                    // Estimate page height based on A4 ratio (roughly 1.414)
                    const pageHeight = pageWidth * 1.414;

                    return (
                        <div
                            key={`page_container_${pageNumber}`}
                            className={styles.pageWrapper}
                            style={{ position: 'relative', marginBottom: '20px' }}
                        >
                            <Page
                                pageNumber={pageNumber}
                                className={styles.page}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                width={pageWidth}
                            />
                            <PageCanvas
                                ref={(el) => {
                                    if (el) pageCanvasRefs.current.set(pageNumber, el);
                                }}
                                width={pageWidth}
                                height={pageHeight}
                                tool={tool}
                                color={color}
                                initialStrokes={annotations[pageNumber] || []}
                                onStrokesChange={(strokes) => handleStrokesChange(pageNumber, strokes)}
                            />
                        </div>
                    );
                })}
            </Document>
        </div>
    );
});

export default PDFLayer;


