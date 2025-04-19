// 监听来自背景脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);
  
  if (message.action === "fillPassword") {
    // 获取当前选中/右键点击的输入框
    const activeElement = document.activeElement;
    
    // 如果当前有选中的元素，并且是密码输入框或明文显示的密码框，则填充密码
    if (activeElement && (activeElement.type === "password" || isProbablyPasswordField(activeElement))) {
      fillPasswordIntoField(activeElement, message.password);
      sendResponse({ success: true, element: "activeElement" });
    } else {
      // 如果没有选中的密码输入框，则尝试查找页面上的所有密码输入框
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      
      // 如果找到了密码输入框，则填充第一个
      if (passwordInputs.length > 0) {
        fillPasswordIntoField(passwordInputs[0], message.password);
        sendResponse({ success: true, element: "firstPasswordInput" });
      } else {
        // 尝试查找可能是显示状态的密码输入框
        const possiblePasswordFields = findPossiblePasswordFields();
        if (possiblePasswordFields.length > 0) {
          fillPasswordIntoField(possiblePasswordFields[0], message.password);
          sendResponse({ success: true, element: "possiblePasswordField" });
        } else {
          console.log("没有找到密码输入框");
          showNotification(chrome.i18n.getMessage("noPasswordFieldFound"));
          sendResponse({ success: false, reason: "noPasswordField" });
        }
      }
    }
  } else if (message.action === "showNotification") {
    // 显示通知消息
    showNotification(message.message);
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false, reason: "unknownAction" });
  }
  
  // 返回true以支持异步响应
  return true;
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

// 检查一个text类型的输入框是否可能是密码字段
function isProbablyPasswordField(element) {
  if (element.type !== "text") return false;
  
  // 检查常见的密码相关属性
  const passwordPatterns = getPasswordPatterns();
  const elName = (element.name || '').toLowerCase();
  const elId = (element.id || '').toLowerCase();
  const elClasses = (element.className || '').toLowerCase();
  const elPlaceholder = (element.placeholder || '').toLowerCase();
  const elAutocomplete = (element.getAttribute('autocomplete') || '').toLowerCase();
  
  // 检查元素的name、id、class、placeholder或autocomplete是否包含密码相关的关键词
  for (const pattern of passwordPatterns) {
    if (elName.includes(pattern) || 
        elId.includes(pattern) || 
        elClasses.includes(pattern) || 
        elPlaceholder.includes(pattern) ||
        elAutocomplete === 'current-password' ||
        elAutocomplete === 'new-password') {
      return true;
    }
  }
  
  // 检查是否有显示密码相关的元素在附近（如眼睛图标按钮）
  const parent = element.parentElement;
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
      return true;
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
          return true;
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
          return true;
        }
      }
    }
  }
  
  // 查找关联的label元素
  if (element.id) {
    const associatedLabel = document.querySelector(`label[for="${element.id}"]`);
    if (associatedLabel) {
      const labelText = associatedLabel.textContent.toLowerCase();
      for (const pattern of passwordPatterns) {
        if (labelText.includes(pattern)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 查找可能是显示状态的密码输入框
function findPossiblePasswordFields() {
  const textInputs = document.querySelectorAll('input[type="text"]');
  return Array.from(textInputs).filter(isProbablyPasswordField);
}

// 填充密码到输入框并复制到剪贴板
function fillPasswordIntoField(inputField, password) {
  // 填充密码
  inputField.value = password;
  
  // 触发input事件，确保表单验证能够捕获到值的变化
  const inputEvent = new Event('input', { bubbles: true });
  inputField.dispatchEvent(inputEvent);
  
  // 可能还需要触发change事件
  const changeEvent = new Event('change', { bubbles: true });
  inputField.dispatchEvent(changeEvent);
  
  // 复制密码到剪贴板
  try {
    navigator.clipboard.writeText(password)
      .then(() => {
        // 显示复制成功的提示
        showNotification(chrome.i18n.getMessage("passwordGeneratedAndCopied"));
      })
      .catch(err => {
        console.error("复制到剪贴板失败: ", err);
        showNotification(chrome.i18n.getMessage("passwordGeneratedCopyFailed"));
      });
  } catch (error) {
    console.error("复制到剪贴板操作异常: ", error);
    showNotification(chrome.i18n.getMessage("clipboardOperationFailed"));
  }
    
  // 尝试查找并填充确认密码字段
  tryFillConfirmPasswordField(inputField, password);
}

// 尝试查找并填充确认密码字段
function tryFillConfirmPasswordField(passwordField, password) {
  // 常见的确认密码字段ID和名称
  const confirmPasswordPatterns = [
    'confirmPassword', 'confirm_password', 'password_confirm', 
    'passwordConfirm', 'password2', 'pwd2', 'pass2', 
    'verify_password', 'verifyPassword'
  ];
  
  // 尝试在当前表单中查找确认密码字段
  if (passwordField.form) {
    const form = passwordField.form;
    const inputs = form.querySelectorAll('input[type="password"]');
    
    // 排除当前密码字段
    for (let input of inputs) {
      if (input === passwordField) continue;
      
      // 检查字段是否匹配确认密码模式
      const name = input.name ? input.name.toLowerCase() : '';
      const id = input.id ? input.id.toLowerCase() : '';
      
      for (let pattern of confirmPasswordPatterns) {
        if (name.includes(pattern) || id.includes(pattern)) {
          // 填充确认密码字段
          input.value = password;
          const inputEvent = new Event('input', { bubbles: true });
          input.dispatchEvent(inputEvent);
          const changeEvent = new Event('change', { bubbles: true });
          input.dispatchEvent(changeEvent);
          return;
        }
      }
      
      // 如果没有找到匹配的模式，但表单只有两个密码字段，
      // 假设第二个就是确认密码字段
      if (inputs.length === 2) {
        inputs[1].value = password;
        const inputEvent = new Event('input', { bubbles: true });
        inputs[1].dispatchEvent(inputEvent);
        const changeEvent = new Event('change', { bubbles: true });
        inputs[1].dispatchEvent(changeEvent);
      }
    }
  }
}

// 显示通知
function showNotification(message) {
  // 检查是否已存在通知元素
  let notification = document.getElementById('password-generator-notification');
  
  if (!notification) {
    // 创建通知元素
    notification = document.createElement('div');
    notification.id = 'password-generator-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-family: Arial, sans-serif;
      font-size: 14px;
      transition: opacity 0.3s;
      opacity: 0;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      max-width: 300px;
    `;
    document.body.appendChild(notification);
  }
  
  // 设置消息内容
  notification.textContent = message;
  
  // 显示通知
  notification.style.opacity = '1';
  
  // 3秒后隐藏通知
  setTimeout(() => {
    notification.style.opacity = '0';
    
    // 完全隐藏后移除元素
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
} 