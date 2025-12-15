import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Chip, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fileApi } from '../api/services';
import type { FileModel, FolderModel } from '../types/api';
import FileList from '../components/FileList';
import FilePreviewModal from '../components/FilePreviewModal';

const SearchResults: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;

    const [results, setResults] = useState<FileModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<FileModel | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const data = await fileApi.search(query, category, tag);
                setResults(data);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        };

        if (query || category || tag) {
            fetchResults();
        } else {
            setLoading(false);
        }
    }, [query, category, tag]);

    const handleFileClick = (file: FileModel) => {
        setPreviewFile(file);
    };

    const handleContextMenu = (event: React.MouseEvent, _item: FileModel | FolderModel) => {
        event.preventDefault();
        // Could open context menu here if needed
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>{t('search.title')}</Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                {query && <Chip label={`Query: "${query}"`} color="primary" variant="outlined" />}
                {category && <Chip label={`Category: ${category}`} color="secondary" variant="outlined" />}
                {tag && <Chip label={`Tag: ${tag}`} color="info" variant="outlined" />}
            </Stack>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : results.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="textSecondary">
                        {query || category || tag ? t('common.noResults') : t('search.enterSearchTerm')}
                    </Typography>
                </Paper>
            ) : (
                <>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {t('search.foundFiles', { count: results.length })}
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                        <FileList
                            files={results}
                            folders={[]}
                            onFolderClick={() => { }}
                            onFileClick={handleFileClick}
                            onContextMenu={handleContextMenu}
                        />
                    </Paper>
                </>
            )}

            <FilePreviewModal
                open={!!previewFile}
                file={previewFile}
                onClose={() => setPreviewFile(null)}
            />
        </Box>
    );
};

export default SearchResults;
