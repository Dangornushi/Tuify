import { useEditorStore } from '../../store/editorStore';
import { LayoutNode, WidgetNode, BorderStyle, Constraint } from '../../types/models';
import { Settings } from 'lucide-react';

export const PropertyPanel = () => {
  const { selectedId, nodes, updateNodeProps, updateConstraint } =
    useEditorStore();

  const selectedNode = selectedId ? nodes[selectedId] : null;

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col bg-terminal-bg-secondary border-l border-terminal-border">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border">
          <Settings className="w-4 h-4 text-terminal-accent" />
          <span className="font-semibold text-sm">Properties</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-terminal-text-dim text-sm">
          Select a node to edit
        </div>
      </div>
    );
  }

  if (selectedNode.type === 'Layout') {
    return <LayoutProperties node={selectedNode as LayoutNode} />;
  } else {
    return <WidgetProperties node={selectedNode as WidgetNode} />;
  }
};

// Layout Properties
const LayoutProperties = ({ node }: { node: LayoutNode }) => {
  const { updateNodeProps } = useEditorStore();

  const handleDirectionChange = (direction: 'Vertical' | 'Horizontal') => {
    updateNodeProps(node.id, { direction });
  };

  return (
    <div className="h-full flex flex-col bg-terminal-bg-secondary border-l border-terminal-border">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border">
        <Settings className="w-4 h-4 text-terminal-accent" />
        <span className="font-semibold text-sm">Layout Properties</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Direction */}
        <div>
          <label className="block text-sm text-terminal-text-dim mb-2">
            Direction
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleDirectionChange('Vertical')}
              className={`flex-1 px-3 py-2 text-sm rounded border ${
                node.direction === 'Vertical'
                  ? 'bg-terminal-accent text-terminal-bg border-terminal-accent'
                  : 'border-terminal-border hover:border-terminal-accent'
              }`}
            >
              Vertical
            </button>
            <button
              onClick={() => handleDirectionChange('Horizontal')}
              className={`flex-1 px-3 py-2 text-sm rounded border ${
                node.direction === 'Horizontal'
                  ? 'bg-terminal-accent text-terminal-bg border-terminal-accent'
                  : 'border-terminal-border hover:border-terminal-accent'
              }`}
            >
              Horizontal
            </button>
          </div>
        </div>

        {/* Constraints */}
        {node.children.length > 0 && (
          <div>
            <label className="block text-sm text-terminal-text-dim mb-2">
              Child Constraints
            </label>
            <div className="space-y-2">
              {node.constraints.map((constraint, index) => (
                <ConstraintEditor
                  key={index}
                  parentId={node.id}
                  index={index}
                  constraint={constraint}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-terminal-text-dim">
          <p>Children: {node.children.length}</p>
          <p>ID: {node.id.slice(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
};

// Constraint Editor
const ConstraintEditor = ({
  parentId,
  index,
  constraint,
}: {
  parentId: string;
  index: number;
  constraint: Constraint;
}) => {
  const { updateConstraint } = useEditorStore();

  const handleTypeChange = (type: Constraint['type']) => {
    updateConstraint(parentId, index, { ...constraint, type });
  };

  const handleValueChange = (value: number) => {
    updateConstraint(parentId, index, { ...constraint, value });
  };

  return (
    <div className="flex gap-2 items-center">
      <span className="text-xs text-terminal-text-dim w-8">#{index + 1}</span>
      <select
        value={constraint.type}
        onChange={(e) => handleTypeChange(e.target.value as Constraint['type'])}
        className="flex-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1 text-sm"
      >
        <option value="Percentage">%</option>
        <option value="Length">Fixed</option>
        <option value="Min">Min</option>
        <option value="Max">Max</option>
      </select>
      <input
        type="number"
        value={constraint.value}
        onChange={(e) => handleValueChange(Math.round(Number(e.target.value)))}
        className="w-16 bg-terminal-bg border border-terminal-border rounded px-2 py-1 text-sm"
        min={0}
        max={constraint.type === 'Percentage' ? 100 : undefined}
        step={1}
      />
    </div>
  );
};

// Widget Properties
const WidgetProperties = ({ node }: { node: WidgetNode }) => {
  const { updateNodeProps } = useEditorStore();
  const { data, widgetType } = node;

  const handleChange = (key: string, value: string | string[] | string[][]) => {
    updateNodeProps(node.id, { [key]: value });
  };

  return (
    <div className="h-full flex flex-col bg-terminal-bg-secondary border-l border-terminal-border">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border">
        <Settings className="w-4 h-4 text-terminal-accent" />
        <span className="font-semibold text-sm">{widgetType} Properties</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm text-terminal-text-dim mb-1">
            Title
          </label>
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="input-field"
            placeholder="Widget title"
          />
        </div>

        {/* Content (for Paragraph) */}
        {widgetType === 'Paragraph' && (
          <div>
            <label className="block text-sm text-terminal-text-dim mb-1">
              Content
            </label>
            <textarea
              value={data.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
              className="input-field min-h-[100px] resize-y"
              placeholder="Enter text content..."
            />
          </div>
        )}

        {/* Label & Placeholder (for Input) */}
        {widgetType === 'Input' && (
          <>
            <div>
              <label className="block text-sm text-terminal-text-dim mb-1">
                Label
              </label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="input-field"
                placeholder="Input label"
              />
            </div>
            <div>
              <label className="block text-sm text-terminal-text-dim mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={data.placeholder || ''}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                className="input-field"
                placeholder="Placeholder text"
              />
            </div>
          </>
        )}

        {/* Items (for List) */}
        {widgetType === 'List' && (
          <div>
            <label className="block text-sm text-terminal-text-dim mb-1">
              Items (one per line)
            </label>
            <textarea
              value={(data.items || []).join('\n')}
              onChange={(e) =>
                handleChange('items', e.target.value.split('\n'))
              }
              className="input-field min-h-[100px] resize-y"
              placeholder="Item 1&#10;Item 2&#10;Item 3"
            />
          </div>
        )}

        {/* Border Style */}
        <div>
          <label className="block text-sm text-terminal-text-dim mb-1">
            Border Style
          </label>
          <select
            value={data.borderStyle || 'None'}
            onChange={(e) =>
              handleChange('borderStyle', e.target.value as BorderStyle)
            }
            className="input-field"
          >
            <option value="None">None</option>
            <option value="Plain">Plain</option>
            <option value="Rounded">Rounded</option>
            <option value="Double">Double</option>
          </select>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-terminal-text-dim mb-1">
              Border Color
            </label>
            <input
              type="color"
              value={data.borderColor || '#e8e8e8'}
              onChange={(e) => handleChange('borderColor', e.target.value)}
              className="w-full h-8 bg-transparent border border-terminal-border rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm text-terminal-text-dim mb-1">
              Text Color
            </label>
            <input
              type="color"
              value={data.textColor || '#e8e8e8'}
              onChange={(e) => handleChange('textColor', e.target.value)}
              className="w-full h-8 bg-transparent border border-terminal-border rounded cursor-pointer"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-terminal-text-dim mb-1">
              Background Color
            </label>
            <input
              type="color"
              value={data.backgroundColor || '#1a1a2e'}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="w-full h-8 bg-transparent border border-terminal-border rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-terminal-text-dim">
          <p>Type: {widgetType}</p>
          <p>ID: {node.id.slice(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
};
