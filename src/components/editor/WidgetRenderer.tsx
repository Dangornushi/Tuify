import { useDraggable, useDroppable } from '@dnd-kit/core';
import { WidgetNode } from '../../types/models';
import { useEditorStore } from '../../store/editorStore';
import { getBorderStyle } from '../../utils/constraints';
import { Type, List, Table, Square, TextCursorInput, GripVertical } from 'lucide-react';

interface WidgetRendererProps {
  node: WidgetNode;
}

interface InputPreviewProps {
  label?: string;
  placeholder?: string;
  borderStyle?: string;
  borderColor?: string;
  multiline?: boolean;
}

const InputPreview = ({ label, placeholder, multiline }: InputPreviewProps) => {
  const displayPlaceholder = placeholder || 'Enter text...';

  return (
    <div className="relative">
      {/* Label on border */}
      {label && (
        <span
          className="absolute -top-[1.1em] left-1 px-1 text-xs bg-terminal-bg-secondary text-terminal-warning"
        >
          {label}
        </span>
      )}
      {/* Content */}
      <div className={`text-sm text-terminal-text-dim ${multiline ? 'min-h-[60px]' : ''}`}>
        {displayPlaceholder}
        {multiline && (
          <span className="block text-xs text-terminal-accent mt-1">(multiline)</span>
        )}
      </div>
    </div>
  );
};

const getWidgetIcon = (widgetType: string) => {
  switch (widgetType) {
    case 'Paragraph':
      return <Type className="w-4 h-4" />;
    case 'List':
      return <List className="w-4 h-4" />;
    case 'Table':
      return <Table className="w-4 h-4" />;
    case 'Block':
      return <Square className="w-4 h-4" />;
    case 'Input':
      return <TextCursorInput className="w-4 h-4" />;
    default:
      return <Square className="w-4 h-4" />;
  }
};

export const WidgetRenderer = ({ node }: WidgetRendererProps) => {
  const { id, widgetType, data } = node;
  const { selectedId, selectNode, dropTargetId } = useEditorStore();
  const isSelected = selectedId === id;
  const isDropTarget = dropTargetId === id;

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `droppable-widget-${id}`,
    data: {
      type: 'widget',
      nodeId: id,
    },
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `draggable-${id}`,
    data: {
      type: 'widget',
      nodeId: id,
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(id);
  };

  const borderStyle = getBorderStyle(data.borderStyle, data.borderColor);

  // 両方のrefを1つの要素に適用
  const setRefs = (element: HTMLDivElement | null) => {
    setDroppableRef(element);
    setDraggableRef(element);
  };

  return (
    <div
      ref={setRefs}
      onClick={handleClick}
      className={`
        w-full h-full p-2 font-mono text-sm
        editor-node
        ${isSelected ? 'editor-node-selected' : ''}
        ${isDropTarget ? 'ring-2 ring-terminal-accent bg-terminal-accent/20' : ''}
        ${isDragging ? 'opacity-50' : ''}
      `}
      style={{
        ...borderStyle,
        backgroundColor: isDropTarget ? undefined : (data.backgroundColor || 'transparent'),
        color: data.textColor || '#e8e8e8',
      }}
    >
      {/* Widget Header */}
      <div className="flex items-center gap-1 mb-1 text-terminal-text-dim">
        <div
          {...listeners}
          {...attributes}
          className="relative z-30 cursor-grab active:cursor-grabbing p-0.5 hover:bg-terminal-border rounded"
        >
          <GripVertical className="w-3 h-3" />
        </div>
        {getWidgetIcon(widgetType)}
        <span className="text-xs">{widgetType}</span>
      </div>

      {/* Widget Content */}
      <div className="overflow-hidden">
        {data.title && (
          <div className="font-semibold text-terminal-accent mb-1 truncate">
            {data.title}
          </div>
        )}

        {widgetType === 'Paragraph' && (
          <div className="text-terminal-text whitespace-pre-wrap line-clamp-3">
            {data.content || 'Paragraph content...'}
          </div>
        )}

        {widgetType === 'List' && (
          <ul className="list-disc list-inside">
            {(data.items || ['Item 1', 'Item 2', 'Item 3']).map(
              (item, index) => (
                <li key={index} className="truncate">
                  {item}
                </li>
              )
            )}
          </ul>
        )}

        {widgetType === 'Table' && (
          <div className="text-xs">
            <div className="flex gap-2 border-b border-terminal-border pb-1 mb-1">
              {(data.headers || ['Col 1', 'Col 2', 'Col 3']).map(
                (header, index) => (
                  <span key={index} className="flex-1 font-semibold truncate">
                    {header}
                  </span>
                )
              )}
            </div>
            {(data.rows || [['A', 'B', 'C']]).slice(0, 2).map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2">
                {row.map((cell, cellIndex) => (
                  <span key={cellIndex} className="flex-1 truncate">
                    {cell}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}

        {widgetType === 'Block' && (
          <div className="h-full min-h-[40px] bg-terminal-border/30 rounded flex items-center justify-center text-terminal-text-dim">
            Block
          </div>
        )}

        {widgetType === 'Input' && (
          <InputPreview
            label={data.label}
            placeholder={data.placeholder}
            borderStyle={data.borderStyle}
            borderColor={data.borderColor}
            multiline={data.multiline}
          />
        )}
      </div>
    </div>
  );
};
