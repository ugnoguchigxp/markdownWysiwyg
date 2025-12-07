import { useState, useEffect } from 'react';
import { MarkdownEditor } from 'markdown-wysiwyg-editor';
import 'markdown-wysiwyg-editor/style.css';
import mermaid from 'mermaid';

function App() {
  const [content, setContent] = useState<string>(
    '# Markdown WYSIWYG Editor Demo\n' +
    '\n' +
    'このサンプルでは、エディタでサポートしている主な要素を一通り確認できます。\n' +
    '\n' +
    '## 1. Basic Text\n' +
    '\n' +
    '- **Bold text**\n' +
    '- *Italic text*\n' +
    '- ~~Strikethrough~~\n' +
    '- `Inline code`\n' +
    '\n' +
    '### Blockquote\n' +
    '\n' +
    '> Markdown is a lightweight markup language for creating formatted text.\n' +
    '\n' +
    '## 2. Lists\n' +
    '\n' +
    '- Bullet item 1\n' +
    '- Bullet item 2\n' +
    '  - Nested bullet item\n' +
    '\n' +
    '1. Numbered item 1\n' +
    '2. Numbered item 2\n' +
    '\n' +
    '## 3. Links & Images\n' +
    '\n' +
    '- Link: [GitHub](https://github.com)\n' +
    '- Image (Markdown syntax, 実際の表示はホスト環境に依存します):\n' +
    '\n' +
    '  ![Sample Image](/images/markdown-sample.png)\n' +
    '\n' +
    '## 4. Code Blocks\n' +
    '\n' +
    '```ts\n' +
    'function greet(name: string): string {\n' +
    '  return `Hello, ${name}!`;\n' +
    '}\n' +
    '\n' +
    'console.log(greet("Markdown"));\n' +
    '```\n' +
    '\n' +
    '## 5. Table\n' +
    '\n' +
    '| Feature        | Supported |\n' +
    '| -------------- | --------- |\n' +
    '| Bold           | Yes       |\n' +
    '| Italic         | Yes       |\n' +
    '| Strikethrough  | Yes       |\n' +
    '| Code Block     | Yes       |\n' +
    '| Tables         | Yes       |\n' +
    '| Mermaid        | Optional  |\n' +
    '\n' +
    '## 6. Mermaid Diagram\n' +
    '\n' +
    '```mermaid\n' +
    'graph TD;\n' +
    '  A[Editor] --> B[Markdown];\n' +
    '  B --> C[TipTap JSON];\n' +
    '  C --> D[HTML];\n' +
    '```\n'
  );
  const [isEditable, setIsEditable] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  // Toggle button handler
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-10 shadow-sm transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <h1 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Markdown WYSIWYG Editor</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <label className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer select-none ${theme === 'dark' ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <input
                type="checkbox"
                checked={isEditable}
                onChange={(e) => setIsEditable(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              Editable Mode
            </label>
            <a
              href="https://github.com/ugnoguchigxp/markdownWysiwyg"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">

          {/* Editor Column */}
          <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Editor</h2>
              <span className="text-xs text-slate-400">WYSIWYG Mode</span>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
              <MarkdownEditor
                value={content}
                onChange={setContent}
                editable={isEditable}
                mermaidLib={mermaid}
                enableMermaid={true}
                placeholder="Start typing your markdown..."
                className="h-full flex flex-col"
                autoHeight={false}
                enableVerticalScroll={true}
                showDownloadButton={true}
              />
            </div>
          </div>

          {/* Preview Column */}
          <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Raw Output</h2>
              <span className="text-xs text-slate-400">Markdown Source</span>
            </div>
            <div className="flex-1 bg-slate-900 rounded-xl shadow-inner border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => navigator.clipboard.writeText(content)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded backdrop-blur-sm transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="h-full p-4 overflow-auto text-sm font-mono text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {content}
              </pre>
            </div>
          </div>

        </div>
      </main>
    </div >
  );
}

export default App;
