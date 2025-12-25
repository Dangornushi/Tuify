import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, pointerWithin } from '@dnd-kit/core';
import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { LayoutNode, WidgetNode, AnyNode } from '../../types/models';
import {
  Layers,
  ChevronRight,
  ChevronDown,
  Layout,
  Type,
  List,
  Table,
  Square,
  Trash2,
  GripVertical,
  TextCursorInput,
} from 'lucide-react';

interface LayerItemProps {
  nodeId: string;
  depth: number;
}

const getNodeIcon = (node: AnyNode) => {
  if (node.type === 'Layout') {
    return <Layout className="w-4 h-4 text-terminal-accent" />;
  }

  const widgetNode = node as WidgetNode;
  switch (widgetNode.widgetType) {
    case 'Paragraph':
      return <Type className="w-4 h-4 text-blue-400" />;
    case 'List':
      return <List className="w-4 h-4 text-green-400" />;
    case 'Table':
      return <Table className="w-4 h-4 text-yellow-400" />;
    case 'Block':
      return <Square className="w-4 h-4 text-purple-400" />;
    case 'Input':
      return <TextCursorInput className="w-4 h-4 text-pink-400" />;
    default:
      return <Square className="w-4 h-4" />;
  }
};

const getNodeLabel = (node: AnyNode) => {
  if (node.type === 'Layout') {
    const layoutNode = node as LayoutNode;
    return `Layout (${layoutNode.direction})`;
  }

  const widgetNode = node as WidgetNode;
  return widgetNode.data.title || widgetNode.widgetType;
};

const LayerItem = ({ nodeId, depth }: LayerItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const node = useEditorStore((state) => state.nodes[nodeId]);
  const { selectedId, selectNode, deleteNode, rootId } = useEditorStore();

  const isRoot = rootId === nodeId;
  const isLayout = node?.type === 'Layout';

  // Draggable (non-root nodes only)
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `layer-drag-${nodeId}`,
    data: { nodeId },
    disabled: isRoot,
  });

  // Droppable (layouts only)
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `layer-drop-${nodeId}`,
    data: { nodeId },
    disabled: !isLayout,
  });

  if (!node) return null;

  const isSelected = selectedId === nodeId;
  const hasChildren = isLayout && (node as LayoutNode).children.length > 0;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(nodeId);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRoot) {
      deleteNode(nodeId);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div ref={setDropRef}>
      <div
        ref={setDragRef}
        onClick={handleSelect}
        className={`
          flex items-center gap-1 px-2 py-1 cursor-pointer group
          hover:bg-terminal-border/30 transition-colors
          ${isSelected ? 'bg-terminal-accent/20 text-terminal-accent' : ''}
          ${isDragging ? 'opacity-50' : ''}
          ${isOver && isLayout ? 'bg-terminal-accent/30 ring-1 ring-terminal-accent' : ''}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Drag handle */}
        {!isRoot && (
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-terminal-border rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-3 h-3" />
          </div>
        )}
        {isRoot && <span className="w-4" />}

        {/* Expand/Collapse button */}
        <button
          onClick={handleToggle}
          className="w-4 h-4 flex items-center justify-center"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          ) : (
            <span className="w-3" />
          )}
        </button>

        {/* Icon */}
        {getNodeIcon(node)}

        {/* Label */}
        <span className="flex-1 text-sm truncate">{getNodeLabel(node)}</span>

        {/* Delete button */}
        {!isRoot && (
          <button
            onClick={handleDelete}
            className="p-1 opacity-0 group-hover:opacity-100 hover:text-terminal-error transition-opacity"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {(node as LayoutNode).children.map((childId) => (
            <LayerItem key={childId} nodeId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const LayerPanel = () => {
  const { rootId, nodes, moveNode } = useEditorStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const nodeId = (event.active.data.current as { nodeId: string })?.nodeId;
    setActiveId(nodeId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedNodeId = (active.data.current as { nodeId: string })?.nodeId;
    const targetNodeId = (over.data.current as { nodeId: string })?.nodeId;

    if (!draggedNodeId || !targetNodeId || draggedNodeId === targetNodeId) return;

    // Check if target is a Layout
    const targetNode = nodes[targetNodeId];
    if (targetNode?.type === 'Layout') {
      const layoutNode = targetNode as LayoutNode;
      // Don't allow dropping into itself or its descendants
      const isDescendant = (parentId: string, childId: string): boolean => {
        const node = nodes[parentId];
        if (node?.type !== 'Layout') return false;
        const layout = node as LayoutNode;
        if (layout.children.includes(childId)) return true;
        return layout.children.some((id) => isDescendant(id, childId));
      };

      if (!isDescendant(draggedNodeId, targetNodeId)) {
        moveNode(draggedNodeId, targetNodeId, layoutNode.children.length);
      }
    }
  };

  const activeNode = activeId ? nodes[activeId] : null;

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col bg-terminal-bg-secondary border-r border-terminal-border">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border">
          <Layers className="w-4 h-4 text-terminal-accent" />
          <span className="font-semibold text-sm">Layers</span>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto py-2">
          <LayerItem nodeId={rootId} depth={0} />
        </div>
      </div>

      <DragOverlay>
        {activeNode && (
          <div className="bg-terminal-bg-secondary border border-terminal-accent rounded px-2 py-1 flex items-center gap-2 shadow-lg">
            {getNodeIcon(activeNode)}
            <span className="text-sm text-terminal-accent">
              {getNodeLabel(activeNode)}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
