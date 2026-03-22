/**
 * 🚀 S3 Gateway Upload Functions テスト
 *
 * putToGateway, headerPairsToRecord, uploadViaGateway, useProxyUploadのテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ReactNode } from 'react';
import React from 'react';

import {
  putToGateway,
  headerPairsToRecord,
  type HeaderPair,
  type UploadProgress,
} from '../utils/upload';
import { useProxyUpload, UPLOAD_FILE_PROXY } from '../hooks/useProxyUpload';
import { CREATE_UPLOAD_SESSION, COMPLETE_UPLOAD_SESSION } from '../mutations/media';

// Base64エンコードのヘルパー関数
const fileToBase64 = (file: File): string => {
  return Buffer.from('test content', 'utf8').toString('base64');
};

// ================================
// モック設定
// ================================

// XMLHttpRequest モック
class MockXMLHttpRequest {
  public status: number = 200;
  public readyState: number = 0;
  public responseText: string = '';
  private _url: string = '';
  private _method: string = '';
  private _headers: Record<string, string> = {};
  private _timeout: number = 0;
  private _upload: XMLHttpRequestUpload = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as any;
  private _listeners: Record<string, Function[]> = {};
  private _progressListeners: Record<string, Function[]> = {};

  open(method: string, url: string, async: boolean = true) {
    this._method = method;
    this._url = url;
    this.readyState = 1;
  }

  setRequestHeader(name: string, value: string) {
    this._headers[name] = value;
  }

  send(body?: any) {
    this.readyState = 2;

    // タイムアウト設定
    if (this._timeout > 0) {
      setTimeout(() => {
        this._listeners['timeout']?.forEach(cb => cb());
      }, this._timeout);
      return;
    }

    // ネットワークエラーをシミュレート（status = 0）
    if (this.status === 0) {
      setTimeout(() => {
        this._listeners['error']?.forEach(cb => cb());
      }, 10);
      return;
    }

    // レスポンスをシミュレート
    setTimeout(() => {
      this.readyState = 4;
      this._listeners['load']?.forEach(cb => cb());
    }, 10);
  }

  abort() {
    this.readyState = 0;
    this._listeners['abort']?.forEach(cb => cb());
  }

  get upload() {
    return {
      addEventListener: (event: string, callback: Function) => {
        if (!this._progressListeners[event]) {
          this._progressListeners[event] = [];
        }
        this._progressListeners[event].push(callback);
      },
      removeEventListener: (event: string, callback: Function) => {
        this._progressListeners[event] =
          this._progressListeners[event]?.filter(cb => cb !== callback) || [];
      },
    };
  }

  get response() {
    return this.responseText;
  }

  addEventListener(event: string, callback: Function) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  // テスト用ヘルパーメソッド
  setStatus(status: number) {
    this.status = status;
  }

  setTimeout(timeout: number) {
    this._timeout = timeout;
  }

  triggerProgress(loaded: number, total: number) {
    this._progressListeners['progress']?.forEach(cb => {
      cb({ lengthComputable: true, loaded, total });
    });
  }

  reset() {
    this.status = 200;
    this.readyState = 0;
    this.responseText = '';
    this._url = '';
    this._method = '';
    this._headers = {};
    this._timeout = 0;
    this._listeners = {};
    this._progressListeners = {};
  }
}

// XMLHttpRequest をモック
let mockXHR: MockXMLHttpRequest;

beforeEach(() => {
  mockXHR = new MockXMLHttpRequest();
  global.XMLHttpRequest = vi.fn(() => mockXHR) as any;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ================================
// テストデータ
// ================================

const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
const mockUploadUrl = 'https://test-gateway.example.com/upload/test-id';
const mockHeaders: Record<string, string> = {
  'Content-Type': 'image/jpeg',
  Authorization: 'Bearer test-token',
};

// ================================
// putToGateway テスト
// ================================

describe('putToGateway', () => {
  beforeEach(() => {
    mockXHR.reset();
  });

  it('正常にアップロードされる', async () => {
    mockXHR.setStatus(204);

    await expect(
      putToGateway(mockUploadUrl, mockFile, {
        headers: mockHeaders,
      })
    ).resolves.not.toThrow();
  });

  it('onProgressコールバックが正しく呼ばれる', async () => {
    mockXHR.setStatus(204);

    const progressCallback = vi.fn();

    const uploadPromise = putToGateway(mockUploadUrl, mockFile, {
      headers: mockHeaders,
      onProgress: (progress: UploadProgress) => {
        progressCallback(progress);
      },
    });

    // プログレスイベントをトリガー
    await new Promise(resolve => setTimeout(resolve, 5));
    mockXHR.triggerProgress(256, 1024);
    await new Promise(resolve => setTimeout(resolve, 5));
    mockXHR.triggerProgress(512, 1024);
    await new Promise(resolve => setTimeout(resolve, 5));
    mockXHR.triggerProgress(1024, 1024);

    await uploadPromise;

    expect(progressCallback).toHaveBeenCalledWith({
      loaded: 256,
      total: 1024,
      percent: 25,
    });
    expect(progressCallback).toHaveBeenCalledWith({
      loaded: 512,
      total: 1024,
      percent: 50,
    });
    expect(progressCallback).toHaveBeenCalledWith({
      loaded: 1024,
      total: 1024,
      percent: 100,
    });
  });

  it('signalでアップロードをキャンセルできる', async () => {
    const abortController = new AbortController();
    const uploadPromise = putToGateway(mockUploadUrl, mockFile, {
      headers: mockHeaders,
      signal: abortController.signal,
    });

    // アップロードをキャンセル
    abortController.abort();

    await expect(uploadPromise).rejects.toThrow('アップロードがキャンセルされました');
  });
});

// ================================
// putToGateway - 異常系テスト
// ================================

describe('putToGateway - 異常系', () => {
  beforeEach(() => {
    mockXHR.reset();
  });

  it('ネットワークエラーでエラー', async () => {
    mockXHR.setStatus(0); // ネットワークエラー

    await expect(
      putToGateway(mockUploadUrl, mockFile, {
        headers: mockHeaders,
      })
    ).rejects.toThrow('ネットワークエラーが発生しました');
  });

  it('401エラーでエラー', async () => {
    mockXHR.setStatus(401);

    await expect(
      putToGateway(mockUploadUrl, mockFile, {
        headers: mockHeaders,
      })
    ).rejects.toThrow('認証に失敗しました');
  });

  it('403エラーでエラー', async () => {
    mockXHR.setStatus(403);

    await expect(
      putToGateway(mockUploadUrl, mockFile, {
        headers: mockHeaders,
      })
    ).rejects.toThrow('アクセス権限がありません');
  });

  it('404エラーでエラー', async () => {
    mockXHR.setStatus(404);

    await expect(
      putToGateway(mockUploadUrl, mockFile, {
        headers: mockHeaders,
      })
    ).rejects.toThrow('アップロード先が見つかりません');
  });

  it('409エラーでエラー', async () => {
    mockXHR.setStatus(409);

    await expect(
      putToGateway(mockUploadUrl, mockFile, {
        headers: mockHeaders,
      })
    ).rejects.toThrow('ファイルが既に存在するか、競合が発生しました');
  });

  it('413エラーでエラー', async () => {
    mockXHR.setStatus(413);

    await expect(
      putToGateway(mockUploadUrl, mockFile, {
        headers: mockHeaders,
      })
    ).rejects.toThrow('ファイルサイズが大きすぎます');
  });

  it('415エラーでエラー', async () => {
    mockXHR.setStatus(415);

    await expect(
      putToGateway(mockUploadUrl, mockFile, {
        headers: mockHeaders,
      })
    ).rejects.toThrow('サポートされていないファイル形式です');
  });

  it('500エラーでエラー', async () => {
    mockXHR.setStatus(500);

    await expect(
      putToGateway(mockUploadUrl, mockFile, {
        headers: mockHeaders,
      })
    ).rejects.toThrow('サーバーエラーが発生しました');
  });

  it('タイムアウトでエラー', async () => {
    mockXHR.setTimeout(10); // 10msでタイムアウト

    await expect(
      putToGateway(mockUploadUrl, mockFile, {
        headers: mockHeaders,
      })
    ).rejects.toThrow('アップロードがタイムアウトしました');
  });
});

// ================================
// headerPairsToRecord テスト
// ================================

describe('headerPairsToRecord', () => {
  it('HeaderPair[]がRecordに変換される', () => {
    const pairs: HeaderPair[] = [
      { key: 'Content-Type', value: 'image/jpeg' },
      { key: 'Authorization', value: 'Bearer token' },
      { key: 'X-Custom-Header', value: 'custom-value' },
    ];

    const result = headerPairsToRecord(pairs);

    expect(result).toEqual({
      'Content-Type': 'image/jpeg',
      Authorization: 'Bearer token',
      'X-Custom-Header': 'custom-value',
    });
  });

  it('同名キーが後勝ち', () => {
    const pairs: HeaderPair[] = [
      { key: 'X-Custom-Header', value: 'first-value' },
      { key: 'X-Custom-Header', value: 'second-value' },
      { key: 'X-Custom-Header', value: 'third-value' },
    ];

    const result = headerPairsToRecord(pairs);

    expect(result['X-Custom-Header']).toBe('third-value');
  });

  it('空の配列で空のRecordが返る', () => {
    const pairs: HeaderPair[] = [];

    const result = headerPairsToRecord(pairs);

    expect(result).toEqual({});
  });
});

// ================================
// uploadViaGateway テスト
// ================================

describe('uploadViaGateway', () => {
  const mockCreateUploadSessionResponse = {
    data: {
      createUploadSession: {
        uploadId: 'test-upload-id',
        uploadPath: 'https://test-gateway.example.com/upload/test-upload-id',
        uploadAuthToken: 'test-auth-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        requiredHeaders: [
          { key: 'Content-Type', value: 'image/jpeg' },
          { key: 'X-Upload-Id', value: 'test-upload-id' },
        ],
        maxBytes: 10485760,
      },
    },
  };

  const mockCompleteUploadSessionResponse = {
    data: {
      completeUploadSession: {
        id: 'media-123',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 12,
        status: 'PROCESSING',
        type: 'POST',
        s3Key: 'uploads/test/test-upload-id/test.jpg',
        url: 'https://cdn.example.com/test.jpg',
        thumbnailUrl: 'https://cdn.example.com/test-thumb.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  };

  const mocks = [
    {
      request: {
        query: CREATE_UPLOAD_SESSION,
        variables: {
          input: {
            kind: 'POST',
            filename: 'test.jpg',
            contentType: 'image/jpeg',
            byteSize: 12,
          },
        },
      },
      result: mockCreateUploadSessionResponse,
    },
    {
      request: {
        query: COMPLETE_UPLOAD_SESSION,
        variables: {
          uploadId: 'test-upload-id',
        },
      },
      result: mockCompleteUploadSessionResponse,
    },
  ];

  const wrapper = function createWrapper(testMocks: any[]) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return React.createElement(MockedProvider, { mocks: testMocks }, children);
    };
  };

  beforeEach(() => {
    mockXHR.reset();
    mockXHR.setStatus(204);
  });

  it('正常にアップロードされる', async () => {
    const { result } = renderHook(
      () =>
        useProxyUpload({
          mediaType: 'POST',
          mode: 'gateway',
        }),
      { wrapper: wrapper(mocks) }
    );

    await act(async () => {
      const uploadResult = await result.current.uploadFile(mockFile);

      expect(uploadResult).toEqual({
        success: true,
        mediaId: 'media-123',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        size: 12,
        downloadUrl: 'https://cdn.example.com/test.jpg',
        encrypted: false,
      });
    });
  });

  it('onProgressコールバックが呼ばれる', async () => {
    const onProgress = vi.fn();

    const { result } = renderHook(
      () =>
        useProxyUpload({
          mediaType: 'POST',
          mode: 'gateway',
          onProgress,
        }),
      { wrapper: wrapper(mocks) }
    );

    await act(async () => {
      await result.current.uploadFile(mockFile);
    });

    // プログレスが更新されたことを確認
    expect(onProgress).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(100);
  });
});

// ================================
// uploadViaGateway - 異常系テスト
// ================================

describe('uploadViaGateway - 異常系', () => {
  const mockCreateUploadSessionResponse = {
    data: {
      createUploadSession: {
        uploadId: 'test-upload-id',
        uploadPath: 'https://test-gateway.example.com/upload/test-upload-id',
        uploadAuthToken: 'test-auth-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        requiredHeaders: [{ key: 'Content-Type', value: 'image/jpeg' }],
        maxBytes: 10485760,
      },
    },
  };

  const mockCompleteUploadSessionResponse = {
    data: {
      completeUploadSession: {
        id: 'media-123',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 12,
        status: 'PROCESSING',
        type: 'POST',
        s3Key: 'uploads/test/test-upload-id/test.jpg',
        url: 'https://cdn.example.com/test.jpg',
        thumbnailUrl: 'https://cdn.example.com/test-thumb.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  };

  const wrapper = function createWrapper(testMocks: any[]) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return React.createElement(MockedProvider, { mocks: testMocks }, children);
    };
  };

  beforeEach(() => {
    mockXHR.reset();
    mockXHR.setStatus(204);
  });

  it('createUploadSessionでエラー', async () => {
    const testMocks = [
      {
        request: {
          query: CREATE_UPLOAD_SESSION,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 12,
            },
          },
        },
        error: new Error('Failed to create upload session'),
      },
    ];

    const { result } = renderHook(
      () =>
        useProxyUpload({
          mediaType: 'POST',
          mode: 'gateway',
        }),
      { wrapper: wrapper(testMocks) }
    );

    await act(async () => {
      await expect(result.current.uploadFile(mockFile)).rejects.toThrow(
        'Failed to create upload session'
      );
    });
  });

  it('putToGatewayでエラー', async () => {
    mockXHR.setStatus(500);

    const testMocks = [
      {
        request: {
          query: CREATE_UPLOAD_SESSION,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 12,
            },
          },
        },
        result: mockCreateUploadSessionResponse,
      },
    ];

    const { result } = renderHook(
      () =>
        useProxyUpload({
          mediaType: 'POST',
          mode: 'gateway',
        }),
      { wrapper: wrapper(testMocks) }
    );

    await act(async () => {
      await expect(result.current.uploadFile(mockFile)).rejects.toThrow(
        'サーバーエラーが発生しました'
      );
    });
  });

  it('completeUploadSessionでエラー', async () => {
    const testMocks = [
      {
        request: {
          query: CREATE_UPLOAD_SESSION,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 12,
            },
          },
        },
        result: mockCreateUploadSessionResponse,
      },
      {
        request: {
          query: COMPLETE_UPLOAD_SESSION,
          variables: {
            uploadId: 'test-upload-id',
          },
        },
        error: new Error('Failed to complete upload session'),
      },
    ];

    const { result } = renderHook(
      () =>
        useProxyUpload({
          mediaType: 'POST',
          mode: 'gateway',
        }),
      { wrapper: wrapper(testMocks) }
    );

    await act(async () => {
      await expect(result.current.uploadFile(mockFile)).rejects.toThrow(
        'Failed to complete upload session'
      );
    });
  });
});

// ================================
// useProxyUpload テスト
// ================================

describe('useProxyUpload', () => {
  const mockUploadFileProxyResponse = {
    data: {
      uploadFileProxy: {
        success: true,
        mediaId: 'media-123',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        size: 12,
        downloadUrl: 'https://cdn.example.com/test.jpg',
        encrypted: false,
      },
    },
  };

  const mockCreateUploadSessionResponse = {
    data: {
      createUploadSession: {
        uploadId: 'test-upload-id',
        uploadPath: 'https://test-gateway.example.com/upload/test-upload-id',
        uploadAuthToken: 'test-auth-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        requiredHeaders: [{ key: 'Content-Type', value: 'image/jpeg' }],
        maxBytes: 10485760,
      },
    },
  };

  const mockCompleteUploadSessionResponse = {
    data: {
      completeUploadSession: {
        id: 'media-123',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 12,
        status: 'PROCESSING',
        type: 'POST',
        s3Key: 'uploads/test/test-upload-id/test.jpg',
        url: 'https://cdn.example.com/test.jpg',
        thumbnailUrl: 'https://cdn.example.com/test-thumb.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  };

  const wrapper = function createWrapper(testMocks: any[]) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return React.createElement(MockedProvider, { mocks: testMocks }, children);
    };
  };

  beforeEach(() => {
    mockXHR.reset();
    mockXHR.setStatus(204);
  });

  it('mode: gatewayで正常にアップロードされる', async () => {
    const testMocks = [
      {
        request: {
          query: CREATE_UPLOAD_SESSION,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 12,
            },
          },
        },
        result: mockCreateUploadSessionResponse,
      },
      {
        request: {
          query: COMPLETE_UPLOAD_SESSION,
          variables: {
            uploadId: 'test-upload-id',
          },
        },
        result: mockCompleteUploadSessionResponse,
      },
    ];

    const { result } = renderHook(
      () =>
        useProxyUpload({
          mediaType: 'POST',
          mode: 'gateway',
        }),
      { wrapper: wrapper(testMocks) }
    );

    await act(async () => {
      const uploadResult = await result.current.uploadFile(mockFile);

      expect(uploadResult).toEqual({
        success: true,
        mediaId: 'media-123',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        size: 12,
        downloadUrl: 'https://cdn.example.com/test.jpg',
        encrypted: false,
      });
    });
  });

  it('mode: base64で正常にアップロードされる', async () => {
    const testMocks = [
      {
        request: {
          query: UPLOAD_FILE_PROXY,
          variables: {
            input: {
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              size: 12,
              mediaType: 'POST',
              fileData: fileToBase64(mockFile),
            },
          },
        },
        result: mockUploadFileProxyResponse,
      },
    ];

    const { result } = renderHook(
      () =>
        useProxyUpload({
          mediaType: 'POST',
          mode: 'base64',
        }),
      { wrapper: wrapper(testMocks) }
    );

    await act(async () => {
      const uploadResult = await result.current.uploadFile(mockFile);

      expect(uploadResult).toEqual({
        success: true,
        mediaId: 'media-123',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        size: 12,
        downloadUrl: 'https://cdn.example.com/test.jpg',
        encrypted: false,
      });
    });
  });

  it('デフォルトでgatewayモードが使用される', async () => {
    const testMocks = [
      {
        request: {
          query: CREATE_UPLOAD_SESSION,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 12,
            },
          },
        },
        result: mockCreateUploadSessionResponse,
      },
      {
        request: {
          query: COMPLETE_UPLOAD_SESSION,
          variables: {
            uploadId: 'test-upload-id',
          },
        },
        result: mockCompleteUploadSessionResponse,
      },
    ];

    const { result } = renderHook(
      () =>
        useProxyUpload({
          mediaType: 'POST',
          // mode未指定
        }),
      { wrapper: wrapper(testMocks) }
    );

    await act(async () => {
      const uploadResult = await result.current.uploadFile(mockFile);

      expect(uploadResult).toEqual({
        success: true,
        mediaId: 'media-123',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        size: 12,
        downloadUrl: 'https://cdn.example.com/test.jpg',
        encrypted: false,
      });
    });
  });

  it('onSuccessコールバックが呼ばれる', async () => {
    const onSuccess = vi.fn();
    const testMocks = [
      {
        request: {
          query: UPLOAD_FILE_PROXY,
          variables: {
            input: {
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              size: 12,
              mediaType: 'POST',
              fileData: fileToBase64(mockFile),
            },
          },
        },
        result: mockUploadFileProxyResponse,
      },
    ];

    const { result } = renderHook(
      () =>
        useProxyUpload({
          mediaType: 'POST',
          mode: 'base64',
          onSuccess,
        }),
      { wrapper: wrapper(testMocks) }
    );

    await act(async () => {
      await result.current.uploadFile(mockFile);
    });

    expect(onSuccess).toHaveBeenCalledWith({
      success: true,
      mediaId: 'media-123',
      filename: 'test.jpg',
      contentType: 'image/jpeg',
      size: 12,
      downloadUrl: 'https://cdn.example.com/test.jpg',
      encrypted: false,
    });
  });

  it('onErrorコールバックが呼ばれる', async () => {
    const onError = vi.fn();
    const testMocks = [
      {
        request: {
          query: UPLOAD_FILE_PROXY,
          variables: {
            input: {
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              size: 12,
              mediaType: 'POST',
              fileData: fileToBase64(mockFile),
            },
          },
        },
        error: new Error('Upload failed'),
      },
    ];

    const { result } = renderHook(
      () =>
        useProxyUpload({
          mediaType: 'POST',
          mode: 'base64',
          onError,
        }),
      { wrapper: wrapper(testMocks) }
    );

    await act(async () => {
      try {
        await result.current.uploadFile(mockFile);
      } catch (error) {
        // エラーが期待される
      }
    });

    expect(onError).toHaveBeenCalledWith('Upload failed');
  });
});
