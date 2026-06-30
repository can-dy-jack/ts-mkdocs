const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'search.placeholder': 'Search',
    'search.type': 'Type to search',
    'search.loading': 'Loading index…',
    'search.no_results': 'No results for',
    'search.results': 'results for',
    'search.result': 'result for',
    'search.documents': 'documents indexed',
    'search.unavailable': 'Search index not available',
    'toc.title': 'Table of contents',
    'nav.title': 'Navigation',
    'footer.previous': 'Previous',
    'footer.next': 'Next',
    'theme.toggle': 'Toggle theme',
    'repo.label': 'Repository',
    'menu.open': 'Open menu',
    'top.button': 'Back to top',
    'hero.get_started': 'Get started',
    '404.title': '404 - Page Not Found',
    '404.message': 'The page you are looking for does not exist.',
    'edit': 'Edit this page',
    'view': 'View source',
    'clipboard.copy': 'Copy to clipboard',
    'clipboard.copied': 'Copied!',
  },
  zh: {
    'search.placeholder': '搜索',
    'search.type': '输入以搜索',
    'search.loading': '正在加载索引…',
    'search.no_results': '未找到结果',
    'search.results': '条结果',
    'search.result': '条结果',
    'search.documents': '个文档已索引',
    'search.unavailable': '搜索索引不可用',
    'toc.title': '目录',
    'nav.title': '导航',
    'footer.previous': '上一页',
    'footer.next': '下一页',
    'theme.toggle': '切换主题',
    'repo.label': '代码仓库',
    'menu.open': '打开菜单',
    'top.button': '返回顶部',
    'hero.get_started': '开始使用',
    '404.title': '404 - 页面未找到',
    '404.message': '您访问的页面不存在。',
    'edit': '编辑此页',
    'view': '查看源码',
    'clipboard.copy': '复制到剪贴板',
    'clipboard.copied': '已复制！',
  },
}

export type I18nStrings = Record<string, string>

export function getI18n(language: string): I18nStrings {
  const lang = language.split('-')[0].toLowerCase()
  return { ...TRANSLATIONS.en, ...(TRANSLATIONS[lang] ?? {}) }
}
