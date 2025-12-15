import { client } from './client';
import type { FileModel, FileVersion, FolderContents, FolderModel, SystemStats } from '../types/api';

export const folderApi = {
    getContents: async (folderId: number): Promise<FolderContents> => {
        const response = await client.get<FolderContents>(`/folders/${folderId}`);
        return response.data;
    },
    create: async (name: string, parentId: number | null): Promise<FolderModel> => {
        const response = await client.post<FolderModel>('/folders', { name, parent_id: parentId });
        return response.data;
    },
    list: async (parentId: number | null): Promise<FolderModel[]> => {
        const response = await client.get<FolderModel[]>('/folders', { params: { parent_id: parentId } });
        return response.data;
    },
    delete: async (folderId: number, recursive: boolean = false): Promise<void> => {
        await client.delete(`/folders/${folderId}`, { params: { recursive } });
    }
};

export const fileApi = {
    upload: async (file: File, folderId: number | null, onProgress?: (progress: number) => void): Promise<FileModel> => {
        const formData = new FormData();
        formData.append('file', file);
        if (folderId !== null) {
            formData.append('folder_id', folderId.toString());
        }
        const response = await client.post<FileModel>('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            }
        });
        return response.data;
    },
    delete: async (fileId: number): Promise<void> => {
        await client.delete(`/files/${fileId}`);
    },
    download: async (fileId: number): Promise<void> => {
        // Trigger download via browser
        window.open(`${client.defaults.baseURL}/download/${fileId}`, '_blank');
    },
    search: async (q?: string, category?: string, tag?: string): Promise<FileModel[]> => {
        const response = await client.get<FileModel[]>('/search', { params: { q, category, tag } });
        return response.data;
    },
    getRootFiles: async (): Promise<FileModel[]> => {
        // Get all files and filter those in root (folder_id is null)
        const response = await client.get<FileModel[]>('/search');
        return response.data.filter(f => f.folder_id === null);
    },
    getStats: async (): Promise<SystemStats> => {
        const response = await client.get<SystemStats>('/stats');
        return response.data;
    },

    // Version Control APIs
    listVersions: async (fileId: number): Promise<FileVersion[]> => {
        const response = await client.get<FileVersion[]>(`/files/${fileId}/versions`);
        return response.data;
    },

    downloadVersion: (fileId: number, versionId: number): void => {
        window.open(`${client.defaults.baseURL}/files/${fileId}/versions/${versionId}/download`, '_blank');
    },

    deleteVersion: async (fileId: number, versionId: number): Promise<void> => {
        await client.delete(`/files/${fileId}/versions/${versionId}`);
    },

    restoreVersion: async (fileId: number, versionId: number): Promise<FileModel> => {
        const response = await client.put<FileModel>(`/files/${fileId}/versions/${versionId}/restore`);
        return response.data;
    },
};
