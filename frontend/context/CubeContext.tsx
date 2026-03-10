import React, { createContext, useContext, useMemo, useState } from 'react';

type SharedValue<T> = {
  value: T;
};

type CubeContextType = {
  detectedSides: SharedValue<string[][]>; 
  validCube: SharedValue<boolean>;
};

const CubeContext = createContext<CubeContextType | undefined>(undefined);

export const CubeProvider = ({ children }: { children: React.ReactNode }) => {
  const [detectedSidesState, setDetectedSidesState] = useState<string[][]>([]);
  const [validCubeState, setValidCubeState] = useState(false);

  const detectedSides: SharedValue<string[][]> = {
    get value() {
      return detectedSidesState;
    },
    set value(newValue: string[][]) {
      setDetectedSidesState(newValue);
    },
  };

  const validCube: SharedValue<boolean> = {
    get value() {
      return validCubeState;
    },
    set value(newValue: boolean) {
      setValidCubeState(newValue);
    },
  };

  const value = useMemo(() => {
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