import { create } from 'zustand';
import { User } from '../types/models';
import * as authService from '../services/authService';
import * as userService from '../services/userService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loginAction: (email: string, password: string) => Promise<void>;
  registerAction: (email: string, password: string) => Promise<void>;
  logoutAction: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  /**
   * ログイン処理
   * 1. バリデーション実行
   * 2. Firebase Authentication呼び出し
   * 3. Firestoreからユーザー情報取得
   * 4. ストアにユーザー情報設定
   */
  loginAction: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const credential = await authService.signIn(email, password);
      const userData = await userService.getUser(credential.user.uid);
      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * 登録処理
   * 1. バリデーション実行
   * 2. Firebase Authentication新規登録
   * 3. Firestoreにユーザードキュメント作成（displayNameはランダム生成）
   * 4. Firestoreから完全なユーザー情報を再取得
   * 5. ストアにユーザー情報設定
   */
  registerAction: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const credential = await authService.signUp(email, password);

      // ランダムなdisplayNameを生成（User_XXXX形式）
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      const generatedDisplayName = `User_${randomSuffix}`;

      await userService.createUser({
        uid: credential.user.uid,
        email: email,
        displayName: generatedDisplayName,
        avatarUrl: '',
      });

      // Firestoreから再取得（serverTimestamp()が解決された完全なUserを取得）
      const userData = await userService.getUser(credential.user.uid);
      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * ログアウト処理
   * 1. Firebase Authenticationログアウト
   * 2. ストアをクリア
   */
  logoutAction: async () => {
    await authService.signOut();
    set({ user: null, isAuthenticated: false, error: null });
  },
}));
