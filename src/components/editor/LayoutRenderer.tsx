import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useCallback, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { LayoutNode } from '../../types/models';
import { useEditorStore } from '../../store/editorStore';
import { EditorNode } from './EditorNode';
import { getFlexStyle } from '../../utils/constraints';
import { useResizeHandler } from '../../hooks/useResizeHandler';

interface LayoutRendererProps {
  node: LayoutNode;
}

interface ResizerProps {
  parentId: string;
  index: number;
  direction: 'Vertical' | 'Horizontal';
}

const Resizer = ({ parentId, index, direction }: ResizerProps) => {
  const { resizeConstraints } = useEditorStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback(
    (delta: number) => {
      // ピクセル差をパーセンテージに変換（親要素のサイズに基づく）
      const parent = containerRef.current?.parentElement?.parentElement;
      if (parent) {
        const parentSize =
          direction === 'Vertical' ? parent.clientHeight : parent.clientWidth;
        const deltaPercent = (delta / parentSize) * 100;

        if (Math.abs(deltaPercent) > 0.5) {
          resizeConstraints(parentId, index, deltaPercent);
        }
      }
    },
    [direction, parentId, index, resizeConstraints]
  );

  const { isResizing, startResize } = useResizeHandler({
    direction: direction === 'Vertical' ? 'vertical' : 'horizontal',
    onResize: handleResize,
  });

  const isVertical = direction === 'Vertical';

  return (
    <div
      ref={containerRef}
      className={`
        flex-shrink-0 z-10 group
        ${isVertical ? 'h-1 w-full cursor-row-resize' : 'w-1 h-full cursor-col-resize'}
        ${isResizing ? 'bg-terminal-accent' : 'bg-terminal-border hover:bg-terminal-accent'}
        transition-colors
      `}
      onMouseDown={startResize}
    />
  );
};

export const LayoutRenderer = ({ node }: LayoutRendererProps) => {
  const { direction, children, constraints, id } = node;
  const { selectedId, selectNode, nodes, dropTargetId } = useEditorStore();
  const isSelected = selectedId === id;
  const isRoot = useEditorStore((state) => state.rootId === id);
  const isDropTarget = dropTargetId === id;

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `droppable-${id}`,
    data: {
      type: 'layout',
      nodeId: id,
    },
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `draggable-layout-${id}`,
    data: {
      type: 'layout',
      nodeId: id,
    },
    disabled: isRoot,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(id);
  };

  return (
    <div
      ref={setDroppableRef}
      onClick={handleClick}
      className={`
        w-full h-full
        ${isRoot ? '' : 'editor-node'}
        ${isSelected ? 'editor-node-selected' : ''}
        ${isDropTarget ? 'ring-2 ring-terminal-accent bg-terminal-accent/20' : ''}
        ${isDragging ? 'opacity-50' : ''}
        transition-colors duration-200
      `}
      style={{
        display: 'flex',
        flexDirection: direction === 'Vertical' ? 'column' : 'row',
      }}
    >
      {/* Drag handle for non-root layouts */}
      {!isRoot && (
        <div
          ref={setDraggableRef}
          {...listeners}
          {...attributes}
          className="absolute top-1 left-1 z-20 cursor-grab active:cursor-grabbing p-0.5 hover:bg-terminal-border rounded text-terminal-text-dim"
        >
          <GripVertical className="w-3 h-3" />
        </div>
      )}

      {children.length === 0 ? (
        <div className="flex items-center justify-center w-full h-full min-h-[60px] text-terminal-text-dim text-sm">
          {isDropTarget ? (
            <span className="text-terminal-accent">Drop here</span>
          ) : (
            <span>Empty Layout</span>
          )}
        </div>
      ) : (
        children.map((childId, index) => {
          const constraint = constraints[index];
          const style = constraint
            ? getFlexStyle(direction, constraint)
            : { flex: 1 };
          const childNode = nodes[childId];

          // 子ノードを囲むdivのクリックハンドラ
          // 子がLayoutの場合、このdivをクリックした時に子ノードを選択する
          const handleChildContainerClick = (e: React.MouseEvent) => {
            // 子ノードがLayoutの場合のみ、クリックを捕捉して子を選択
            if (childNode?.type === 'Layout') {
              e.stopPropagation();
              selectNode(childId);
            }
          };

          return (
            <div key={childId} className="contents">
              <div
                style={style}
                className="relative overflow-hidden"
                onClick={handleChildContainerClick}
              >
                <EditorNode nodeId={childId} />
              </div>
              {index < children.length - 1 && (
                <Resizer
                  parentId={id}
                  index={index}
                  direction={direction}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
