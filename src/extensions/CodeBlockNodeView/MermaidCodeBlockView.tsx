import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { Trash2 } from '../../components/ui/icons';
import { createLogger } from '../../utils/logger';
import { sanitizeSvg } from '../../utils/security';
import { IconButton } from './IconButton';
import { SUPPORTED_LANGUAGES } from './constants';

const log = createLogger('CodeBlockNodeView');

interface MermaidCodeBlockViewProps {
  code: string;
  selected: boolean;
  editable: boolean;
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
  mermaidLib: typeof import('mermaid').default;
  mermaidLibVersion: number;
}

export const MermaidCodeBlockView = ({
  code,
  selected,
  editable,
  updateAttributes,
  deleteNode,
  mermaidLib,
  mermaidLibVersion,
}: MermaidCodeBlockViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('mermaid');
  const [isEditable, setIsEditable] = useState(editable);
  const renderIdRef = useRef(0);

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
      setSelectedLanguage('mermaid');
    }
  };

  const handleRender = () => {
    updateAttributes({ language: selectedLanguage });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedLanguage('mermaid');
    setIsEditing(false);
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
          <pre className="border-2 border-blue-500 rounded-md p-3 bg-slate-800 font-mono text-sm whitespace-pre-wrap m-0 min-h-[100px] relative text-slate-200">
            <div className="absolute top-2 right-2 flex gap-1 items-center z-10">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
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
              <IconButton onClick={deleteNode} title="削除">
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

  if (isFullscreen) {
    return (
      <NodeViewWrapper className="mermaid-code-block fullscreen">
        <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center p-0 m-0">
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
        className={`relative rounded-md p-4 bg-white border ${selected ? 'border-primary' : 'border-border'} text-slate-900`}
      >
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
