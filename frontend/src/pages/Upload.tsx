import React, { useRef, useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Alert, Snackbar } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import { triggerUpload } from '../components/UploadManager';
import { folderApi } from '../api/services';
import type { FolderModel } from '../types/api';
import { useFileStore } from '../store/fileStore';

interface FolderNode extends FolderModel {
    children?: FolderNode[];
    level: number;
}

const Upload: React.FC = () => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setCurrentFolder } = useFileStore();

    // Folder selection state
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [flatFolderList, setFlatFolderList] = useState<FolderNode[]>([]);

    // Folder creation dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [parentFolderId, setParentFolderId] = useState<number | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Build flat folder list with hierarchy
    const buildFolderTree = async () => {
        const fetchChildren = async (parentId: number | null, level: number): Promise<FolderNode[]> => {
            try {
                const folders = await folderApi.list(parentId);
                const nodes: FolderNode[] = [];

                for (const folder of folders) {
                    const node: FolderNode = { ...folder, level };
                    nodes.push(node);

                    // Recursively fetch children
                    const children = await fetchChildren(folder.id, level + 1);
                    nodes.push(...children);
                }

                return nodes;
            } catch (error) {
                console.error('Failed to fetch folders', error);
                return [];
            }
        };

        const allFolders = await fetchChildren(null, 0);
        setFlatFolderList(allFolders);
    };

    useEffect(() => {
        buildFolderTree();
    }, []);

    // Update store's current folder when selection changes
    useEffect(() => {
        setCurrentFolder(selectedFolderId);
    }, [selectedFolderId, setCurrentFolder]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            triggerUpload(files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            triggerUpload(files);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            await folderApi.create(newFolderName.trim(), parentFolderId);
            setSnackbarMessage(t('upload.folderCreated'));
            setSnackbarOpen(true);
            setCreateDialogOpen(false);
            setNewFolderName('');
            setParentFolderId(null);

            // Refresh folder list
            buildFolderTree();
        } catch (error) {
            console.error('Failed to create folder', error);
        }
    };

    const getFolderDisplayName = (folder: FolderNode) => {
        const indent = '  '.repeat(folder.level);
        return `${indent}${folder.level > 0 ? '└ ' : ''}${folder.name}`;
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>{t('upload.title')}</Typography>

            {/* Folder Selection */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('upload.selectFolder')}</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 300 }}>
                        <InputLabel>{t('upload.selectFolder')}</InputLabel>
                        <Select
                            value={selectedFolderId === null ? '' : String(selectedFolderId)}
                            label={t('upload.selectFolder')}
                            onChange={(e) => setSelectedFolderId(e.target.value === '' ? null : Number(e.target.value))}
                        >
                            <MenuItem value="">
                                <em>{t('upload.rootFolder')}</em>
                            </MenuItem>
                            {flatFolderList.map((folder) => (
                                <MenuItem key={folder.id} value={folder.id}>
                                    {getFolderDisplayName(folder)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined"
                        startIcon={<CreateNewFolderIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        {t('upload.createFolder')}
                    </Button>
                </Box>
            </Paper>

            <Paper
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                sx={{
                    p: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    backgroundColor: 'rgba(0, 188, 212, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: 300,
                    '&:hover': {
                        backgroundColor: 'rgba(0, 188, 212, 0.1)',
                        borderColor: 'primary.light',
                    }
                }}
                onClick={handleBrowseClick}
            >
                <CloudUploadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
                    {t('upload.dragDrop')}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    {t('upload.orClick')}
                </Typography>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={handleFileSelect}
                />
            </Paper>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<FolderOpenIcon />}
                    onClick={handleBrowseClick}
                    size="large"
                >
                    {t('upload.browseFiles')}
                </Button>
            </Box>

            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('upload.supportedTypes')}</Typography>
                <Typography variant="body2" color="textSecondary">
                    {t('upload.documents')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {t('upload.images')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {t('upload.archives')}
                </Typography>
            </Box>

            {/* Create Folder Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t('upload.createFolder')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label={t('upload.newFolderName')}
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            fullWidth
                            autoFocus
                        />
                        <FormControl fullWidth>
                            <InputLabel>{t('upload.parentFolder')}</InputLabel>
                            <Select
                                value={parentFolderId === null ? '' : String(parentFolderId)}
                                label={t('upload.parentFolder')}
                                onChange={(e) => setParentFolderId(e.target.value === '' ? null : Number(e.target.value))}
                            >
                                <MenuItem value="">
                                    <em>{t('upload.rootFolder')}</em>
                                </MenuItem>
                                {flatFolderList.map((folder) => (
                                    <MenuItem key={folder.id} value={folder.id}>
                                        {getFolderDisplayName(folder)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
                        {t('upload.createFolder')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Upload;
