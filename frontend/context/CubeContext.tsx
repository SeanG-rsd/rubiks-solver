import React, { createContext, useContext, useMemo } from 'react';
import { useSharedValue, ISharedValue } from 'react-native-worklets-core';

type CubeContextType = {
  detectedSides: ISharedValue<string[][]>; 
  validCube: ISharedValue<boolean>;
};

const CubeContext = createContext<CubeContextType | undefined>(undefined);

export const CubeProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMemo(() => {
    const detectedSides = useSharedValue<string[][]>([]);
    const validCube = useSharedValue(false);
    
    return { detectedSides, validCube };
  }, []);

  return (
    <CubeContext.Provider value={value}>
      {children}
    </CubeContext.Provider>
  );
};

export const useCubeStore = () => {
  const context = useContext(CubeContext);
  if (!context) throw new Error("useCubeStore must be used within a CubeProvider");
  return context;
};