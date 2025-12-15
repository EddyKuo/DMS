import React, { useEffect, useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Collapse, CircularProgress, IconButton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import { folderApi } from '../api/services';
import type { FolderModel } from '../types/api';

interface FolderTreeProps {
    selectedFolderId: number | null;
    onFolderSelect: (folderId: number | null) => void;
    refreshTrigger?: number;
}

interface TreeNode {
    folder: FolderModel;
    children: TreeNode[];
    isLoading: boolean;
    isExpanded: boolean;
}

const FolderTreeItem: React.FC<{
    node: TreeNode;
    level: number;
    selectedFolderId: number | null;
    onSelect: (folderId: number) => void;
    onToggle: (folderId: number) => void;
    onLoadChildren: (folderId: number) => void;
}> = ({ node, level, selectedFolderId, onSelect, onToggle, onLoadChildren }) => {
    const isSelected = selectedFolderId === node.folder.id;

    const handleClick = () => {
        onSelect(node.folder.id);
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!node.isExpanded && node.children.length === 0) {
            onLoadChildren(node.folder.id);
        }
        onToggle(node.folder.id);
    };

    return (
        <>
            <ListItemButton
                onClick={handleClick}
                selected={isSelected}
                sx={{
                    pl: 1 + level * 2,
                    py: 0.25, // Reduced vertical padding
                    minHeight: 32, // Compact height
                }}
            >
                <IconButton
                    size="small"
                    onClick={handleToggle}
                    sx={{ mr: 0.5, p: 0.25 }}
                >
                    {node.isLoading ? (
                        <CircularProgress size={14} />
                    ) : node.isExpanded ? (
                        <ExpandLess sx={{ fontSize: 18 }} />
                    ) : (
                        <ExpandMore sx={{ fontSize: 18 }} />
                    )}
                </IconButton>
                <ListItemIcon sx={{ minWidth: 24 }}>
                    {node.isExpanded ? (
                        <FolderOpenIcon sx={{ color: '#FFCa28', fontSize: 18 }} />
                    ) : (
                        <FolderIcon sx={{ color: '#FFCa28', fontSize: 18 }} />
                    )}
                </ListItemIcon>
                <ListItemText
                    primary={node.folder.name}
                    primaryTypographyProps={{
                        noWrap: true,
                        variant: 'body2',
                        sx: { fontSize: '0.85rem' }
                    }}
                />
            </ListItemButton>
            {node.isExpanded && node.children.length > 0 && (
                <Collapse in={node.isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding dense>
                        {node.children.map((child) => (
                            <FolderTreeItem
                                key={child.folder.id}
                                node={child}
                                level={level + 1}
                                selectedFolderId={selectedFolderId}
                                onSelect={onSelect}
                                onToggle={onToggle}
                                onLoadChildren={onLoadChildren}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

const FolderTree: React.FC<FolderTreeProps> = ({ selectedFolderId, onFolderSelect, refreshTrigger }) => {
    const { t } = useTranslation();
    const [rootFolders, setRootFolders] = useState<TreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const isInitialLoadRef = React.useRef(true);

    useEffect(() => {
        const loadRootFolders = async () => {
            // Only show loading on initial load, not on refresh
            if (isInitialLoadRef.current) {
                setLoading(true);
            }

            try {
                // Use folder id 0 for root
                const contents = await folderApi.getContents(0);
                setRootFolders(contents.sub_folders.map(f => ({
                    folder: f,
                    children: [],
                    isLoading: false,
                    isExpanded: false
                })));
            } catch (error) {
                console.error('Failed to load folders', error);
            } finally {
                setLoading(false);
                isInitialLoadRef.current = false;
            }
        };
        loadRootFolders();
    }, [refreshTrigger]);

    const updateNode = (nodes: TreeNode[], folderId: number, updater: (node: TreeNode) => TreeNode): TreeNode[] => {
        return nodes.map(node => {
            if (node.folder.id === folderId) {
                return updater(node);
            }
            if (node.children.length > 0) {
                return { ...node, children: updateNode(node.children, folderId, updater) };
            }
            return node;
        });
    };

    const handleToggle = (folderId: number) => {
        setRootFolders(prev => updateNode(prev, folderId, node => ({
            ...node,
            isExpanded: !node.isExpanded
        })));
    };

    const handleLoadChildren = async (folderId: number) => {
        setRootFolders(prev => updateNode(prev, folderId, node => ({
            ...node,
            isLoading: true
        })));

        try {
            const contents = await folderApi.getContents(folderId);
            const children: TreeNode[] = contents.sub_folders.map(f => ({
                folder: f,
                children: [],
                isLoading: false,
                isExpanded: false
            }));

            setRootFolders(prev => updateNode(prev, folderId, node => ({
                ...node,
                children,
                isLoading: false,
                isExpanded: true
            })));
        } catch (error) {
            console.error('Failed to load subfolders', error);
            setRootFolders(prev => updateNode(prev, folderId, node => ({
                ...node,
                isLoading: false
            })));
        }
    };

    const handleSelect = (folderId: number) => {
        onFolderSelect(folderId);
    };

    return (
        <Box sx={{
            width: 220,
            borderRight: '1px solid rgba(255,255,255,0.1)',
            overflowY: 'auto',
            height: '100%',
            bgcolor: 'rgba(0,0,0,0.2)'
        }}>
            <Typography variant="caption" sx={{ px: 1.5, py: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
                {t('nav.myFiles')}
            </Typography>
            <List component="nav" dense disablePadding>
                {/* Home/Root */}
                <ListItemButton
                    selected={selectedFolderId === null}
                    onClick={() => onFolderSelect(null)}
                    sx={{ py: 0.5, minHeight: 32 }}
                >
                    <ListItemIcon sx={{ minWidth: 28 }}>
                        <HomeIcon sx={{ fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary={t('common.home')}
                        primaryTypographyProps={{ variant: 'body2', sx: { fontSize: '0.85rem' } }}
                    />
                </ListItemButton>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                        <CircularProgress size={20} />
                    </Box>
                ) : (
                    rootFolders.map((node) => (
                        <FolderTreeItem
                            key={node.folder.id}
                            node={node}
                            level={0}
                            selectedFolderId={selectedFolderId}
                            onSelect={handleSelect}
                            onToggle={handleToggle}
                            onLoadChildren={handleLoadChildren}
                        />
                    ))
                )}
            </List>
        </Box>
    );
};

export default FolderTree;
