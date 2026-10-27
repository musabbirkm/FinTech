/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Add / Edit Category Dialog with Icon, Color, Budget, and Currency Inheritance.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category } from '../types';
import { 
  AVAILABLE_ICON_NAMES, 
  AVAILABLE_COLORS, 
  CategoryIcon 
} from './CategoryIcon';
import { toMinorUnits, toMajorUnits } from '../utils/money';
import { X, Check, Plus, AlertCircle, FolderPlus } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (newCategory: Category) => void;
  editingCategory?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
  editingCategory,
}) => {
  const { currency, addCategory, updateCategory } = useApp();

  const [name, setName] = useState(editingCategory ? editingCategory.name : '');
  const [icon, setIcon] = useState(editingCategory ? editingCategory.icon : 'Folder');
  const [color, setColor] = useState(editingCategory ? editingCategory.color : AVAILABLE_COLORS[0]);
  const [description, setDescription] = useState(editingCategory ? editingCategory.description || '' : '');
  const [budgetStr, setBudgetStr] = useState(
    editingCategory && editingCategory.monthlyBudgetMinor
      ? toMajorUnits(editingCategory.monthlyBudgetMinor, editingCategory.currency).toString()
      : ''
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please provide a category name.');
      return;
    }

    const budgetMinor = budgetStr ? toMinorUnits(budgetStr, currency) : undefined;

    if (editingCategory) {
      const res = updateCategory({
        ...editingCategory,
        name: trimmed,
        icon,
        color,
        description,
        monthlyBudgetMinor: budgetMinor,
      });

      if (!res.success) {
        setError(res.error || 'Failed to update category.');
        return;
      }
      onClose();
    } else {
      const res = addCategory({
        name: trimmed,
        icon,
        color,
        description,
        monthlyBudgetMinor: budgetMinor,
      });

      if (!res.success) {
        setError(res.error || 'Failed to create category.');
        return;
      }

      if (res.newCategory && onCategoryCreated) {
        onCategoryCreated(res.newCategory);
      }
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl my-auto text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, color: color }}>
              <CategoryIcon iconName={icon} size={18} />
            </div>
            <div>
              <h2 id="category-modal-title" className="text-sm font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Create Custom Category'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Currency: <span className="font-semibold text-emerald-400">{currency}</span> ({currency === 'AED' ? 'fils' : 'paise'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div>
            <label htmlFor="cat-name-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Category Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="cat-name-input"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Personal Savings, Streaming, Pet Care"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category Color
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-slate-950" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category Icon
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
              {AVAILABLE_ICON_NAMES.map(iconName => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                    icon === iconName
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  aria-label={`Select icon ${iconName}`}
                >
                  <CategoryIcon iconName={iconName} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Optional Monthly Budget */}
          <div>
            <label htmlFor="cat-budget-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Monthly Budget ({currency}) <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              id="cat-budget-input"
              type="number"
              step="any"
              min="0"
              value={budgetStr}
              onChange={e => setBudgetStr(e.target.value)}
              placeholder={`e.g. ${currency === 'AED' ? '1500' : '15000'}`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Sets target spending limit for this category in {currency}.
            </p>
          </div>

          {/* Optional Description */}
          <div>
            <label htmlFor="cat-desc-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Description <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              id="cat-desc-input"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Monthly allocation for self and family"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 rounded-xl shadow-md flex items-center gap-1.5"
            >
              {editingCategory ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingCategory ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
