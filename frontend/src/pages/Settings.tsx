import React from 'react';
import { Box, Paper, Typography, Switch, FormControlLabel, Divider, List, ListItem, ListItemText, ListItemIcon, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import StorageIcon from '@mui/icons-material/Storage';
import InfoIcon from '@mui/icons-material/Info';
import LanguageIcon from '@mui/icons-material/Language';
import { useThemeMode } from '../theme/ThemeContext';

const Settings: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { mode, toggleTheme } = useThemeMode();

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'zh-TW', name: '繁體中文' },
        { code: 'zh-CN', name: '简体中文' },
    ];

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>{t('settings.title')}</Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('settings.language')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LanguageIcon />
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>{t('settings.selectLanguage')}</InputLabel>
                        <Select
                            value={i18n.language}
                            label={t('settings.selectLanguage')}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                        >
                            {languages.map((lang) => (
                                <MenuItem key={lang.code} value={lang.code}>
                                    {lang.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('settings.appearance')}</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={mode === 'dark'}
                            onChange={toggleTheme}
                            color="primary"
                        />
                    }
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
                            <span>{t('settings.darkMode')}</span>
                        </Box>
                    }
                />
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('settings.apiConfig')}</Typography>
                <List dense>
                    <ListItem>
                        <ListItemIcon>
                            <StorageIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={t('settings.backendApi')}
                            secondary="/api → http://127.0.0.1:8000 (Proxied via Vite)"
                        />
                    </ListItem>
                </List>
            </Paper>

            <Divider sx={{ my: 3 }} />

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('settings.about')}</Typography>
                <List dense>
                    <ListItem>
                        <ListItemIcon>
                            <InfoIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary="DMS Frontend"
                            secondary={`${t('settings.version')} 1.0.0`}
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary={t('settings.techStack')}
                            secondary="React 19 • Vite 7 • MUI 7 • TypeScript 5"
                        />
                    </ListItem>
                </List>
            </Paper>
        </Box>
    );
};

export default Settings;
