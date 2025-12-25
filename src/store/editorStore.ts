import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  DesignTree,
  LayoutNode,
  WidgetNode,
  WidgetData,
  Constraint,
  AnyNode,
} from '../types/models';
import { v4 as uuidv4 } from 'uuid';

// ノードプロパティ更新用の型定義
type LayoutNodeProps = Partial<Pick<LayoutNode, 'direction' | 'constraints'>>;
type WidgetNodeProps = Partial<WidgetData>;
type NodeProps = LayoutNodeProps | WidgetNodeProps;

interface EditorState {
  nodes: Record<string, AnyNode>;
  rootId: string;
  selectedId: string | null;
  isDirty: boolean;

  // Actions
  selectNode: (nodeId: string | null) => void;
  addNode: (
    parentId: string,
    node: Omit<LayoutNode, 'id'> | Omit<WidgetNode, 'id'>
  ) => string;
  updateNodeProps: (nodeId: string, props: NodeProps) => void;
  updateConstraint: (
    parentId: string,
    index: number,
    constraint: Constraint
  ) => void;
  resizeConstraints: (
    parentId: string,
    index: number,
    delta: number
  ) => void;
  deleteNode: (nodeId: string) => void;
  moveNode: (nodeId: string, newParentId: string, index: number) => void;
  loadDesignData: (designData: DesignTree) => void;
  resetEditor: () => void;
  getDesignData: () => DesignTree;
  setDirty: (dirty: boolean) => void;
}

// 初期状態を生成する関数（毎回新しいUUIDを生成）
const createInitialState = () => {
  const rootId = uuidv4();
  return {
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        type: 'Layout' as const,
        direction: 'Vertical' as const,
        children: [],
        constraints: [],
      },
    },
  };
};

