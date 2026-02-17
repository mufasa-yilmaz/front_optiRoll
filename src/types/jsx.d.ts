/**
 * JSX intrinsic element tipleri.
 * @types/react yüklü değilse JSX etiketlerinin 'any' sayılmasını önler.
 */
declare global {
  namespace JSX {
    interface ElementAttributesProperty {
      props: unknown;
    }
    interface IntrinsicElements {
      main: { className?: string; children?: unknown };
      h1: { className?: string; children?: unknown };
      p: { className?: string; children?: unknown };
      div: { className?: string; children?: unknown };
      span: { className?: string; children?: unknown };
    }
  }
}

export {};
