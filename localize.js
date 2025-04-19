// 替换 HTML 中的国际化消息占位符
document.addEventListener('DOMContentLoaded', function() {
  // 查找所有包含文本内容的元素
  const elements = document.querySelectorAll('*');
  
  // 正则表达式匹配 __MSG_messagename__ 格式的占位符
  const msgRegex = /__MSG_(\w+)__/g;
  
  // 遍历所有元素
  elements.forEach(function(element) {
    // 检查元素是否有子节点
    if (element.childNodes.length > 0) {
      // 遍历所有子节点
      Array.from(element.childNodes).forEach(function(node) {
        // 只处理文本节点
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes('__MSG_')) {
          // 替换文本中的占位符
          node.nodeValue = node.nodeValue.replace(msgRegex, function(match, messageName) {
            return chrome.i18n.getMessage(messageName) || match;
          });
        }
      });
    }
    
    // 处理元素的属性
    Array.from(element.attributes).forEach(function(attr) {
      if (attr.value.includes('__MSG_')) {
        element.setAttribute(attr.name, attr.value.replace(msgRegex, function(match, messageName) {
          return chrome.i18n.getMessage(messageName) || match;
        }));
      }
    });
  });
  
  // 特别处理页面标题
  if (document.title.includes('__MSG_')) {
    document.title = document.title.replace(msgRegex, function(match, messageName) {
      return chrome.i18n.getMessage(messageName) || match;
    });
  }
  
  // 特别处理 placeholder 属性
  const inputElements = document.querySelectorAll('input[placeholder]');
  inputElements.forEach(function(input) {
    if (input.placeholder.includes('__MSG_')) {
      input.placeholder = input.placeholder.replace(msgRegex, function(match, messageName) {
        return chrome.i18n.getMessage(messageName) || match;
      });
    }
  });
}); 