document.addEventListener('DOMContentLoaded', function() {
  // UI元素
  const passwordInput = document.getElementById('password');
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const passwordLengthInput = document.getElementById('passwordLength');
  const passwordLengthSlider = document.getElementById('passwordLengthSlider');
  const excludeCharsInput = document.getElementById('excludeChars');
  const useNumbersCheckbox = document.getElementById('useNumbers');
  const useLowercaseCheckbox = document.getElementById('useLowercase');
  const useUppercaseCheckbox = document.getElementById('useUppercase');
  const useSymbolsCheckbox = document.getElementById('useSymbols');
  const toggleAllPasswordsBtn = document.getElementById('toggleAllPasswordsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');
  const notification = document.getElementById('notification');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const strengthMeter = document.getElementById('strengthMeter');
  const strengthText = document.getElementById('strengthText');
  
  // 全局变量
  let allPasswordsVisible = false;

  // 同步密码长度输入框和滑块
  passwordLengthInput.addEventListener('input', function() {
    passwordLengthSlider.value = this.value;
  });
  
  passwordLengthSlider.addEventListener('input', function() {
    passwordLengthInput.value = this.value;
  });
  
  // 处理排除字符输入，自动去重和转换为半角字符
  excludeCharsInput.addEventListener('input', function() {
    // 转换为半角字符
    let halfWidthText = convertToHalfWidth(this.value);
    
    // 去重
    halfWidthText = removeDuplicateChars(halfWidthText);
    
    // 更新输入框值
    if (halfWidthText !== this.value) {
      this.value = halfWidthText;
    }
  });
  
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
  
  // 选项卡切换
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const tabId = `${tab.dataset.tab}-tab`;
      document.getElementById(tabId).classList.add('active');
      
      // 如果切换到历史记录，重新加载记录
      if (tab.dataset.tab === 'history') {
        // 重置密码可见状态
        allPasswordsVisible = false;
        toggleAllPasswordsBtn.innerHTML = '<i class="fas fa-eye"></i> 全部显示';
        
        // 加载历史记录
        loadPasswordHistory();
      }
    });
  });
  
  // 生成随机密码
  function generateRandomPassword(options = {}) {
    // 默认值
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
      showNotification("错误：排除字符过多，无法生成密码");
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
  
  // 计算密码强度
  function calculatePasswordStrength(password) {
    if (!password) return { score: 0, label: "无" };
    
    let score = 0;
    const length = password.length;
    
    // 长度评分
    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    
    // 复杂性评分
    const hasNumbers = /\d/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSymbols = /[^a-zA-Z0-9]/.test(password);
    
    if (hasNumbers) score += 1;
    if (hasLowerCase) score += 1;
    if (hasUpperCase) score += 1;
    if (hasSymbols) score += 1;
    
    // 评分标准
    let label = "";
    let percentage = 0;
    
    if (score <= 2) {
      label = "弱";
      percentage = 25;
    } else if (score <= 4) {
      label = "中";
      percentage = 50;
    } else if (score <= 6) {
      label = "强";
      percentage = 75;
    } else {
      label = "非常强";
      percentage = 100;
    }
    
    return { score, label, percentage, hasNumbers, hasLowerCase, hasUpperCase, hasSymbols };
  }
  
  // 更新密码强度指示器
  function updateStrengthIndicator(password) {
    const strength = calculatePasswordStrength(password);
    
    // 更新强度条
    strengthMeter.style.width = `${strength.percentage}%`;
    strengthMeter.className = 'strength-meter';
    
    if (strength.percentage <= 25) {
      strengthMeter.classList.add('weak');
    } else if (strength.percentage <= 50) {
      strengthMeter.classList.add('medium');
    } else if (strength.percentage <= 75) {
      strengthMeter.classList.add('strong');
    } else {
      strengthMeter.classList.add('very-strong');
    }
    
    // 更新强度文本
    strengthText.textContent = `密码强度: ${strength.label}`;
  }
  
  // 生成密码按钮点击事件
  generateBtn.addEventListener('click', function() {
    const options = {
      length: parseInt(passwordLengthInput.value, 10),
      useNumbers: useNumbersCheckbox.checked,
      useLowercase: useLowercaseCheckbox.checked,
      useUppercase: useUppercaseCheckbox.checked,
      useSymbols: useSymbolsCheckbox.checked,
      excludeChars: excludeCharsInput.value
    };
    
    const password = generateRandomPassword(options);
    
    if (password) {
      passwordInput.value = password;
      // 更新密码强度指示器
      updateStrengthIndicator(password);
    }
  });
  
  // 复制密码按钮点击事件
  copyBtn.addEventListener('click', function() {
    if (passwordInput.value) {
      // 复制到剪贴板
      copyToClipboard(passwordInput.value);
      
      // 显示通知
      showNotification("密码已复制到剪贴板");
      
      // 保存到历史记录（仅在页面内有限度使用）
      savePasswordToHistory(passwordInput.value);
    }
  });
  
  // 全部显示/隐藏密码按钮点击事件
  toggleAllPasswordsBtn.addEventListener('click', function() {
    allPasswordsVisible = !allPasswordsVisible;
    
    if (allPasswordsVisible) {
      this.innerHTML = '<i class="fas fa-eye-slash"></i> 全部隐藏';
      document.querySelectorAll('.password-mask').forEach(span => {
        const passwordBtn = span.closest('.password-value').querySelector('.toggle-history-password');
        if (passwordBtn) {
          const password = passwordBtn.dataset.password;
          span.textContent = password;
          passwordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        }
      });
    } else {
      this.innerHTML = '<i class="fas fa-eye"></i> 全部显示';
      document.querySelectorAll('.password-mask').forEach(span => {
        const passwordBtn = span.closest('.password-value').querySelector('.toggle-history-password');
        if (passwordBtn) {
          span.textContent = '••••••••••••';
          passwordBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
      });
    }
  });
  
  // 复制文本到剪贴板
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
      .then(() => {
        copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
        }, 1500);
      })
      .catch(err => {
        console.error('复制失败:', err);
        showNotification("复制失败，请手动复制");
      });
  }
  
  // 显示通知
  function showNotification(message, duration = 2000) {
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, duration);
  }
  
  // 保存密码到历史记录
  function savePasswordToHistory(password) {
    // 获取当前标签页的URL
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        const tab = tabs[0];
        const url = new URL(tab.url);
        const domain = url.hostname;
        const timestamp = new Date().toISOString();
        const favicon = tab.favIconUrl || '';
        
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
              url: tab.url,
              password: password,
              timestamp: timestamp,
              favicon: favicon
            });
            
            // 限制历史记录数量
            if (history.length > 100) {
              history = history.slice(0, 100);
            }
            
            // 保存历史记录
            chrome.storage.local.set({passwordHistory: history}, function() {
              console.log('密码已保存到历史记录');
            });
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
              chrome.storage.local.set({passwordHistory: history}, function() {
                console.log('已更新重复密码记录的时间戳并移至首位');
              });
            }
          }
        });
      }
    });
  }
  
  // 加载密码历史记录
  function loadPasswordHistory() {
    // 重置密码可见状态
    allPasswordsVisible = false;
    toggleAllPasswordsBtn.innerHTML = '<i class="fas fa-eye"></i> 全部显示';
    
    chrome.storage.local.get(['passwordHistory'], function(result) {
      const history = result.passwordHistory || [];
      
      if (history.length === 0) {
        historyList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-history"></i>
            <p>暂无历史记录</p>
          </div>
        `;
        return;
      }
      
      // 按网站分组历史记录
      const groupedHistory = {};
      history.forEach(item => {
        if (!groupedHistory[item.domain]) {
          groupedHistory[item.domain] = [];
        }
        groupedHistory[item.domain].push(item);
      });
      
      // 构建历史记录HTML
      let historyHTML = '';
      for (const domain in groupedHistory) {
        const items = groupedHistory[domain];
        const favicon = items[0].favicon ? 
          `<img src="${items[0].favicon}" width="16" height="16" style="margin-right: 4px;">` : 
          '<i class="fas fa-globe" style="margin-right: 4px;"></i>';
        
        historyHTML += `
          <div class="history-item" data-domain="${domain}">
            <div class="site-info">
              <div class="site-domain">${favicon}${domain}</div>
              <div class="timestamp">${formatDate(new Date(items[0].timestamp))}</div>
            </div>
        `;
        
        // 显示前3条记录
        for (let i = 0; i < Math.min(3, items.length); i++) {
          const item = items[i];
          historyHTML += createPasswordEntryHTML(item, i);
        }
        
        // 如果有更多记录，添加"展开更多"按钮
        if (items.length > 3) {
          historyHTML += `
            <div class="hidden-records" data-domain="${domain}">
              <i class="fas fa-chevron-down"></i> 还有 ${items.length - 3} 条记录，点击展开
            </div>
            <div class="more-records" style="display: none;" data-domain="${domain}">
            </div>
          `;
        }
        
        historyHTML += `</div>`;
      }
      
      historyList.innerHTML = historyHTML;
      
      // 添加历史记录密码的事件监听
      addPasswordEntryListeners();
      
      // 添加"展开更多"按钮的事件监听
      document.querySelectorAll('.hidden-records').forEach(btn => {
        btn.addEventListener('click', function() {
          const domain = this.dataset.domain;
          const moreRecordsContainer = document.querySelector(`.more-records[data-domain="${domain}"]`);
          
          // 如果已经加载了更多记录，则直接显示/隐藏
          if (moreRecordsContainer.innerHTML.trim()) {
            if (moreRecordsContainer.style.display === 'none') {
              moreRecordsContainer.style.display = 'block';
              this.innerHTML = `<i class="fas fa-chevron-up"></i> 点击收起`;
            } else {
              moreRecordsContainer.style.display = 'none';
              this.innerHTML = `<i class="fas fa-chevron-down"></i> 还有 ${groupedHistory[domain].length - 3} 条记录，点击展开`;
            }
            return;
          }
          
          // 加载更多记录
          let moreHTML = '';
          for (let i = 3; i < groupedHistory[domain].length; i++) {
            const item = groupedHistory[domain][i];
            moreHTML += createPasswordEntryHTML(item, i);
          }
          
          moreRecordsContainer.innerHTML = moreHTML;
          moreRecordsContainer.style.display = 'block';
          this.innerHTML = `<i class="fas fa-chevron-up"></i> 点击收起`;
          
          // 添加新加载的密码条目的事件监听
          addPasswordEntryListeners();
          
          // 如果当前是全部可见状态，则显示所有密码
          if (allPasswordsVisible) {
            moreRecordsContainer.querySelectorAll('.password-mask').forEach(span => {
              const passwordBtn = span.closest('.password-value').querySelector('.toggle-history-password');
              if (passwordBtn) {
                const password = passwordBtn.dataset.password;
                span.textContent = password;
                passwordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
              }
            });
          }
        });
      });
    });
  }
  
  // 创建密码条目HTML
  function createPasswordEntryHTML(item, index) {
    return `
      <div class="password-value">
        <span class="password-mask">••••••••••••</span>
        <div class="password-actions">
          <button class="small-btn toggle-history-password" data-password="${item.password}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="small-btn copy-history-password" data-password="${item.password}">
            <i class="fas fa-copy"></i>
          </button>
        </div>
      </div>
    `;
  }
  
  // 添加密码条目的事件监听
  function addPasswordEntryListeners() {
    document.querySelectorAll('.toggle-history-password').forEach(btn => {
      btn.addEventListener('click', function() {
        const passwordSpan = this.closest('.password-value').querySelector('.password-mask');
        const password = this.dataset.password;
        
        if (passwordSpan.textContent === '••••••••••••') {
          passwordSpan.textContent = password;
          this.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
          passwordSpan.textContent = '••••••••••••';
          this.innerHTML = '<i class="fas fa-eye"></i>';
        }
      });
    });
    
    document.querySelectorAll('.copy-history-password').forEach(btn => {
      btn.addEventListener('click', function() {
        copyToClipboard(this.dataset.password);
        showNotification("密码已复制到剪贴板");
      });
    });
  }
  
  // 清空历史记录
  clearHistoryBtn.addEventListener('click', function() {
    if (confirm('确定要清空所有密码历史记录吗？此操作不可撤销。')) {
      chrome.storage.local.remove(['passwordHistory'], function() {
        showNotification('所有密码历史记录已清空');
        loadPasswordHistory();
      });
    }
  });
  
  // 导出密码历史记录
  exportBtn.addEventListener('click', function() {
    chrome.storage.local.get(['passwordHistory'], function(result) {
      const history = result.passwordHistory || [];
      
      if (history.length === 0) {
        showNotification("没有历史记录可导出");
        return;
      }
      
      // 格式化为CSV
      let csv = "domain,url,password,timestamp\n";
      history.forEach(item => {
        csv += `"${item.domain}","${item.url}","${item.password}","${item.timestamp}"\n`;
      });
      
      // 创建下载链接
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `password_history_${formatDate(new Date())}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification("历史记录已导出");
    });
  });
  
  // 格式化日期
  function formatDate(date) {
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  }
  
  function padZero(num) {
    return num.toString().padStart(2, '0');
  }
  
  // 页面加载时自动生成一个密码并加载历史记录
  const options = {
    length: parseInt(passwordLengthInput.value, 10),
    useNumbers: useNumbersCheckbox.checked,
    useLowercase: useLowercaseCheckbox.checked,
    useUppercase: useUppercaseCheckbox.checked,
    useSymbols: useSymbolsCheckbox.checked,
    excludeChars: excludeCharsInput.value
  };
  
  const initialPassword = generateRandomPassword(options);
  passwordInput.value = initialPassword;
  updateStrengthIndicator(initialPassword);
  
  // 添加输入监听，实时更新密码强度
  passwordInput.addEventListener('input', function() {
    updateStrengthIndicator(this.value);
  });
}); 