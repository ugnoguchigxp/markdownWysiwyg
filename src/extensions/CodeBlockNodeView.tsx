import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { NodeViewProps } from '@tiptap/core';
import { useEffect, useRef, useState } from 'react';
import { createLogger } from '../utils/logger';
import { Trash2 } from 'lucide-react';

const log = createLogger('CodeBlockNodeView');

// Mermaid library (optional)
let mermaidLib: typeof import('mermaid').default | null = null;

// Initialize mermaid if available
try {
  // This will be imported by the user if they enable Mermaid
  // @ts-expect-error - Mermaid is optional
  if (typeof window !== 'undefined' && window.mermaid) {
    // @ts-expect-error - Mermaid is optional
    mermaidLib = window.mermaid;
    mermaidLib?.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
  }
} catch {
  // Mermaid not available
  log.debug('Mermaid not available (optional)');
}

// 統一されたボタンスタイル
const BUTTON_STYLE: React.CSSProperties = {
  background: '#2d3748',
  border: '1px solid #4a5568',
  borderRadius: '3px',
  padding: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#e2e8f0',
  width: '28px',
  height: '28px',
};

// 統一されたボタンコンポーネント
interface IIconButtonProps {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
}

const IconButton = ({ onClick, title, children }: IIconButtonProps) => (
  <button onClick={onClick} title={title} style={BUTTON_STYLE}>
    {children}
  </button>
);

// サポートする言語リスト
const SUPPORTED_LANGUAGES = [
  { value: '', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'ts', label: 'TypeScript (ts)' },
  { value: 'js', label: 'JavaScript (js)' },
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'sh', label: 'Shell (sh)' },
  { value: 'zsh', label: 'Zsh' },
  { value: 'tcsh', label: 'Tcsh' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'mermaid', label: 'Mermaid' },
];

export const CodeBlockNodeView = ({ node, selected, editor, updateAttributes, deleteNode }: NodeViewProps) => {
  const language = node.attrs.language || '';
  const code = node.textContent;

  // Mermaid専用のレンダリング
  if (language === 'mermaid' && mermaidLib) {
    return <MermaidCodeBlockView code={code} selected={selected} editable={editor.isEditable} updateAttributes={updateAttributes} deleteNode={deleteNode} />;
  }

  // 通常のコードブロック
  return <RegularCodeBlockView language={language} selected={selected} editable={editor.isEditable} updateAttributes={updateAttributes} deleteNode={deleteNode} />;
};

interface IRegularCodeBlockViewProps {
  language: string;
  selected: boolean;
  editable: boolean;
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
}

const RegularCodeBlockView = ({ language, selected, editable, updateAttributes, deleteNode }: IRegularCodeBlockViewProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState(language || '');

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
  };

  const handleRender = () => {
    updateAttributes({ language: selectedLanguage });
  };

  const handleDelete = () => {
    deleteNode();
  };

  return (
    <NodeViewWrapper className={`code-block ${selected ? 'selected' : ''}`}>
      <div
        style={{
          border: selected ? '2px solid #007bff' : '1px solid #4a5568',
          borderRadius: '4px',
          padding: '16px',
          background: '#1e293b',
          position: 'relative',
        }}
      >
        <pre style={{ 
          margin: 0, 
          position: 'relative',
          overflow: 'visible',
          whiteSpace: 'pre',
          color: '#e2e8f0',
        }}>
          {/* 右上のコントロール */}
          {editable && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #4a5568',
                  borderRadius: '3px',
                  fontSize: '12px',
                  background: '#2d3748',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <IconButton onClick={handleRender} title="レンダリング">
                &#x25B6;
              </IconButton>
              <IconButton onClick={handleDelete} title="削除">
                <Trash2 size={16} />
              </IconButton>
            </div>
          )}
          <code style={{ display: 'block', overflow: 'auto', color: '#e2e8f0' }}>
            <NodeViewContent />
          </code>
        </pre>
      </div>
    </NodeViewWrapper>
  );
};

interface IMermaidCodeBlockViewProps {
  code: string;
  selected: boolean;
  editable: boolean;
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
}

