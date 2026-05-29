// ----------------------------------------------------------------------
// useFileUpload Hook - File upload wrapper
// ----------------------------------------------------------------------

import type { IUploadProgress } from 'src/services/file/CreateFile.service';
import type { MediaType, IMediaUploadOptions, IMediaUploadResponse } from 'src/types/ai-course-media';

import { useState, useCallback } from 'react';

import {
	validateFile,
	CreateFileService,
	getMediaTypeFromMime,
	CreateMultipleFilesService,
} from 'src/services/file/CreateFile.service';

// ----------------------------------------------------------------------

interface FileUploadState {
	isUploading: boolean;
	progress: IUploadProgress | null;
	uploadedFiles: IMediaUploadResponse[];
	error: string | null;
}

interface UseFileUploadOptions extends IMediaUploadOptions {
	onSuccess?: (file: IMediaUploadResponse) => void;
	onError?: (error: string) => void;
	onProgress?: (progress: IUploadProgress) => void;
}

// ----------------------------------------------------------------------

export function useFileUpload(options?: UseFileUploadOptions) {
	const [state, setState] = useState<FileUploadState>({
		isUploading: false,
		progress: null,
		uploadedFiles: [],
		error: null,
	});

	// Upload single file
	const uploadFile = useCallback(
		async (file: File): Promise<IMediaUploadResponse | null> => {
			// Validate file first
			const validation = validateFile(file, options);
			if (!validation.valid) {
				const errorMsg = validation.error?.message || 'Invalid file';
				setState((prev) => ({ ...prev, error: errorMsg }));
				options?.onError?.(errorMsg);
				return null;
			}

			setState((prev) => ({
				...prev,
				isUploading: true,
				progress: null,
				error: null,
			}));

			try {
				const response = await CreateFileService(file, {
					...options,
					onProgress: (progress) => {
						setState((prev) => ({ ...prev, progress }));
						options?.onProgress?.(progress);
					},
				});

				setState((prev) => ({
					...prev,
					isUploading: false,
					progress: null,
					uploadedFiles: [...prev.uploadedFiles, response],
				}));

				options?.onSuccess?.(response);
				return response;
			} catch (error: any) {
				const errorMsg = error.message || 'Upload failed';
				setState((prev) => ({
					...prev,
					isUploading: false,
					progress: null,
					error: errorMsg,
				}));
				options?.onError?.(errorMsg);
				return null;
			}
		},
		[options]
	);

	// Upload multiple files
	const uploadFiles = useCallback(
		async (files: File[]): Promise<IMediaUploadResponse[]> => {
			setState((prev) => ({
				...prev,
				isUploading: true,
				progress: null,
				error: null,
			}));

			const results: IMediaUploadResponse[] = [];
			const errors: string[] = [];

			try {
				const responses = await CreateMultipleFilesService(files, {
					...options,
					onProgress: (fileIndex, progress) => {
						setState((prev) => ({ ...prev, progress }));
						options?.onProgress?.(progress);
					},
					onFileComplete: (fileIndex, response) => {
						results.push(response);
						options?.onSuccess?.(response);
					},
				});

				setState((prev) => ({
					...prev,
					isUploading: false,
					progress: null,
					uploadedFiles: [...prev.uploadedFiles, ...responses],
				}));

				return responses;
			} catch (error: any) {
				const errorMsg = error.message || 'Upload failed';
				errors.push(errorMsg);

				setState((prev) => ({
					...prev,
					isUploading: false,
					progress: null,
					error: errors.join(', '),
					uploadedFiles: [...prev.uploadedFiles, ...results],
				}));

				options?.onError?.(errors.join(', '));
				return results;
			}
		},
		[options]
	);

	// Upload from drag and drop event
	const uploadFromDrop = useCallback(
		async (event: React.DragEvent): Promise<IMediaUploadResponse[]> => {
			event.preventDefault();

			const files = Array.from(event.dataTransfer.files);
			if (files.length === 0) return [];

			if (files.length === 1) {
				const result = await uploadFile(files[0]);
				return result ? [result] : [];
			}

			return uploadFiles(files);
		},
		[uploadFile, uploadFiles]
	);

	// Upload from input change event
	const uploadFromInput = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>): Promise<IMediaUploadResponse[]> => {
			const files = Array.from(event.target.files || []);
			if (files.length === 0) return [];

			// Reset input value to allow re-uploading same file
			event.target.value = '';

			if (files.length === 1) {
				const result = await uploadFile(files[0]);
				return result ? [result] : [];
			}

			return uploadFiles(files);
		},
		[uploadFile, uploadFiles]
	);

	// Remove uploaded file from state
	const removeUploadedFile = useCallback((fileId: string) => {
		setState((prev) => ({
			...prev,
			uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== fileId),
		}));
	}, []);

	// Clear all uploaded files
	const clearUploadedFiles = useCallback(() => {
		setState((prev) => ({
			...prev,
			uploadedFiles: [],
		}));
	}, []);

	// Clear error
	const clearError = useCallback(() => {
		setState((prev) => ({
			...prev,
			error: null,
		}));
	}, []);

	// Reset state
	const reset = useCallback(() => {
		setState({
			isUploading: false,
			progress: null,
			uploadedFiles: [],
			error: null,
		});
	}, []);

	// Check if file is valid
	const isFileValid = useCallback(
		(file: File): boolean => {
			const validation = validateFile(file, options);
			return validation.valid;
		},
		[options]
	);

	// Get file type
	const getFileType = useCallback((file: File): MediaType => getMediaTypeFromMime(file.type), []);

	return {
		// State
		isUploading: state.isUploading,
		progress: state.progress,
		uploadedFiles: state.uploadedFiles,
		error: state.error,

		// Actions
		uploadFile,
		uploadFiles,
		uploadFromDrop,
		uploadFromInput,
		removeUploadedFile,
		clearUploadedFiles,
		clearError,
		reset,

		// Utilities
		isFileValid,
		getFileType,
	};
}
