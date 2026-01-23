let selectedElementXPath = null;
let isSelecting = false;

function getXPath(element) {
  if (element.id !== '') {
    return `//*[@id="${element.id}"]`;
  }
  if (element === document.body) {
    return '/html/body';
  }
  let ix = 0;
  const siblings = element.parentNode.childNodes;
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
  return '';
}

async function startElementSelection(tabId) {
  isSelecting = true;
  document.getElementById('selected-element-info').textContent = 'Click on an element to select it...';

  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      window.getXPath = function(element) {
        if (element.id !== '') {
          return `//*[@id="${element.id}"]`;
        }
        if (element === document.body) {
          return '/html/body';
        }
        let ix = 0;
        const siblings = element.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i];
          if (sibling === element) {
            return window.getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
          }
          if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            ix++;
          }
        }
        return '';
      };

      let overlay = document.createElement('div');
      overlay.id = 'element-selector-overlay';
      overlay.style.position = 'fixed';
      overlay.style.pointerEvents = 'none';
      overlay.style.backgroundColor = 'rgba(0, 123, 255, 0.3)';
      overlay.style.border = '2px solid #007bff';
      overlay.style.zIndex = '999999';
      overlay.style.display = 'none';
      document.body.appendChild(overlay);

      let currentElement = null;

      const mouseoverHandler = (e) => {
        if (!window.isSelecting) return;
        e.preventDefault();
        e.stopPropagation();
        currentElement = e.target;
        const rect = currentElement.getBoundingClientRect();
        overlay.style.display = 'block';
        overlay.style.left = rect.left + 'px';
        overlay.style.top = rect.top + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
      };

      const mouseoutHandler = () => {
        if (!window.isSelecting) return;
        overlay.style.display = 'none';
      };

      const clickHandler = (e) => {
        if (!window.isSelecting) return;
        e.preventDefault();
        e.stopPropagation();
        console.log('Clicked on element:', e.target);
        currentElement = e.target.parentElement || e.target; // Select parent element to make it larger
        console.log('Selected element:', currentElement);
        window.selectedXPath = window.getXPath(currentElement);
        console.log('Selected XPath:', window.selectedXPath);
        window.isSelecting = false;
        overlay.remove();
        document.removeEventListener('mouseover', mouseoverHandler);
        document.removeEventListener('mouseout', mouseoutHandler);
        document.removeEventListener('click', clickHandler);
      };

      document.addEventListener('mouseover', mouseoverHandler);
      document.addEventListener('mouseout', mouseoutHandler);
      document.addEventListener('click', clickHandler);

      window.isSelecting = true;
    }
  });

  // Wait a bit and get the selected xpath
  setTimeout(async () => {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        console.log('Selected xpath:', window.selectedXPath);
        return window.selectedXPath;
      }
    });
    selectedElementXPath = result?.result;
    document.getElementById('selected-element-info').textContent = selectedElementXPath ? 'Element selected' : 'Selection failed';
    isSelecting = false;
    // Save to storage
    if (selectedElementXPath) {
      await chrome.storage.local.set({ selectedElementXPath });
    }
  }, 500);
}

async function getTextFromSelectedElement(tabId) {
  if (!selectedElementXPath) return null;

  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (xpath) => {
      function getElementByXPath(xpath) {
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue;
      }
      const element = getElementByXPath(xpath);
      return element ? element.innerHTML : null;
    },
    args: [selectedElementXPath]
  });
  return result?.result || null;
}

function preprocessText(html) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const paragraphs = doc.querySelectorAll('p');
  const lines = Array.from(paragraphs).map(p => p.textContent.trim()).filter(line => line !== '');
  return lines.join('\n');
}

async function sendToGemini(text, prompt) {
  const geminiTabs = await chrome.tabs.query({ url: '*://gemini.google.com/*' });
  if (geminiTabs.length === 0) {
    throw new Error('No Gemini tab found. Please open gemini.google.com in a tab.');
  }

  const geminiTab = geminiTabs[0];
  await chrome.tabs.update(geminiTab.id, { active: true });

  const fullText = prompt ? `${prompt}\n\n${text}` : text;

  await chrome.scripting.executeScript({
    target: { tabId: geminiTab.id },
    func: (inputText) => {
      let inputElement = document.querySelector('textarea[aria-label*="Ask"], textarea[placeholder*="Ask"], input[aria-label*="Ask"], input[placeholder*="Ask"], [contenteditable="true"], [role="textbox"]');
      if (!inputElement) {
        inputElement = document.querySelector('textarea') || document.querySelector('input[type="text"]') || document.querySelector('[contenteditable]');
      }
      if (!inputElement) {
        throw new Error('Could not find input field on Gemini page.');
      }

      if (inputElement.tagName.toLowerCase() === 'input' || inputElement.tagName.toLowerCase() === 'textarea') {
        inputElement.value = inputText;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (inputElement.contentEditable === 'true') {
        inputElement.textContent = inputText;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
      inputElement.focus();

      setTimeout(() => {
        let sendButton = document.querySelector('button[aria-label*="Send"], button[data-testid*="send"], button[type="submit"], button[aria-label*="Submit"]');
        if (!sendButton) {
          sendButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.toLowerCase().includes('send') || 
            btn.textContent.toLowerCase().includes('submit') || 
            btn.ariaLabel && btn.ariaLabel.toLowerCase().includes('send')
          );
        }
        if (sendButton) {
          console.log('Clicking send button:', sendButton);
          sendButton.click();
        } else {
          console.log('No send button found, trying Enter');
          inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          inputElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
        }
      }, 500);
    },
    args: [fullText]
  });
}

export async function initUI() {
  const promptInput = document.getElementById('prompt-input');
  const selectElementBtn = document.getElementById('select-element-btn');
  const selectedElementInfo = document.getElementById('selected-element-info');
  const sendToGeminiBtn = document.getElementById('send-to-gemini-btn');
  const resultDiv = document.getElementById('result');

  // Load saved xpath
  const stored = await chrome.storage.local.get(['selectedElementXPath']);
  selectedElementXPath = stored.selectedElementXPath || null;
  selectedElementInfo.textContent = selectedElementXPath ? 'Element selected' : 'No element selected';

  selectElementBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith('http')) {
      resultDiv.textContent = 'No active web page';
      return;
    }
    await startElementSelection(tab.id);
  });

  sendToGeminiBtn.addEventListener('click', async () => {
    if (!selectedElementXPath) {
      resultDiv.textContent = 'Please select an element first';
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith('http')) {
      resultDiv.textContent = 'No active web page';
      return;
    }

    const text = await getTextFromSelectedElement(tab.id);
    if (!text) {
      resultDiv.textContent = 'No text found in selected element';
      return;
    }

    const processedText = preprocessText(text);

    const prompt = promptInput.value.trim();
    resultDiv.textContent = 'Processing with Gemini...';

    try {
      await sendToGemini(processedText, prompt);
      resultDiv.textContent = 'Sent to Gemini successfully!';
    } catch (e) {
      resultDiv.textContent = `Error: ${e.message}`;
    }
  });
}