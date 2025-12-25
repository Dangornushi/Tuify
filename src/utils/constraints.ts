import { CSSProperties } from 'react';
import { Constraint } from '../types/models';

/**
 * RatatuiのConstraint定義からCSSスタイルを生成
 */
export const getFlexStyle = (
  direction: 'Vertical' | 'Horizontal',
  constraint: Constraint
): CSSProperties => {
  const isVert = direction === 'Vertical';

  // 基本スタイル
  const style: CSSProperties = {
    display: 'flex',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  switch (constraint.type) {
    case 'Percentage':
      style.flexBasis = `${constraint.value}%`;
      style.flexGrow = 0;
      style.flexShrink = 0;
      break;
    case 'Length':
      // TUIの1行/1文字を Webでは 1.5rem 程度と仮定して変換
      style.flexBasis = `${constraint.value * 1.5}rem`;
      style.flexGrow = 0;
      style.flexShrink = 0;
      break;
    case 'Min':
      style.flexGrow = 1;
      style[isVert ? 'minHeight' : 'minWidth'] = `${constraint.value * 1.5}rem`;
      break;
    case 'Max':
      style.flexGrow = 1;
      style.flexShrink = 1;
      style[isVert ? 'maxHeight' : 'maxWidth'] = `${constraint.value * 1.5}rem`;
      break;
  }

  return style;
};

/**
 * ボーダースタイルをCSSに変換
 */
export const getBorderStyle = (
  borderStyle?: string,
  borderColor?: string
): CSSProperties => {
  if (!borderStyle || borderStyle === 'None') {
    return {};
  }

  const color = borderColor || '#e8e8e8';

  switch (borderStyle) {
    case 'Plain':
      return {
        border: `1px solid ${color}`,
      };
    case 'Rounded':
      return {
        border: `1px solid ${color}`,
        borderRadius: '8px',
      };
    case 'Double':
      return {
        border: `4px double ${color}`,
      };
    default:
      return {};
  }
};
