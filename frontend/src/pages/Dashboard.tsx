import React, { useEffect, useState } from 'react';
import { Typography, Grid, Paper, Box, CircularProgress, Skeleton, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import FolderIcon from '@mui/icons-material/Folder';
import StorageIcon from '@mui/icons-material/Storage';
import CategoryIcon from '@mui/icons-material/Category';
import { fileApi } from '../api/services';
import type { SystemStats } from '../types/api';

const COLORS = ['#00bcd4', '#00e676', '#ff9800', '#e91e63', '#9c27b0', '#3f51b5', '#009688'];

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await fileApi.getStats();
                setStats(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
                setError(t('dashboard.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [t]);

    const formatSize = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Prepare chart data from categories
    const chartData = stats?.categories
        ? Object.entries(stats.categories).map(([name, value]) => ({
            name: t(`categories.${name}`, name),
            value: value as number,
        }))
        : [];

    const StatCard: React.FC<{
        title: string;
        value: string | number;
        icon: React.ReactNode;
        color: string;
        loading?: boolean;
    }> = ({ title, value, icon, color, loading: cardLoading }) => (
        <Paper
            sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 150,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    backgroundColor: color,
                },
            }}
        >
            <Box sx={{ position: 'absolute', top: 12, right: 12, opacity: 0.2 }}>
                {icon}
            </Box>
            {cardLoading ? (
                <>
                    <Skeleton variant="text" width={100} height={24} />
                    <Skeleton variant="text" width={80} height={48} />
                </>
            ) : (
                <>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {title}
                    </Typography>
                    <Typography variant="h3" sx={{ color, fontWeight: 'bold' }}>
                        {value}
                    </Typography>
                </>
            )}
        </Paper>
    );

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                {t('dashboard.title')}
            </Typography>

            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Stats Cards */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard
                        title={t('dashboard.totalFiles')}
                        value={stats?.total_files || 0}
                        icon={<FolderIcon sx={{ fontSize: 48 }} />}
                        color="#00bcd4"
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard
                        title={t('dashboard.storageUsed')}
                        value={stats ? formatSize(stats.total_size_bytes) : '0 B'}
                        icon={<StorageIcon sx={{ fontSize: 48 }} />}
                        color="#00e676"
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard
                        title={t('dashboard.categories')}
                        value={chartData.length}
                        icon={<CategoryIcon sx={{ fontSize: 48 }} />}
                        color="#ff9800"
                        loading={loading}
                    />
                </Grid>

                {/* Category Distribution Chart */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, height: 350 }}>
                        <Typography variant="h6" gutterBottom>
                            {t('dashboard.categoryDistribution')}
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
                                <CircularProgress />
                            </Box>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                                    >
                                        {chartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e1e1e',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 8,
                                        }}
                                        formatter={(value: number) => [`${value} ${t('dashboard.files')}`, '']}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
                                <Typography color="textSecondary">{t('common.noResults')}</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Storage Usage */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, height: 350 }}>
                        <Typography variant="h6" gutterBottom>
                            {t('dashboard.storageOverview')}
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 250 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                        <CircularProgress
                                            variant="determinate"
                                            value={stats?.storage_usage_percent || 0}
                                            size={120}
                                            thickness={4}
                                            sx={{
                                                color: '#00bcd4',
                                                '& .MuiCircularProgress-circle': {
                                                    strokeLinecap: 'round',
                                                },
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                top: 0,
                                                left: 0,
                                                bottom: 0,
                                                right: 0,
                                                position: 'absolute',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Typography variant="h5" component="div" color="textSecondary">
                                                {(stats?.storage_usage_percent || 0).toFixed(1)}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {t('dashboard.used')}: {formatSize(stats?.total_size_bytes || 0)}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
