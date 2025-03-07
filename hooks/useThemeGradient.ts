import { useTheme } from '@/contexts/ThemeContext';
import { shadeColor, getContrastTextColor } from '@/utils/themeUtils';

export function useThemeGradient(intensity = 20) {
  // Get theme colors from context
  const { colors } = useTheme();
  
  // Calculate text color based on background
  const textColor = colors.textColor || getContrastTextColor(colors.backgroundColor);
  
  // Create gradient colors for background
  const gradientColors = [
    colors.backgroundColor,
    shadeColor(colors.backgroundColor, -intensity),
    shadeColor(colors.backgroundColor, -intensity * 2)
  ] as readonly [string, string, string];
  
  return {
    colors,
    textColor,
    gradientColors,
    buttonColor: colors.buttonColor,
    accentColor: colors.accentColor
  };
}
