import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    TextField,
    Button,
    Slider,
    CircularProgress,
    Alert,
    InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { FileModel } from '../types/api';
import { client } from '../api/client';

interface ShareDialogProps {
    open: boolean;
    onClose: () => void;
    file: FileModel | null;
}

interface ShareResponse {
    url: string;
    expires_at: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ open, onClose, file }) => {
    const { t } = useTranslation();
    const [hours, setHours] = useState<number>(24);
    const [loading, setLoading] = useState(false);
    const [shareData, setShareData] = useState<ShareResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerateLink = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const response = await client.get<ShareResponse>(`/files/${file.id}/share`, {
                params: { hours }
            });
            setShareData(response.data);
        } catch (err) {
            console.error('Failed to generate share link', err);
            setError(t('share.generateFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async () => {
        if (!shareData) return;
        try {
            await navigator.clipboard.writeText(shareData.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    };

    const handleClose = () => {
        setShareData(null);
        setError(null);
        setCopied(false);
        setHours(24);
        onClose();
    };

    const hourMarks = [
        { value: 1, label: '1h' },
        { value: 24, label: '1d' },
        { value: 168, label: '7d' },
        { value: 720, label: '30d' },
    ];

    if (!file) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { backgroundColor: '#1e1e1e' },
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShareIcon />
                {t('share.title')}
                <IconButton
                    onClick={handleClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {file.filename}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {(file.size / 1024).toFixed(2)} KB
                    </Typography>
                </Box>

                {!shareData ? (
                    <>
                        <Typography variant="subtitle2" gutterBottom>
                            {t('share.expirationTime')}
                        </Typography>
                        <Box sx={{ px: 2, mb: 3 }}>
                            <Slider
                                value={hours}
                                onChange={(_, value) => setHours(value as number)}
                                min={1}
                                max={720}
                                marks={hourMarks}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => {
                                    if (value < 24) return `${value}h`;
                                    return `${Math.round(value / 24)}d`;
                                }}
                            />
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {t('share.linkValidFor', {
                                time: hours < 24
                                    ? `${hours} ${t('share.hours')}`
                                    : `${Math.round(hours / 24)} ${t('share.days')}`
                            })}
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </>
                ) : (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            {t('share.shareLink')}
                        </Typography>
                        <TextField
                            fullWidth
                            value={shareData.url}
                            InputProps={{
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleCopyLink} color={copied ? 'success' : 'default'}>
                                            {copied ? <CheckIcon /> : <ContentCopyIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />
                        <Typography variant="body2" color="textSecondary">
                            {t('share.expiresAt')}: {format(new Date(shareData.expires_at), 'yyyy-MM-dd HH:mm')}
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} color="inherit">
                    {t('common.cancel')}
                </Button>
                {!shareData && (
                    <Button
                        onClick={handleGenerateLink}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <ShareIcon />}
                    >
                        {t('share.generateLink')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ShareDialog;
