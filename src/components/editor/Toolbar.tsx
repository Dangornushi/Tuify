import { useEditorStore } from '../../store/editorStore';
import { WidgetNode, LayoutNode } from '../../types/models';
import {
  Layout,
  Type,
  List,
  Table,
  Square,
  Plus,
  SplitSquareVertical,
  SplitSquareHorizontal,
  Trash2,
  TextCursorInput,
} from 'lucide-react';

export const Toolbar = () => {
  const { selectedId, nodes, addNode, deleteNode, rootId } = useEditorStore();

  const selectedNode = selectedId ? nodes[selectedId] : null;
  const canAddChild =
    selectedNode?.type === 'Layout' || selectedId === null || selectedId === rootId;
  const canDelete = selectedId && selectedId !== rootId;

  // Find parent for adding widgets
  const getTargetParentId = () => {
    if (!selectedId) return rootId;
    if (selectedNode?.type === 'Layout') return selectedId;
    // If widget is selected, find its parent
    for (const [id, node] of Object.entries(nodes)) {
      if (node.type === 'Layout') {
        const layoutNode = node as LayoutNode;
        if (layoutNode.children.includes(selectedId)) {
          return id;
        }
      }
    }
    return rootId;
  };

  const handleAddLayout = (direction: 'Vertical' | 'Horizontal') => {
    const parentId = getTargetParentId();
    const layoutNode: Omit<LayoutNode, 'id'> = {
      type: 'Layout',
      direction,
      children: [],
      constraints: [],
    };
    addNode(parentId, layoutNode);
  };

  const handleAddWidget = (widgetType: WidgetNode['widgetType']) => {
    const parentId = getTargetParentId();
    const widgetNode: Omit<WidgetNode, 'id'> = {
      type: 'Widget',
      widgetType,
      data: {
        title: '',
        content: '',
        borderStyle: 'Plain',
        borderColor: '#e8e8e8',
        textColor: '#e8e8e8',
        items: widgetType === 'List' ? ['Item 1', 'Item 2', 'Item 3'] : undefined,
        headers:
          widgetType === 'Table' ? ['Column 1', 'Column 2', 'Column 3'] : undefined,
        rows:
          widgetType === 'Table'
            ? [
                ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
                ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
              ]
            : undefined,
        placeholder: widgetType === 'Input' ? 'Enter text...' : undefined,
        label: widgetType === 'Input' ? 'Label' : undefined,
      },
    };
    addNode(parentId, widgetNode);
  };

  const handleDelete = () => {
    if (canDelete) {
      deleteNode(selectedId!);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-terminal-bg-secondary border-b border-terminal-border">
      {/* Layout buttons */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-terminal-text-dim mr-1">Layout:</span>
        <button
          onClick={() => handleAddLayout('Vertical')}
          disabled={!canAddChild}
          className="p-2 rounded hover:bg-terminal-border disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Vertical Layout"
        >
          <SplitSquareVertical className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleAddLayout('Horizontal')}
          disabled={!canAddChild}
          className="p-2 rounded hover:bg-terminal-border disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Horizontal Layout"
        >
          <SplitSquareHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-terminal-border" />

      {/* Widget buttons */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-terminal-text-dim mr-1">Widgets:</span>
        <button
          onClick={() => handleAddWidget('Paragraph')}
          disabled={!canAddChild}
          className="p-2 rounded hover:bg-terminal-border disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Paragraph"
        >
          <Type className="w-4 h-4 text-blue-400" />
        </button>
        <button
          onClick={() => handleAddWidget('List')}
          disabled={!canAddChild}
          className="p-2 rounded hover:bg-terminal-border disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add List"
        >
          <List className="w-4 h-4 text-green-400" />
        </button>
        <button
          onClick={() => handleAddWidget('Table')}
          disabled={!canAddChild}
          className="p-2 rounded hover:bg-terminal-border disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Table"
        >
          <Table className="w-4 h-4 text-yellow-400" />
        </button>
        <button
          onClick={() => handleAddWidget('Block')}
          disabled={!canAddChild}
          className="p-2 rounded hover:bg-terminal-border disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Block"
        >
          <Square className="w-4 h-4 text-purple-400" />
        </button>
        <button
          onClick={() => handleAddWidget('Input')}
          disabled={!canAddChild}
          className="p-2 rounded hover:bg-terminal-border disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Input"
        >
          <TextCursorInput className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      <div className="flex-1" />

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={!canDelete}
        className="p-2 rounded hover:bg-terminal-error/20 text-terminal-error disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete Selected"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
