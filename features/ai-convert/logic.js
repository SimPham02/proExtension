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
    func: (getXPathFunc) => {
      window.getXPath = getXPathFunc;

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
        currentElement = e.target.parentElement || e.target;
        window.selectedXPath = window.getXPath(currentElement);
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
    },
    args: [getXPath]
  });

  // Wait a bit and get the selected xpath
  setTimeout(async () => {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.selectedXPath
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
          sendButton.click();
        } else {
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
  const savedPromptsSelect = document.getElementById('saved-prompts');
  const savePromptBtn = document.getElementById('save-prompt-btn');
  const selectElementBtn = document.getElementById('select-element-btn');
  const selectedElementInfo = document.getElementById('selected-element-info');
  const sendToGeminiBtn = document.getElementById('send-to-gemini-btn');
  const resultDiv = document.getElementById('result');

  // Helper to show temporary message
  const showResult = (msg, duration = 2000) => {
    resultDiv.textContent = msg;
    if (duration > 0) setTimeout(() => resultDiv.textContent = '', duration);
  };

  // Load saved prompts
  let savedPrompts = [];
  const storedPrompts = await chrome.storage.local.get(['savedPrompts']);
  savedPrompts = storedPrompts.savedPrompts || [];
  updateSavedPromptsSelect();

  function updateSavedPromptsSelect() {
    savedPromptsSelect.innerHTML = '<option value="">Select a saved prompt...</option>';
    savedPrompts.forEach(prompt => {
      const option = document.createElement('option');
      option.value = prompt;
      option.textContent = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
      savedPromptsSelect.appendChild(option);
    });
  }

  // Load saved xpath
  const stored = await chrome.storage.local.get(['selectedElementXPath']);
  selectedElementXPath = stored.selectedElementXPath || null;
  selectedElementInfo.textContent = selectedElementXPath ? 'Element selected' : 'No element selected';

  savedPromptsSelect.addEventListener('change', () => {
    const selectedPrompt = savedPromptsSelect.value;
    if (selectedPrompt) promptInput.value = selectedPrompt;
  });

  savePromptBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      showResult('No prompt to save.');
      return;
    }
    if (savedPrompts.includes(prompt)) {
      showResult('Prompt already saved.');
      return;
    }
    savedPrompts.push(prompt);
    await chrome.storage.local.set({ savedPrompts });
    updateSavedPromptsSelect();
    showResult('Prompt saved!');
  });

  selectElementBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith('http')) {
      showResult('No active web page');
      return;
    }
    await startElementSelection(tab.id);
  });

  sendToGeminiBtn.addEventListener('click', async () => {
    if (!selectedElementXPath) {
      showResult('Please select an element first');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith('http')) {
      showResult('No active web page');
      return;
    }

    const text = await getTextFromSelectedElement(tab.id);
    if (!text) {
      showResult('No text found in selected element');
      return;
    }

    const processedText = preprocessText(text);
    const prompt = promptInput.value.trim();
    showResult('Processing with Gemini...', 0);

    try {
      await sendToGemini(processedText, prompt);
      showResult('Sent to Gemini successfully!');
    } catch (e) {
      showResult(`Error: ${e.message}`);
    }
  });
}