import React, { useState } from 'react';
import { Paper, InputBase, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/search?q=${encodeURIComponent(search.trim())}`);
        }
    };

    return (
        <Paper
            component="form"
            onSubmit={handleSearch}
            sx={{
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                width: 400,
                backgroundColor: 'rgba(255,255,255,0.05)',
                '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                },
                '&:focus-within': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    boxShadow: '0 0 0 2px rgba(0, 188, 212, 0.3)',
                }
            }}
        >
            <InputBase
                sx={{ ml: 1, flex: 1, color: 'inherit' }}
                placeholder={t('common.search') + '...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <IconButton type="submit" sx={{ p: '10px' }} aria-label="search" color="primary">
                <SearchIcon />
            </IconButton>
        </Paper>
    );
};

export default SearchBar;
