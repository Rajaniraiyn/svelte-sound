import { createRenderer } from 'svelte/renderer';

type Kind = 'fragment' | 'element' | 'text' | 'comment';
export interface Tree {
  kind: Kind;
  parent: Tree | null;
  children: Tree[];
  text: string;
  attributes: Record<string, unknown>;
}
export const node = (kind: Kind, text = ''): Tree => ({
  kind,
  parent: null,
  children: [],
  text,
  attributes: {},
});
function remove(child: Tree) {
  if (child.parent)
    child.parent.children.splice(child.parent.children.indexOf(child), 1);
  child.parent = null;
}

export default createRenderer({
  createFragment: () => node('fragment'),
  createElement: (name) => node('element', name),
  createText: (text) => node('text', text),
  createComment: (text) => node('comment', text),
  getNodeType: (value) => value.kind,
  getText: (value) => value.text,
  getAttribute: (value, key) =>
    value.attributes[key] === undefined ? null : String(value.attributes[key]),
  setAttribute: (value, key, data) => {
    value.attributes[key] = data;
  },
  removeAttribute: (value, key) => {
    delete value.attributes[key];
  },
  hasAttribute: (value, key) => key in value.attributes,
  setText: (value, text) => {
    value.text = text;
  },
  getFirstChild: (value) => value.children[0] ?? null,
  getLastChild: (value) => value.children.at(-1) ?? null,
  getNextSibling: (value) =>
    value.parent?.children[value.parent.children.indexOf(value) + 1] ?? null,
  getParent: (value) => value.parent,
  insert(parent, child, anchor) {
    if (child.kind === 'fragment') {
      while (child.children.length)
        this.insert(parent, child.children[0], anchor);
    } else {
      remove(child);
      child.parent = parent;
      parent.children.splice(
        anchor ? parent.children.indexOf(anchor) : parent.children.length,
        0,
        child,
      );
    }
  },
  remove,
  addEventListener: (value, key, handler) => {
    value.attributes[`on${key}`] = handler;
  },
  removeEventListener: (value, key) => {
    delete value.attributes[`on${key}`];
  },
});
