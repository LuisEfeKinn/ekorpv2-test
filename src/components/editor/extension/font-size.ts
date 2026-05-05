import type { CommandProps } from '@tiptap/core';

import { Mark } from '@tiptap/core';

// ----------------------------------------------------------------------

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const isHTMLElement = (node: unknown): node is HTMLElement => node instanceof HTMLElement;

// ----------------------------------------------------------------------

export const FontSize = Mark.create({
  name: 'fontSize',

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element): string | null => {
          if (!isHTMLElement(element)) return null;
          return element.style.fontSize || null;
        },
        renderHTML: (attributes): Record<string, string> => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style]',
        getAttrs: (node) => {
          if (!isHTMLElement(node)) return false;
          return node.style.fontSize ? {} : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ commands }: CommandProps): boolean =>
          commands.setMark(this.name, { fontSize: size }),

      unsetFontSize:
        () =>
        ({ commands }: CommandProps): boolean =>
          commands.unsetMark(this.name),
    };
  },
});
