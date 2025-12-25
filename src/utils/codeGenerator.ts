import {
  DesignTree,
  LayoutNode,
  WidgetNode,
  AnyNode,
  Constraint,
} from '../types/models';

/**
 * デザインツリーからRustコードを生成する
 */
export const generateRustCode = (designData: DesignTree): string => {
  const { rootId, nodes } = designData;

  // Collect all imports needed
  const imports = new Set<string>();
  imports.add('use crossterm::{execute, terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen}, event::{self, Event, KeyCode}};');
  imports.add('use ratatui::{prelude::*, widgets::*};');
  imports.add('use std::io::{self, stdout};');

  // Generate the UI function body
  const uiBody = generateNodeCode(rootId, nodes, 'f', 0);

  // Generate the full main.rs content
  const code = `${Array.from(imports).join('\n')}

fn main() -> io::Result<()> {
    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // Main loop
    loop {
        terminal.draw(|f| {
            ui(f);
        })?;

        // Handle events
        if event::poll(std::time::Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                if key.code == KeyCode::Char('q') {
                    break;
                }
            }
        }
    }

    // Restore terminal
    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;

    Ok(())
}

fn ui(f: &mut Frame) {
    let area = f.area();
${uiBody}
}
`;

  return code;
};

/**
 * 再帰的にノードのコードを生成
 */
const generateNodeCode = (
  nodeId: string,
  nodes: Record<string, AnyNode>,
  frameVar: string,
  indent: number
): string => {
  const node = nodes[nodeId];
  if (!node) return '';

  const indentStr = '    '.repeat(indent + 1);

  if (node.type === 'Layout') {
    return generateLayoutCode(node as LayoutNode, nodes, frameVar, indent);
  } else {
    return generateWidgetCode(node as WidgetNode, frameVar, indent);
  }
};

/**
 * レイアウトノードのコードを生成
 */
const generateLayoutCode = (
  node: LayoutNode,
  nodes: Record<string, AnyNode>,
  frameVar: string,
  indent: number
): string => {
  const indentStr = '    '.repeat(indent + 1);
  const { direction, children, constraints } = node;

  if (children.length === 0) {
    return `${indentStr}// Empty layout\n`;
  }

  // Generate constraints
  const constraintStr = constraints
    .map((c) => generateConstraintCode(c))
    .join(', ');

  // Generate layout code
  const directionStr = direction === 'Vertical' ? 'Direction::Vertical' : 'Direction::Horizontal';
  const layoutVarName = `layout_${node.id.slice(0, 8).replace(/-/g, '_')}`;
  const chunksVarName = `chunks_${node.id.slice(0, 8).replace(/-/g, '_')}`;

  let code = `${indentStr}let ${layoutVarName} = Layout::default()
${indentStr}    .direction(${directionStr})
${indentStr}    .constraints([${constraintStr}])
${indentStr}    .split(area);\n\n`;

  // Generate children code
  children.forEach((childId, index) => {
    const childNode = nodes[childId];
    if (!childNode) return;

    if (childNode.type === 'Layout') {
      // For nested layouts, we need to use the chunk area
      code += `${indentStr}// Nested layout ${index}\n`;
      code += `${indentStr}let area = ${layoutVarName}[${index}];\n`;
      code += generateLayoutCode(childNode as LayoutNode, nodes, frameVar, indent);
    } else {
      code += generateWidgetCodeWithArea(
        childNode as WidgetNode,
        frameVar,
        `${layoutVarName}[${index}]`,
        indent
      );
    }
  });

  return code;
};

/**
 * ウィジェットノードのコードを生成（areaを指定）
 */
const generateWidgetCodeWithArea = (
  node: WidgetNode,
  frameVar: string,
  areaExpr: string,
  indent: number
): string => {
  const indentStr = '    '.repeat(indent + 1);
  const { widgetType, data } = node;

  let widgetCode = '';

  switch (widgetType) {
    case 'Paragraph':
      widgetCode = generateParagraphCode(data, indent);
      break;
    case 'List':
      widgetCode = generateListCode(data, indent);
      break;
    case 'Table':
      widgetCode = generateTableCode(data, indent);
      break;
    case 'Block':
      widgetCode = generateBlockCode(data, indent);
      break;
    case 'Input':
      widgetCode = generateInputCode(data, indent);
      break;
  }

  return `${indentStr}${frameVar}.render_widget(\n${widgetCode}${indentStr}    ${areaExpr},\n${indentStr});\n\n`;
};

/**
 * ウィジェットノードのコードを生成（ルートの場合）
 */
const generateWidgetCode = (
  node: WidgetNode,
  frameVar: string,
  indent: number
): string => {
  return generateWidgetCodeWithArea(node, frameVar, 'area', indent);
};

