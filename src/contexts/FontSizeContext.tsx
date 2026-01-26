import React, { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

type FontSize = 'NORMAL' | 'LARGE';

interface FontSizeContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
    const [fontSize, setFontSize] = useLocalStorage<FontSize>('app_font_size', 'NORMAL');

    useEffect(() => {
        const root = document.documentElement;
        if (fontSize === 'LARGE') {
            root.style.fontSize = '120%'; // 기본 대비 1.2배 키움 (약 19.2px)
        } else {
            root.style.fontSize = '100%'; // 기본 (16px)
        }
    }, [fontSize]);

    return (
        <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
            {children}
        </FontSizeContext.Provider>
    );
}

export function useFontSize() {
    const context = useContext(FontSizeContext);
    if (!context) {
        throw new Error('useFontSize must be used within a FontSizeProvider');
    }
    return context;
}
