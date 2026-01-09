import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import styles from './Canvas.module.css';

export interface CanvasHandle {
    getDataURL: () => string;
    clear: () => void;
}

interface CanvasProps {
    color?: string;
    lineWidth?: number;
    tool?: 'pen' | 'eraser';
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ color = '#ffffff', lineWidth = 3, tool = 'pen' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useImperativeHandle(ref, () => ({
        getDataURL: () => {
            if (canvasRef.current) {
                return canvasRef.current.toDataURL('image/png');
            }
            return '';
        },
        clear: () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }));

    const setupCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Handle high DPI displays
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            // Only resize if dimensions change to avoid clearing content
            if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.scale(dpr, dpr);
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                }
            }
        }
    };

    useEffect(() => {
        setupCanvas();
        window.addEventListener('resize', setupCanvas);
        return () => window.removeEventListener('resize', setupCanvas);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
            ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        }
    }, [color, lineWidth, tool]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        lastPos.current = { x, y };
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !lastPos.current || !canvasRef.current) return;

        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');

        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            lastPos.current = { x, y };
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const rect = canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    return (
        <canvas
            ref={canvasRef}
            className={styles.canvas}
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

export default Canvas;
