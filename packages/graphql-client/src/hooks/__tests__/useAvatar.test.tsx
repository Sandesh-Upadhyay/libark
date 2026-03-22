import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useAvatar } from '../useAvatar';

const mockUser = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  bio: '',
  coverImageId: null,
  isVerified: false,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: null,
};

const mockUploadMedia = vi.fn();
const mockUpdateUserAvatar = vi.fn();
let latestUploadConfig: { onError?: (message: string) => void } | undefined;

vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual('@apollo/client');
  return {
    ...actual,
    useMutation: () => [mockUpdateUserAvatar],
  };
});

vi.mock('../../auth/AuthProvider.js', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../useUploadMedia', () => ({
  useUploadMedia: (config: unknown) => {
    const typedConfig = config as {
      onError?: (message: string) => void;
      onSuccess?: (result: { mediaId: string; downloadUrl: string }) => void;
    };
    latestUploadConfig = typedConfig;
    return {
      uploadMedia: async (file: File) => {
        const result = await mockUploadMedia(file);
        typedConfig.onSuccess?.(result);
        return result;
      },
      isUploading: false,
      progress: 0,
      error: null,
    };
  },
}));

const mockFile = new File(['test'], 'avatar.webp', { type: 'image/webp' });

describe('useAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadMedia.mockResolvedValue({
      mediaId: 'media-123',
      downloadUrl: 'https://example.com/download',
    });
    mockUpdateUserAvatar.mockResolvedValue({
      data: {
        updateUserAvatar: {
          success: true,
          user: { profileImageId: 'media-123' },
        },
      },
    });
  });

  it('should call onUploadComplete during avatar upload', async () => {
    const onUploadComplete = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useAvatar({ onUploadComplete, onError }));

    await result.current.uploadAvatar(mockFile);

    expect(onUploadComplete).toHaveBeenCalledWith('media-123');
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle upload errors gracefully', async () => {
    const onError = vi.fn();
    mockUploadMedia.mockImplementation(async () => {
      latestUploadConfig?.onError?.('Upload failed');
      throw new Error('Upload failed');
    });

    const { result } = renderHook(() => useAvatar({ onError }));

    await expect(result.current.uploadAvatar(mockFile)).rejects.toThrow('Upload failed');
    expect(onError).toHaveBeenCalled();
  });

  it('should call update mutation with uploaded mediaId', async () => {
    const { result } = renderHook(() => useAvatar());

    await result.current.uploadAvatar(mockFile);

    expect(mockUpdateUserAvatar).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { input: { mediaId: 'media-123' } },
      })
    );
  });

  it('should expose stable idle state after upload completion', async () => {
    const { result } = renderHook(() => useAvatar());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);

    await waitFor(async () => {
      await result.current.uploadAvatar(mockFile);
    });

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
  });
});
