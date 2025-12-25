import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useState, useCallback, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { LayoutNode } from '../../types/models';
import { useEditorStore } from '../../store/editorStore';
import { EditorNode } from './EditorNode';
import { getFlexStyle } from '../../utils/constraints';

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
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startPosRef.current = direction === 'Vertical' ? e.clientY : e.clientX;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const currentPos = direction === 'Vertical' ? e.clientY : e.clientX;
      const diff = currentPos - startPosRef.current;

      // ピクセル差をパーセンテージに変換（親要素のサイズに基づく）
      const parent = containerRef.current?.parentElement?.parentElement;
      if (parent) {
        const parentSize =
          direction === 'Vertical' ? parent.clientHeight : parent.clientWidth;
        const deltaPercent = (diff / parentSize) * 100;

        if (Math.abs(deltaPercent) > 0.5) {
          resizeConstraints(parentId, index, deltaPercent);
          startPosRef.current = currentPos;
        }
      }
    },
    [isResizing, direction, parentId, index, resizeConstraints]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'Vertical' ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp, direction]);

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
      onMouseDown={handleMouseDown}
    />
  );
};

export const LayoutRenderer = ({ node }: LayoutRendererProps) => {
  const { direction, children, constraints, id } = node;
  const { selectedId, selectNode } = useEditorStore();
  const isSelected = selectedId === id;
  const isRoot = useEditorStore((state) => state.rootId === id);

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
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
        ${isOver ? 'bg-terminal-accent/10' : ''}
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
          {isOver ? (
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

          return (
            <div key={childId} className="contents">
              <div style={style} className="relative overflow-hidden">
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
