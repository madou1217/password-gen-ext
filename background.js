// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generatePassword",
    title: "生成随机密码",
    contexts: ["editable"],
    documentUrlPatterns: ["<all_urls>"]
  });
  
  // 初始化用户设置（如果不存在）
  chrome.storage.local.get(['passwordSettings'], function(result) {
    if (!result.passwordSettings) {
      chrome.storage.local.set({
        passwordSettings: {
          length: 8,
          useNumbers: true,
          useLowercase: true,
          useUppercase: true,
          useSymbols: true,
          excludeChars: ""
        }
      });
    }
  });
});

// 获取密码关键词列表（从i18n或使用默认值）
function getPasswordPatterns() {
  try {
    // 尝试从i18n获取密码关键词
    const patterns = chrome.i18n.getMessage("passwordPatterns");
    if (patterns) {
      return patterns.split(",");
    }
  } catch (error) {
    console.error("获取i18n密码关键词失败:", error);
  }
  
  // 如果没有i18n或获取失败，使用默认值
  return ['password', 'passwd', 'pwd', 'pass', '密码', 'passcode', '口令', '暗码', '密匙', '验证码'];
}

// 将全角字符转换为半角字符
function convertToHalfWidth(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // 全角字符范围大致是从65281到65374，对应的半角从33到126
    if (charCode >= 65281 && charCode <= 65374) {
      result += String.fromCharCode(charCode - 65248);
    } else if (charCode === 12288) { // 全角空格
      result += ' ';
    } else {
      result += text[i];
    }
  }
  return result;
}

// 移除重复字符
function removeDuplicateChars(text) {
  return [...new Set(text)].join('');
}

