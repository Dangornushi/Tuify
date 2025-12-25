import { create } from 'zustand';
import { Project, DesignTree, User } from '../types/models';
import * as projectService from '../services/projectService';

// 依存関係を引数として受け取るインターフェース
interface ProjectDependencies {
  getUser: () => User | null;
  getDesignData: () => DesignTree;
  loadDesignData: (designData: DesignTree) => void;
}

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  currentProjectTitle: string;
  isLoading: boolean;
  hasMore: boolean;

  // Actions（依存関係を引数で受け取る）
  fetchProjects: (deps: Pick<ProjectDependencies, 'getUser'>) => Promise<void>;
  fetchMoreProjects: (
    deps: Pick<ProjectDependencies, 'getUser'>
  ) => Promise<void>;
  loadProject: (
    projectId: string,
    deps: Pick<ProjectDependencies, 'loadDesignData'>
  ) => Promise<void>;
  saveProject: (title: string, deps: ProjectDependencies) => Promise<string>;
  deleteProjectAction: (projectId: string) => Promise<void>;
  setCurrentProjectId: (projectId: string | null) => void;
  setCurrentProjectTitle: (title: string) => void;
  clearCurrentProject: () => void;
}

const PAGE_SIZE = 20;

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  currentProjectTitle: '',
  isLoading: false,
  hasMore: true,

  /**
   * プロジェクト一覧取得（初回）
   * 1. 認証チェック
   * 2. Firestoreからユーザーのプロジェクト取得（ページネーション対応）
   * 3. ストアに設定
   */
  fetchProjects: async ({ getUser }) => {
    const user = getUser();
    if (!user) {
      throw new Error('ログインが必要です');
    }

    set({ isLoading: true });
    try {
      const projects = await projectService.getProjectsByUser(
        user.uid,
        PAGE_SIZE
      );
      set({
        projects,
        isLoading: false,
        hasMore: projects.length === PAGE_SIZE,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // プロジェクト追加取得（無限スクロール用）
  fetchMoreProjects: async ({ getUser }) => {
    const { projects, isLoading, hasMore } = get();
    if (isLoading || !hasMore) return;

    const user = getUser();
    if (!user) {
      throw new Error('ログインが必要です');
    }

    const lastProject = projects[projects.length - 1];
    if (!lastProject) return;

    set({ isLoading: true });
    try {
      const moreProjects = await projectService.getProjectsByUser(
        user.uid,
        PAGE_SIZE,
        lastProject.updatedAt
      );
      set({
        projects: [...projects, ...moreProjects],
        isLoading: false,
        hasMore: moreProjects.length === PAGE_SIZE,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * プロジェクト読み込み
   * 1. Firestoreからプロジェクト取得
   * 2. エディタストアにデザインデータをロード（コールバック経由）
   */
  loadProject: async (projectId, { loadDesignData }) => {
    set({ isLoading: true });
    try {
      const project = await projectService.getProject(projectId);
      if (!project) {
        throw new Error('プロジェクトが見つかりません');
      }
      loadDesignData(project.designData);
      set({
        currentProjectId: projectId,
        currentProjectTitle: project.title,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * プロジェクト保存
   * 1. 認証チェック
   * 2. エディタからデザインデータ取得（コールバック経由）
   * 3. 新規または既存プロジェクトに保存
   */
  saveProject: async (title, { getUser, getDesignData }) => {
    const user = getUser();
    if (!user) {
      throw new Error('ログインが必要です');
    }

    const designData = getDesignData();
    const currentProjectId = get().currentProjectId;

    if (currentProjectId) {
      // 既存プロジェクト更新
      await projectService.updateProject(currentProjectId, {
        title,
        designData,
      });
      set({ currentProjectTitle: title });
      return currentProjectId;
    } else {
      // 新規プロジェクト作成
      const newId = await projectService.createProject({
        userId: user.uid,
        title,
        designData,
        isPublic: false,
      });
      set({ currentProjectId: newId, currentProjectTitle: title });
      return newId;
    }
  },

  // プロジェクト削除
  deleteProjectAction: async (projectId) => {
    await projectService.deleteProject(projectId);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      currentProjectId:
        state.currentProjectId === projectId ? null : state.currentProjectId,
      currentProjectTitle:
        state.currentProjectId === projectId ? '' : state.currentProjectTitle,
    }));
  },

  // 現在のプロジェクトIDを設定
  setCurrentProjectId: (projectId) => set({ currentProjectId: projectId }),

  // 現在のプロジェクトタイトルを設定
  setCurrentProjectTitle: (title) => set({ currentProjectTitle: title }),

  // 現在のプロジェクトをクリア
  clearCurrentProject: () =>
    set({ currentProjectId: null, currentProjectTitle: '' }),
}));
