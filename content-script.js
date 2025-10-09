// Content script for GrayTool extension
// Injects buttons into Graylog log rows

console.log("GrayTool: Content script starting to load...");
console.log("GrayTool: Current URL:", window.location.href);
console.log("GrayTool: Chrome APIs check:", {
  chrome: !!chrome,
  storage: !!(chrome && chrome.storage),
  runtime: !!(chrome && chrome.runtime)
});

function parseKeyValuePairs(text) {
  const fields = {};
  if (!text) return fields;
  
  // key=value, key2=value2 formatını parse et
  const matches = text.match(/(\w+)=([^,]+)/g);
  if (matches) {
    matches.forEach(match => {
      const [, key, value] = match.match(/(\w+)=(.+)/);
      if (key && value) {
        fields[key] = value.trim();
      }
    });
  }
  
  return fields;
}

function buildAdminUrl(btn, fields, baseUrl) {
  // Custom URL varsa onu kullan, yoksa environment base URL kullan
  const effectiveBaseUrl = btn.customUrl || baseUrl;
  
  console.log("GrayTool: Building admin URL with:", {
    customUrl: btn.customUrl,
    baseUrl,
    effectiveBaseUrl,
    adminRoute: btn.adminRoute,
    paramMapping: btn.paramMapping,
    fields
  });
  
  const params = [];
  const graylogQueryParts = [];
  
  // Parameter mapping'i işle
  Object.entries(btn.paramMapping).forEach(([key, field]) => {
    console.log("GrayTool: Processing param mapping:", { key, field, fieldValue: fields[field] });
    
    if (!fields[field]) {
      console.log("GrayTool: Field value not found for:", field);
      return;
    }
    
    const fieldValue = fields[field];
    
    // Graylog query syntax: q.fieldName -> q=fieldName:"value" formatında
    if (key.startsWith('q.')) {
      const queryField = key.substring(2); // "q.requestId" -> "requestId"
      graylogQueryParts.push(`${queryField}:"${fieldValue}"`);
      console.log("GrayTool: Added Graylog query part:", `${queryField}:"${fieldValue}"`);
    } else {
      // Normal URL parameter
      params.push(`${key}=${encodeURIComponent(fieldValue)}`);
      console.log("GrayTool: Added normal parameter:", `${key}=${fieldValue}`);
    }
  });
  
  // Graylog query'leri varsa q parametresine ekle
  if (graylogQueryParts.length > 0) {
    const graylogQuery = graylogQueryParts.join(' AND ');
    params.push(`q=${encodeURIComponent(graylogQuery)}`);
    console.log("GrayTool: Built Graylog query:", graylogQuery);
  }
  
  let finalUrl = `${effectiveBaseUrl}${btn.adminRoute}`;
  
  if (params.length > 0) {
    // Final URL'de zaten parametre var mı kontrol et
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}${params.join('&')}`;
  }
  
  console.log("GrayTool: URL Building Debug:", {
    effectiveBaseUrl,
    adminRoute: btn.adminRoute,
    params,
    graylogQueryParts,
    finalUrl
  });
  
  console.log("GrayTool: Final URL:", finalUrl, btn.customUrl ? "(using custom URL)" : "(using environment base URL)");
  
  return finalUrl;
}

function appendButtonsToLogRow(logRow, fields, buttons, baseUrl) {
  console.log("GrayTool: Processing row with fields:", fields);
  console.log("GrayTool: Available buttons:", buttons);
  
  buttons.forEach(btn => {
    console.log("GrayTool: Checking button:", btn.buttonName, "for route:", btn.graylogRoute);
    
    // Wildcard (*) desteği - eğer * ise tüm rowlara ekle
    if (btn.graylogRoute !== '*' && !fields.route?.includes(btn.graylogRoute)) {
      console.log("GrayTool: Button route check failed. Button route:", btn.graylogRoute, "Field route:", fields.route);
      return;
    }

    // Field'ların hem mevcut olduğunu hem de anlamlı değerlere sahip olduğunu kontrol et
    const hasAll = Object.values(btn.paramMapping).every(fieldName => {
      const fieldValue = fields[fieldName];
      
      // Field yoksa false
      if (!fieldValue) return false;
      
      // Field string ise boş olmamalı
      if (typeof fieldValue === 'string' && fieldValue.trim() === '') return false;
      
      // Field number ise 0 olmamalı (çoğunlukla ID'ler için 0 anlamsız)
      if (fieldValue === '0' || fieldValue === 0) return false;
      
      // Field 'null', 'undefined', 'NaN' string'i ise false
      if (['null', 'undefined', 'NaN'].includes(String(fieldValue).toLowerCase())) return false;
      
      return true;
    });
    
    if (!hasAll) {
      const missingOrInvalid = Object.entries(btn.paramMapping)
        .filter(([key, fieldName]) => {
          const fieldValue = fields[fieldName];
          return !fieldValue || fieldValue === '0' || fieldValue === 0 || 
                 (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
                 ['null', 'undefined', 'NaN'].includes(String(fieldValue).toLowerCase());
        })
        .map(([key, fieldName]) => `${fieldName}="${fields[fieldName] || 'missing'}"`);
        
      console.log("GrayTool: Missing or invalid required fields for button:", btn.buttonName, 
                 "Invalid fields:", missingOrInvalid,
                 "Required:", Object.values(btn.paramMapping), 
                 "Available:", Object.keys(fields));
      return;
    }
    
    console.log("GrayTool: Adding button:", btn.buttonName);

    const url = buildAdminUrl(btn, fields, baseUrl);
    const button = document.createElement("button");
    button.innerText = btn.buttonName;
    
    // Mevcut butonların stillerini kopyala (önce lokal sonra global)
    let existingButton = logRow.querySelector("button, .btn");
    if (!existingButton) {
      // Global olarak herhangi bir buton ara
      existingButton = document.querySelector(".btn-group button, button.btn, .btn");
    }
    
    if (existingButton) {
      // Mevcut butonun sınıflarını kopyala
      button.className = existingButton.className;
    } else {
      // Fallback: temel bootstrap sınıfları
      button.className = "btn btn-sm btn-default";
    }
    
    button.onclick = () => window.open(url, "_blank");

    // Always use btn-group position
    let btnGroup = logRow.querySelector(".btn-group");
    
    // Eğer logRow'da btn-group yoksa, parent elementlerde ara
    if (!btnGroup) {
      let parent = logRow.parentElement;
      while (parent && !btnGroup) {
        btnGroup = parent.querySelector(".btn-group");
        parent = parent.parentElement;
      }
    }
    
    if (btnGroup) {
      console.log("GrayTool: Found btn-group, adding button to it");
      console.log("GrayTool: btn-group HTML:", btnGroup.innerHTML.substring(0, 200) + "...");
      
      // Build'den bağımsız selectors
      const existingDiv = btnGroup.querySelector("div:has(button[data-gl-clipboard-button])") || 
                         btnGroup.querySelector("div:has(span[role='button'] button)") ||
                         btnGroup.querySelector("div span[role='button']")?.parentElement;
      
      if (existingDiv) {
        console.log("GrayTool: Found existing div with classes:", existingDiv.className);
        
        // Mevcut div'in yapısını tam olarak kopyala
        const wrapper = document.createElement("div");
        wrapper.className = existingDiv.className;
        
        const existingSpan = existingDiv.querySelector("span");
        const span = document.createElement("span");
        span.setAttribute("role", "button");
        
        if (existingSpan) {
          span.className = existingSpan.className;
          console.log("GrayTool: Copying span classes:", existingSpan.className);
        } else {
          // Fallback: role="button" attribute'u yeter
          console.log("GrayTool: Using minimal span structure");
        }
        
        // Button styling'i mevcut button'dan al
        const existingButton = existingDiv.querySelector("button");
        if (existingButton) {
          button.className = existingButton.className;
          button.setAttribute("type", "button");
          console.log("GrayTool: Copying button classes:", existingButton.className);
        } else {
          button.className = "btn btn-sm btn-default";
          button.setAttribute("type", "button");
        }
        
        span.appendChild(button);
        wrapper.appendChild(span);
        
        // btn-group içine, mevcut div'in sonrasına ekle
        btnGroup.appendChild(wrapper);
        console.log("GrayTool: Button added to btn-group");
      } else {
        console.log("GrayTool: No existing div found, creating new structure");
        
        // Mevcut link butonlarını bul ve onlardan class'ları al
        const existingLink = btnGroup.querySelector("a");
        
        if (existingLink) {
          // Link gibi direkt btn-group'a ekle
          button.className = existingLink.className;
          button.setAttribute("type", "button");
          btnGroup.appendChild(button);
          console.log("GrayTool: Added button directly to btn-group like existing links");
        } else {
          // Genel yapı oluştur (varsayılan)
          const wrapper = document.createElement("div");
          const span = document.createElement("span");
          span.setAttribute("role", "button");
          
          button.className = "btn btn-sm btn-default";
          button.setAttribute("type", "button");
          
          span.appendChild(button);
          wrapper.appendChild(span);
          btnGroup.appendChild(wrapper);
          console.log("GrayTool: Created generic button structure in btn-group");
        }
      }
    } else {
      console.log("GrayTool: No btn-group found, adding to row end as fallback");
      logRow.appendChild(button);
    }
  });
}

// Global variables for cached config
let cachedButtons = [];
let cachedAdminBaseUrl = "";
let configInitialized = false;

// Initialize configuration once on page load
function initializeConfig() {
  console.log("GrayTool: initializeConfig() called");
  
  if (!chrome || !chrome.storage || !chrome.runtime) {
    console.error("GrayTool: Chrome extension APIs not available");
    return;
  }

  console.log("GrayTool: Chrome APIs available, getting storage...");
  chrome.storage.sync.get(["buttons", "adminBaseUrl", "environments"], (result) => {
    if (chrome.runtime.lastError) {
      console.error("GrayTool: Chrome storage error:", chrome.runtime.lastError);
      return;
    }
    
    console.log("GrayTool: Raw storage result:", result);
    const { buttons, adminBaseUrl, environments = [] } = result;
    
    // Auto-detect environment based on current URL (once!)
    const currentHost = window.location.hostname.toLowerCase();
    const isStaging = currentHost.includes('stage');
    const envType = isStaging ? 'staging' : 'production';
    
    const detectedEnv = environments.find(env => 
      env.name.toLowerCase().includes(envType)
    );
    const defaultEnv = environments.find(env => env.isDefault);
    const finalEnv = detectedEnv || defaultEnv;
    
    // Cache the effective admin base URL
    cachedAdminBaseUrl = finalEnv?.adminBaseUrl || adminBaseUrl || "";
    cachedButtons = buttons || [];
    configInitialized = true;
    
    console.log("GrayTool: Configuration initialized:", {
      currentHost,
      isStaging,
      envType,
      detectedEnv: detectedEnv?.name,
      defaultEnv: defaultEnv?.name,
      finalEnv: finalEnv?.name,
      cachedAdminBaseUrl,
      buttonsCount: cachedButtons.length
    });
    
    // Process existing elements after config is loaded
    processExistingElements();
  });
}

// Process existing log rows and message details
function processExistingElements() {
  console.log("GrayTool: processExistingElements() called, configInitialized:", configInitialized);
  
  if (!configInitialized) {
    console.log("GrayTool: Config not initialized yet, skipping processing");
    return;
  }
  
  const logRows = document.querySelectorAll(".table tr, .log-row");
  const messageDetails = document.querySelectorAll(".message-detail, .message-details");
  
  console.log("GrayTool: Found", logRows.length, "log rows and", messageDetails.length, "message details");
  
  // Process normal log rows
  logRows.forEach((row, index) => {
    if (row.dataset.buttonsInjected) {
      console.log("GrayTool: Row", index, "already has buttons injected, skipping");
      return;
    }
    console.log("GrayTool: Processing log row", index);
    processLogRow(row);
  });
  
  // Process message detail pages
  messageDetails.forEach((detail, index) => {
    if (detail.dataset.buttonsInjected) {
      console.log("GrayTool: Detail", index, "already has buttons injected, skipping");
      return;
    }
    console.log("GrayTool: Processing message detail", index);
    processMessageDetail(detail);
  });
}

function processLogRow(row) {
  const fields = {};
  
  // Data-field attributelerini oku
  row.querySelectorAll("[data-field]").forEach(el => {
    if (el.dataset.field) {
      fields[el.dataset.field] = el.innerText.trim();
    }
  });
  
  // Message field'ından JSON parse et (Yeni format)
  const messageElements = row.querySelectorAll("[data-field='message'], .message, [data-testid*='message']");
  messageElements.forEach(msgEl => {
    const messageText = msgEl.innerText.trim();
    
    // JSON formatındaki mesajları parse et
    if (messageText.startsWith("{") && messageText.endsWith("}")) {
      try {
        const parsed = JSON.parse(messageText);
        console.log("GrayTool: Parsed JSON from message:", parsed);
        
        // Recursive function to flatten nested objects
        function flattenObject(obj, prefix = '') {
          Object.entries(obj).forEach(([key, value]) => {
            const fieldName = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'string' || typeof value === 'number') {
              // String/number değerleri direkt ekle
              fields[key] = String(value); // Sadece key ismi (prefix olmadan)
              if (prefix) fields[fieldName] = String(value); // Full path ile de ekle
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
              // Nested object'leri recursive olarak flatten et
              flattenObject(value, fieldName);
            }
          });
        }
        
        // Ana JSON'ı flatten et
        flattenObject(parsed);
        
        // Özel durum: msg field'ı kendisi JSON string ise onu da parse et
        if (parsed.msg && typeof parsed.msg === 'string' && parsed.msg.trim().startsWith('{')) {
          try {
            console.log("GrayTool: msg field contains JSON string, parsing:", parsed.msg.substring(0, 100) + "...");
            const msgJson = JSON.parse(parsed.msg.trim());
            console.log("GrayTool: Parsed JSON from msg field:", msgJson);
            
            // msg içindeki JSON'ı da flatten et
            flattenObject(msgJson, 'msg');
            
            console.log("GrayTool: Fields after parsing msg JSON:", fields);
          } catch (e) {
            console.log("GrayTool: Failed to parse JSON from msg field:", e.message);
          }
        }
        
        // Özel handling: userId bulunamazsa msg içerisinde pattern ara
        if (!fields.userId && parsed.msg) {
          const msgContent = String(parsed.msg);
          console.log("GrayTool: userId not found in main fields, searching in msg:", msgContent);
          
          // msg içerisinde userId pattern'lerini ara
          const userIdPatterns = [
            /userId[=:]\s*(\d+)/i,           // userId=3244 veya userId:3244
            /user[_\s]?id[=:]\s*(\d+)/i,    // user_id=3244 veya user id:3244
            /\buser[=:]\s*(\d+)/i,          // user=3244
            /\bu(\d+)\b/i                   // u3244 format
          ];
          
          for (const pattern of userIdPatterns) {
            const match = msgContent.match(pattern);
            if (match && match[1]) {
              fields.userId = match[1];
              console.log("GrayTool: Found userId in msg:", match[1], "using pattern:", pattern);
              break;
            }
          }
        }
        
        // Benzer şekilde diğer kritik field'lar için de arama yapabiliriz
        if (!fields.deviceId && parsed.msg) {
          const msgContent = String(parsed.msg);
          const deviceIdPatterns = [
            /deviceId[=:]\s*(\d+)/i,
            /device[_\s]?id[=:]\s*(\d+)/i,
            /\bdevice[=:]\s*(\d+)/i,
            /\bd(\d+)\b/i
          ];
          
          for (const pattern of deviceIdPatterns) {
            const match = msgContent.match(pattern);
            if (match && match[1]) {
              fields.deviceId = match[1];
              console.log("GrayTool: Found deviceId in msg:", match[1]);
              break;
            }
          }
        }
        
        console.log("GrayTool: Extracted fields from JSON:", fields);
      } catch (e) {
        console.log("GrayTool: Failed to parse message JSON:", e.message);
        // Fallback: eski key-value parsing
        const parsedFields = parseKeyValuePairs(messageText);
        Object.assign(fields, parsedFields);
      }
    } else {
      // Eski format: key-value pairs
      if (messageText.includes("=")) {
        const parsedFields = parseKeyValuePairs(messageText);
        Object.assign(fields, parsedFields);
      }
    }
  });
  
  console.log("GrayTool: Final fields for row:", fields);
  appendButtonsToLogRow(row, fields, cachedButtons, cachedAdminBaseUrl);
  row.dataset.buttonsInjected = "true";
}

function processMessageDetail(detail) {
  const fields = {};
  
  // Mesaj detaylarından field'ları çıkar
  detail.querySelectorAll("[data-field], .field-content").forEach(el => {
    const fieldName = el.dataset.field || el.className.replace("field-content", "").trim();
    if (fieldName) {
      fields[fieldName] = el.innerText.trim();
    }
  });
  
  // JSON mesajları parse et
  const messageElement = detail.querySelector(".message-body, .message-content, [data-testid*='message']");
  if (messageElement && messageElement.innerText) {
    try {
      const messageText = messageElement.innerText.trim();
      if (messageText.startsWith("{") && messageText.endsWith("}")) {
        const parsed = JSON.parse(messageText);
        // Only assign string/number values, ignore complex objects
        Object.entries(parsed).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            fields[key] = String(value);
          }
        });
      } else {
        const parsedFields = parseKeyValuePairs(messageText);
        Object.assign(fields, parsedFields);
      }
    } catch (e) {
      // JSON parsing failed, fallback to key-value parsing
      const parsedFields = parseKeyValuePairs(messageElement.innerText.trim());
      Object.assign(fields, parsedFields);
    }
  }
  
  appendButtonsToLogRow(detail, fields, cachedButtons, cachedAdminBaseUrl);
  detail.dataset.buttonsInjected = "true";
}

// Monitor log rows for changes
const observer = new MutationObserver(() => {
  // Chrome extension context kontrolü
  if (!chrome || !chrome.storage || !chrome.runtime || chrome.runtime.lastError) {
    console.log("GrayTool: Extension context invalidated, stopping observer");
    observer.disconnect();
    return;
  }

  // Config henüz yüklenmemişse bekle
  if (!configInitialized) {
    return;
  }

  // Log tablo satırları
  const logRows = document.querySelectorAll(".table tr, .log-row");
  
  // Mesaj detay sayfaları (buton grupları burada)
  const messageDetails = document.querySelectorAll(".message-detail, .message-details");
  
  try {
    // Normal log satırlarını işle
    logRows.forEach(row => {
      if (row.dataset.buttonsInjected) return;
      processLogRow(row);
    });
    
    // Mesaj detay sayfalarını işle
    messageDetails.forEach(detail => {
      if (detail.dataset.buttonsInjected) return;
      processMessageDetail(detail);
    });
  } catch (error) {
    console.error("GrayTool: Processing error:", error);
  }
});

// Listen for storage changes to update config
if (chrome && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes.buttons || changes.adminBaseUrl || changes.environments)) {
      console.log("GrayTool: Storage changed, reinitializing config");
      configInitialized = false;
      initializeConfig();
    }
  });
}

// Debug function to check current state
function debugCurrentState() {
  console.log("=== GrayTool Debug Info ===");
  console.log("Config Initialized:", configInitialized);
  console.log("Cached Buttons:", cachedButtons);
  console.log("Cached Admin Base URL:", cachedAdminBaseUrl);
  console.log("Chrome APIs available:", !!(chrome && chrome.storage && chrome.runtime));
  
  const logRows = document.querySelectorAll(".table tr, .log-row");
  const messageDetails = document.querySelectorAll(".message-detail, .message-details");
  
  console.log("Found log rows:", logRows.length);
  console.log("Found message details:", messageDetails.length);
  
  // Check if any rows already have buttons injected
  const injectedRows = document.querySelectorAll("[data-buttons-injected='true']");
  console.log("Rows with buttons already injected:", injectedRows.length);
  
  console.log("=== End Debug Info ===");
}

// Make debug function available globally for testing
window.debugGrayTool = debugCurrentState;

// Initialize configuration on page load
initializeConfig();

// Chrome extension API'lerinin mevcut olup olmadığını kontrol et
if (chrome && chrome.storage && chrome.runtime) {
  observer.observe(document.body, { childList: true, subtree: true });
  console.log("GrayTool: Content script loaded successfully");
} else {
  console.error("GrayTool: Chrome extension APIs not available");
}
