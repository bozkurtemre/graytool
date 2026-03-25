// shared/i18n.ts — Internationalization support for Graytool
// Provides runtime translation with user-selectable locale (en/tr).

// ─── Types ────────────────────────────────────────────────────

export type Locale = "en" | "tr";

export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
];

// ─── State ────────────────────────────────────────────────────

let currentLocale: Locale = "en";

// ─── Message Catalogs ─────────────────────────────────────────

const messages: Record<Locale, Record<string, string>> = {
  en: {
    // ── Field Selector ─────────────────────────────────────
    fieldSelector_title: "Select Field",
    fieldSelector_description:
      "Which field should Graytool use as the message content for this log row?",
    fieldSelector_saveDefault: "Save this selection as default",
    fieldSelector_cancel: "Cancel",
    fieldSelector_selectAndContinue: "Select and Continue",
    fieldSelector_close: "Close",

    // ── JSON Viewer ────────────────────────────────────────
    jsonViewer_detailView: "Detail View",
    jsonViewer_close: "Close",
    jsonViewer_field: "Field:",
    jsonViewer_defaultField: "Default",
    jsonViewer_searchPlaceholder: "Search fields... (/)",
    jsonViewer_copyAll: "Copy All",
    jsonViewer_copiedToClipboard: "Copied to clipboard",
    jsonViewer_queryCopied: "Query copied — paste in Graylog search",
    jsonViewer_copyValue: "Copy value",
    jsonViewer_addFilter: "Add as Graylog filter",
    jsonViewer_copied: "Copied!",
    jsonViewer_nKeys: "{n} keys",
    jsonViewer_nItems: "{n} items",
    jsonViewer_tabRaw: "Raw",
    jsonViewer_tabDevTools: "DevTools",
    jsonViewer_tabCode: "Code",
    jsonViewer_jsonEscape: "JSON Escape / Unescape",
    jsonViewer_pasteJsonHere: "Paste JSON here...",
    jsonViewer_escape: "Escape",
    jsonViewer_unescape: "Unescape",
    jsonViewer_prettify: "Prettify",
    jsonViewer_copy: "Copy",
    jsonViewer_invalidEscapedJson: "Invalid escaped JSON",
    jsonViewer_invalidJson: "Invalid JSON",
    jsonViewer_codeCopied: "Code copied!",
    jsonViewer_language: "Language:",
    jsonViewer_filterPrefix: "Filter: {query}",

    // ── Search History ─────────────────────────────────────
    searchHistory_title: "Search History",
    searchHistory_clearHistory: "Clear History",
    searchHistory_closeEsc: "Close (Esc)",
    searchHistory_searchPlaceholder: "Search in history...",
    searchHistory_emptyMessage:
      "No search history recorded yet. Execute a search in Graylog to save it.",
    searchHistory_clearConfirm:
      "Are you sure you want to clear your search history for this environment?",
    searchHistory_editorNotFound: "Could not find Graylog search editor.",
    searchHistory_editorNotFoundPrompt: "Graylog editor not found. You can copy your query below:",
    searchHistory_copyToClipboard: "Copy to clipboard",

    // ── Button Injector ────────────────────────────────────
    buttonInjector_detailView: "Detail View",

    // ── Options Page ───────────────────────────────────────
    options_loading: "Loading configuration...",
    options_loadFailed: "Failed to load configuration",
    options_saving: "Saving...",
    options_autoSaved: "Auto-saved",

    // Navigation
    options_tabPatterns: "URL Patterns",
    options_tabButtons: "Buttons",
    options_tabFields: "Field Config",
    options_tabSettings: "Settings",
    options_tabHelp: "Help",

    // URL Patterns
    options_patternsInfoTitle: "URL Patterns",
    options_patternsInfoMessage:
      "Define which Graylog instances the extension should activate on. Use wildcards (*) to match multiple paths. Example: ",
    options_configuredPatterns: "Configured Patterns",
    options_addPattern: "Add Pattern",
    options_searchPatterns: "Search patterns...",
    options_noPatternsConfigured: "No URL patterns configured. Add one to get started.",
    options_noPatternsMatch: "No patterns match your search.",
    options_unnamedPattern: "Unnamed Pattern",
    options_editPattern: "Edit Pattern",
    options_addPatternTitle: "Add Pattern",
    options_label: "Label",
    options_labelHelp: "A friendly name for this pattern.",
    options_labelPlaceholder: "Production Graylog",
    options_urlPattern: "URL Pattern",
    options_urlPatternHelp: "URL pattern with optional wildcard (*).",
    options_urlPatternPlaceholder: "https://graylog.company.com/*",
    options_cancel: "Cancel",
    options_savePattern: "Save Pattern",
    options_edit: "Edit",
    options_delete: "Delete",

    // Buttons
    options_buttonsInfoTitle: "Action Buttons",
    options_buttonsInfoMessage:
      "Configure buttons that appear on log rows. Use field bindings to insert log data into URLs. Example URL: ",
    options_configuredButtons: "Configured Buttons",
    options_addButton: "Add Button",
    options_searchButtons: "Search buttons...",
    options_allPatterns: "All Patterns",
    options_noPattern: "No Pattern",
    options_noButtonsConfigured: "No buttons configured. Add one to get started.",
    options_noButtonsMatch: "No buttons match your search criteria.",
    options_unnamedButton: "Unnamed Button",
    options_noUrlConfigured: "No URL configured",
    options_editButton: "Edit Button",
    options_addButtonTitle: "Add Button",
    options_urlTemplate: "URL Template",
    options_urlTemplateHelp:
      "Use {fieldName} placeholders for dynamic values. Map them to actual log field paths below.",
    options_fieldMappings: "Field Mappings",
    options_fieldMappingsHelp:
      "Map URL placeholders to actual log field paths. Leave empty to use the placeholder name as the field path directly.",
    options_color: "Color",
    options_colorPrimary: "Primary (Blue)",
    options_colorSuccess: "Success (Green)",
    options_colorWarning: "Warning (Yellow)",
    options_colorDanger: "Danger (Red)",
    options_colorDefault: "Default (Gray)",
    options_urlPatterns: "URL Patterns",
    options_urlPatternsHelp:
      "Select which URL patterns this button should appear on. Leave empty for all patterns.",
    options_noPatternsForButton: "No URL patterns configured. Button will appear on all pages.",
    options_conditions: "Conditions",
    options_conditionsHelp: "Button will only appear when all conditions are met.",
    options_fieldName: "Field name",
    options_exists: "Exists",
    options_equals: "Equals",
    options_notEquals: "Not Equals",
    options_contains: "Contains",
    options_startsWith: "Starts With",
    options_value: "Value",
    options_removeCondition: "Remove condition",
    options_addCondition: "Add Condition",
    options_options: "Options",
    options_openInNewTab: "Open in new tab",
    options_enabled: "Enabled",
    options_saveButton: "Save Button",

    // Field Config
    options_fieldDiscoveryConfig: "Field Discovery Configuration",
    options_defaultMessageField: "Default Message Field",
    options_defaultMessageFieldHelp:
      "The field to parse for JSON content. Leave empty for auto-detection.",
    options_autoDetect: "Auto-detect",
    options_fieldPrefixes: "Field Prefixes",
    options_fieldPrefixesHelp: "Comma-separated list of field prefixes to search.",
    options_jsonStringParsing: "JSON String Parsing",
    options_parseJsonStrings: "Parse JSON strings in field values",
    options_parseJsonStringsHelp:
      "When enabled, string values that contain JSON will be parsed and their nested fields will be available for button bindings.",
    options_maxParseDepth: "Max Parse Depth",
    options_maxParseDepthHelp: "Maximum recursion depth for parsing nested JSON strings (1-10).",

    // Settings
    options_applicationSettings: "Application Settings",
    options_extension: "Extension",
    options_enableExtension: "Enable extension",
    options_features: "Features",
    options_enableMessageDetail: "Enable message detail button",
    options_enableSearchHistory: "Enable search history",
    options_enableJsonViewer: "Enable JSON viewer",
    options_enableKeyboardShortcuts: "Enable keyboard shortcuts",
    options_importExport: "Import / Export",
    options_exportSettings: "Export settings",
    options_importFromFile: "Import from file",
    options_pasteJsonPlaceholder: "Paste exported JSON here...",
    options_importJson: "Import JSON",
    options_clear: "Clear",
    options_importOverwriteWarning: "Importing overwrites your current settings.",
    options_language: "Language",
    options_languageHelp: "Select the display language for the extension.",

    // Help
    options_keyboardShortcuts: "Keyboard Shortcuts",
    options_shortcut: "Shortcut",
    options_action: "Action",
    options_shortcutHistoryDesc: "Open the Search History popup (when in Graylog).",
    options_shortcutEscDesc: "Close open overlays (Search History, JSON Viewer, Field Selector).",
    options_shortcutEnterDesc:
      "Save the current query to search history and execute search (when focusing Graylog query editor).",
    options_usefulLinks: "Useful Links",
    options_reportIssue: "Report an Issue",
    options_reportIssueDesc: "Found a bug or have a feature request? Open an issue on GitHub.",
    options_documentation: "Documentation",
    options_documentationDesc: "Read the documentation to learn how to use Graytool effectively.",
    options_changelog: "Changelog",
    options_changelogDesc: "View the release history and changelog.",
    options_extensionInfo: "Extension Information",
    options_githubRepo: "GitHub Repository",
    options_developer: "Developer",
    options_footer: "Graytool Chrome Extension",

    // Errors / Status
    options_permissionDenied: "Permission denied. The extension will not work on this URL pattern.",
    options_pasteJsonFirst: "Paste JSON or import a file first.",
    options_invalidJson: "Invalid JSON. Please check the format.",
    options_invalidConfigFormat: "Invalid configuration format.",
    options_importPermissionDenied:
      "Permission denied. The extension will not work on the imported URL patterns.",
    options_failedRequestPermissions: "Failed to request permissions.",
    options_importSuccess: "Settings imported successfully.",
    options_failedSaveImport: "Failed to save imported settings.",
    options_fileLoaded: "File loaded. Review and click Import JSON to apply.",
    options_failedReadFile: "Failed to read file.",
  },

  tr: {
    // ── Field Selector ─────────────────────────────────────
    fieldSelector_title: "Alan Seç",
    fieldSelector_description:
      "Graytool bu log satırından hangi alanı mesaj içeriği olarak okumalı?",
    fieldSelector_saveDefault: "Bu seçimi varsayılan olarak kaydet",
    fieldSelector_cancel: "İptal",
    fieldSelector_selectAndContinue: "Seç ve Devam",
    fieldSelector_close: "Kapat",

    // ── JSON Viewer ────────────────────────────────────────
    jsonViewer_detailView: "Detay Görünümü",
    jsonViewer_close: "Kapat",
    jsonViewer_field: "Alan:",
    jsonViewer_defaultField: "Varsayılan",
    jsonViewer_searchPlaceholder: "Alanlarda ara... (/)",
    jsonViewer_copyAll: "Tümünü Kopyala",
    jsonViewer_copiedToClipboard: "Panoya kopyalandı",
    jsonViewer_queryCopied: "Sorgu kopyalandı — Graylog aramasına yapıştırın",
    jsonViewer_copyValue: "Değeri kopyala",
    jsonViewer_addFilter: "Graylog filtresi olarak ekle",
    jsonViewer_copied: "Kopyalandı!",
    jsonViewer_nKeys: "{n} anahtar",
    jsonViewer_nItems: "{n} öğe",
    jsonViewer_tabRaw: "Ham",
    jsonViewer_tabDevTools: "Geliştirici Araçları",
    jsonViewer_tabCode: "Kod",
    jsonViewer_jsonEscape: "JSON Escape / Unescape",
    jsonViewer_pasteJsonHere: "JSON yapıştırın...",
    jsonViewer_escape: "Escape",
    jsonViewer_unescape: "Unescape",
    jsonViewer_prettify: "Düzenle",
    jsonViewer_copy: "Kopyala",
    jsonViewer_invalidEscapedJson: "Geçersiz escape edilmiş JSON",
    jsonViewer_invalidJson: "Geçersiz JSON",
    jsonViewer_codeCopied: "Kod kopyalandı!",
    jsonViewer_language: "Dil:",
    jsonViewer_filterPrefix: "Filtre: {query}",

    // ── Search History ─────────────────────────────────────
    searchHistory_title: "Arama Geçmişi",
    searchHistory_clearHistory: "Geçmişi Temizle",
    searchHistory_closeEsc: "Kapat (Esc)",
    searchHistory_searchPlaceholder: "Geçmişte ara...",
    searchHistory_emptyMessage:
      "Henüz arama geçmişi kaydedilmedi. Kaydetmek için Graylog'da bir arama yapın.",
    searchHistory_clearConfirm:
      "Bu ortam için arama geçmişinizi temizlemek istediğinizden emin misiniz?",
    searchHistory_editorNotFound: "Graylog arama editörü bulunamadı.",
    searchHistory_editorNotFoundPrompt:
      "Graylog editörü bulunamadı. Sorgunuzu aşağıdan kopyalayabilirsiniz:",
    searchHistory_copyToClipboard: "Panoya kopyala",

    // ── Button Injector ────────────────────────────────────
    buttonInjector_detailView: "Detay Görünümü",

    // ── Options Page ───────────────────────────────────────
    options_loading: "Yapılandırma yükleniyor...",
    options_loadFailed: "Yapılandırma yüklenemedi",
    options_saving: "Kaydediliyor...",
    options_autoSaved: "Otomatik kaydedildi",

    // Navigation
    options_tabPatterns: "URL Kalıpları",
    options_tabButtons: "Butonlar",
    options_tabFields: "Alan Yapılandırması",
    options_tabSettings: "Ayarlar",
    options_tabHelp: "Yardım",

    // URL Patterns
    options_patternsInfoTitle: "URL Kalıpları",
    options_patternsInfoMessage:
      "Uzantının hangi Graylog örneklerinde etkinleşeceğini tanımlayın. Birden fazla yolu eşleştirmek için joker karakter (*) kullanın. Örnek: ",
    options_configuredPatterns: "Yapılandırılmış Kalıplar",
    options_addPattern: "Kalıp Ekle",
    options_searchPatterns: "Kalıplarda ara...",
    options_noPatternsConfigured: "Yapılandırılmış URL kalıbı yok. Başlamak için bir tane ekleyin.",
    options_noPatternsMatch: "Aramanızla eşleşen kalıp yok.",
    options_unnamedPattern: "İsimsiz Kalıp",
    options_editPattern: "Kalıbı Düzenle",
    options_addPatternTitle: "Kalıp Ekle",
    options_label: "Etiket",
    options_labelHelp: "Bu kalıp için kolay anlaşılır bir isim.",
    options_labelPlaceholder: "Üretim Graylog",
    options_urlPattern: "URL Kalıbı",
    options_urlPatternHelp: "Opsiyonel joker karakter (*) içeren URL kalıbı.",
    options_urlPatternPlaceholder: "https://graylog.company.com/*",
    options_cancel: "İptal",
    options_savePattern: "Kalıbı Kaydet",
    options_edit: "Düzenle",
    options_delete: "Sil",

    // Buttons
    options_buttonsInfoTitle: "Aksiyon Butonları",
    options_buttonsInfoMessage:
      "Log satırlarında görünecek butonları yapılandırın. Log verilerini URL'lere eklemek için alan bağlamalarını kullanın. Örnek URL: ",
    options_configuredButtons: "Yapılandırılmış Butonlar",
    options_addButton: "Buton Ekle",
    options_searchButtons: "Butonlarda ara...",
    options_allPatterns: "Tüm Kalıplar",
    options_noPattern: "Kalıp Yok",
    options_noButtonsConfigured: "Yapılandırılmış buton yok. Başlamak için bir tane ekleyin.",
    options_noButtonsMatch: "Arama kriterlerinize uyan buton bulunamadı.",
    options_unnamedButton: "İsimsiz Buton",
    options_noUrlConfigured: "URL yapılandırılmamış",
    options_editButton: "Butonu Düzenle",
    options_addButtonTitle: "Buton Ekle",
    options_urlTemplate: "URL Şablonu",
    options_urlTemplateHelp:
      "Dinamik değerler için {alanAdı} yer tutucularını kullanın. Bunları aşağıdaki gerçek log alan yollarına eşleyin.",
    options_fieldMappings: "Alan Eşlemeleri",
    options_fieldMappingsHelp:
      "URL yer tutucularını gerçek log alan yollarına eşleyin. Yer tutucu adını doğrudan alan yolu olarak kullanmak için boş bırakın.",
    options_color: "Renk",
    options_colorPrimary: "Birincil (Mavi)",
    options_colorSuccess: "Başarılı (Yeşil)",
    options_colorWarning: "Uyarı (Sarı)",
    options_colorDanger: "Tehlike (Kırmızı)",
    options_colorDefault: "Varsayılan (Gri)",
    options_urlPatterns: "URL Kalıpları",
    options_urlPatternsHelp:
      "Bu butonun hangi URL kalıplarında görüneceğini seçin. Tüm kalıplarda göstermek için boş bırakın.",
    options_noPatternsForButton: "Yapılandırılmış URL kalıbı yok. Buton tüm sayfalarda görünecek.",
    options_conditions: "Koşullar",
    options_conditionsHelp: "Buton yalnızca tüm koşullar sağlandığında görünecektir.",
    options_fieldName: "Alan adı",
    options_exists: "Mevcut",
    options_equals: "Eşittir",
    options_notEquals: "Eşit Değil",
    options_contains: "İçerir",
    options_startsWith: "İle Başlar",
    options_value: "Değer",
    options_removeCondition: "Koşulu kaldır",
    options_addCondition: "Koşul Ekle",
    options_options: "Seçenekler",
    options_openInNewTab: "Yeni sekmede aç",
    options_enabled: "Etkin",
    options_saveButton: "Butonu Kaydet",

    // Field Config
    options_fieldDiscoveryConfig: "Alan Keşif Yapılandırması",
    options_defaultMessageField: "Varsayılan Mesaj Alanı",
    options_defaultMessageFieldHelp:
      "JSON içeriği için ayrıştırılacak alan. Otomatik algılama için boş bırakın.",
    options_autoDetect: "Otomatik algıla",
    options_fieldPrefixes: "Alan Önekleri",
    options_fieldPrefixesHelp: "Aranacak alan öneklerinin virgülle ayrılmış listesi.",
    options_jsonStringParsing: "JSON Dizesi Ayrıştırma",
    options_parseJsonStrings: "Alan değerlerindeki JSON dizelerini ayrıştır",
    options_parseJsonStringsHelp:
      "Etkinleştirildiğinde, JSON içeren dize değerleri ayrıştırılır ve iç içe alanları buton bağlamaları için kullanılabilir hale gelir.",
    options_maxParseDepth: "Maks. Ayrıştırma Derinliği",
    options_maxParseDepthHelp:
      "İç içe JSON dizelerini ayrıştırmak için maksimum özyineleme derinliği (1-10).",

    // Settings
    options_applicationSettings: "Uygulama Ayarları",
    options_extension: "Uzantı",
    options_enableExtension: "Uzantıyı etkinleştir",
    options_features: "Özellikler",
    options_enableMessageDetail: "Mesaj detay butonunu etkinleştir",
    options_enableSearchHistory: "Arama geçmişini etkinleştir",
    options_enableJsonViewer: "JSON görüntüleyiciyi etkinleştir",
    options_enableKeyboardShortcuts: "Klavye kısayollarını etkinleştir",
    options_importExport: "İçe / Dışa Aktarma",
    options_exportSettings: "Ayarları dışa aktar",
    options_importFromFile: "Dosyadan içe aktar",
    options_pasteJsonPlaceholder: "Dışa aktarılmış JSON'u buraya yapıştırın...",
    options_importJson: "JSON İçe Aktar",
    options_clear: "Temizle",
    options_importOverwriteWarning: "İçe aktarma mevcut ayarlarınızın üzerine yazar.",
    options_language: "Dil",
    options_languageHelp: "Uzantının görüntüleme dilini seçin.",

    // Help
    options_keyboardShortcuts: "Klavye Kısayolları",
    options_shortcut: "Kısayol",
    options_action: "Eylem",
    options_shortcutHistoryDesc: "Arama Geçmişi penceresini açın (Graylog'da).",
    options_shortcutEscDesc:
      "Açık pencereleri kapatın (Arama Geçmişi, JSON Görüntüleyici, Alan Seçici).",
    options_shortcutEnterDesc:
      "Mevcut sorguyu arama geçmişine kaydedin ve aramayı çalıştırın (Graylog sorgu düzenleyicisinde odaklanıldığında).",
    options_usefulLinks: "Faydalı Bağlantılar",
    options_reportIssue: "Sorun Bildirin",
    options_reportIssueDesc:
      "Bir hata buldunuz veya özellik isteğiniz mi var? GitHub'da bir sorun açın.",
    options_documentation: "Dokümantasyon",
    options_documentationDesc:
      "Graytool'u etkili bir şekilde kullanmayı öğrenmek için dokümantasyonu okuyun.",
    options_changelog: "Değişiklik Günlüğü",
    options_changelogDesc: "Sürüm geçmişini ve değişiklik günlüğünü görüntüleyin.",
    options_extensionInfo: "Uzantı Bilgileri",
    options_githubRepo: "GitHub Deposu",
    options_developer: "Geliştirici",
    options_footer: "Graytool Chrome Uzantısı",

    // Errors / Status
    options_permissionDenied: "İzin reddedildi. Uzantı bu URL kalıbında çalışmayacaktır.",
    options_pasteJsonFirst: "Önce JSON yapıştırın veya bir dosya içe aktarın.",
    options_invalidJson: "Geçersiz JSON. Lütfen formatı kontrol edin.",
    options_invalidConfigFormat: "Geçersiz yapılandırma formatı.",
    options_importPermissionDenied:
      "İzin reddedildi. Uzantı içe aktarılan URL kalıplarında çalışmayacaktır.",
    options_failedRequestPermissions: "İzin isteği başarısız oldu.",
    options_importSuccess: "Ayarlar başarıyla içe aktarıldı.",
    options_failedSaveImport: "İçe aktarılan ayarlar kaydedilemedi.",
    options_fileLoaded: "Dosya yüklendi. İnceleyip uygulamak için JSON İçe Aktar'a tıklayın.",
    options_failedReadFile: "Dosya okunamadı.",
  },
};

// ─── Public API ───────────────────────────────────────────────

/**
 * Get the translated string for the given key.
 * Supports simple placeholder replacement: t("key", { n: "5" }) → "5 keys"
 */
export function t(key: string, replacements?: Record<string, string>): string {
  const msg = messages[currentLocale]?.[key] || messages["en"][key] || key;
  if (!replacements) return msg;
  return Object.entries(replacements).reduce((result, [k, v]) => result.replace(`{${k}}`, v), msg);
}

/** Get the current locale. */
export function getLocale(): Locale {
  return currentLocale;
}

/** Set the locale for all subsequent t() calls. */
export function setLocale(locale: Locale): void {
  if (locale === "en" || locale === "tr") {
    currentLocale = locale;
  }
}

/**
 * Initialize the locale from config settings.
 * Defaults to English when no language preference is set.
 */
export function initLocaleFromConfig(language?: string): void {
  if (language === "en" || language === "tr") {
    currentLocale = language;
  } else {
    currentLocale = "en";
  }
}
