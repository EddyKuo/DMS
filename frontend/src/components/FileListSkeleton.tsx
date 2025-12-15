import React from 'react';
import { Skeleton, Box } from '@mui/material';

interface FileListSkeletonProps {
    rows?: number;
}

const FileListSkeleton: React.FC<FileListSkeletonProps> = ({ rows = 5 }) => {
    return (
        <Box sx={{ width: '100%' }}>
            {/* Header row */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, px: 2 }}>
                <Skeleton variant="rectangular" width={40} height={40} />
                <Skeleton variant="text" width="40%" height={40} />
                <Skeleton variant="text" width="15%" height={40} />
                <Skeleton variant="text" width="20%" height={40} />
            </Box>

            {/* Data rows */}
            {Array.from({ length: rows }).map((_, index) => (
                <Box
                    key={index}
                    sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 1,
                        px: 2,
                        py: 1,
                        alignItems: 'center',
                    }}
                >
                    <Skeleton variant="rectangular" width={24} height={24} />
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton
                        variant="text"
                        width={`${40 + Math.random() * 20}%`}
                        height={24}
                        animation="wave"
                    />
                    <Skeleton variant="text" width={60} height={24} animation="wave" />
                    <Skeleton variant="text" width={100} height={24} animation="wave" />
                </Box>
            ))}
        </Box>
    );
};

export default FileListSkeleton;
