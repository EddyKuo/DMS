import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, LinearProgress, IconButton, Collapse } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { fileApi } from '../api/services';
import { useFileStore } from '../store/fileStore';

interface UploadItem {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
}

// Global event emitter for uploads (simplest way to trigger from anywhere)
export const uploadEvent = new EventTarget();

export const triggerUpload = (files: File[]) => {
    const event = new CustomEvent('upload', { detail: files });
    uploadEvent.dispatchEvent(event);
};

const UploadManager: React.FC = () => {
    const { t } = useTranslation();
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [open, setOpen] = useState(true);
    const { currentFolderId, triggerRefresh } = useFileStore();

    useEffect(() => {
        const handleUpload = (e: Event) => {
            const files = (e as CustomEvent).detail as File[];
            const newUploads = files.map(f => ({ file: f, progress: 0, status: 'pending' as const }));
            setUploads(prev => [...prev, ...newUploads]);
            setOpen(true);
        };

        uploadEvent.addEventListener('upload', handleUpload);
        return () => uploadEvent.removeEventListener('upload', handleUpload);
    }, []);

    // Track which uploads have been processed
    const processingRef = React.useRef<Set<number>>(new Set());
    const completedRef = React.useRef<Set<number>>(new Set());
    const needsRefreshRef = React.useRef(false);

    useEffect(() => {
        const processUploads = async () => {
            let hasMorePending = true;

            while (hasMorePending) {
                hasMorePending = false;

                for (let i = 0; i < uploads.length; i++) {
                    const upload = uploads[i];

                    // Skip if already processing or completed
                    if (processingRef.current.has(i) || completedRef.current.has(i)) continue;

                    if (upload.status === 'pending') {
                        hasMorePending = true;
                        processingRef.current.add(i);

                        // Start upload
                        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: 'uploading' } : u));

                        try {
                            await fileApi.upload(
                                upload.file,
                                currentFolderId,
                                (progress) => {
                                    setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, progress } : u));
                                }
                            );

                            setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: 'completed', progress: 100 } : u));
                            completedRef.current.add(i);
                            needsRefreshRef.current = true;
                        } catch (error) {
                            console.error("Upload failed", error);
                            setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: 'error', error: 'Failed' } : u));
                            completedRef.current.add(i);
                        } finally {
                            processingRef.current.delete(i);
                        }
                        break; // Process one at a time, then check for more
                    }
                }
            }

            // Only refresh once after all uploads are done
            if (needsRefreshRef.current) {
                needsRefreshRef.current = false;
                triggerRefresh();
            }
        };

        if (uploads.some(u => u.status === 'pending')) {
            processUploads();
        }
    }, [uploads.length, currentFolderId, triggerRefresh]);

    const getStatusText = (status: UploadItem['status']) => {
        switch (status) {
            case 'pending': return t('upload.pending');
            case 'uploading': return t('upload.uploading');
            case 'completed': return t('upload.completed');
            case 'error': return t('upload.failed');
            default: return status;
        }
    };

    if (uploads.length === 0) return null;

    return (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, width: 300, zIndex: 2000 }}>
            <Paper sx={{ overflow: 'hidden', boxShadow: 3 }}>
                <Box
                    sx={{ p: 1, backgroundColor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setOpen(!open)}
                >
                    <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        {t('common.upload')} ({uploads.filter(u => u.status === 'completed').length}/{uploads.length})
                    </Typography>
                    {open ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                    <IconButton size="small" color="inherit" onClick={(e) => { e.stopPropagation(); setUploads([]); }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Collapse in={open}>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                        {uploads.map((item, index) => (
                            <Box key={index} sx={{ p: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" noWrap sx={{ maxWidth: '70%' }}>{item.file.name}</Typography>
                                    <Typography variant="caption">{getStatusText(item.status)}</Typography>
                                </Box>
                                <LinearProgress
                                    variant={item.status === 'uploading' ? 'indeterminate' : 'determinate'}
                                    value={item.progress}
                                    color={item.status === 'error' ? 'error' : 'primary'}
                                />
                            </Box>
                        ))}
                    </Box>
                </Collapse>
            </Paper>
        </Box>
    );
};

export default UploadManager;
