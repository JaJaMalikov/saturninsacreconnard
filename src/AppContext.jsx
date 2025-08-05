import React, { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [inspectorOpen, setInspectorOpen] = useState(() => {
    const stored = localStorage.getItem('inspector-open');
    return stored ? stored !== 'false' : true;
  });
  const toggleInspector = () => setInspectorOpen(prev => !prev);

  useEffect(() => {
    localStorage.setItem('inspector-open', inspectorOpen);
  }, [inspectorOpen]);

  return (
    <AppContext.Provider value={{ inspectorOpen, toggleInspector }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  return useContext(AppContext);
}
