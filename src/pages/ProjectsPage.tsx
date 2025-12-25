import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, Loader2, FolderOpen } from 'lucide-react';
import { useProject, useInfiniteScroll } from '../hooks/useProject';
import { Project } from '../types/models';

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const {
    projects,
    isLoading,
    hasMore,
    fetchProjects,
    fetchMore,
    loadProject,
    deleteProject,
    newProject,
  } = useProject();

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Infinite scroll ref
  const loadMoreRef = useInfiniteScroll(fetchMore, hasMore, isLoading);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenProject = async (projectId: string) => {
    await loadProject(projectId);
    navigate(`/editor/${projectId}`);
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    setDeleteConfirm(null);
  };

  const handleNewProject = () => {
    newProject();
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-terminal-bg p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-terminal-accent" />
            <h1 className="text-2xl font-bold text-terminal-accent">
              My Projects
            </h1>
          </div>

          <button
            onClick={handleNewProject}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-terminal-text-dim mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-terminal-text mb-2">
              No projects yet
            </h2>
            <p className="text-terminal-text-dim mb-6">
              Create your first TUI design project
            </p>
            <button
              onClick={handleNewProject}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => handleOpenProject(project.id)}
                onDelete={() => setDeleteConfirm(project.id)}
                isDeleting={deleteConfirm === project.id}
                onConfirmDelete={() => handleDeleteProject(project.id)}
                onCancelDelete={() => setDeleteConfirm(null)}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="h-1" />

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-terminal-accent animate-spin" />
          </div>
        )}

        {/* End of list */}
        {!hasMore && projects.length > 0 && (
          <p className="text-center text-terminal-text-dim py-8">
            All projects loaded
          </p>
        )}
      </div>
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

const ProjectCard = ({
  project,
  onOpen,
  onDelete,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
}: ProjectCardProps) => {
  const formatDate = (timestamp: { toDate: () => Date } | Date) => {
    const date = 'toDate' in timestamp ? timestamp.toDate() : timestamp;
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="card hover:border-terminal-accent transition-colors">
      {isDeleting ? (
        <div className="text-center py-4">
          <p className="text-terminal-text mb-4">Delete this project?</p>
          <div className="flex gap-2 justify-center">
            <button onClick={onCancelDelete} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={onConfirmDelete}
              className="px-4 py-2 bg-terminal-error text-white rounded text-sm hover:bg-terminal-error/80"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-terminal-text truncate flex-1">
              {project.title}
            </h3>
            <div className="flex gap-1 ml-2">
              <button
                onClick={onOpen}
                className="p-1 hover:bg-terminal-border rounded"
                title="Edit"
              >
                <Edit className="w-4 h-4 text-terminal-text-dim" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 hover:bg-terminal-error/20 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-terminal-error" />
              </button>
            </div>
          </div>

          <p className="text-xs text-terminal-text-dim mb-4">
            Updated: {formatDate(project.updatedAt)}
          </p>

          <button
            onClick={onOpen}
            className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            <span>Open in Editor</span>
          </button>
        </>
      )}
    </div>
  );
};