export const useEditorStore = create(
  immer<EditorState>((set, get) => ({
    ...createInitialState(),
    selectedId: null,
    isDirty: false,

    // ノード選択
    selectNode: (nodeId) =>
      set((state) => {
        state.selectedId = nodeId;
      }),

    /**
     * ノード追加
     * 1. 新しいIDを生成
     * 2. nodesマップにノードを追加
     * 3. 親ノードのchildrenに新ノードIDを追加
     * 4. 既存のconstraintsを比例縮小し、新要素用スペースを確保
     * 5. isDirtyをtrueに設定
     */
    addNode: (parentId, nodeData) => {
      const newId = uuidv4();

      set((state) => {
        const newNode = { ...nodeData, id: newId } as AnyNode;
        state.nodes[newId] = newNode;

        const parent = state.nodes[parentId] as LayoutNode;
        if (parent && parent.type === 'Layout') {
          const oldChildCount = parent.children.length;
          parent.children.push(newId);

          if (oldChildCount === 0) {
            // 最初の子要素は100%
            parent.constraints = [{ type: 'Percentage' as const, value: 100 }];
          } else {
            // 既存のconstraintsを比例縮小し、新要素用に20%確保
            const newElementShare = 20;
            const shrinkRatio = (100 - newElementShare) / 100;

            // 既存のconstraintsを縮小
            let totalAfterShrink = 0;
            parent.constraints = parent.constraints.map((c) => {
              if (c.type === 'Percentage') {
                const newValue = Math.max(5, Math.round(c.value * shrinkRatio));
                totalAfterShrink += newValue;
                return { ...c, value: newValue };
              }
              return c;
            });

            // 新要素のサイズを追加（残りを割り当て）
            const newElementValue = Math.max(5, 100 - totalAfterShrink);
            parent.constraints.push({ type: 'Percentage' as const, value: newElementValue });
          }
        }

        state.isDirty = true;
      });

      return newId;
    },

    // ノードプロパティ更新
    updateNodeProps: (nodeId, props) =>
      set((state) => {
        const node = state.nodes[nodeId];
        if (node) {
          if (node.type === 'Widget') {
            node.data = { ...node.data, ...props };
          } else {
            Object.assign(node, props);
          }
          state.isDirty = true;
        }
      }),

    // 個別のConstraint更新
    updateConstraint: (parentId, index, constraint) =>
      set((state) => {
        const parent = state.nodes[parentId] as LayoutNode;
        if (parent && parent.type === 'Layout' && parent.constraints[index]) {
          // 整数に丸める（Ratatuiが小数に対応していないため）
          parent.constraints[index] = {
            ...constraint,
            value: Math.round(constraint.value),
          };
          state.isDirty = true;
        }
      }),

    // リサイズ時のConstraint更新（隣接する2つのconstraintを同時に更新）
    resizeConstraints: (parentId, index, delta) =>
      set((state) => {
        const parent = state.nodes[parentId] as LayoutNode;
        if (
          parent &&
          parent.type === 'Layout' &&
          parent.constraints[index] &&
          parent.constraints[index + 1]
        ) {
          const current = parent.constraints[index];
          const next = parent.constraints[index + 1];

          // Percentageタイプの場合のみリサイズ
          if (current.type === 'Percentage' && next.type === 'Percentage') {
            // 整数に丸める（Ratatuiが小数に対応していないため）
            const roundedDelta = Math.round(delta);
            if (roundedDelta === 0) return;

            const total = current.value + next.value;
            const newCurrentValue = Math.max(5, Math.min(total - 5, current.value + roundedDelta));
            const newNextValue = total - newCurrentValue;

            parent.constraints[index] = { type: 'Percentage', value: newCurrentValue };
            parent.constraints[index + 1] = { type: 'Percentage', value: newNextValue };
            state.isDirty = true;
          }
        }
      }),

    /**
     * ノード削除
     * 1. ルートノードは削除不可
     * 2. 親ノードからchildrenを削除
     * 3. 再帰的に子ノードも削除
     * 4. nodesマップから削除
     * 5. 削除された要素のサイズを残りに比例配分
     */
    deleteNode: (nodeId) =>
      set((state) => {
        // ルートノードは削除不可
        if (nodeId === state.rootId) {
          console.warn('ルートノードは削除できません');
          return;
        }

        const deleteRecursive = (id: string) => {
          const node = state.nodes[id];
          if (node?.type === 'Layout') {
            (node as LayoutNode).children.forEach(deleteRecursive);
          }
          delete state.nodes[id];
        };

        // 親ノードから参照を削除し、constraintsを比例拡大
        Object.values(state.nodes).forEach((node) => {
          if (node.type === 'Layout') {
            const layoutNode = node as LayoutNode;
            const index = layoutNode.children.indexOf(nodeId);
            if (index > -1) {
              // 削除される要素のconstraint値を取得
              const deletedConstraint = layoutNode.constraints[index];
              const deletedValue = deletedConstraint?.type === 'Percentage' ? deletedConstraint.value : 0;

              layoutNode.children.splice(index, 1);
              layoutNode.constraints.splice(index, 1);

              // 残りの子ノードに削除された分を比例配分
              if (layoutNode.children.length > 0 && deletedValue > 0) {
                const remainingTotal = layoutNode.constraints.reduce(
                  (sum, c) => sum + (c.type === 'Percentage' ? c.value : 0),
                  0
                );

                if (remainingTotal > 0) {
                  // 比例拡大して合計100%にする
                  const expandRatio = 100 / remainingTotal;
                  let accumulated = 0;

                  layoutNode.constraints = layoutNode.constraints.map((c, idx) => {
                    if (c.type === 'Percentage') {
                      if (idx === layoutNode.constraints.length - 1) {
                        // 最後の要素で端数調整
                        return { ...c, value: 100 - accumulated };
                      }
                      const newValue = Math.round(c.value * expandRatio);
                      accumulated += newValue;
                      return { ...c, value: newValue };
                    }
                    return c;
                  });
                }
              }
            }
          }
        });

        deleteRecursive(nodeId);

        if (state.selectedId === nodeId) {
          state.selectedId = null;
        }
        state.isDirty = true;
      }),

    /**
     * ノード移動（ドラッグ＆ドロップ用）
     * 移動元: 削除された分を比例拡大
     * 移動先: 既存を比例縮小して新要素用スペースを確保
     */
    moveNode: (nodeId, newParentId, index) =>
      set((state) => {
        // ルートノードは移動不可
        if (nodeId === state.rootId) {
          console.warn('ルートノードは移動できません');
          return;
        }

        // 自身の子孫への移動は不可（循環参照防止）
        const isDescendant = (parentId: string, childId: string): boolean => {
          const node = state.nodes[parentId];
          if (node?.type !== 'Layout') return false;
          const layoutNode = node as LayoutNode;
          if (layoutNode.children.includes(childId)) return true;
          return layoutNode.children.some((id) => isDescendant(id, childId));
        };

        if (isDescendant(nodeId, newParentId)) {
          console.warn('自身の子孫への移動はできません');
          return;
        }

        // 元の親から削除し、constraintsを比例拡大
        let movedConstraintValue = 20; // デフォルト値
        Object.values(state.nodes).forEach((node) => {
          if (node.type === 'Layout') {
            const layoutNode = node as LayoutNode;
            const oldIndex = layoutNode.children.indexOf(nodeId);
            if (oldIndex > -1) {
              // 移動する要素のconstraint値を保存
              const movedConstraint = layoutNode.constraints[oldIndex];
              if (movedConstraint?.type === 'Percentage') {
                movedConstraintValue = movedConstraint.value;
              }

              layoutNode.children.splice(oldIndex, 1);
              layoutNode.constraints.splice(oldIndex, 1);

              // 残りの子ノードに削除された分を比例配分
              if (layoutNode.children.length > 0) {
                const remainingTotal = layoutNode.constraints.reduce(
                  (sum, c) => sum + (c.type === 'Percentage' ? c.value : 0),
                  0
                );

                if (remainingTotal > 0) {
                  const expandRatio = 100 / remainingTotal;
                  let accumulated = 0;

                  layoutNode.constraints = layoutNode.constraints.map((c, idx) => {
                    if (c.type === 'Percentage') {
                      if (idx === layoutNode.constraints.length - 1) {
                        return { ...c, value: 100 - accumulated };
                      }
                      const newValue = Math.round(c.value * expandRatio);
                      accumulated += newValue;
                      return { ...c, value: newValue };
                    }
                    return c;
                  });
                }
              }
            }
          }
        });

        // 新しい親に追加し、既存を比例縮小
        const newParent = state.nodes[newParentId] as LayoutNode;
        if (newParent && newParent.type === 'Layout') {
          const oldChildCount = newParent.children.length;
          newParent.children.splice(index, 0, nodeId);

          if (oldChildCount === 0) {
            // 最初の子要素は100%
            newParent.constraints = [{ type: 'Percentage' as const, value: 100 }];
          } else {
            // 既存のconstraintsを比例縮小し、移動要素用スペースを確保
            const newElementShare = Math.min(movedConstraintValue, 50); // 最大50%
            const shrinkRatio = (100 - newElementShare) / 100;

            let totalAfterShrink = 0;
            const newConstraints: Constraint[] = [];

            for (let i = 0; i < newParent.children.length; i++) {
              if (i === index) {
                // 移動した要素のconstraint
                newConstraints.push({ type: 'Percentage' as const, value: newElementShare });
              } else {
                // 既存要素（インデックス調整）
                const oldIdx = i < index ? i : i - 1;
                const oldConstraint = newParent.constraints[oldIdx];
                if (oldConstraint?.type === 'Percentage') {
                  const newValue = Math.max(5, Math.round(oldConstraint.value * shrinkRatio));
                  totalAfterShrink += newValue;
                  newConstraints.push({ type: 'Percentage' as const, value: newValue });
                } else {
                  newConstraints.push(oldConstraint || { type: 'Percentage' as const, value: 10 });
                }
              }
            }

            // 合計を100%に調整
            const total = newConstraints.reduce((sum, c) => sum + (c.type === 'Percentage' ? c.value : 0), 0);
            if (total !== 100 && newConstraints.length > 0) {
              const diff = 100 - total;
              const lastIdx = newConstraints.length - 1;
              if (newConstraints[lastIdx].type === 'Percentage') {
                newConstraints[lastIdx] = {
                  ...newConstraints[lastIdx],
                  value: Math.max(5, newConstraints[lastIdx].value + diff),
                };
              }
            }

            newParent.constraints = newConstraints;
          }
        }

        state.isDirty = true;
      }),

    // デザインデータロード（プロジェクト読み込み時）
    loadDesignData: (designData) =>
      set((state) => {
        state.nodes = designData.nodes;
        state.rootId = designData.rootId;
        state.selectedId = null;
        state.isDirty = false;
      }),

    // エディタリセット
    resetEditor: () =>
      set((state) => {
        const initial = createInitialState();
        state.nodes = initial.nodes;
        state.rootId = initial.rootId;
        state.selectedId = null;
        state.isDirty = false;
      }),

    // 現在のデザインデータを取得
    getDesignData: () => ({
      rootId: get().rootId,
      nodes: get().nodes,
    }),

    // isDirtyフラグを設定
    setDirty: (dirty) =>
      set((state) => {
        state.isDirty = dirty;
      }),
  }))
);
