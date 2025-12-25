import { useEditorStore } from '../../store/editorStore';
import { LayoutRenderer } from './LayoutRenderer';
import { WidgetRenderer } from './WidgetRenderer';
import { LayoutNode, WidgetNode } from '../../types/models';

interface EditorNodeProps {
  nodeId: string;
}

/**
 * ツリーの各ノードを受け取り、タイプによって分岐する再帰コンポーネント
 */
export const EditorNode = ({ nodeId }: EditorNodeProps) => {
  const node = useEditorStore((state) => state.nodes[nodeId]);

  if (!node) return null;

  if (node.type === 'Layout') {
    return <LayoutRenderer node={node as LayoutNode} />;
  } else {
    return <WidgetRenderer node={node as WidgetNode} />;
  }
};
