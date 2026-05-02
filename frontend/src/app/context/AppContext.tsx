import { createContext, useContext, useState, type ReactNode } from 'react';

interface AppContextType {
  activeSite: string;
  setActiveSite: (site: string) => void;
  isAIActive: boolean;
  setIsAIActive: (v: boolean) => void;
}

const AppContext = createContext<AppContextType>({
  activeSite: 'Site A - Construction Zone',
  setActiveSite: () => {},
  isAIActive: true,
  setIsAIActive: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeSite, setActiveSite] = useState('Site A - Construction Zone');
  const [isAIActive, setIsAIActive] = useState(true);

  return (
    <AppContext.Provider value={{ activeSite, setActiveSite, isAIActive, setIsAIActive }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
