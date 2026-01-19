import {
  DesignTree,
  LayoutNode,
  WidgetNode,
  AnyNode,
  Constraint,
} from '../types/models';

/**
 * Inputウィジェット情報を収集
 */
interface InputInfo {
  id: string;
  fieldName: string;
  label: string;
  placeholder: string;
  multiline: boolean;
}

/**
 * デザインツリーからInputウィジェットを収集する
 */
const collectInputWidgets = (
  nodeId: string,
  nodes: Record<string, AnyNode>
): InputInfo[] => {
  const node = nodes[nodeId];
  if (!node) return [];

  if (node.type === 'Layout') {
    const layoutNode = node as LayoutNode;
    return layoutNode.children.flatMap((childId) =>
      collectInputWidgets(childId, nodes)
    );
  } else {
    const widgetNode = node as WidgetNode;
    if (widgetNode.widgetType === 'Input') {
      const fieldName = `input_${nodeId.slice(0, 8).replace(/-/g, '_')}`;
      return [{
        id: nodeId,
        fieldName,
        label: widgetNode.data.label || '',
        placeholder: widgetNode.data.placeholder || 'Enter text...',
        multiline: widgetNode.data.multiline || false,
      }];
    }
  }
  return [];
};

/**
 * デザインツリーからRustコードを生成する
 */
export const generateRustCode = (designData: DesignTree): string => {
  const { rootId, nodes } = designData;

  // Inputウィジェットを収集
  const inputs = collectInputWidgets(rootId, nodes);
  const hasInputs = inputs.length > 0;

  // Collect all imports needed
  const imports = new Set<string>();
  imports.add('use crossterm::{execute, terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen}, event::{self, Event, KeyCode}};');
  imports.add('use ratatui::{prelude::*, widgets::*};');
  imports.add('use std::io::{self, stdout};');

  if (hasInputs) {
    return generateCodeWithInputs(rootId, nodes, inputs, imports);
  } else {
    return generateCodeWithoutInputs(rootId, nodes, imports);
  }
};

/**
 * Inputがない場合のコード生成（従来の方式）
 */
const generateCodeWithoutInputs = (
  rootId: string,
  nodes: Record<string, AnyNode>,
  imports: Set<string>
): string => {
  const uiBody = generateNodeCode(rootId, nodes, 'f', 0, null);

  return `${Array.from(imports).join('\n')}

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
};

/**
 * Inputがある場合のコード生成（状態管理付き・マウス対応）
 */
const generateCodeWithInputs = (
  rootId: string,
  nodes: Record<string, AnyNode>,
  inputs: InputInfo[],
  _imports: Set<string>
): string => {
  // App構造体のフィールド定義
  const appFields = inputs
    .map((input) => `    ${input.fieldName}: String,`)
    .join('\n');

  // App構造体の初期化
  const appInit = inputs
    .map((input) => `            ${input.fieldName}: String::new(),`)
    .join('\n');

  // inputsマップを生成してgenerateNodeCodeに渡す
  const inputsMap = new Map(inputs.map((input) => [input.id, input]));

  // UI関数の本体
  const uiBody = generateNodeCode(rootId, nodes, 'f', 0, inputsMap);

  // マウス対応のimportを使用
  const mouseImports = `use crossterm::{
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    event::{self, Event, KeyCode, MouseEventKind, MouseButton, EnableMouseCapture, DisableMouseCapture},
};
use ratatui::{prelude::*, widgets::*};
use std::io::{self, stdout};`;

  return `${mouseImports}

/// Application state
struct App {
${appFields}
    focused_input: usize,
    input_count: usize,
    input_areas: Vec<Rect>,
    multiline_flags: Vec<bool>,
}

impl App {
    fn new() -> Self {
        Self {
${appInit}
            focused_input: 0,
            input_count: ${inputs.length},
            input_areas: Vec::new(),
            multiline_flags: vec![${inputs.map((i) => i.multiline.toString()).join(', ')}],
        }
    }

    fn is_current_multiline(&self) -> bool {
        self.multiline_flags.get(self.focused_input).copied().unwrap_or(false)
    }

    fn focused_field_mut(&mut self) -> &mut String {
        match self.focused_input {
${inputs.map((input, i) => `            ${i} => &mut self.${input.fieldName},`).join('\n')}
            _ => &mut self.${inputs[0].fieldName},
        }
    }

    fn next_input(&mut self) {
        self.focused_input = (self.focused_input + 1) % self.input_count;
    }

    fn prev_input(&mut self) {
        self.focused_input = if self.focused_input == 0 {
            self.input_count - 1
        } else {
            self.focused_input - 1
        };
    }

    fn handle_click(&mut self, x: u16, y: u16) {
        for (i, area) in self.input_areas.iter().enumerate() {
            if x >= area.x && x < area.x + area.width && y >= area.y && y < area.y + area.height {
                self.focused_input = i;
                break;
            }
        }
    }

    fn clear_input_areas(&mut self) {
        self.input_areas.clear();
    }

    fn register_input_area(&mut self, area: Rect) {
        self.input_areas.push(area);
    }
}

fn main() -> io::Result<()> {
    // Setup terminal with mouse capture
    enable_raw_mode()?;
    let mut stdout = stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app = App::new();

    // Main loop
    loop {
        terminal.draw(|f| {
            ui(f, &mut app);
        })?;

        // Handle events
        if event::poll(std::time::Duration::from_millis(100))? {
            match event::read()? {
                Event::Key(key) => {
                    match key.code {
                        KeyCode::Esc => break,
                        KeyCode::Tab => app.next_input(),
                        KeyCode::BackTab => app.prev_input(),
                        KeyCode::Char(c) => {
                            app.focused_field_mut().push(c);
                        }
                        KeyCode::Backspace => {
                            app.focused_field_mut().pop();
                        }
                        KeyCode::Enter => {
                            if app.is_current_multiline() {
                                app.focused_field_mut().push('\\n');
                            } else {
                                app.next_input();
                            }
                        }
                        _ => {}
                    }
                }
                Event::Mouse(mouse) => {
                    if let MouseEventKind::Down(MouseButton::Left) = mouse.kind {
                        app.handle_click(mouse.column, mouse.row);
                    }
                }
                _ => {}
            }
        }
    }

    // Restore terminal
    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen, DisableMouseCapture)?;

    Ok(())
}