// 生成随机密码
function generateRandomPassword(options = {}) {
  // 获取选项，使用默认值
  const length = options.length || 8;
  const useNumbers = options.useNumbers !== undefined ? options.useNumbers : true;
  const useLowercase = options.useLowercase !== undefined ? options.useLowercase : true;
  const useUppercase = options.useUppercase !== undefined ? options.useUppercase : true;
  const useSymbols = options.useSymbols !== undefined ? options.useSymbols : true;
  let excludeChars = options.excludeChars || '';
  
  // 确保排除字符是半角
  excludeChars = convertToHalfWidth(excludeChars);
  // 去重
  excludeChars = removeDuplicateChars(excludeChars);
  
  // 准备字符集
  let charset = '';
  const numbers = "0123456789";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
  
  if (useNumbers) charset += numbers;
  if (useLowercase) charset += lowercase;
  if (useUppercase) charset += uppercase;
  if (useSymbols) charset += symbols;
  
  // 排除指定字符
  if (excludeChars) {
    // 创建一个新的字符集，不包含排除的字符
    let filteredCharset = '';
    for (let i = 0; i < charset.length; i++) {
      if (!excludeChars.includes(charset[i])) {
        filteredCharset += charset[i];
      }
    }
    charset = filteredCharset;
  }
  
  // 如果没有选择任何字符集，使用默认值
  if (!charset) {
    charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    // 再次应用排除字符
    if (excludeChars) {
      let filteredCharset = '';
      for (let i = 0; i < charset.length; i++) {
        if (!excludeChars.includes(charset[i])) {
          filteredCharset += charset[i];
        }
      }
      charset = filteredCharset;
    }
  }
  
  if (charset.length === 0) {
    console.error("排除字符过多，无法生成密码");
    return "";
  }
  
  let password = "";
  
  // 确保密码包含至少一个从每种选择的字符类型
  if (useNumbers && !password.includes(numbers) && password.length < length) {
    // 获取未被排除的数字
    const availableNumbers = numbers.split('').filter(char => !excludeChars.includes(char));
    if (availableNumbers.length > 0) {
      password += availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    }
  }
  
  if (useLowercase && !password.includes(lowercase) && password.length < length) {
    // 获取未被排除的小写字母
    const availableLowercase = lowercase.split('').filter(char => !excludeChars.includes(char));
    if (availableLowercase.length > 0) {
      password += availableLowercase[Math.floor(Math.random() * availableLowercase.length)];
    }
  }
  
  if (useUppercase && !password.includes(uppercase) && password.length < length) {
    // 获取未被排除的大写字母
    const availableUppercase = uppercase.split('').filter(char => !excludeChars.includes(char));
    if (availableUppercase.length > 0) {
      password += availableUppercase[Math.floor(Math.random() * availableUppercase.length)];
    }
  }
  
  if (useSymbols && !password.includes(symbols) && password.length < length) {
    // 获取未被排除的特殊字符
    const availableSymbols = symbols.split('').filter(char => !excludeChars.includes(char));
    if (availableSymbols.length > 0) {
      password += availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
    }
  }
  
  // 生成剩余的密码字符
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // 打乱密码字符顺序
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// 保存密码到历史记录
function savePasswordToHistory(password, tabInfo) {
  if (!tabInfo || !tabInfo.url) return;
  
  try {
    const url = new URL(tabInfo.url);
    const domain = url.hostname;
    const timestamp = new Date().toISOString();
    const favicon = tabInfo.favIconUrl || '';
    
    // 获取现有历史记录
    chrome.storage.local.get(['passwordHistory'], function(result) {
      let history = result.passwordHistory || [];
      
      // 检查是否已存在相同域名和密码的记录
      const isDuplicate = history.some(item => 
        item.domain === domain && item.password === password
      );
      
      // 如果不是重复记录，才添加
      if (!isDuplicate) {
        // 添加新记录
        history.unshift({
          domain: domain,
          url: tabInfo.url,
          password: password,
          timestamp: timestamp,
          favicon: favicon
        });
        
        // 限制历史记录数量
        if (history.length > 100) {
          history = history.slice(0, 100);
        }
        
        // 保存历史记录
        chrome.storage.local.set({passwordHistory: history});
      } else {
        console.log('跳过重复密码记录');
        
        // 找到现有记录的索引
        const existingIndex = history.findIndex(item => 
          item.domain === domain && item.password === password
        );
        
        // 如果找到了记录并且不在首位，将它移到首位并更新时间戳
        if (existingIndex > 0) {
          const existingRecord = history[existingIndex];
          // 更新时间戳
          existingRecord.timestamp = timestamp;
          // 从当前位置移除
          history.splice(existingIndex, 1);
          // 添加到开头
          history.unshift(existingRecord);
          
          // 保存更新后的历史记录
          chrome.storage.local.set({passwordHistory: history});
        }
      }
    });
  } catch (e) {
    console.error('保存历史记录失败:', e);
  }
}

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generatePassword") {
    // 检查被点击的元素是否为密码输入框，或可能是已切换为显示状态的密码输入框
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => {
        // 获取密码关键词列表
        function getPasswordPatternsInContent() {
          try {
            // 尝试从i18n获取密码关键词
            const patterns = chrome.i18n.getMessage("passwordPatterns");
            if (patterns) {
              return patterns.split(",");
            }
          } catch (error) {
            console.error("获取i18n密码关键词失败:", error);
          }
          
          // 如果没有i18n或获取失败，使用默认值
          return ['password', 'passwd', 'pwd', 'pass', '密码', 'passcode', '口令', '暗码', '密匙', '验证码'];
        }
        
        const el = document.activeElement;
        // 检查当前元素是否为密码字段或可能是已切换为显示状态的密码字段
        if (el && el.type === "password") {
          return { isPassword: true, type: "password" };
        }
        
        // 检查是否为一个已切换为显示状态的密码字段
        // 常见密码字段的属性和特征
        if (el && el.type === "text") {
          // 检查元素的name、id、class、或data属性是否包含密码相关的关键词
          const passwordPatterns = getPasswordPatternsInContent();
          const elName = (el.name || '').toLowerCase();
          const elId = (el.id || '').toLowerCase();
          const elClasses = (el.className || '').toLowerCase();
          const dataAttrs = Object.keys(el.dataset || {}).join(' ').toLowerCase();
          const elPlaceholder = (el.placeholder || '').toLowerCase();
          const elAutocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();
          
          // 检查是否有密码相关的属性
          for (const pattern of passwordPatterns) {
            if (elName.includes(pattern) || 
                elId.includes(pattern) || 
                elClasses.includes(pattern) || 
                dataAttrs.includes(pattern) ||
                elPlaceholder.includes(pattern) ||
                elAutocomplete === 'current-password' ||
                elAutocomplete === 'new-password') {
              return { isPassword: true, type: "text" };
            }
          }
          
          // 检查是否有显示密码相关的元素在附近（如眼睛图标按钮）
          const parent = el.parentElement;
          if (parent) {
            // 扩展眼睛图标选择器以支持更多前端框架和常见命名模式
            const eyeIconSelectors = [
              // 通用图标库的眼睛图标
              'i.fa-eye', 'i.fa-eye-slash', 'i.fa-fw', 'span.fa-eye', 'span.fa-eye-slash',
              'i.icon-eye', 'i.icon-eye-open', 'i.icon-eye-close', 'i.icon-eye-slash',
              'svg[class*="eye"]', 'svg[class*="Eye"]',
              
              // 通用类名
              '.eye-icon', '.eyeIcon', '.toggle-password', '.togglePassword', 
              '.show-password', '.showPassword', '.hide-password', '.hidePassword',
              '.password-toggle', '.passwordToggle', '.visibility-toggle', '.visibilityToggle',
              '.pwd-toggle', '.pwdToggle', '[class*="password-toggle"]', '[class*="passwordToggle"]', 
              
              // 特定框架的类名
              '.el-input__suffix-inner', // Element UI
              '.ant-input-suffix', // Ant Design
              '.v-input__append-inner', // Vuetify
              '.MuiInputAdornment-root', // Material-UI
              '.input-group-append', // Bootstrap
              '.input-password-toggle', // Tailwind UI & others
              
              // 常见属性
              '[data-password-toggle]', '[data-toggle="password"]', '[data-toggle="visibility"]',
              '[aria-label*="password"]', '[aria-label*="Password"]',
              '[title*="password"]', '[title*="Password"]',
              
              // 图片和其他元素
              'img[src*="eye"]', 'img[alt*="password"]', 'img[alt*="Password"]',
              'button[aria-label*="password"]', 'button[aria-label*="Password"]',
              
              // 常见中文类名和属性
              '[class*="密码"]', '[title*="密码"]', '[aria-label*="密码"]',
              '.密码可见', '.密码切换', '.显示密码', '.隐藏密码'
            ];
            
            const eyeIconEls = parent.querySelectorAll(eyeIconSelectors.join(', '));
            if (eyeIconEls.length > 0) {
              return { isPassword: true, type: "text" };
            }
            
            // 检查祖先元素中是否有密码相关的类名（最多向上检查3层）
            let ancestor = parent;
            let depth = 0;
            const passwordContainerClasses = [
              'password-field', 'passwordField', 'password-input', 'passwordInput',
              'pwd-field', 'pwdField', 'pwd-input', 'pwdInput',
              'form-group-password', 'input-password',
              'el-input-password', 'ant-input-password', 'v-input-password',
              'MuiInput-password', 'input-group-password',
              '密码输入框', '密码字段', '密码区域'
            ];
            
            while (ancestor && depth < 3) {
              for (const cls of passwordContainerClasses) {
                if (ancestor.className && 
                    (ancestor.className.includes(cls) || 
                     ancestor.className.toLowerCase().includes('password'))) {
                  return { isPassword: true, type: "text" };
                }
              }
              ancestor = ancestor.parentElement;
              depth++;
            }
            
            // 检查周围的标签文本是否包含密码相关文字
            const labels = parent.querySelectorAll('label');
            for (const label of labels) {
              const labelText = label.textContent.toLowerCase();
              for (const pattern of passwordPatterns) {
                if (labelText.includes(pattern)) {
                  return { isPassword: true, type: "text" };
                }
              }
            }
          }
          
          // 查找关联的label元素
          if (el.id) {
            const associatedLabel = document.querySelector(`label[for="${el.id}"]`);
            if (associatedLabel) {
              const labelText = associatedLabel.textContent.toLowerCase();
              for (const pattern of passwordPatterns) {
                if (labelText.includes(pattern)) {
                  return { isPassword: true, type: "text" };
                }
              }
            }
          }
        }
        
        return { isPassword: false };
      }
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      
      const result = results && results[0] && results[0].result;
      const isPasswordField = result && result.isPassword;
      
      // 如果是密码输入框（包括显示状态的密码框），生成密码
      if (isPasswordField) {
        // 获取用户设置
        chrome.storage.local.get(['passwordSettings'], function(result) {
          const settings = result.passwordSettings || {
            length: 8,
            useNumbers: true,
            useLowercase: true,
            useUppercase: true,
            useSymbols: true,
            excludeChars: ""
          };
          
          // 处理排除字符
          settings.excludeChars = convertToHalfWidth(settings.excludeChars);
          settings.excludeChars = removeDuplicateChars(settings.excludeChars);
          
          const password = generateRandomPassword(settings);
          
          if (password) {
            // 向当前活动标签页发送消息，填充密码
            // 添加错误处理，捕获"接收端不存在"的错误
            try {
              chrome.tabs.sendMessage(tab.id, {
                action: "fillPassword",
                password: password
              }, response => {
                if (chrome.runtime.lastError) {
                  console.error("发送消息错误:", chrome.runtime.lastError.message);
                  // 尝试注入内容脚本并重新发送消息
                  injectContentScriptAndSendMessage(tab.id, password);
                  return;
                }
                
                // 保存到历史记录
                savePasswordToHistory(password, tab);
              });
            } catch (error) {
              console.error("发送消息异常:", error);
              // 尝试注入内容脚本并重新发送消息
              injectContentScriptAndSendMessage(tab.id, password);
            }
          } else {
            // 通知用户生成密码失败
            try {
              chrome.tabs.sendMessage(tab.id, {
                action: "showNotification",
                message: "生成密码失败，排除字符过多或设置有误"
              });
            } catch (error) {
              console.error("发送消息异常:", error);
            }
          }
        });
      } else {
        // 如果不是密码输入框，提示用户
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: "showNotification",
            message: "请在密码输入框上右键点击使用此功能"
          });
        } catch (error) {
          console.error("发送消息异常:", error);
        }
      }
    });
  }
});

