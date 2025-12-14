import type { NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createLogger } from '../utils/logger';
import { sanitizeSvg } from '../utils/security';
import {
  getMermaidLib,
  getMermaidLibVersion,
  setMermaidLib,
  subscribeMermaidLib,
} from './mermaidRegistry';

const log = createLogger('CodeBlockNodeView');

// Initialize mermaid if available
try {
  // This will be imported by the user if they enable Mermaid
  // @ts-expect-error - Mermaid is optional
  if (typeof window !== 'undefined' && window.mermaid) {
    // @ts-expect-error - Mermaid is optional
    setMermaidLib(window.mermaid);
  }
} catch {
  // Mermaid not available
  log.debug('Mermaid not available (optional)');
}

// 統一されたボタンコンポーネント
interface IIconButtonProps {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
}

const IconButton = ({ onClick, title, children }: IIconButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="flex items-center justify-center w-7 h-7 bg-slate-700 border border-slate-600 rounded text-slate-200 hover:bg-slate-600 transition-colors text-sm"
  >
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

export const CodeBlockNodeView = ({
  node,
  selected,
  editor,
  updateAttributes,
  deleteNode,
}: NodeViewProps) => {
  const language = node.attrs.language || '';
  const code = node.textContent;
  const [mermaidLibVersion, setMermaidLibVersion] = useState(getMermaidLibVersion());
  const mermaidLib = getMermaidLib();

  log.debug('CodeBlockNodeView render', { language, editable: editor.isEditable, selected });

  useEffect(() => {
    return subscribeMermaidLib(() => {
      setMermaidLibVersion(getMermaidLibVersion());
    });
  }, []);

  // Mermaid専用のレンダリング
  if (language === 'mermaid' && mermaidLib) {
    return (
      <MermaidCodeBlockView
        code={code}
        selected={selected}
        editable={editor.isEditable}
        updateAttributes={updateAttributes}
        deleteNode={deleteNode}
        mermaidLib={mermaidLib}
        mermaidLibVersion={mermaidLibVersion}
      />
    );
  }

  // 通常のコードブロック
  return (
    <RegularCodeBlockView
      language={language}
      selected={selected}
      editable={editor.isEditable}
      updateAttributes={updateAttributes}
      deleteNode={deleteNode}
    />
  );
};

interface IRegularCodeBlockViewProps {
  language: string;
  selected: boolean;
  editable: boolean;
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
}

const RegularCodeBlockView = ({
  language,
  selected,
  editable,
  updateAttributes,
  deleteNode,
}: IRegularCodeBlockViewProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState(language || '');
  const [isEditable, setIsEditable] = useState(editable);

  // Listen to editable changes
  useEffect(() => {
    setIsEditable(editable);
    log.debug('RegularCodeBlockView editable changed', { language, editable, selected });
  }, [editable, language, selected]);

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
    <NodeViewWrapper className={`code-block ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <div
        className={`relative bg-slate-800 rounded-md p-4 border ${selected ? 'border-blue-500' : 'border-slate-700'}`}
      >
        {/* 右上のコントロール */}
        {isEditable && (
          <div className="absolute top-0 right-0 flex gap-1 items-center z-10">
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-2 py-1.5 border border-slate-600 rounded text-xs bg-slate-700 text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
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
        <pre className="m-0 relative overflow-visible whitespace-pre text-slate-200">
          <code className="block overflow-auto text-slate-200">
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
  mermaidLib: typeof import('mermaid').default;
  mermaidLibVersion: number;
}

const MermaidCodeBlockView = ({
  code,
  selected,
  editable,
  updateAttributes,
  deleteNode,
  mermaidLib,
  mermaidLibVersion,
}: IMermaidCodeBlockViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('mermaid');
  const [isEditable, setIsEditable] = useState(editable);
  const renderIdRef = useRef(0);

  // Listen to editable changes
  useEffect(() => {
    setIsEditable(editable);
  }, [editable]);

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
        const elementId = `mermaid-${mermaidLibVersion}-${renderIdRef.current}-${Date.now()}`;

        log.debug('Rendering Mermaid diagram', {
          elementId,
          codeLength: code.length,
          isFullscreen,
          mermaidLibVersion,
        });

        const { svg } = await mermaidLib.render(elementId, code);

        if (targetContainer) {
          const safeSvg = sanitizeSvg(svg);
          targetContainer.replaceChildren();
          if (safeSvg) {
            const doc = new DOMParser().parseFromString(safeSvg, 'image/svg+xml');
            const svgEl = doc.documentElement;
            if (svgEl) {
              targetContainer.appendChild(document.importNode(svgEl, true));
            }
          }

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
  }, [code, isEditing, isFullscreen, mermaidLib, mermaidLibVersion]);

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
        <div className="relative">
          {/* コードエディタ */}
          <pre className="border-2 border-blue-500 rounded-md p-3 bg-slate-800 font-mono text-sm whitespace-pre-wrap m-0 min-h-[100px] relative text-slate-200">
            {/* 右上のコントロール */}
            <div className="absolute top-2 right-2 flex gap-1 items-center z-10">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-2 py-1.5 border border-slate-600 rounded text-xs bg-slate-700 text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
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
        <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center p-0 m-0">
          {/* 閉じるボタン */}
          <div className="absolute top-5 right-5 z-[10000]">
            <IconButton onClick={handleToggleFullscreen} title="閉じる">
              &#x2715;
            </IconButton>
          </div>

          {error ? (
            <div className="text-red-600 bg-red-100 border border-red-200 rounded p-5 m-5 max-w-4xl">
              <p className="font-bold mb-2">Mermaid rendering error:</p>
              <pre className="m-0 text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          ) : (
            <div
              ref={fullscreenContainerRef}
              className="mermaid-diagram w-screen h-screen flex items-center justify-center"
            />
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className={`mermaid-code-block ${selected ? 'selected' : ''}`}>
      <div
        className={`relative rounded-md p-4 bg-gray-50 border ${selected ? 'border-blue-500' : 'border-gray-200'}`}
      >
        {/* 右上のコントロールボタン */}
        {isEditable && (
          <div className="absolute top-0 right-0 flex gap-1 z-10">
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
        )}

        {error ? (
          <div className="text-red-600 bg-red-100 border border-red-200 rounded p-3">
            <p className="font-bold mb-2">Mermaid rendering error:</p>
            <pre className="m-0 text-xs whitespace-pre-wrap">{error}</pre>
          </div>
        ) : (
          <div ref={containerRef} className="mermaid-diagram" />
        )}
      </div>
    </NodeViewWrapper>
  );
};
