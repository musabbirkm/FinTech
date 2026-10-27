/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Reusable Attachment & Receipt Management Component.
 * Supports PDF, PNG, JPG/JPEG, CSV, and XLSX with upload, preview, download, and deletion.
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AttachmentRecord, AttachmentRecordType } from '../types';
import {
  validateAttachmentFile,
  readFileAsDataUrl,
  formatFileSize,
  downloadAttachment,
} from '../utils/attachments';
import { ConfirmDialog } from './ConfirmDialog';
import {
  Paperclip,
  Upload,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Trash2,
  Eye,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface AttachmentManagerProps {
  recordId: string;
  recordType: AttachmentRecordType;
  title?: string;
  compact?: boolean;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  recordId,
  recordType,
  title = 'Receipts & File Attachments',
  compact = false,
}) => {
  const { currency, attachments, addAttachment, deleteAttachment } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentRecord | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<AttachmentRecord | null>(null);

  const recordAttachments = attachments.filter(a => a.recordId === recordId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      const dataUrl = await readFileAsDataUrl(file);
      const newAttachment: Omit<AttachmentRecord, 'id' | 'createdAt'> = {
        recordId,
        recordType,
        currency,
        originalFilename: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        dataUrl,
      };

      addAttachment(newAttachment);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to read file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (mime: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    }
    if (mime === 'application/pdf' || ext === 'pdf') {
      return <FileText className="w-4 h-4 text-rose-400" />;
    }
    if (['csv', 'xlsx', 'xls'].includes(ext || '') || mime.includes('sheet') || mime.includes('excel')) {
      return <FileSpreadsheet className="w-4 h-4 text-teal-400" />;
    }
    return <Paperclip className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className={`w-full ${compact ? 'mt-1' : 'mt-4 pt-3 border-t border-slate-800'}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
          <span>{title}</span>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
            {recordAttachments.length}
          </span>
        </label>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all"
        >
          <Upload className="w-3 h-3" />
          <span>{isUploading ? 'Uploading...' : '+ Attach File'}</span>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx"
          className="hidden"
          aria-label="Upload receipt or document"
        />
      </div>

      {uploadError && (
        <div className="p-2 mb-2 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {recordAttachments.length === 0 ? (
        <p className="text-[11px] text-slate-500 italic">
          No files attached. Supported: PDF, JPG, PNG, CSV, XLSX (max 8MB).
        </p>
      ) : (
        <div className="space-y-1.5">
          {recordAttachments.map(att => (
            <div
              key={att.id}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="p-1 rounded bg-slate-900 shrink-0">
                  {getFileIcon(att.mimeType, att.originalFilename)}
                </div>
                <div className="min-w-0">
                  <p className="text-slate-200 font-medium truncate max-w-[200px] sm:max-w-xs" title={att.originalFilename}>
                    {att.originalFilename}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {formatFileSize(att.fileSize)} &bull; {new Date(att.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {(att.mimeType.startsWith('image/') || att.mimeType === 'application/pdf') && (
                  <button
                    type="button"
                    onClick={() => setPreviewAttachment(att)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                    title="Preview File"
                    aria-label={`Preview ${att.originalFilename}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => downloadAttachment(att)}
                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded"
                  title="Download File"
                  aria-label={`Download ${att.originalFilename}`}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAttachmentToDelete(att)}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded"
                  title="Delete File"
                  aria-label={`Delete ${att.originalFilename}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal for images / documents */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 truncate pr-4">
                {getFileIcon(previewAttachment.mimeType, previewAttachment.originalFilename)}
                <span className="font-bold text-sm text-white truncate">
                  {previewAttachment.originalFilename}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  ({formatFileSize(previewAttachment.fileSize)})
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => downloadAttachment(previewAttachment)}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 rounded-xl mt-3 min-h-[300px]">
              {previewAttachment.mimeType.startsWith('image/') ? (
                <img
                  src={previewAttachment.dataUrl}
                  alt={previewAttachment.originalFilename}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                />
              ) : previewAttachment.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewAttachment.dataUrl}
                  title={previewAttachment.originalFilename}
                  className="w-full h-[60vh] rounded-lg border-0"
                />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-slate-200">
                    Preview not available for this file type.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Please download the file to open in your spreadsheet viewer.
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(previewAttachment)}
                    className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Attachment */}
      {attachmentToDelete && (
        <ConfirmDialog
          isOpen={!!attachmentToDelete}
          title="Delete Attached File"
          message={`Are you sure you want to permanently delete "${attachmentToDelete.originalFilename}"?`}
          subMessage="This cannot be undone."
          confirmText="Delete File"
          variant="danger"
          onConfirm={() => {
            deleteAttachment(attachmentToDelete.id);
            setAttachmentToDelete(null);
          }}
          onClose={() => setAttachmentToDelete(null)}
        />
      )}
    </div>
  );
};
