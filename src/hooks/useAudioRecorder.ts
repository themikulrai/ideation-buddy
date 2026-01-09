import { useState, useRef } from 'react';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const stopRecording = (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const mediaRecorder = mediaRecorderRef.current;
            if (!mediaRecorder) {
                reject("No recorder found");
                return;
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                chunksRef.current = [];
                resolve(blob);
            };

            mediaRecorder.stop();
            // Stop all tracks to release mic
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        });
    };

    return { isRecording, startRecording, stopRecording };
};
