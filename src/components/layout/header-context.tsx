"use client";

import * as React from "react";

export type HeaderConfig = {
  left?: React.ReactNode;
  title?: React.ReactNode; // allows a logo component OR plain string title
  right?: React.ReactNode;
};

type HeaderContextValue = {
  header: HeaderConfig | null;
  setHeader: (config: HeaderConfig) => void;
  resetHeader: () => void;
};

function shallowEqualHeader(a: HeaderConfig | null, b: HeaderConfig | null) {
  return (
    (a?.left ?? null) === (b?.left ?? null) &&
    (a?.title ?? null) === (b?.title ?? null) &&
    (a?.right ?? null) === (b?.right ?? null)
  );
}

const HeaderContext = React.createContext<HeaderContextValue | null>(null);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeaderState] = React.useState<HeaderConfig | null>(null);

  const setHeader = React.useCallback((config: HeaderConfig) => {
    setHeaderState((prev) => (shallowEqualHeader(prev, config) ? prev : config));
  }, []);

  const resetHeader = React.useCallback(() => {
    setHeaderState(null);
  }, []);

  const value = React.useMemo(
    () => ({ header, setHeader, resetHeader }),
    [header, setHeader, resetHeader]
  );

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}

export function useHeader() {
  const ctx = React.useContext(HeaderContext);
  if (!ctx) throw new Error("useHeader must be used within HeaderProvider");
  return ctx;
}

/**
 * Page helper: set header on mount; reset to default on unmount.
 * Keep configs small/stable (avoid huge objects). Pass nodes directly.
 */
export function usePageHeader(config: HeaderConfig | null) {
  const { setHeader, resetHeader } = useHeader();

  React.useEffect(() => {
    if (config) setHeader(config);
    return () => resetHeader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);
}
