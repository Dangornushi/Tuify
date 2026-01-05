import { DndContext, DragEndEvent, DragOverlay, DragOverEvent, pointerWithin, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { EditorNode } from './EditorNode';
import { LayoutNode } from '../../types/models';

export const Canvas = () => {
  const { rootId, nodes, moveNode, selectNode, setDropTarget } = useEditorStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const nodeId = (event.active.data.current as { nodeId: string })?.nodeId;
    setActiveId(nodeId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      setDropTarget(null);
      return;
    }

    const draggedNodeId = (active.data.current as { nodeId: string })?.nodeId;
    const overId = (over.data.current as { nodeId: string })?.nodeId;

    // 自分自身の上にいる場合はドロップターゲットをクリア
    if (!overId || draggedNodeId === overId) {
      setDropTarget(null);
      return;
    }

    // ドロップ先がLayoutの場合、その子要素として追加される
    // ドロップ先がWidget/非ルートLayoutの場合、入れ替え対象としてハイライト
    const overNode = nodes[overId];
    if (overNode) {
      setDropTarget(overId);
    } else {
      setDropTarget(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDropTarget(null); // ドラッグ終了時にドロップターゲットをクリア

    if (!over) return;

    const draggedNodeId = (active.data.current as { nodeId: string })?.nodeId;
    const overId = (over.data.current as { nodeId: string })?.nodeId;

    if (!draggedNodeId || !overId || draggedNodeId === overId) return;

    // Check if over is a Layout
    const overNode = nodes[overId];
    if (overNode?.type === 'Layout') {
      const layoutNode = overNode as LayoutNode;
      moveNode(draggedNodeId, overId, layoutNode.children.length);
    }
  };

  const handleCanvasClick = () => {
    selectNode(null);
  };

  const activeNode = activeId ? nodes[activeId] : null;

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex-1 overflow-auto bg-terminal-bg p-4"
        onClick={handleCanvasClick}
      >
        <div
          className="w-full h-full min-h-[400px] bg-terminal-bg-secondary border border-terminal-border rounded-lg overflow-hidden font-mono"
          style={{ aspectRatio: '16/9', maxHeight: 'calc(100vh - 200px)' }}
        >
          <EditorNode nodeId={rootId} />
        </div>
      </div>

      <DragOverlay>
        {activeNode && (
          <div className="bg-terminal-bg-secondary border-2 border-terminal-accent rounded p-2 opacity-80 shadow-lg">
            <span className="text-terminal-accent text-sm">
              {activeNode.type === 'Widget' ? activeNode.widgetType : 'Layout'}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
