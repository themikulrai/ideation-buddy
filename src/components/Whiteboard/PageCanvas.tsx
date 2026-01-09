import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { Stroke, Point } from '../../types/annotationTypes';

export interface PageCanvasHandle {
    getStrokes: () => Stroke[];
    setStrokes: (strokes: Stroke[]) => void;
    clear: () => void;
    redraw: () => void;
    getDataURL: () => string;
}

interface PageCanvasProps {
    width: number;
    height: number;
    tool: 'pen' | 'eraser';
    color?: string;
    lineWidth?: number;
    initialStrokes?: Stroke[];
    onStrokesChange?: (strokes: Stroke[]) => void;
}

const PageCanvas = forwardRef<PageCanvasHandle, PageCanvasProps>(({
    width,
    height,
    tool,
    color = '#ffffff',
    lineWidth = 3,
    initialStrokes = [],
    onStrokesChange
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
    const [isDrawing, setIsDrawing] = useState(false);
    const currentStroke = useRef<Point[]>([]);

    useImperativeHandle(ref, () => ({
        getStrokes: () => strokes,
        setStrokes: (newStrokes: Stroke[]) => {
            setStrokes(newStrokes);
        },
        clear: () => {
            setStrokes([]);
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
        },
        redraw: () => redrawCanvas(),
        getDataURL: () => {
            if (canvasRef.current) {
                return canvasRef.current.toDataURL('image/png');
            }
            return '';
        }
    }));

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw all strokes
        strokes.forEach(stroke => {
            if (stroke.points.length < 2) return;

            ctx.beginPath();
            ctx.strokeStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
            ctx.lineWidth = stroke.tool === 'eraser' ? 20 : stroke.lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });

        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(dpr, dpr);
            }
        }
        redrawCanvas();
    }, [width, height]);

    // Sync with parent's initialStrokes when they change (e.g., when cleared)
    useEffect(() => {
        // Only sync if the parent's data differs significantly (e.g., was cleared)
        if (initialStrokes.length === 0 && strokes.length > 0) {
            setStrokes([]);
        } else if (initialStrokes.length > 0 && strokes.length === 0) {
            setStrokes(initialStrokes);
        }
    }, [initialStrokes]);

    useEffect(() => {
        redrawCanvas();
    }, [strokes]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setIsDrawing(true);
        const point = getCoordinates(e);
        currentStroke.current = [point];
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.stopPropagation();

        const point = getCoordinates(e);
        currentStroke.current.push(point);

        // Draw the current stroke in real-time
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && currentStroke.current.length >= 2) {
            const points = currentStroke.current;
            const prev = points[points.length - 2];
            const curr = points[points.length - 1];

            ctx.beginPath();
            ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
            ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentStroke.current.length >= 2) {
            const newStroke: Stroke = {
                points: [...currentStroke.current],
                color,
                lineWidth,
                tool
            };
            const newStrokes = [...strokes, newStroke];
            setStrokes(newStrokes);
            onStrokesChange?.(newStrokes);
        }

        currentStroke.current = [];
    };

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${width}px`,
                height: `${height}px`,
                pointerEvents: 'auto',
                touchAction: 'none'
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
    );
});

export default PageCanvas;
