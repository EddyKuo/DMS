import React, { useState } from 'react';
import { Drawer, Box, Typography, Divider, TextField, Button, Chip, Snackbar, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { FileModel } from '../types/api';
import { client } from '../api/client';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import VersionHistoryPanel from './VersionHistoryPanel';


interface InfoDrawerProps {
    open: boolean;
    onClose: () => void;
    file: FileModel | null;
    onFileUpdated?: (updatedFile: FileModel) => void;
}

const InfoDrawer: React.FC<InfoDrawerProps> = ({ open, onClose, file, onFileUpdated }) => {
    const { t } = useTranslation();
    const [newTag, setNewTag] = useState('');
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
    const [localTags, setLocalTags] = useState<{ id: number; name: string }[]>([]);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Sync local tags with file tags when file changes
    React.useEffect(() => {
        if (file?.tags) {
            setLocalTags(file.tags);
        }
    }, [file]);

    if (!file) return null;

    const handleAddTag = async () => {
        if (!newTag.trim()) return;
        try {
            const response = await client.post<FileModel>(`/files/${file.id}/tags`, { name: newTag });
            setLocalTags(response.data.tags || []);
            setNewTag('');
            setSnackbar({
                open: true,
                message: t('infoDrawer.tagAdded'),
                severity: 'success',
            });
            onFileUpdated?.(response.data);
        } catch (e) {
            console.error(e);
            setSnackbar({
                open: true,
                message: t('common.error'),
                severity: 'error',
            });
        }
    };

    const handleDeleteTag = async (tagName: string) => {
        try {
            await client.delete(`/files/${file.id}/tags/${encodeURIComponent(tagName)}`);
            setLocalTags(prev => prev.filter(tag => tag.name !== tagName));
            setSnackbar({
                open: true,
                message: t('infoDrawer.tagDeleted'),
                severity: 'success',
            });
        } catch (e) {
            console.error(e);
            setSnackbar({
                open: true,
                message: t('common.error'),
                severity: 'error',
            });
        }
    };

    const handleVersionRestored = (updatedFile: FileModel) => {
        onFileUpdated?.(updatedFile);
    };

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                sx={{ '& .MuiDrawer-paper': { width: 350, p: 3, backgroundColor: '#1e1e1e' } }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">{t('infoDrawer.fileDetails')}</Typography>
                    <CloseIcon onClick={onClose} sx={{ cursor: 'pointer' }} />
                </Box>

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                    {file.content_type?.startsWith('image/') ? (
                        <img
                            src={`${client.defaults.baseURL}/download/${file.id}`}
                            alt={file.filename}
                            style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                        />
                    ) : (
                        <Box sx={{ width: '100%', height: 150, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="textSecondary">No Thumbnail</Typography>
                        </Box>
                    )}
                </Box>

                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{t('infoDrawer.filename')}</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>{file.filename}</Typography>

                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{t('infoDrawer.type')}</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>{file.content_type}</Typography>

                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{t('infoDrawer.size')}</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>{(file.size / 1024).toFixed(2)} KB</Typography>

                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{t('infoDrawer.uploadedAt')}</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>{new Date(file.uploaded_at).toLocaleString()}</Typography>

                <Divider sx={{ my: 2 }} />

                {/* Version Info Section */}
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{t('infoDrawer.versions')}</Typography>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                        {t('infoDrawer.currentVersion')}: v{file.current_version?.version_number || 1}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {t('infoDrawer.totalVersions')}: {file.version_count || 1}
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<HistoryIcon />}
                    onClick={() => setVersionHistoryOpen(true)}
                    sx={{ mb: 2 }}
                >
                    {t('infoDrawer.viewVersionHistory')}
                </Button>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{t('infoDrawer.tags')}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {localTags.length > 0 ? (
                        localTags.map((tag) => (
                            <Chip
                                key={tag.id}
                                label={tag.name}
                                onDelete={() => handleDeleteTag(tag.name)}
                                size="small"
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 82, 82, 0.1)',
                                    }
                                }}
                            />
                        ))
                    ) : (
                        <Typography variant="body2" color="textSecondary">
                            {t('infoDrawer.noTags')}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        placeholder={t('infoDrawer.addTag')}
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleAddTag();
                            }
                        }}
                        fullWidth
                    />
                    <Button variant="contained" onClick={handleAddTag}>{t('common.save')}</Button>
                </Box>
            </Drawer>

            <VersionHistoryPanel
                open={versionHistoryOpen}
                onClose={() => setVersionHistoryOpen(false)}
                file={file}
                onVersionRestored={handleVersionRestored}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default InfoDrawer;
