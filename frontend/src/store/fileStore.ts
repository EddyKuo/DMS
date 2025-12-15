import { create } from 'zustand';
import type { FileModel, FolderModel } from '../types/api';

interface FileExplorerState {
    currentFolderId: number | null;
    currentFolder: FolderModel | null;
    breadcrumbs: { id: number | null, name: string }[];
    selectedItems: (FileModel | FolderModel)[];
    refreshTrigger: number;

    setCurrentFolder: (id: number | null, folder?: FolderModel) => void;
    setBreadcrumbs: (crumbs: { id: number | null, name: string }[]) => void;
    setSelectedItems: (items: (FileModel | FolderModel)[]) => void;
    triggerRefresh: () => void;
}

export const useFileStore = create<FileExplorerState>((set) => ({
    currentFolderId: null,
    currentFolder: null,
    breadcrumbs: [{ id: null, name: 'Home' }],
    selectedItems: [],
    refreshTrigger: 0,

    setCurrentFolder: (id, folder) => set({ currentFolderId: id, currentFolder: folder || null }),
    setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
    setSelectedItems: (items) => set({ selectedItems: items }),
    triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));

