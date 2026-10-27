/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Universal In-App Confirmation Dialog.
 * Replaces native window.confirm() which is blocked or silent in iframe and mobile contexts.
 */

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  subMessage,
  confirmText = 'Delete Record',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Confirmation action failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 shadow-md';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50 shadow-md';
      default:
        return 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold shadow-emerald-950/50 shadow-md';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-md p-5 shadow-2xl my-auto text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5 mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {variant === 'danger' ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 pr-6">
            <h2 id="confirm-dialog-title" className="text-sm font-bold text-white leading-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{message}</p>
            {subMessage && (
              <p className="text-[11px] text-slate-400 mt-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800 italic">
                {subMessage}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${getButtonStyles()} ${
              isProcessing ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isProcessing ? 'Deleting...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
