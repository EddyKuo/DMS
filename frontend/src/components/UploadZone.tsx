import React, { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { triggerUpload } from './UploadManager';

const UploadZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dragActive, setDragActive] = useState(false);
    const dragCounterRef = useRef(0);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        if (dragCounterRef.current === 1) {
            setDragActive(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setDragActive(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            triggerUpload(files);
        }
    };

    return (
        <Box
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            sx={{ position: 'relative', height: '100%', width: '100%' }}
        >
            {children}
            {dragActive && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 188, 212, 0.1)',
                        border: '2px dashed #00bcd4',
                        zIndex: 999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(3px)',
                        pointerEvents: 'none' // Prevent overlay from interfering with drag events
                    }}
                >
                    <CloudUploadIcon sx={{ fontSize: 60, color: '#00bcd4', mb: 2 }} />
                    <Typography variant="h5" color="primary">Drop files to upload</Typography>
                </Box>
            )}
        </Box>
    );
};

export default UploadZone;

