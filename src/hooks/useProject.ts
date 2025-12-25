import { useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { useEditorStore } from '../store/editorStore';

/**
 * プロジェクト操作を簡潔に行うためのカスタムフック
 * ストア間の依存関係をこのフック内でまとめて管理
 */
export const useProject = () => {
  const {
    projects,
    currentProjectId,
    currentProjectTitle,
    isLoading,
    hasMore,
    fetchProjects,
    fetchMoreProjects,
    loadProject,
    saveProject,
    deleteProjectAction,
    setCurrentProjectId,
    setCurrentProjectTitle,
    clearCurrentProject,
  } = useProjectStore();

  const user = useAuthStore((state) => state.user);
  const { loadDesignData, getDesignData, resetEditor, setDirty } =
    useEditorStore();

  // 依存関係オブジェクトを安定化
  const deps = useRef({
    getUser: () => useAuthStore.getState().user,
    getDesignData: () => useEditorStore.getState().getDesignData(),
    loadDesignData,
  });

  // プロジェクト一覧を取得
  const handleFetchProjects = useCallback(async () => {
    await fetchProjects({ getUser: deps.current.getUser });
  }, [fetchProjects]);

  // 追加のプロジェクトを取得（無限スクロール）
  const handleFetchMore = useCallback(async () => {
    await fetchMoreProjects({ getUser: deps.current.getUser });
  }, [fetchMoreProjects]);

  // プロジェクトを読み込み
  const handleLoadProject = useCallback(
    async (projectId: string) => {
      await loadProject(projectId, {
        loadDesignData: deps.current.loadDesignData,
      });
    },
    [loadProject]
  );

  // プロジェクトを保存
  const handleSaveProject = useCallback(
    async (title: string) => {
      const projectId = await saveProject(title, deps.current);
      setDirty(false);
      return projectId;
    },
    [saveProject, setDirty]
  );

  // プロジェクトを削除
  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      await deleteProjectAction(projectId);
    },
    [deleteProjectAction]
  );

  // 新規プロジェクト開始
  const handleNewProject = useCallback(() => {
    clearCurrentProject();
    resetEditor();
  }, [clearCurrentProject, resetEditor]);

  return {
    // State
    projects,
    currentProjectId,
    currentProjectTitle,
    isLoading,
    hasMore,
    isAuthenticated: !!user,

    // Actions
    fetchProjects: handleFetchProjects,
    fetchMore: handleFetchMore,
    loadProject: handleLoadProject,
    saveProject: handleSaveProject,
    deleteProject: handleDeleteProject,
    newProject: handleNewProject,
    setCurrentProjectId,
    setCurrentProjectTitle,
  };
};

/**
 * 無限スクロールを実装するためのフック
 */
export const useInfiniteScroll = (
  onLoadMore: () => Promise<void>,
  hasMore: boolean,
  isLoading: boolean
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          await onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [onLoadMore, hasMore, isLoading]);

  return loadMoreRef;
};
