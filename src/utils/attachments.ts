/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * File attachment and receipt upload utilities for FinTech.
 * Supports PDF, PNG, JPG/JPEG, CSV, and XLSX with persistent local storage.
 */

import { AttachmentRecord, AttachmentRecordType, Currency } from '../types';

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'JPEG Image',
  'image/jpg': 'JPG Image',
  'image/png': 'PNG Image',
  'application/pdf': 'PDF Document',
  'text/csv': 'CSV Spreadsheet',
  'application/vnd.ms-excel': 'Excel / CSV Document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Workbook (XLSX)',
};

export const MAX_ATTACHMENT_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export function validateAttachmentFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 8MB.`,
    };
  }

  const mime = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase();

  const isAllowedMime = Object.keys(ALLOWED_MIME_TYPES).includes(mime);
  const isAllowedExt = ['pdf', 'png', 'jpg', 'jpeg', 'csv', 'xlsx'].includes(ext || '');

  if (!isAllowedMime && !isAllowedExt) {
    return {
      valid: false,
      error: `Unsupported file format (.${ext || 'unknown'}). Supported formats: PDF, JPG, PNG, CSV, XLSX.`,
    };
  }

  return { valid: true };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file contents'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadAttachment(attachment: AttachmentRecord): void {
  const link = document.createElement('a');
  link.href = attachment.dataUrl;
  link.download = attachment.originalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
