export type Props = Record<string, any> | null;
export type ElementType = string | ((props: Record<string, any>) => JSXNode);

export type JSXNode = JSXElement | string | number | boolean | null | undefined | JSXNode[];

export interface JSXElement {
  readonly type: ElementType | typeof Fragment;
  readonly props: Props;
  readonly key?: string;
}

export const Fragment = Symbol.for("fragment");

export function jsx(type: ElementType | typeof Fragment, props: Props = null, key?: string): JSXElement {
  return { type, props, key };
}

export const jsxs = jsx;

const BOOLEAN_ATTRIBUTES = new Set(["disabled", "checked", "readonly", "multiple"]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function attrName(name: string): string {
  if (name === "className") return "class";
  if (name === "htmlFor") return "for";
  return name.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
}

function renderChildren(children: JSXNode): string {
  if (Array.isArray(children)) {
    return children.map(renderNode).join("");
  }
  return renderNode(children);
}

function renderNode(node: JSXNode): string {
  if (node === null || node === undefined || node === false) {
    return "";
  }
  if (node === true) {
    return "";
  }
  if (Array.isArray(node)) {
    return node.map(renderNode).join("");
  }
  if (typeof node === "string" || typeof node === "number") {
    return escapeHtml(String(node));
  }
  if (typeof node !== "object") {
    return escapeHtml(String(node));
  }

  const element = node as JSXElement;

  if (element.type === Fragment) {
    return renderChildren(element.props?.children ?? null);
  }

  if (typeof element.type === "function") {
    const result = element.type({ ...(element.props ?? {}), key: element.key });
    return renderNode(result as JSXNode);
  }

  const { children, dangerouslySetInnerHTML, ...rest } = element.props ?? {};
  const attrs: string[] = [];

  for (const [name, value] of Object.entries(rest)) {
    if (value === null || value === undefined || value === false) continue;
    const attr = attrName(name);
    if (value === true && BOOLEAN_ATTRIBUTES.has(attr)) {
      attrs.push(attr);
    } else {
      attrs.push(`${attr}="${escapeHtml(String(value))}"`);
    }
  }

  const attrString = attrs.length > 0 ? " " + attrs.join(" ") : "";
  let inner = "";
  if (dangerouslySetInnerHTML && typeof dangerouslySetInnerHTML.__html === "string") {
    inner = dangerouslySetInnerHTML.__html;
  } else {
    inner = renderChildren(children ?? null);
  }

  return `<${element.type}${attrString}>${inner}</${element.type}>`;
}

export function renderToHtml(node: JSXNode): string {
  return "<!DOCTYPE html>" + renderNode(node);
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: Record<string, any>;
    }
  }
}
