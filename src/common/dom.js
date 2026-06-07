export function clearElement(element) {
  if (!element) return;
  element.replaceChildren();
}

export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  const {
    className,
    text,
    attributes = {},
    dataset = {},
    styles = {},
    children = []
  } = options;

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(name, String(value));
    }
  });

  Object.entries(dataset).forEach(([name, value]) => {
    if (value !== undefined && value !== null) {
      element.dataset[name] = String(value);
    }
  });

  Object.assign(element.style, styles);
  element.append(...children.filter(Boolean));
  return element;
}

export function appendIcon(parent, className) {
  const icon = createElement('i', { className });
  parent.appendChild(icon);
  return icon;
}
