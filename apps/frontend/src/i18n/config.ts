import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 翻訳リソースをインポート
import jaMessages from '../messages/ja.json';
import enMessages from '../messages/en.json';

const resources = {
  ja: {
    translation: jaMessages,
  },
  en: {
    translation: enMessages,
  },
};

// Vite環境変数の取得
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// i18nの初期化（同期的に実行）
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    debug: isDevelopment,
    lng: 'ja', // デフォルト言語を明示的に設定

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'libark-language',
    },

    // 言語変更時のコールバック
    saveMissing: false,

    react: {
      useSuspense: false,
    },

    // キーが見つからない場合のフォールバック設定
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,

    // 翻訳キーが見つからない場合の処理
    parseMissingKeyHandler: (key: string) => {
      if (isDevelopment) {
        console.warn(`🔍 Missing translation key: ${key}`);
      }
      return key; // キー自体を返す代わりにデフォルト値を使用
    },

    // ネームスペース設定
    defaultNS: 'translation',
    ns: ['translation'],
  });

// 初期化完了後にストアとの同期を実行
i18n.on('initialized', () => {
  // ブラウザ環境でのみ実行
  if (typeof window !== 'undefined') {
    // TODO: @libark/graphql-clientの動的インポートを一時的に無効化
    // JavaScript エラー解決後に再有効化する
    console.log('i18n initialized - GraphQL client sync temporarily disabled');

    // 動的インポートでストアとの同期を実行
    // import('@libark/graphql-client')
    //   .then(module => {
    //     // 少し遅延させてストアの初期化を待つ
    //     setTimeout(() => {
    //       if (module.initializeSettings) {
    //         module.initializeSettings();
    //       } else {
    //         console.warn('initializeSettings function not found in @libark/graphql-client');
    //       }
    //     }, 100);
    //   })
    //   .catch(console.warn);
  }
});

if (isDevelopment) {
  console.log('🌐 i18n initialized:', {
    language: i18n.language,
    hasResources: i18n.hasResourceBundle('ja', 'translation'),
    resources: Object.keys(i18n.store.data),
  });

  // 翻訳キーが見つからない場合のデバッグ
  i18n.on('missingKey', (lng, namespace, key, fallbackValue) => {
    console.warn('🔍 Missing translation key:', {
      language: lng,
      namespace,
      key,
      fallbackValue,
    });
  });
}

export default i18n;
