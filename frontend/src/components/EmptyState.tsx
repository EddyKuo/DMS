import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
    type: 'folder' | 'search' | 'upload';
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
    const { t } = useTranslation();

    const config = {
        folder: {
            icon: <FolderOpenIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.2)' }} />,
            title: t('emptyState.folderTitle'),
            description: t('emptyState.folderDescription'),
            action: t('emptyState.uploadFiles'),
        },
        search: {
            icon: <SearchOffIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.2)' }} />,
            title: t('emptyState.searchTitle'),
            description: t('emptyState.searchDescription'),
            action: null,
        },
        upload: {
            icon: <CloudUploadIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.2)' }} />,
            title: t('emptyState.uploadTitle'),
            description: t('emptyState.uploadDescription'),
            action: t('emptyState.browseFiles'),
        },
    };

    const { icon, title, description, action } = config[type];

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 4,
                textAlign: 'center',
            }}
        >
            <Box
                sx={{
                    mb: 3,
                    opacity: 0.7,
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                        '0%, 100%': { opacity: 0.5 },
                        '50%': { opacity: 0.8 },
                    },
                }}
            >
                {icon}
            </Box>
            <Typography variant="h6" color="textSecondary" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 300 }}>
                {description}
            </Typography>
            {action && onAction && (
                <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={onAction}
                >
                    {action}
                </Button>
            )}
        </Box>
    );
};

export default EmptyState;
