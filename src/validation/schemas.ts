import { z } from 'zod';

// ======================================
// 認証関連バリデーション
// ======================================

// ログインフォーム
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
});

// 新規登録フォーム
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'メールアドレスは必須です')
      .email('有効なメールアドレスを入力してください'),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        'パスワードは英字と数字を含む必要があります'
      ),
    confirmPassword: z.string().min(1, '確認用パスワードは必須です'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

// ======================================
// プロジェクト関連バリデーション
// ======================================

// プロジェクト保存
export const projectSaveSchema = z.object({
  title: z
    .string()
    .min(1, 'プロジェクト名は必須です')
    .max(100, 'プロジェクト名は100文字以内で入力してください'),
});

// ======================================
// デザインデータバリデーション
// ======================================

// Constraint型（Percentageは0-100の範囲、それ以外はピクセル値）
const constraintSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('Percentage'),
    value: z.number().min(0).max(100),
  }),
  z.object({
    type: z.literal('Length'),
    value: z.number().min(0),
  }),
  z.object({
    type: z.literal('Min'),
    value: z.number().min(0),
  }),
  z.object({
    type: z.literal('Max'),
    value: z.number().min(0),
  }),
]);

// カラーコード正規表現（3桁または6桁のHEXカラー）
const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

// WidgetData型
const widgetDataSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(10000).optional(),
  borderStyle: z.enum(['None', 'Plain', 'Rounded', 'Double']).optional(),
  borderColor: z
    .string()
    .regex(
      hexColorRegex,
      '有効なカラーコードを入力してください（例: #FFF, #FFFFFF）'
    )
    .optional(),
  textColor: z
    .string()
    .regex(
      hexColorRegex,
      '有効なカラーコードを入力してください（例: #FFF, #FFFFFF）'
    )
    .optional(),
  backgroundColor: z
    .string()
    .regex(
      hexColorRegex,
      '有効なカラーコードを入力してください（例: #FFF, #FFFFFF）'
    )
    .optional(),
  items: z.array(z.string()).optional(),
  headers: z.array(z.string()).optional(),
  rows: z.array(z.array(z.string())).optional(),
});

// WidgetNode型
const widgetNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('Widget'),
  widgetType: z.enum(['Paragraph', 'List', 'Table', 'Block']),
  data: widgetDataSchema,
});

// LayoutNode型（childrenとconstraintsの長さ一致を検証）
const layoutNodeSchema = z
  .object({
    id: z.string().uuid(),
    type: z.literal('Layout'),
    direction: z.enum(['Vertical', 'Horizontal']),
    children: z.array(z.string().uuid()),
    constraints: z.array(constraintSchema),
  })
  .refine((data) => data.children.length === data.constraints.length, {
    message: 'childrenとconstraintsの要素数が一致しません',
  });

// ノード型（LayoutNodeまたはWidgetNode）
const nodeSchema = z.union([layoutNodeSchema, widgetNodeSchema]);

// DesignTree型（保存前の検証用）
export const designTreeSchema = z
  .object({
    rootId: z.string().uuid(),
    nodes: z.record(z.string(), nodeSchema),
  })
  .refine((data) => data.rootId in data.nodes, {
    message: 'rootIdがnodesに存在しません',
  })
  .refine(
    (data) => {
      const rootNode = data.nodes[data.rootId];
      return rootNode && rootNode.type === 'Layout';
    },
    { message: 'ルートノードはLayout型である必要があります' }
  );

// 型エクスポート
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProjectSaveInput = z.infer<typeof projectSaveSchema>;