/**
 * Paragraphウィジェットのコードを生成
 */
const generateParagraphCode = (data: WidgetNode['data'], indent: number): string => {
  const indentStr = '    '.repeat(indent + 2);
  const content = escapeRustString(data.content || 'Paragraph content');
  const title = data.title ? escapeRustString(data.title) : null;
  const borderStyle = getBorderStyleCode(data.borderStyle);
  const borderColor = data.borderColor ? colorToRatatuiColor(data.borderColor) : 'Color::White';
  const textColor = data.textColor ? colorToRatatuiColor(data.textColor) : 'Color::White';

  let code = `${indentStr}Paragraph::new("${content}")\n`;

  if (title) {
    code += `${indentStr}    .block(Block::default()\n`;
    code += `${indentStr}        .title("${title}")\n`;
    code += `${indentStr}        .borders(Borders::ALL)\n`;
    code += `${indentStr}        .border_type(${borderStyle})\n`;
    code += `${indentStr}        .border_style(Style::default().fg(${borderColor})))\n`;
  } else if (data.borderStyle && data.borderStyle !== 'None') {
    code += `${indentStr}    .block(Block::default()\n`;
    code += `${indentStr}        .borders(Borders::ALL)\n`;
    code += `${indentStr}        .border_type(${borderStyle})\n`;
    code += `${indentStr}        .border_style(Style::default().fg(${borderColor})))\n`;
  }

  code += `${indentStr}    .style(Style::default().fg(${textColor})),\n`;

  return code;
};

/**
 * Listウィジェットのコードを生成
 */
const generateListCode = (data: WidgetNode['data'], indent: number): string => {
  const indentStr = '    '.repeat(indent + 2);
  const items = data.items || ['Item 1', 'Item 2', 'Item 3'];
  const title = data.title ? escapeRustString(data.title) : null;
  const borderStyle = getBorderStyleCode(data.borderStyle);
  const borderColor = data.borderColor ? colorToRatatuiColor(data.borderColor) : 'Color::White';
  const textColor = data.textColor ? colorToRatatuiColor(data.textColor) : 'Color::White';

  const itemsCode = items
    .map((item) => `ListItem::new("${escapeRustString(item)}")`)
    .join(', ');

  let code = `${indentStr}List::new([${itemsCode}])\n`;

  if (title) {
    code += `${indentStr}    .block(Block::default()\n`;
    code += `${indentStr}        .title("${title}")\n`;
    code += `${indentStr}        .borders(Borders::ALL)\n`;
    code += `${indentStr}        .border_type(${borderStyle})\n`;
    code += `${indentStr}        .border_style(Style::default().fg(${borderColor})))\n`;
  } else if (data.borderStyle && data.borderStyle !== 'None') {
    code += `${indentStr}    .block(Block::default()\n`;
    code += `${indentStr}        .borders(Borders::ALL)\n`;
    code += `${indentStr}        .border_type(${borderStyle})\n`;
    code += `${indentStr}        .border_style(Style::default().fg(${borderColor})))\n`;
  }

  code += `${indentStr}    .style(Style::default().fg(${textColor})),\n`;

  return code;
};

/**
 * Tableウィジェットのコードを生成
 */
const generateTableCode = (data: WidgetNode['data'], indent: number): string => {
  const indentStr = '    '.repeat(indent + 2);
  const headers = data.headers || ['Column 1', 'Column 2', 'Column 3'];
  const rows = data.rows || [['A', 'B', 'C']];
  const title = data.title ? escapeRustString(data.title) : null;
  const borderStyle = getBorderStyleCode(data.borderStyle);
  const borderColor = data.borderColor ? colorToRatatuiColor(data.borderColor) : 'Color::White';
  const textColor = data.textColor ? colorToRatatuiColor(data.textColor) : 'Color::White';

  const headerCells = headers
    .map((h) => `Cell::from("${escapeRustString(h)}")`)
    .join(', ');

  const rowsCode = rows
    .map((row) => {
      const cells = row.map((cell) => `Cell::from("${escapeRustString(cell)}")`).join(', ');
      return `Row::new([${cells}])`;
    })
    .join(', ');

  const widths = headers.map(() => 'Constraint::Percentage(33)').join(', ');

  let code = `${indentStr}Table::new([${rowsCode}], [${widths}])\n`;
  code += `${indentStr}    .header(Row::new([${headerCells}]).style(Style::default().bold()))\n`;

  if (title) {
    code += `${indentStr}    .block(Block::default()\n`;
    code += `${indentStr}        .title("${title}")\n`;
    code += `${indentStr}        .borders(Borders::ALL)\n`;
    code += `${indentStr}        .border_type(${borderStyle})\n`;
    code += `${indentStr}        .border_style(Style::default().fg(${borderColor})))\n`;
  } else if (data.borderStyle && data.borderStyle !== 'None') {
    code += `${indentStr}    .block(Block::default()\n`;
    code += `${indentStr}        .borders(Borders::ALL)\n`;
    code += `${indentStr}        .border_type(${borderStyle})\n`;
    code += `${indentStr}        .border_style(Style::default().fg(${borderColor})))\n`;
  }

  code += `${indentStr}    .style(Style::default().fg(${textColor})),\n`;

  return code;
};

