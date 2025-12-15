import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ShareIcon from '@mui/icons-material/Share';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import type { FileModel, FolderModel } from '../types/api';

interface FileContextMenuProps {
    anchorPosition: { top: number; left: number } | null;
    onClose: () => void;
    onAction: (action: string, item: FileModel | FolderModel | null) => void;
    selectedItem: FileModel | FolderModel | null;
}

const FileContextMenu: React.FC<FileContextMenuProps> = ({ anchorPosition, onClose, onAction, selectedItem }) => {
    const { t } = useTranslation();

    const isFile = selectedItem && 'filename' in selectedItem;

    return (
        <Menu
            open={!!anchorPosition}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition || undefined}
            PaperProps={{
                style: {
                    width: 220,
                },
            }}
        >
            {/* Create Folder - always available */}
            <MenuItem onClick={() => onAction('createFolder', selectedItem)}>
                <ListItemIcon>
                    <CreateNewFolderIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('contextMenu.createFolder')}</ListItemText>
            </MenuItem>

            {selectedItem && <Divider />}

            {/* File-specific actions */}
            {isFile && (
                <>
                    <MenuItem onClick={() => onAction('download', selectedItem)}>
                        <ListItemIcon>
                            <DownloadIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>{t('contextMenu.download')}</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => onAction('share', selectedItem)}>
                        <ListItemIcon>
                            <ShareIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>{t('contextMenu.share')}</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => onAction('info', selectedItem)}>
                        <ListItemIcon>
                            <InfoIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>{t('contextMenu.info')}</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => onAction('versions', selectedItem)}>
                        <ListItemIcon>
                            <HistoryIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>{t('contextMenu.versionHistory')}</ListItemText>
                    </MenuItem>
                </>
            )}

            {/* Rename - for both files and folders */}
            {selectedItem && (
                <MenuItem onClick={() => onAction('rename', selectedItem)}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('contextMenu.rename')}</ListItemText>
                </MenuItem>
            )}

            {/* Delete - for both files and folders */}
            {selectedItem && (
                <MenuItem onClick={() => onAction('delete', selectedItem)} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>{t('contextMenu.delete')}</ListItemText>
                </MenuItem>
            )}
        </Menu>
    );
};

export default FileContextMenu;
