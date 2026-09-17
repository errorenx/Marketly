import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type Palette = 'obsidian_coral' | 'cyber_violet' | 'emerald_oasis' | 'royal_sapphire' | 'minimalist_frost' | 'velvet_plum';

interface ThemeContextType {
  theme: Theme;
  palette: Palette;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  setPalette: (palette: Palette) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('marketly_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved as Theme;
    }
    return 'dark';
  });

  const [palette, setPaletteState] = useState<Palette>(() => {
    const saved = localStorage.getItem('marketly_palette');
    if (
      saved === 'obsidian_coral' ||
      saved === 'cyber_violet' ||
      saved === 'emerald_oasis' ||
      saved === 'royal_sapphire' ||
      saved === 'minimalist_frost' ||
      saved === 'velvet_plum'
    ) {
      return saved as Palette;
    }
    return 'obsidian_coral'; // Option 3: Midnight Obsidian & Sunset Coral as primary
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    let active: 'dark' | 'light' = 'dark';

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      active = prefersDark ? 'dark' : 'light';
    } else {
      active = theme;
    }

    setResolvedTheme(active);

    const root = document.documentElement;
    if (active === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }

    // Apply palette attribute to root
    root.setAttribute('data-palette', palette);
  }, [theme, palette]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('marketly_theme', newTheme);
  };

  const setPalette = (newPalette: Palette) => {
    setPaletteState(newPalette);
    localStorage.setItem('marketly_palette', newPalette);
  };

  return (
    <ThemeContext.Provider value={{ theme, palette, resolvedTheme, setTheme, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
