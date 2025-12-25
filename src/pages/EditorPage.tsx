import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Download, FileCode, AlertCircle, Loader2, GripVertical } from 'lucide-react';
import { LayerPanel } from '../components/editor/LayerPanel';
import { Canvas } from '../components/editor/Canvas';
import { PropertyPanel } from '../components/editor/PropertyPanel';
import { Toolbar } from '../components/editor/Toolbar';
import { useEditorStore } from '../store/editorStore';
import { useAuthStore } from '../store/authStore';
import { useProject } from '../hooks/useProject';
import { exportProjectAsZip, downloadRustCode } from '../utils/zipExport';
import { generateRustCode } from '../utils/codeGenerator';

export const EditorPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { isDirty, getDesignData, resetEditor } = useEditorStore();
  const {
    currentProjectId,
    currentProjectTitle,
    loadProject,
    saveProject,
    setCurrentProjectTitle,
    isLoading,
  } = useProject();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Panel resizing state
  const [leftPanelWidth, setLeftPanelWidth] = useState(256); // 16rem = 256px
  const [rightPanelWidth, setRightPanelWidth] = useState(288); // 18rem = 288px
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse move for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    if (isResizingLeft) {
      const newWidth = e.clientX - containerRect.left;
      setLeftPanelWidth(Math.max(150, Math.min(400, newWidth)));
    } else if (isResizingRight) {
      const newWidth = containerRect.right - e.clientX;
      setRightPanelWidth(Math.max(200, Math.min(500, newWidth)));
    }
  }, [isResizingLeft, isResizingRight]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  // Add/remove event listeners for resizing
  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight, handleMouseMove, handleMouseUp]);

  // Load project if projectId is provided
  useEffect(() => {
    if (projectId && projectId !== currentProjectId) {
      loadProject(projectId);
    } else if (!projectId && currentProjectId) {
      // New project - reset editor
      resetEditor();
    }
  }, [projectId]);

  // Update project title when loaded
  useEffect(() => {
    setProjectTitle(currentProjectTitle);
  }, [currentProjectTitle]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/editor' } } });
      return;
    }

    if (!projectTitle.trim()) {
      setShowSaveModal(true);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const id = await saveProject(projectTitle);
      if (!projectId) {
        navigate(`/editor/${id}`, { replace: true });
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save project'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWithTitle = async () => {
    if (!projectTitle.trim()) {
      setSaveError('Project name is required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const id = await saveProject(projectTitle);
      setShowSaveModal(false);
      if (!projectId) {
        navigate(`/editor/${id}`, { replace: true });
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save project'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportZip = () => {
    const designData = getDesignData();
    const name = projectTitle || 'tuify_project';
    exportProjectAsZip(name, designData);
  };

  const handleDownloadCode = () => {
    const designData = getDesignData();
    downloadRustCode(projectTitle || 'tuify_project', designData);
  };

  const handleShowCode = () => {
    setShowCodeModal(true);
  };

  if (isLoading && projectId) {
    return (
      <div className="h-screen flex items-center justify-center bg-terminal-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-terminal-accent animate-spin" />
          <p className="text-terminal-text-dim">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-terminal-bg">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-terminal-bg-secondary border-b border-terminal-border">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-terminal-accent">
            {projectTitle || 'Untitled Project'}
          </h1>
          {isDirty && (
            <span className="text-xs text-terminal-text-dim">(unsaved)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShowCode}
            className="btn-secondary flex items-center gap-1 text-sm"
          >
            <FileCode className="w-4 h-4" />
            <span>View Code</span>
          </button>
          <button
            onClick={handleDownloadCode}
            className="btn-secondary flex items-center gap-1 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>main.rs</span>
          </button>
          <button
            onClick={handleExportZip}
            className="btn-secondary flex items-center gap-1 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>ZIP</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-1 text-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar />

      {/* Main Editor Area */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Layer Panel */}
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: leftPanelWidth }}
        >
          <LayerPanel />
        </div>

        {/* Left Resizer */}
        <div
          className={`w-1.5 flex-shrink-0 cursor-col-resize flex items-center justify-center group transition-colors ${
            isResizingLeft ? 'bg-terminal-accent' : 'bg-terminal-border hover:bg-terminal-accent'
          }`}
          onMouseDown={() => setIsResizingLeft(true)}
        >
          <GripVertical className={`w-3 h-3 transition-opacity ${
            isResizingLeft ? 'text-terminal-accent opacity-100' : 'text-terminal-text-dim group-hover:text-terminal-accent opacity-0 group-hover:opacity-100'
          }`} />
        </div>

        {/* Canvas */}
        <Canvas />

        {/* Right Resizer */}
        <div
          className={`w-1.5 flex-shrink-0 cursor-col-resize flex items-center justify-center group transition-colors ${
            isResizingRight ? 'bg-terminal-accent' : 'bg-terminal-border hover:bg-terminal-accent'
          }`}
          onMouseDown={() => setIsResizingRight(true)}
        >
          <GripVertical className={`w-3 h-3 transition-opacity ${
            isResizingRight ? 'text-terminal-accent opacity-100' : 'text-terminal-text-dim group-hover:text-terminal-accent opacity-0 group-hover:opacity-100'
          }`} />
        </div>

        {/* Property Panel */}
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: rightPanelWidth }}
        >
          <PropertyPanel />
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-terminal-accent mb-4">
              Save Project
            </h2>

            {!isAuthenticated && (
              <div className="mb-4 p-3 bg-terminal-warning/10 border border-terminal-warning rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-terminal-warning flex-shrink-0" />
                <p className="text-terminal-warning text-sm">
                  Please login to save your project
                </p>
              </div>
            )}

            {saveError && (
              <div className="mb-4 p-3 bg-terminal-error/10 border border-terminal-error rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-terminal-error flex-shrink-0" />
                <p className="text-terminal-error text-sm">{saveError}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-terminal-text-dim mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="input-field"
                placeholder="My TUI Project"
                autoFocus
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              {isAuthenticated ? (
                <button
                  onClick={handleSaveWithTitle}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-1"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    navigate('/login', {
                      state: { from: { pathname: '/editor' } },
                    });
                  }}
                  className="btn-primary"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Code Preview Modal */}
      {showCodeModal && <CodePreviewModal onClose={() => setShowCodeModal(false)} />}
    </div>
  );
};

// Code Preview Modal Component
const CodePreviewModal = ({ onClose }: { onClose: () => void }) => {
  const { getDesignData } = useEditorStore();
  const [code, setCode] = useState('');

  useEffect(() => {
    const designData = getDesignData();
    const generatedCode = generateRustCode(designData);
    setCode(generatedCode);
  }, [getDesignData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border">
          <h2 className="text-lg font-semibold text-terminal-accent">
            Generated Rust Code
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="btn-secondary text-sm">
              Copy
            </button>
            <button onClick={onClose} className="btn-secondary text-sm">
              Close
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-sm text-terminal-text whitespace-pre-wrap font-mono bg-terminal-bg p-4 rounded">
            {code}
          </pre>
        </div>
      </div>
    </div>
  );
};
