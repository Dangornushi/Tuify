import { useEffect, useCallback, useState, useRef } from 'react';

interface UseResizeHandlerOptions {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number, currentPos: number) => void;
  onResizeEnd?: () => void;
}

interface UseResizeHandlerReturn {
  isResizing: boolean;
  startResize: (e: React.MouseEvent) => void;
}

/**
 * リサイズ操作を管理する共通フック
 * EditorPageのパネルリサイズとLayoutRendererのConstraintリサイズで共通利用
 */
export const useResizeHandler = ({
  direction,
  onResize,
  onResizeEnd,
}: UseResizeHandlerOptions): UseResizeHandlerReturn => {
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const currentPos = direction === 'vertical' ? e.clientY : e.clientX;
      const delta = currentPos - startPosRef.current;

      onResize(delta, currentPos);
      startPosRef.current = currentPos;
    },
    [isResizing, direction, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    onResizeEnd?.();
  }, [onResizeEnd]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'vertical' ? 'row-resize' : 'col-resize';
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
  }, [isResizing, handleMouseMove, handleMouseUp, direction]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startPosRef.current = direction === 'vertical' ? e.clientY : e.clientX;
  }, [direction]);

  return {
    isResizing,
    startResize,
  };
};