const MermaidCodeBlockView = ({ code, selected, editable, updateAttributes, deleteNode }: IMermaidCodeBlockViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('mermaid');
  const renderIdRef = useRef(0);

  useEffect(() => {
    if (!code || isEditing || !mermaidLib) {
      return;
    }

    const renderDiagram = async () => {
      const targetContainer = isFullscreen ? fullscreenContainerRef.current : containerRef.current;
      if (!targetContainer) {
        return;
      }

      try {
        renderIdRef.current += 1;
        const elementId = `mermaid-${renderIdRef.current}-${Date.now()}`;

        log.debug('Rendering Mermaid diagram', { elementId, codeLength: code.length, isFullscreen });

        const { svg } = await mermaidLib.render(elementId, code);

        if (targetContainer) {
          targetContainer.innerHTML = svg;

          // フルスクリーン時はSVGを画面いっぱいに拡大
          if (isFullscreen) {
            const svgElement = targetContainer.querySelector('svg');
            if (svgElement) {
              svgElement.setAttribute('width', '100%');
              svgElement.setAttribute('height', '100%');
              svgElement.style.maxWidth = '100vw';
              svgElement.style.maxHeight = '100vh';
            }
          }

          setError(null);
        }
      } catch (err) {
        log.error('Failed to render Mermaid diagram', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    renderDiagram();
  }, [code, isEditing, isFullscreen]);

  const handleEditClick = () => {
    if (editable) {
      setIsEditing(true);
      setSelectedLanguage('mermaid'); // 現在の言語を設定
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
  };

  const handleRender = () => {
    // 言語を変更してレンダリング
    updateAttributes({ language: selectedLanguage });
    setIsEditing(false);
  };

  const handleCancel = () => {
    // キャンセル - 元の状態に戻す
    setSelectedLanguage('mermaid');
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteNode();
  };

  const handleDownloadSvg = () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;

    try {
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      const bbox = svgElement.getBoundingClientRect();
      svgClone.setAttribute('width', String(bbox.width));
      svgClone.setAttribute('height', String(bbox.height));
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `mermaid-diagram-${Date.now()}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      log.error('Failed to download SVG', err);
    }
  };

  const handleDownloadPng = () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;

    try {
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      const bbox = svgElement.getBoundingClientRect();
      svgClone.setAttribute('width', String(bbox.width));
      svgClone.setAttribute('height', String(bbox.height));

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        canvas.width = bbox.width * 2;
        canvas.height = bbox.height * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, bbox.width, bbox.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `mermaid-diagram-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(link.href);
          }
        }, 'image/png');
      };

      img.onerror = (err) => {
        log.error('Failed to load SVG image', err);
      };

      img.src = svgDataUrl;
    } catch (err) {
      log.error('Failed to download PNG', err);
    }
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isEditing) {
    return (
      <NodeViewWrapper className="mermaid-code-block editing">
        <div style={{ position: 'relative' }}>
          {/* コードエディタ */}
          <pre
            style={{
              border: '2px solid #007bff',
              borderRadius: '4px',
              padding: '12px',
              background: '#1e293b',
              fontFamily: 'monospace',
              fontSize: '14px',
              whiteSpace: 'pre-wrap',
              margin: 0,
              minHeight: '100px',
              position: 'relative',
              color: '#e2e8f0',
            }}
          >
            {/* 右上のコントロール */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #4a5568',
                  borderRadius: '3px',
                  fontSize: '12px',
                  background: '#2d3748',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <IconButton onClick={handleRender} title="レンダリング">
                &#x25B6;
              </IconButton>
              <IconButton onClick={handleDelete} title="削除">
                <Trash2 size={16} />
              </IconButton>
              <IconButton onClick={handleCancel} title="キャンセル">
                &#x2715;
              </IconButton>
            </div>
            <NodeViewContent />
          </pre>
        </div>
      </NodeViewWrapper>
    );
  }

  // フルスクリーン表示
  if (isFullscreen) {
    return (
      <NodeViewWrapper className="mermaid-code-block fullscreen">
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'white',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            margin: 0,
          }}
        >
          {/* 閉じるボタン */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 10000,
            }}
          >
            <IconButton onClick={handleToggleFullscreen} title="閉じる">
              &#x2715;
            </IconButton>
          </div>

          {error ? (
            <div
              style={{
                color: '#dc3545',
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                padding: '20px',
                margin: '20px',
                maxWidth: '800px',
              }}
            >
              <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Mermaid rendering error:</p>
              <pre style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap' }}>{error}</pre>
            </div>
          ) : (
            <div
              ref={fullscreenContainerRef}
              className="mermaid-diagram"
              style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={`mermaid-code-block ${selected ? 'selected' : ''}`}
    >
      <div
        style={{
          border: selected ? '2px solid #007bff' : '1px solid #e0e0e0',
          borderRadius: '4px',
          padding: '16px',
          background: '#fafafa',
          position: 'relative',
        }}
      >
        {/* 右上のコントロールボタン */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '4px',
            zIndex: 10,
          }}
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick();
            }}
            title="ソース編集"
          >
            &lt;&gt;
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadSvg();
            }}
            title="SVGダウンロード"
          >
            &#x1F5BC;
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadPng();
            }}
            title="PNGダウンロード"
          >
            &#x2B07;
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFullscreen();
            }}
            title="全画面表示"
          >
            &#x26F6;
          </IconButton>
        </div>

        {error ? (
          <div
            style={{
              color: '#dc3545',
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              padding: '12px',
            }}
          >
            <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Mermaid rendering error:</p>
            <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>{error}</pre>
          </div>
        ) : (
          <div ref={containerRef} className="mermaid-diagram" />
        )}
      </div>
    </NodeViewWrapper>
  );
};
