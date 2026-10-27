import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateAttachmentFile, formatFileSize, MAX_ATTACHMENT_SIZE_BYTES } from './attachments';

describe('Attachment Utilities', () => {
  it('formats file sizes accurately', () => {
    assert.strictEqual(formatFileSize(500), '500 B');
    assert.strictEqual(formatFileSize(1024), '1.0 KB');
    assert.strictEqual(formatFileSize(1024 * 1024 * 2.5), '2.5 MB');
  });

  it('validates allowed file types (PDF, PNG, JPG, CSV, XLSX)', () => {
    const validPdf = {
      name: 'receipt.pdf',
      size: 1024 * 100,
      type: 'application/pdf',
    } as File;
    assert.deepStrictEqual(validateAttachmentFile(validPdf), { valid: true });

    const validPng = {
      name: 'invoice.png',
      size: 1024 * 500,
      type: 'image/png',
    } as File;
    assert.deepStrictEqual(validateAttachmentFile(validPng), { valid: true });

    const validXlsx = {
      name: 'ledger.xlsx',
      size: 1024 * 200,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    } as File;
    assert.deepStrictEqual(validateAttachmentFile(validXlsx), { valid: true });

    const validCsv = {
      name: 'statement.csv',
      size: 1024 * 50,
      type: 'text/csv',
    } as File;
    assert.deepStrictEqual(validateAttachmentFile(validCsv), { valid: true });
  });

  it('rejects files larger than 8MB', () => {
    const oversizedFile = {
      name: 'large_video.mp4',
      size: MAX_ATTACHMENT_SIZE_BYTES + 1024,
      type: 'application/pdf',
    } as File;
    const res = validateAttachmentFile(oversizedFile);
    assert.strictEqual(res.valid, false);
    assert.match(res.error || '', /exceeds maximum limit of 8MB/);
  });

  it('rejects forbidden file extensions', () => {
    const exeFile = {
      name: 'script.exe',
      size: 1024,
      type: 'application/x-msdownload',
    } as File;
    const res = validateAttachmentFile(exeFile);
    assert.strictEqual(res.valid, false);
    assert.match(res.error || '', /Unsupported file format/);
  });
});
