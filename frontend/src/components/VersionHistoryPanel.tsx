import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    Button,
    CircularProgress,
    Divider,
    Tooltip,
    Alert,
    Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { FileModel, FileVersion } from '../types/api';
import { fileApi } from '../api/services';

interface VersionHistoryPanelProps {
    open: boolean;
    onClose: () => void;
    file: FileModel | null;
    onVersionRestored?: (updatedFile: FileModel) => void;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
    open,
    onClose,
    file,
    onVersionRestored,
}) => {
    const { t } = useTranslation();
    const [versions, setVersions] = useState<FileVersion[]>([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        if (open && file) {
            fetchVersions();
        }
    }, [open, file]);

    const fetchVersions = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const data = await fileApi.listVersions(file.id);
            // Sort by version_number descending (newest first)
            setVersions(data.sort((a, b) => b.version_number - a.version_number));
        } catch (error) {
            console.error('Failed to fetch versions', error);
            setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (version: FileVersion) => {
        if (!file) return;
        fileApi.downloadVersion(file.id, version.id);
    };

    const handleRestore = async (version: FileVersion) => {
        if (!file) return;
        try {
            const updatedFile = await fileApi.restoreVersion(file.id, version.id);
            setSnackbar({
                open: true,
                message: t('versionHistory.restoreSuccess', { version: version.version_number }),
                severity: 'success',
            });
            onVersionRestored?.(updatedFile);
            fetchVersions(); // Refresh version list
        } catch (error) {
            console.error('Failed to restore version', error);
            setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
        }
    };

    const handleDelete = async (version: FileVersion) => {
        if (!file) return;
        // Prevent deleting the last version
        if (versions.length <= 1) {
            setSnackbar({
                open: true,
                message: t('versionHistory.cannotDeleteLastVersion'),
                severity: 'error',
            });
            return;
        }

        try {
            await fileApi.deleteVersion(file.id, version.id);
            setSnackbar({
                open: true,
                message: t('versionHistory.deleteSuccess', { version: version.version_number }),
                severity: 'success',
            });
            fetchVersions(); // Refresh version list
        } catch (error) {
            console.error('Failed to delete version', error);
            setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
        }
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isCurrentVersion = (version: FileVersion): boolean => {
        return file?.current_version?.id === version.id;
    };

    if (!file) return null;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { backgroundColor: '#1e1e1e' },
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon />
                    {t('versionHistory.title')}
                    <IconButton
                        onClick={onClose}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {file.filename}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {t('infoDrawer.totalVersions')}: {versions.length}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {versions.map((version) => (
                                <ListItem
                                    key={version.id}
                                    sx={{
                                        mb: 1,
                                        borderRadius: 1,
                                        backgroundColor: isCurrentVersion(version)
                                            ? 'rgba(25, 118, 210, 0.1)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        border: isCurrentVersion(version)
                                            ? '1px solid rgba(25, 118, 210, 0.5)'
                                            : '1px solid transparent',
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle2">
                                                    v{version.version_number}
                                                </Typography>
                                                {isCurrentVersion(version) && (
                                                    <Chip
                                                        label={t('versionHistory.current')}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 0.5 }}>
                                                <Typography variant="caption" color="textSecondary">
                                                    {format(new Date(version.uploaded_at), 'yyyy-MM-dd HH:mm:ss')}
                                                    {' • '}
                                                    {formatSize(version.size)}
                                                </Typography>
                                                {version.sha1_hash && (
                                                    <Typography
                                                        variant="caption"
                                                        color="textSecondary"
                                                        sx={{ display: 'block', fontFamily: 'monospace' }}
                                                    >
                                                        SHA1: {version.sha1_hash.substring(0, 12)}...
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title={t('versionHistory.download')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDownload(version)}
                                            >
                                                <DownloadIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {!isCurrentVersion(version) && (
                                            <>
                                                <Tooltip title={t('versionHistory.restore')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRestore(version)}
                                                        color="primary"
                                                    >
                                                        <RestoreIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('versionHistory.delete')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(version)}
                                                        color="error"
                                                        disabled={versions.length <= 1}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={onClose} variant="outlined">
                            {t('common.cancel')}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

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

export default VersionHistoryPanel;
