import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, FormControlLabel, Checkbox, TextField, Snackbar, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import FileList from '../components/FileList';
import Breadcrumbs from '../components/Breadcrumbs';
import FolderTree from '../components/FolderTree';
import { useFileStore } from '../store/fileStore';
import { folderApi, fileApi } from '../api/services';
import type { FileModel, FolderModel } from '../types/api';
import FileContextMenu from '../components/FileContextMenu';
import UploadZone from '../components/UploadZone';
import FilePreviewModal from '../components/FilePreviewModal';
import InfoDrawer from '../components/InfoDrawer';
import VersionHistoryPanel from '../components/VersionHistoryPanel';
import ShareDialog from '../components/ShareDialog';
import RenameDialog from '../components/RenameDialog';
import EmptyState from '../components/EmptyState';
import FileListSkeleton from '../components/FileListSkeleton';
import { client } from '../api/client';

const FileExplorer: React.FC = () => {
    const { t } = useTranslation();
    const { folderId } = useParams<{ folderId: string }>();
    const navigate = useNavigate();
    const { setCurrentFolder, setBreadcrumbs, refreshTrigger, triggerRefresh, currentFolderId } = useFileStore();

    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<FileModel[]>([]);
    const [folders, setFolders] = useState<FolderModel[]>([]);

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<FileModel | FolderModel | null>(null);
    const [recursiveDelete, setRecursiveDelete] = useState(false);

    // Create folder dialog state
    const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Share dialog state
    const [shareFile, setShareFile] = useState<FileModel | null>(null);

    // Rename dialog state
    const [renameItem, setRenameItem] = useState<FileModel | FolderModel | null>(null);

    // Snackbar for notifications
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Build breadcrumb path recursively
    const buildBreadcrumbPath = async (folder: { id: number; name: string; parent_id: number | null }): Promise<{ id: number | null; name: string }[]> => {
        const path: { id: number | null; name: string }[] = [{ id: folder.id, name: folder.name }];

        let currentParentId = folder.parent_id;
        while (currentParentId !== null) {
            try {
                const parentContents = await folderApi.getContents(currentParentId);
                path.unshift({ id: parentContents.id, name: parentContents.name });
                currentParentId = parentContents.parent_id;
            } catch {
                break;
            }
        }

        path.unshift({ id: null, name: 'Home' });
        return path;
    };

    // Track if this is the initial load or a refresh
    const isInitialLoadRef = React.useRef(true);
    const previousFolderIdRef = React.useRef<string | undefined>(undefined);

    useEffect(() => {
        const fetchContents = async () => {
            // Show loading only on initial load or folder change, NOT on refresh
            const folderChanged = previousFolderIdRef.current !== folderId;
            const shouldShowLoading = isInitialLoadRef.current || folderChanged;

            if (shouldShowLoading) {
                setLoading(true);
            }
            previousFolderIdRef.current = folderId;

            try {
                // Use folder id 0 for root, otherwise use the URL folderId
                const fid = folderId ? parseInt(folderId) : 0;
                const contents = await folderApi.getContents(fid);
                setFiles(contents.files);
                setFolders(contents.sub_folders);

                if (fid === 0) {
                    // Root folder
                    setCurrentFolder(null);
                    setBreadcrumbs([{ id: null, name: 'Home' }]);
                } else {
                    setCurrentFolder(fid, { id: fid, name: contents.name, parent_id: contents.parent_id });
                    // Build full breadcrumb path
                    const fullPath = await buildBreadcrumbPath({ id: fid, name: contents.name, parent_id: contents.parent_id });
                    setBreadcrumbs(fullPath);
                }
            } catch (error) {
                console.error("Failed to fetch folder contents", error);
                setSnackbar({
                    open: true,
                    message: t('fileExplorer.failedToFetch'),
                    severity: 'error',
                });
            } finally {
                setLoading(false);
                isInitialLoadRef.current = false;
            }
        };

        fetchContents();
    }, [folderId, setCurrentFolder, setBreadcrumbs, refreshTrigger, t]);

    const handleFolderClick = (id: number) => {
        navigate(`/files/${id}`);
    };

    const handleTreeFolderSelect = (id: number | null) => {
        if (id === null) {
            navigate('/files');
        } else {
            navigate(`/files/${id}`);
        }
    };

    const [previewFile, setPreviewFile] = useState<FileModel | null>(null);
    const [infoFile, setInfoFile] = useState<FileModel | null>(null);
    const [versionHistoryFile, setVersionHistoryFile] = useState<FileModel | null>(null);

    const handleFileClick = (file: FileModel) => {
        setPreviewFile(file);
    };

    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        item: FileModel | FolderModel | null;
    } | null>(null);

    const handleContextMenu = (event: React.MouseEvent, item: FileModel | FolderModel) => {
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            item: item,
        });
    };

    // Handle right-click on empty area
    const handleEmptyAreaContextMenu = (event: React.MouseEvent) => {
        // Only trigger if clicking on the paper background, not on items
        if ((event.target as HTMLElement).closest('.MuiDataGrid-row')) {
            return;
        }
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            item: null,
        });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const isFile = (item: FileModel | FolderModel): item is FileModel => {
        return 'filename' in item;
    };

    const getItemName = (item: FileModel | FolderModel): string => {
        return isFile(item) ? item.filename : item.name;
    };

    const handleAction = async (action: string, item: FileModel | FolderModel | null) => {
        handleCloseContextMenu();

        if (action === 'createFolder') {
            setNewFolderName('');
            setCreateFolderDialogOpen(true);
        } else if (action === 'info' && item && isFile(item)) {
            setInfoFile(item);
        } else if (action === 'versions' && item && isFile(item)) {
            setVersionHistoryFile(item);
        } else if (action === 'download' && item && isFile(item)) {
            await fileApi.download(item.id);
        } else if (action === 'share' && item && isFile(item)) {
            setShareFile(item);
        } else if (action === 'rename' && item) {
            setRenameItem(item);
        } else if (action === 'delete' && item) {
            setItemToDelete(item);
            setRecursiveDelete(false);
            setDeleteDialogOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (isFile(itemToDelete)) {
                await fileApi.delete(itemToDelete.id);
            } else {
                await folderApi.delete(itemToDelete.id, recursiveDelete);
            }
            triggerRefresh();
            setSnackbar({
                open: true,
                message: t('common.deleteSuccess'),
                severity: 'success',
            });
        } catch (error) {
            console.error("Delete failed", error);
            setSnackbar({
                open: true,
                message: t('common.error'),
                severity: 'error',
            });
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            setRecursiveDelete(false);
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        setRecursiveDelete(false);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            await folderApi.create(newFolderName.trim(), currentFolderId);
            triggerRefresh();
            setCreateFolderDialogOpen(false);
            setNewFolderName('');
            setSnackbar({
                open: true,
                message: t('upload.folderCreated'),
                severity: 'success',
            });
        } catch (error) {
            console.error("Failed to create folder", error);
            setSnackbar({
                open: true,
                message: t('common.error'),
                severity: 'error',
            });
        }
    };

    const handleRename = async (newName: string) => {
        if (!renameItem) return;

        try {
            if (isFile(renameItem)) {
                await client.put(`/files/${renameItem.id}`, { filename: newName });
            } else {
                // For folders, we would need a rename endpoint
                // For now, log a message - backend may need to implement this
                console.log("Folder rename not yet implemented on backend");
            }
            triggerRefresh();
            setSnackbar({
                open: true,
                message: t('rename.success'),
                severity: 'success',
            });
        } catch (error) {
            console.error("Rename failed", error);
            setSnackbar({
                open: true,
                message: t('common.error'),
                severity: 'error',
            });
            throw error;
        }
    };

    const isDeletingFolder = itemToDelete && !isFile(itemToDelete);

    // Get current folder ID from URL
    const currentUrlFolderId = folderId ? parseInt(folderId) : null;

    // Check if folder is empty
    const isEmpty = !loading && files.length === 0 && folders.length === 0;

    return (
        <UploadZone>
            <Box sx={{ height: '100%', display: 'flex' }}>
                {/* Folder Tree Sidebar */}
                <FolderTree
                    selectedFolderId={currentUrlFolderId}
                    onFolderSelect={handleTreeFolderSelect}
                    refreshTrigger={refreshTrigger}
                />

                {/* Main Content */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Breadcrumbs />
                    <Paper
                        sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}
                        onContextMenu={handleEmptyAreaContextMenu}
                    >
                        {loading ? (
                            <FileListSkeleton rows={8} />
                        ) : isEmpty ? (
                            <EmptyState
                                type="folder"
                                onAction={() => navigate('/upload')}
                            />
                        ) : (
                            <FileList
                                files={files}
                                folders={folders}
                                onFolderClick={handleFolderClick}
                                onFileClick={handleFileClick}
                                onContextMenu={handleContextMenu}
                            />
                        )}
                    </Paper>
                </Box>

                <FileContextMenu
                    anchorPosition={
                        contextMenu !== null
                            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                            : null
                    }
                    selectedItem={contextMenu?.item || null}
                    onClose={handleCloseContextMenu}
                    onAction={handleAction}
                />
            </Box>

            <FilePreviewModal
                open={!!previewFile}
                file={previewFile}
                onClose={() => setPreviewFile(null)}
            />
            <InfoDrawer
                open={!!infoFile}
                file={infoFile}
                onClose={() => setInfoFile(null)}
                onFileUpdated={() => triggerRefresh()}
            />
            <VersionHistoryPanel
                open={!!versionHistoryFile}
                file={versionHistoryFile}
                onClose={() => setVersionHistoryFile(null)}
                onVersionRestored={() => triggerRefresh()}
            />
            <ShareDialog
                open={!!shareFile}
                file={shareFile}
                onClose={() => setShareFile(null)}
            />
            <RenameDialog
                open={!!renameItem}
                item={renameItem}
                onClose={() => setRenameItem(null)}
                onRename={handleRename}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
                <DialogTitle>{t('common.deleteConfirmTitle')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('common.deleteConfirmMessage', { name: itemToDelete ? getItemName(itemToDelete) : '' })}
                    </DialogContentText>
                    {isDeletingFolder && (
                        <Box sx={{ mt: 2 }}>
                            <DialogContentText sx={{ mb: 1, color: 'warning.main' }}>
                                {t('common.folderNotEmpty')}
                            </DialogContentText>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={recursiveDelete}
                                        onChange={(e) => setRecursiveDelete(e.target.checked)}
                                        color="error"
                                    />
                                }
                                label={t('common.recursiveDelete')}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="inherit">
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Folder Dialog */}
            <Dialog open={createFolderDialogOpen} onClose={() => setCreateFolderDialogOpen(false)}>
                <DialogTitle>{t('contextMenu.createFolder')}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={t('upload.newFolderName')}
                        fullWidth
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && newFolderName.trim()) {
                                handleCreateFolder();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateFolderDialogOpen(false)} color="inherit">
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
                        {t('upload.createFolder')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </UploadZone>
    );
};

export default FileExplorer;