// 新增：注入内容脚本并重新发送消息的函数
function injectContentScriptAndSendMessage(tabId, password) {
  chrome.scripting.executeScript({
    target: {tabId: tabId},
    files: ['content.js']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("注入脚本错误:", chrome.runtime.lastError.message);
      return;
    }
    
    // 短暂延迟后重新发送消息，确保内容脚本已加载
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        action: "fillPassword",
        password: password
      }, response => {
        if (chrome.runtime.lastError) {
          console.error("重新发送消息错误:", chrome.runtime.lastError.message);
        } else {
          // 保存到历史记录
          chrome.tabs.get(tabId, tab => {
            if (chrome.runtime.lastError) {
              console.error("获取标签页信息错误:", chrome.runtime.lastError.message);
            } else {
              savePasswordToHistory(password, tab);
            }
          });
        }
      });
    }, 100);
  });
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 保存设置
  if (message.action === "saveSettings") {
    // 处理排除字符
    message.settings.excludeChars = convertToHalfWidth(message.settings.excludeChars);
    message.settings.excludeChars = removeDuplicateChars(message.settings.excludeChars);
    
    chrome.storage.local.set({passwordSettings: message.settings}, function() {
      sendResponse({success: true});
    });
    return true; // 表示会异步发送响应
  }
  
  // 获取设置
  if (message.action === "getSettings") {
    chrome.storage.local.get(['passwordSettings'], function(result) {
      sendResponse({
        settings: result.passwordSettings || {
          length: 8,
          useNumbers: true,
          useLowercase: true,
          useUppercase: true,
          useSymbols: true,
          excludeChars: ""
        }
      });
    });
    return true; // 表示会异步发送响应
  }
}); 