/**
 * Blockウィジェットのコードを生成
 */
const generateBlockCode = (data: WidgetNode['data'], indent: number): string => {
  const indentStr = '    '.repeat(indent + 2);
  const title = data.title ? escapeRustString(data.title) : 'Block';
  const borderStyle = getBorderStyleCode(data.borderStyle);
  const borderColor = data.borderColor ? colorToRatatuiColor(data.borderColor) : 'Color::White';

  let code = `${indentStr}Block::default()\n`;
  code += `${indentStr}    .title("${title}")\n`;
  code += `${indentStr}    .borders(Borders::ALL)\n`;
  code += `${indentStr}    .border_type(${borderStyle})\n`;
  code += `${indentStr}    .border_style(Style::default().fg(${borderColor})),\n`;

  return code;
};

/**
 * Inputウィジェットのコードを生成
 * Note: ratatuiには標準でテキスト入力ウィジェットがないため、
 * Paragraphとブロックで視覚的に表現します。
 * 実際の入力機能にはtui-inputやtui-textarea crateの使用を推奨します。
 */
const generateInputCode = (data: WidgetNode['data'], indent: number): string => {
  const indentStr = '    '.repeat(indent + 2);
  const label = data.label ? escapeRustString(data.label) : '';
  const placeholder = data.placeholder ? escapeRustString(data.placeholder) : 'Enter text...';
  const borderStyle = getBorderStyleCode(data.borderStyle);
  const borderColor = data.borderColor ? colorToRatatuiColor(data.borderColor) : 'Color::White';
  const textColor = data.textColor ? colorToRatatuiColor(data.textColor) : 'Color::DarkGray';

  let code = `${indentStr}Paragraph::new("${placeholder}")\n`;

  if (label) {
    code += `${indentStr}    .block(Block::default()\n`;
    code += `${indentStr}        .title("${label}")\n`;
    code += `${indentStr}        .borders(Borders::ALL)\n`;
    code += `${indentStr}        .border_type(${borderStyle})\n`;
    code += `${indentStr}        .border_style(Style::default().fg(${borderColor})))\n`;
  } else {
    code += `${indentStr}    .block(Block::default()\n`;
    code += `${indentStr}        .borders(Borders::ALL)\n`;
    code += `${indentStr}        .border_type(${borderStyle})\n`;
    code += `${indentStr}        .border_style(Style::default().fg(${borderColor})))\n`;
  }

  code += `${indentStr}    .style(Style::default().fg(${textColor})),\n`;

  return code;
};

/**
 * Constraintをratatuiのコードに変換
 */
const generateConstraintCode = (constraint: Constraint): string => {
  switch (constraint.type) {
    case 'Percentage':
      return `Constraint::Percentage(${constraint.value})`;
    case 'Length':
      return `Constraint::Length(${constraint.value})`;
    case 'Min':
      return `Constraint::Min(${constraint.value})`;
    case 'Max':
      return `Constraint::Max(${constraint.value})`;
    default:
      return `Constraint::Percentage(${constraint.value})`;
  }
};

/**
 * ボーダースタイルをratatuiのコードに変換
 */
const getBorderStyleCode = (borderStyle?: string): string => {
  switch (borderStyle) {
    case 'Plain':
      return 'BorderType::Plain';
    case 'Rounded':
      return 'BorderType::Rounded';
    case 'Double':
      return 'BorderType::Double';
    default:
      return 'BorderType::Plain';
  }
};

/**
 * HEXカラーをratatuiのColorに変換
 */
const colorToRatatuiColor = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return `Color::Rgb(${r}, ${g}, ${b})`;
};

/**
 * Rust文字列用にエスケープ
 */
const escapeRustString = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

/**
 * Cargo.tomlを生成
 */
export const generateCargoToml = (projectName: string): string => {
  const sanitizedName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/^[0-9]/, '_$&');

  return `[package]
name = "${sanitizedName}"
version = "0.1.0"
edition = "2021"

[dependencies]
crossterm = "0.28"
ratatui = "0.29"
`;
};
