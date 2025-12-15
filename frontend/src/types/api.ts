export interface Tag {
    id: number;
    name: string;
}

export interface FileVersion {
    id: number;
    version_number: number;
    sha1_hash: string | null;
    size: number;
    content_type: string;
    uploaded_at: string;
}

export interface FileModel {
    id: number;
    filename: string;
    content_type: string;
    size: number;
    category: string;
    uploaded_at: string;
    folder_id: number | null;
    tags: Tag[];
    version_count: number;
    current_version: FileVersion | null;
}

export interface FolderModel {
    id: number;
    name: string;
    parent_id: number | null;
}

export interface FolderContents {
    id: number;
    name: string;
    parent_id: number | null;
    sub_folders: FolderModel[];
    files: FileModel[];
}

export interface SystemStats {
    total_files: number;
    total_size_bytes: number;
    storage_usage_percent?: number;
    categories: Record<string, number>;
}

