import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import * as authService from '../services/authService';
import * as userService from '../services/userService';

/**
 * 認証状態を監視し、ストアを更新するフック
 * アプリケーションのルートで1回だけ呼び出す
 */
export const useAuth = () => {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Firebase Authの状態変更を監視
    const unsubscribe = authService.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // ログイン状態: Firestoreからユーザー情報取得
        try {
          const userData = await userService.getUser(firebaseUser.uid);
          setUser(userData);
        } catch (error) {
          console.error('ユーザー情報の取得に失敗しました:', error);
          setUser(null);
        }
      } else {
        // ログアウト状態
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);
};

/**
 * 認証関連の状態とアクションを返すフック
 */
export const useAuthActions = () => {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    loginAction,
    registerAction,
    logoutAction,
  } = useAuthStore();

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    login: loginAction,
    register: registerAction,
    logout: logoutAction,
  };
};
