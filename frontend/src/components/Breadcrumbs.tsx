import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useFileStore } from '../store/fileStore';
import { useNavigate } from 'react-router-dom';

const Breadcrumbs: React.FC = () => {
    const { breadcrumbs } = useFileStore();
    const navigate = useNavigate();

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: number | null) => {
        event.preventDefault();
        // Determine path based on id
        if (id === null) {
            navigate('/files');
        } else {
            navigate(`/files/${id}`);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <MuiBreadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                {breadcrumbs.map((crumb, index) => {
                    const last = index === breadcrumbs.length - 1;
                    return last ? (
                        <Typography key={cacheKey(crumb.id)} color="text.primary">
                            {crumb.name}
                        </Typography>
                    ) : (
                        <Link
                            underline="hover"
                            key={cacheKey(crumb.id)}
                            color="inherit"
                            href={crumb.id === null ? '/files' : `/files/${crumb.id}`}
                            onClick={(e) => handleClick(e, crumb.id)}
                        >
                            {crumb.name}
                        </Link>
                    );
                })}
            </MuiBreadcrumbs>
        </Box>
    );
};

const cacheKey = (id: number | null) => id === null ? 'home' : id;

export default Breadcrumbs;
