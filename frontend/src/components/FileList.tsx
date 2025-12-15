import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import type { FileModel, FolderModel } from '../types/api';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Box, Chip } from '@mui/material';
import { format } from 'date-fns';

interface FileListProps {
    files: FileModel[];
    folders: FolderModel[];
    onFolderClick: (folderId: number) => void;
    onFileClick: (file: FileModel) => void;
    onContextMenu: (event: React.MouseEvent, item: FileModel | FolderModel) => void;
}

const FileList: React.FC<FileListProps> = ({ files, folders, onFolderClick, onFileClick, onContextMenu }) => {
    const { t } = useTranslation();

    // Create unique row IDs to avoid conflicts between folders and files
    const rows = [
        ...folders.map(f => ({ ...f, rowId: `folder_${f.id}`, type: 'folder', size: 0, originalId: f.id })),
        ...files.map(f => ({ ...f, rowId: `file_${f.id}`, type: 'file', originalId: f.id }))
    ];

    const columns: GridColDef[] = [
        {
            field: 'icon',
            headerName: '',
            width: 50,
            renderCell: (params: GridRenderCellParams) => (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', color: params.row.type === 'folder' ? '#FFCa28' : 'inherit' }}>
                    {params.row.type === 'folder' ? <FolderIcon /> : <InsertDriveFileIcon />}
                </Box>
            )
        },
        {
            field: 'name',
            headerName: t('fileExplorer.name'),
            flex: 1,
            renderCell: (params: GridRenderCellParams) => {
                const displayName = params.row.filename || params.row.name || '';
                const versionCount = params.row.version_count;
                const currentVersion = params.row.current_version;
                const showVersionBadge = params.row.type === 'file' && versionCount > 1;

                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{displayName}</span>
                        {showVersionBadge && (
                            <Chip
                                label={`v${currentVersion?.version_number || versionCount}`}
                                size="small"
                                color="info"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                        )}
                    </Box>
                );
            },
        },
        {
            field: 'size',
            headerName: t('fileExplorer.size'),
            width: 100,
            valueFormatter: (value: number | null | undefined) => {
                if (!value) return '--';
                if (value < 1024) return value + ' B';
                if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
                return (value / (1024 * 1024)).toFixed(1) + ' MB';
            }
        },
        {
            field: 'uploaded_at',
            headerName: t('fileExplorer.date'),
            width: 150,
            valueFormatter: (value: string | null | undefined) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm') : '--'
        },
    ];

    return (
        <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.rowId}
                checkboxSelection
                disableRowSelectionOnClick
                onRowDoubleClick={(params) => {
                    if (params.row.type === 'folder') {
                        onFolderClick(params.row.originalId);
                    } else {
                        onFileClick(params.row as FileModel);
                    }
                }}
                slotProps={{
                    row: {
                        onContextMenu: (event: React.MouseEvent) => {
                            event.preventDefault();
                            const rowId = (event.currentTarget as HTMLElement).dataset.id;
                            const row = rows.find(r => r.rowId === rowId);
                            if (row) {
                                onContextMenu(event, row as FileModel | FolderModel);
                            }
                        }
                    }
                }}
            />
        </Box>
    );
};

export default FileList;
