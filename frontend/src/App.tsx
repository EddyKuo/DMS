import { CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import FileExplorer from './pages/FileExplorer';
import Upload from './pages/Upload';
import Settings from './pages/Settings';
import SearchResults from './pages/SearchResults';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="files" element={<FileExplorer />} />
            <Route path="files/:folderId" element={<FileExplorer />} />
            <Route path="upload" element={<Upload />} />
            <Route path="settings" element={<Settings />} />
            <Route path="search" element={<SearchResults />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
