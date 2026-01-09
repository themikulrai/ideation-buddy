export interface Point {
    x: number;
    y: number;
}

export interface Stroke {
    points: Point[];
    color: string;
    lineWidth: number;
    tool: 'pen' | 'eraser';
}

export interface PageAnnotation {
    pageNumber: number;
    strokes: Stroke[];
}

export type PDFAnnotations = {
    [pageNumber: number]: Stroke[];
};
