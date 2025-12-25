import { FirebaseError } from 'firebase/app';

// Firebase Authenticationエラーコードと日本語メッセージのマッピング
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // 認証エラー
  'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
  'auth/invalid-email': 'メールアドレスの形式が正しくありません',
  'auth/operation-not-allowed': 'この操作は許可されていません',
  'auth/weak-password':
    'パスワードが弱すぎます。より強力なパスワードを設定してください',
  'auth/user-disabled': 'このアカウントは無効化されています',
  'auth/user-not-found': 'アカウントが見つかりません',
  'auth/wrong-password': 'パスワードが正しくありません',
  'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません',
  'auth/too-many-requests':
    'ログイン試行回数が多すぎます。しばらく待ってから再度お試しください',
  'auth/network-request-failed':
    'ネットワークエラーが発生しました。接続を確認してください',
  'auth/popup-closed-by-user': 'ログインがキャンセルされました',
  'auth/requires-recent-login':
    'セキュリティのため、再度ログインしてください',
};

// Firestoreエラーコードと日本語メッセージのマッピング
const FIRESTORE_ERROR_MESSAGES: Record<string, string> = {
  'permission-denied': 'この操作を行う権限がありません',
  'not-found': 'データが見つかりません',
  'already-exists': 'データが既に存在します',
  'resource-exhausted':
    'リクエスト制限に達しました。しばらく待ってから再度お試しください',
  'failed-precondition': '操作の前提条件が満たされていません',
  aborted: '操作が中断されました',
  'out-of-range': '指定された範囲外です',
  unimplemented: 'この機能は実装されていません',
  internal: 'サーバーエラーが発生しました',
  unavailable: 'サービスが一時的に利用できません',
  'data-loss': 'データが失われました',
  unauthenticated: 'ログインが必要です',
};

/**
 * Firebaseエラーを日本語メッセージに変換
 */
export const getFirebaseErrorMessage = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    // Authエラー
    if (error.code.startsWith('auth/')) {
      return (
        AUTH_ERROR_MESSAGES[error.code] || `認証エラー: ${error.message}`
      );
    }

    // Firestoreエラー
    const firestoreCode = error.code.replace('firestore/', '');
    if (FIRESTORE_ERROR_MESSAGES[firestoreCode]) {
      return FIRESTORE_ERROR_MESSAGES[firestoreCode];
    }

    return `エラーが発生しました: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '予期しないエラーが発生しました';
};

/**
 * エラーを処理してユーザーに表示するためのカスタムエラークラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  static fromFirebase(error: unknown): AppError {
    const message = getFirebaseErrorMessage(error);
    const code = error instanceof FirebaseError ? error.code : undefined;
    return new AppError(message, code, error);
  }
}
