import React from 'react';
import { Modal, Box, IconButton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import type { FileModel } from '../types/api';
import { client } from '../api/client';

interface FilePreviewModalProps {
    open: boolean;
    onClose: () => void;
    file: FileModel | null;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ open, onClose, file }) => {
    const { t } = useTranslation();

    if (!file) return null;

    const isImage = file.content_type?.startsWith('image/');
    const isPDF = file.content_type === 'application/pdf';

    const fileUrl = `${client.defaults.baseURL}/download/${file.id}`;

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="preview-modal-title"
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80%',
                height: '80%',
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                outline: 'none',
                borderRadius: 2
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2" noWrap>
                        {file.filename}
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
                    {isImage && (
                        <img
                            src={fileUrl}
                            alt={file.filename}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    )}
                    {isPDF && (
                        <iframe
                            src={fileUrl}
                            title={file.filename}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    )}
                    {!isImage && !isPDF && (
                        <Typography color="white">{t('preview.unsupported')}</Typography>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

export default FilePreviewModal;
