import { useEditorStore } from '../../store/editorStore';
import { LayoutNode, WidgetNode, BorderStyle, Constraint } from '../../types/models';
import { Settings } from 'lucide-react';
import {
  TextField,
  TextAreaField,
  SelectField,
  ColorField,
  PropertyField,
} from './PropertyField';

const BORDER_OPTIONS: { value: BorderStyle; label: string }[] = [
  { value: 'None', label: 'None' },
  { value: 'Plain', label: 'Plain' },
  { value: 'Rounded', label: 'Rounded' },
  { value: 'Double', label: 'Double' },
];

const PanelHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border">
    <Settings className="w-4 h-4 text-terminal-accent" />
    <span className="font-semibold text-sm">{title}</span>
  </div>
);

export const PropertyPanel = () => {
  const { selectedId, nodes } = useEditorStore();
  const selectedNode = selectedId ? nodes[selectedId] : null;

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col bg-terminal-bg-secondary border-l border-terminal-border">
        <PanelHeader title="Properties" />
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
      <PanelHeader title="Layout Properties" />

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <PropertyField label="Direction">
          <div className="flex gap-2">
            {(['Vertical', 'Horizontal'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => handleDirectionChange(dir)}
                className={`flex-1 px-3 py-2 text-sm rounded border ${
                  node.direction === dir
                    ? 'bg-terminal-accent text-terminal-bg border-terminal-accent'
                    : 'border-terminal-border hover:border-terminal-accent'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </PropertyField>

        {node.children.length > 0 && (
          <PropertyField label="Child Constraints">
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
          </PropertyField>
        )}

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

  const handleChange = (key: string, value: string | string[] | string[][] | boolean) => {
    updateNodeProps(node.id, { [key]: value });
  };

  return (
    <div className="h-full flex flex-col bg-terminal-bg-secondary border-l border-terminal-border">
      <PanelHeader title={`${widgetType} Properties`} />

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <TextField
          label="Title"
          value={data.title || ''}
          onChange={(v) => handleChange('title', v)}
          placeholder="Widget title"
        />

        {widgetType === 'Paragraph' && (
          <TextAreaField
            label="Content"
            value={data.content || ''}
            onChange={(v) => handleChange('content', v)}
            placeholder="Enter text content..."
          />
        )}

        {widgetType === 'Input' && (
          <>
            <TextField
              label="Label"
              value={data.label || ''}
              onChange={(v) => handleChange('label', v)}
              placeholder="Input label"
            />
            <TextField
              label="Placeholder"
              value={data.placeholder || ''}
              onChange={(v) => handleChange('placeholder', v)}
              placeholder="Placeholder text"
            />
            <PropertyField label="Mode">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.multiline || false}
                  onChange={(e) => handleChange('multiline', e.target.checked)}
                  className="w-4 h-4 accent-terminal-accent"
                />
                <span className="text-sm">Multiline (textarea)</span>
              </label>
            </PropertyField>
          </>
        )}

        {widgetType === 'List' && (
          <TextAreaField
            label="Items (one per line)"
            value={(data.items || []).join('\n')}
            onChange={(v) => handleChange('items', v.split('\n'))}
            placeholder="Item 1&#10;Item 2&#10;Item 3"
          />
        )}

        <SelectField
          label="Border Style"
          value={(data.borderStyle || 'None') as BorderStyle}
          onChange={(v) => handleChange('borderStyle', v)}
          options={BORDER_OPTIONS}
        />

        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label="Border Color"
            value={data.borderColor || '#e8e8e8'}
            onChange={(v) => handleChange('borderColor', v)}
          />
          <ColorField
            label="Text Color"
            value={data.textColor || '#e8e8e8'}
            onChange={(v) => handleChange('textColor', v)}
          />
          <ColorField
            label="Background Color"
            value={data.backgroundColor || '#1a1a2e'}
            onChange={(v) => handleChange('backgroundColor', v)}
            className="col-span-2"
          />
        </div>

        <div className="text-xs text-terminal-text-dim">
          <p>Type: {widgetType}</p>
          <p>ID: {node.id.slice(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
};
