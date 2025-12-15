import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';
import type { FileModel, FolderModel } from '../types/api';

interface RenameDialogProps {
    open: boolean;
    onClose: () => void;
    item: FileModel | FolderModel | null;
    onRename: (newName: string) => Promise<void>;
}

const RenameDialog: React.FC<RenameDialogProps> = ({ open, onClose, item, onRename }) => {
    const { t } = useTranslation();
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);

    const isFile = item && 'filename' in item;
    const currentName = isFile ? (item as FileModel).filename : (item as FolderModel)?.name || '';

    useEffect(() => {
        if (open && item) {
            setNewName(currentName);
        }
    }, [open, item, currentName]);

    const handleSubmit = async () => {
        if (!newName.trim() || newName === currentName) return;
        setLoading(true);
        try {
            await onRename(newName.trim());
            onClose();
        } catch (error) {
            console.error('Rename failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
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
                <EditIcon />
                {t('rename.title')}
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    margin="dense"
                    label={t('rename.newName')}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && newName.trim() && newName !== currentName) {
                            handleSubmit();
                        }
                    }}
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !newName.trim() || newName === currentName}
                >
                    {t('rename.rename')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RenameDialog;