fn ui(f: &mut Frame, app: &mut App) {
    app.clear_input_areas();
    let area = f.area();
${uiBody}
}
`;
};

/**
 * 再帰的にノードのコードを生成
 */
const generateNodeCode = (
  nodeId: string,
  nodes: Record<string, AnyNode>,
  frameVar: string,
  indent: number,
  inputsMap: Map<string, InputInfo> | null
): string => {
  const node = nodes[nodeId];
  if (!node) return '';

  if (node.type === 'Layout') {
    return generateLayoutCode(node as LayoutNode, nodes, frameVar, indent, inputsMap);
  } else {
    return generateWidgetCode(node as WidgetNode, frameVar, indent, inputsMap);
  }
};

/**
 * レイアウトノードのコードを生成
 */
const generateLayoutCode = (
  node: LayoutNode,
  nodes: Record<string, AnyNode>,
  frameVar: string,
  indent: number,
  inputsMap: Map<string, InputInfo> | null
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
      code += generateLayoutCode(childNode as LayoutNode, nodes, frameVar, indent, inputsMap);
    } else {
      code += generateWidgetCodeWithArea(
        childNode as WidgetNode,
        frameVar,
        `${layoutVarName}[${index}]`,
        indent,
        inputsMap
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
  indent: number,
  inputsMap: Map<string, InputInfo> | null
): string => {
  const indentStr = '    '.repeat(indent + 1);
  const { widgetType, data, id } = node;

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
      widgetCode = generateInputCodeWithState(node, indent, inputsMap);
      break;
  }

  // Inputウィジェットの場合は領域を登録するコードを追加
  if (widgetType === 'Input' && inputsMap && inputsMap.has(id)) {
    return `${indentStr}app.register_input_area(${areaExpr});\n${indentStr}${frameVar}.render_widget(\n${widgetCode}${indentStr}    ${areaExpr},\n${indentStr});\n\n`;
  }

  return `${indentStr}${frameVar}.render_widget(\n${widgetCode}${indentStr}    ${areaExpr},\n${indentStr});\n\n`;
};

/**
 * ウィジェットノードのコードを生成（ルートの場合）
 */
const generateWidgetCode = (
  node: WidgetNode,
  frameVar: string,
  indent: number,
  inputsMap: Map<string, InputInfo> | null
): string => {
  return generateWidgetCodeWithArea(node, frameVar, 'area', indent, inputsMap);
};

/**
 * Paragraphウィジェットのコードを生成
 */
const generateParagraphCode = (data: WidgetNode['data'], indent: number): string => {
  const indentStr = '    '.repeat(indent + 2);
  const content = escapeRustString(data.content || 'Paragraph content');
  const title = data.title ? escapeRustString(data.title) : null;
  const borderColor = data.borderColor ? colorToRatatuiColor(data.borderColor) : 'Color::White';
  const textColor = data.textColor ? colorToRatatuiColor(data.textColor) : 'Color::White';

  let code = `${indentStr}Paragraph::new("${content}")\n`;
  code += generateBlockWrapper(indentStr, title, data.borderStyle, borderColor);
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
  const borderColor = data.borderColor ? colorToRatatuiColor(data.borderColor) : 'Color::White';
  const textColor = data.textColor ? colorToRatatuiColor(data.textColor) : 'Color::White';

  const itemsCode = items
    .map((item) => `ListItem::new("${escapeRustString(item)}")`)
    .join(', ');

  let code = `${indentStr}List::new([${itemsCode}])\n`;
  code += generateBlockWrapper(indentStr, title, data.borderStyle, borderColor);
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
  code += generateBlockWrapper(indentStr, title, data.borderStyle, borderColor);
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
 * Inputウィジェットのコードを生成（状態管理付き）
 * inputsMapがある場合はApp状態を参照し、フォーカス状態でスタイルを変更
 */
const generateInputCodeWithState = (
  node: WidgetNode,
  indent: number,
  inputsMap: Map<string, InputInfo> | null
): string => {
  const indentStr = '    '.repeat(indent + 2);
  const { data, id } = node;
  const label = data.label ? escapeRustString(data.label) : null;
  const placeholder = data.placeholder ? escapeRustString(data.placeholder) : 'Enter text...';
  const borderColor = data.borderColor ? colorToRatatuiColor(data.borderColor) : 'Color::White';
  const textColor = data.textColor ? colorToRatatuiColor(data.textColor) : 'Color::White';

  // Inputは常にborderを表示するため、borderStyleがない場合はデフォルトで'Plain'を使用
  const effectiveBorderStyle = data.borderStyle || 'Plain';
  const borderStyleCode = getBorderStyleCode(effectiveBorderStyle);

  // inputsMapがある場合は状態参照コードを生成
  if (inputsMap && inputsMap.has(id)) {
    const inputInfo = inputsMap.get(id)!;
    const inputs = Array.from(inputsMap.values());
    const inputIndex = inputs.findIndex((i) => i.id === id);

    let code = `${indentStr}{\n`;
    code += `${indentStr}    let is_focused = app.focused_input == ${inputIndex};\n`;
    code += `${indentStr}    let content = if app.${inputInfo.fieldName}.is_empty() {\n`;
    code += `${indentStr}        "${placeholder}".to_string()\n`;
    code += `${indentStr}    } else {\n`;
    code += `${indentStr}        app.${inputInfo.fieldName}.clone()\n`;
    code += `${indentStr}    };\n`;
    code += `${indentStr}    let border_color = if is_focused { Color::Yellow } else { ${borderColor} };\n`;
    code += `${indentStr}    let text_color = if app.${inputInfo.fieldName}.is_empty() { Color::DarkGray } else { ${textColor} };\n`;
    code += `${indentStr}    Paragraph::new(content)\n`;

    if (label) {
      code += `${indentStr}        .block(Block::default()\n`;
      code += `${indentStr}            .title("${label}")\n`;
      code += `${indentStr}            .borders(Borders::ALL)\n`;
      code += `${indentStr}            .border_type(${borderStyleCode})\n`;
      code += `${indentStr}            .border_style(Style::default().fg(border_color)))\n`;
    } else {
      code += `${indentStr}        .block(Block::default()\n`;
      code += `${indentStr}            .borders(Borders::ALL)\n`;
      code += `${indentStr}            .border_type(${borderStyleCode})\n`;
      code += `${indentStr}            .border_style(Style::default().fg(border_color)))\n`;
    }

    code += `${indentStr}        .style(Style::default().fg(text_color))\n`;
    if (inputInfo.multiline) {
      code += `${indentStr}        .wrap(Wrap { trim: false })\n`;
    }
    code += `${indentStr}},\n`;

    return code;
  }

  // inputsMapがない場合は従来の静的コード
  let code = `${indentStr}Paragraph::new("${placeholder}")\n`;
  code += generateBlockWrapper(indentStr, label, effectiveBorderStyle, borderColor);
  code += `${indentStr}    .style(Style::default().fg(Color::DarkGray)),\n`;

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
 * Block/Borderラッパーのコードを生成する共通関数
 * Paragraph, List, Table, Inputで共通利用
 */
const generateBlockWrapper = (
  indentStr: string,
  title: string | null,
  borderStyle: string | undefined,
  borderColor: string
): string => {
  const borderStyleCode = getBorderStyleCode(borderStyle);

  if (title) {
    return `${indentStr}    .block(Block::default()
${indentStr}        .title("${title}")
${indentStr}        .borders(Borders::ALL)
${indentStr}        .border_type(${borderStyleCode})
${indentStr}        .border_style(Style::default().fg(${borderColor})))
`;
  } else if (borderStyle && borderStyle !== 'None') {
    return `${indentStr}    .block(Block::default()
${indentStr}        .borders(Borders::ALL)
${indentStr}        .border_type(${borderStyleCode})
${indentStr}        .border_style(Style::default().fg(${borderColor})))
`;
  }
  return '';
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
