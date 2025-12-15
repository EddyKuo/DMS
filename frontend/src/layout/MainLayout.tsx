import React, { useState } from 'react';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, useTheme, Divider } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MenuIcon from '@mui/icons-material/Menu';
import FolderIcon from '@mui/icons-material/Folder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import UploadManager from '../components/UploadManager';
import SearchBar from '../components/SearchBar';

const drawerWidth = 240;

const MainLayout: React.FC = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { text: t('nav.dashboard'), icon: <DashboardIcon />, path: '/' },
        { text: t('nav.myFiles'), icon: <FolderIcon />, path: '/files' },
        { text: t('nav.upload'), icon: <CloudUploadIcon />, path: '/upload' },
        { text: t('nav.settings'), icon: <SettingsIcon />, path: '/settings' },
    ];

    const drawer = (
        <div>
            <Toolbar sx={{ justifyContent: 'center' }}>
                <Typography variant="h6" noWrap component="div" sx={{ fontFamily: '"Orbitron", sans-serif', color: theme.palette.primary.main, fontWeight: 'bold' }}>
                    DMS v1.0
                </Typography>
            </Toolbar>
            <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            onClick={() => navigate(item.path)}
                            selected={location.pathname === item.path || (item.path === '/' && location.pathname === '/')}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 188, 212, 0.1)' : 'rgba(0, 151, 167, 0.1)',
                                    borderRight: `3px solid ${theme.palette.primary.main}`,
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 188, 212, 0.2)' : 'rgba(0, 151, 167, 0.2)',
                                    }
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: location.pathname === item.path ? theme.palette.primary.main : 'inherit' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontFamily: '"Inter", sans-serif' }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ mr: 4 }}>
                        DMS Explorer
                    </Typography>
                    <SearchBar />
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            backgroundColor: theme.palette.background.paper,
                            borderRight: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)'
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh' }}
            >
                <Toolbar />
                <Outlet />
                <UploadManager />
            </Box>
        </Box>
    );
};

export default MainLayout;
