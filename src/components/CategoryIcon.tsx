/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  HeartHandshake,
  UtensilsCrossed,
  ShoppingCart,
  Activity,
  Home,
  Layers,
  ShoppingBag,
  Car,
  Zap,
  Coffee,
  Briefcase,
  Gift,
  Film,
  Plane,
  GraduationCap,
  Sparkles,
  Smartphone,
  Tag,
  Folder,
} from 'lucide-react';

export const CATEGORY_ICONS_MAP: Record<string, React.ElementType> = {
  HeartHandshake,
  UtensilsCrossed,
  ShoppingCart,
  Activity,
  Home,
  Layers,
  ShoppingBag,
  Car,
  Zap,
  Coffee,
  Briefcase,
  Gift,
  Film,
  Plane,
  GraduationCap,
  Sparkles,
  Smartphone,
  Tag,
  Folder,
};

export const AVAILABLE_ICON_NAMES = Object.keys(CATEGORY_ICONS_MAP);

export const AVAILABLE_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#84cc16', // lime
  '#64748b', // slate
];

export const CategoryIcon: React.FC<{
  iconName: string;
  className?: string;
  size?: number;
  color?: string;
}> = ({ iconName, className = 'w-5 h-5', size, color }) => {
  const IconComponent = CATEGORY_ICONS_MAP[iconName] || Folder;
  return <IconComponent className={className} size={size} style={color ? { color } : undefined} />;
};
