import { I18nProvider } from 'markdown-wysiwyg-editor';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const translations: Record<string, string> = {
  'markdown_editor.placeholder': 'Markdownを入力してください…',
  'markdown_editor.delete_button': '削除',
  'markdown_editor.render_button': 'レンダー',
  'markdown_editor.cancel_button': 'キャンセル',
  'markdown_editor.edit_source': 'ソース編集',
  'markdown_editor.download_image': '画像をダウンロード',
  'markdown_editor.fullscreen': '全画面',
  'markdown_editor.close_fullscreen': '全画面を閉じる',
  'markdown_editor.insert_table': '表を挿入',
  'markdown_editor.insert_code_block': 'コードブロックを挿入',
  'markdown_editor.insert_image': '画像を挿入',
  'markdown_editor.insert_link': 'リンクを挿入',
  'markdown_editor.bold': '太字',
  'markdown_editor.italic': '斜体',
  'markdown_editor.strikethrough': '取り消し線',
  'markdown_editor.code': 'コード',
  'markdown_editor.heading': '見出し',
  'markdown_editor.bullet_list': '箇条書き',
  'markdown_editor.ordered_list': '番号付きリスト',
  'markdown_editor.blockquote': '引用',
  'markdown_editor.horizontal_rule': '区切り線',
  'markdown_editor.download': 'ダウンロード',
  'markdown_editor.loading_editor': 'エディタを読み込み中…',
  'markdown_editor.converting_markdown': 'Markdownに変換中…',
  'markdown_editor.lines_completed': '行完了',
  'markdown_editor.paste_debug_panel': '貼り付けデバッグ',
  'markdown_editor.clear': 'クリア',
  'markdown_editor.type': '種類',
  'markdown_editor.content': '内容',
  'markdown_editor.result': '結果',
  'markdown_editor.open_heading_menu': '見出しメニューを開く',
  'markdown_editor.close_heading_menu': '見出しメニューを閉じる',
  'markdown_editor.open_download_menu': 'エクスポートメニューを開く',
  'markdown_editor.close_download_menu': 'エクスポートメニューを閉じる',
  'markdown_editor.export_menu_title': 'エクスポート',
  'markdown_editor.export_menu_description': '形式を選んで保存できます',
  'markdown_editor.markdown_file': 'Markdownファイル',
  'markdown_editor.save_as_markdown_file': '.mdとして保存',
  'markdown_editor.sample_text': 'サンプル',
  'markdown_editor.insert': '挿入',
  'markdown_editor.close': '閉じる',
  'markdown_editor.update': '更新',
  'markdown_editor.link.open': 'リンクを開く',
  'markdown_editor.link.edit': 'リンクを編集',
  'markdown_editor.link.text': 'リンクテキスト',
  'markdown_editor.link.url': 'URL',
  'markdown_editor.link.enter_text': 'リンクテキストを入力',
  'markdown_editor.link.url_placeholder': 'https://example.com',
  'markdown_editor.syntax_status.help': '選択範囲のMarkdown情報',
  'markdown_editor.syntax_status.selected_text': '選択テキスト',
  'markdown_editor.syntax_status.markdown_syntax': 'Markdown構文',
  'markdown_editor.syntax_status.styles': 'スタイル',
  'markdown_editor.syntax_status.node_type': 'ノード種別',
  'markdown_editor.table_toolbar.confirm_delete_table': '表を削除しますか？',
  'markdown_editor.table_toolbar.insert_row_above': '上に行を挿入',
  'markdown_editor.table_toolbar.insert_row_below': '下に行を挿入',
  'markdown_editor.table_toolbar.delete_row': '行を削除',
  'markdown_editor.table_toolbar.insert_column_left': '左に列を挿入',
  'markdown_editor.table_toolbar.insert_column_right': '右に列を挿入',
  'markdown_editor.table_toolbar.delete_column': '列を削除',
  'markdown_editor.table_toolbar.merge_cells': 'セルを結合',
  'markdown_editor.table_toolbar.split_cell': 'セルを分割',
  'markdown_editor.table_toolbar.toggle_header_row': 'ヘッダー行切替',
  'markdown_editor.table_toolbar.toggle_header_column': 'ヘッダー列切替',
  'markdown_editor.table_toolbar.delete_table': '表を削除',
  'markdown_editor.table_toolbar.header_row': 'ヘッダー行',
  'markdown_editor.table_toolbar.header_column': 'ヘッダー列',
  'markdown_editor.table_edge_controls.add_row_above': '上に行を追加',
  'markdown_editor.table_edge_controls.add_row_below': '下に行を追加',
  'markdown_editor.table_edge_controls.add_column_left': '左に列を追加',
  'markdown_editor.table_edge_controls.add_column_right': '右に列を追加',
  'markdown_editor.table.row_operations': '行操作',
  'markdown_editor.table.add_row_above': '上に行を追加',
  'markdown_editor.table.add_row_below': '下に行を追加',
  'markdown_editor.table.delete_row': '行を削除',
  'markdown_editor.table.column_operations': '列操作',
  'markdown_editor.table.add_column_left': '左に列を追加',
  'markdown_editor.table.add_column_right': '右に列を追加',
  'markdown_editor.table.delete_column': '列を削除',
  'markdown_editor.table.delete_table': '表を削除',
  'markdown_editor.table.cancel': 'キャンセル',
};

const t = (key: string, fallback?: string) => translations[key] ?? fallback ?? key;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider t={t}>
      <App />
    </I18nProvider>
  </StrictMode>,
);
