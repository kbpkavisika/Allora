import { useFocusEffect } from 'expo-router';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View } from 'react-native';

interface PageNode {
  tagName: string;
  textContent: string;
  children: ArrayLike<PageNode>;
  contains: (other: PageNode) => boolean;
}

const FocusedScreensContext = createContext<Set<PageNode>>(new Set());

const ICON_GLYPHS = /[-]|[\u{F0000}-\u{10FFFD}]/gu;

export function PageSpeechProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [screens] = useState(() => new Set<PageNode>());
  return <FocusedScreensContext.Provider value={screens}>{children}</FocusedScreensContext.Provider>;
}

export function PageSpeechScreen({ children }: Readonly<{ children: React.ReactNode }>) {
  const screens = useContext(FocusedScreensContext);
  const ref = useRef<View>(null);

  useFocusEffect(
    useCallback(() => {
      const node = ref.current as unknown as PageNode | null;
      if (!node) return;
      screens.add(node);
      return () => {
        screens.delete(node);
      };
    }, [screens])
  );

  return (
    <View ref={ref} collapsable={false} className="flex-1">
      {children}
    </View>
  );
}

function collectText(node: PageNode, sentences: string[]) {
  if (node.tagName === 'RN:Paragraph') {
    const text = node.textContent.replace(ICON_GLYPHS, '').trim();
    if (text) sentences.push(/[.!?:]$/.test(text) ? text : `${text}.`);
    return;
  }
  Array.from(node.children ?? []).forEach((child) => collectText(child, sentences));
}

export function useReadPage() {
  const screens = useContext(FocusedScreensContext);

  return () => {
    const nodes = [...screens];
    const page = nodes.find((node) => !nodes.some((other) => other !== node && node.contains(other)));
    if (!page) return '';
    const sentences: string[] = [];
    collectText(page, sentences);
    return sentences.join(' ');
  };
}
