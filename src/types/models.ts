import { Timestamp } from 'firebase/firestore';

// ユーザー型定義
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: Timestamp;
}

// プロジェクト型定義
export interface Project {
  id: string;
  userId: string;
  title: string;
  designData: DesignTree;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// デザインツリー型定義（再帰構造）
export interface DesignTree {
  rootId: string;
  nodes: Record<string, LayoutNode | WidgetNode>;
}

// レイアウトノード型定義
export interface LayoutNode {
  id: string;
  type: 'Layout';
  direction: 'Vertical' | 'Horizontal';
  children: string[];
  constraints: Constraint[];
}

// ウィジェットノード型定義
export interface WidgetNode {
  id: string;
  type: 'Widget';
  widgetType: WidgetType;
  data: WidgetData;
}

// ウィジェットタイプ
export type WidgetType = 'Paragraph' | 'List' | 'Table' | 'Block' | 'Input';

// 制約型定義
export interface Constraint {
  type: 'Percentage' | 'Length' | 'Min' | 'Max';
  value: number;
}

// ウィジェットデータ型定義
export interface WidgetData {
  title?: string;
  content?: string;
  borderStyle?: BorderStyle;
  borderColor?: string;
  textColor?: string;
  backgroundColor?: string;
  // List用
  items?: string[];
  // Table用
  headers?: string[];
  rows?: string[][];
  // Input用
  placeholder?: string;
  label?: string;
}

// ボーダースタイル
export type BorderStyle = 'None' | 'Plain' | 'Rounded' | 'Double';

// ノード型（ユニオン）
export type AnyNode = LayoutNode | WidgetNode;

// ノードの判定用ヘルパー
export const isLayoutNode = (node: AnyNode): node is LayoutNode => {
  return node.type === 'Layout';
};

export const isWidgetNode = (node: AnyNode): node is WidgetNode => {
  return node.type === 'Widget';
};
