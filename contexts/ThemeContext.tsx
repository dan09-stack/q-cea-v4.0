import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  backgroundColor: string;
  buttonColor: string;
  textColor?: string;
  accentColor?: string;

}

interface ThemeContextType {
  colors: ThemeColors;
  updateColor: (colorName: keyof ThemeColors, value: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isUpdating: boolean;
}

const DEFAULT_COLORS: ThemeColors = {
  backgroundColor: '#780C28',
  buttonColor: '#008000',
  textColor: '#ffffff',
  accentColor: '#6E8E59',
};

const ThemeContext = createContext<ThemeContextType>({
  colors: DEFAULT_COLORS,
  updateColor: async () => {},
  resetToDefaults: async () => {},
  isUpdating: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadThemeColors = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeColors');
        if (savedTheme) {
          setColors(JSON.parse(savedTheme));
        }
      } catch (error) {
        console.error('Error loading theme colors:', error);
      }
    };
    
    loadThemeColors();
  }, []);

  const updateColor = async (colorName: keyof ThemeColors, value: string) => {
    try {
      setIsUpdating(true);
      const updatedColors = { ...colors, [colorName]: value };
      
      await AsyncStorage.setItem('themeColors', JSON.stringify(updatedColors));
      
      setColors(updatedColors);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error saving theme colors:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      setIsUpdating(true);
      
      await AsyncStorage.setItem('themeColors', JSON.stringify(DEFAULT_COLORS));
      
      setColors(DEFAULT_COLORS);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error resetting theme colors:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ colors, updateColor, resetToDefaults, isUpdating }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);