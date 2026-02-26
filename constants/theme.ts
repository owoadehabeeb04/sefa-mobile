/**
 * SEFA Design System - Colors
 * Primary Color: #3629B7 (Purple/Blue)
 * Light Mode: White backgrounds with dark text
 * Dark Mode: Black shades with light text
 */

import { Platform } from 'react-native';

// Primary brand color
export const PRIMARY_COLOR = '#3629B7';

// Primary color shades
export const PrimaryColors = {
  50: '#F5F4FF',   // Lightest
  100: '#E8E6FF',
  200: '#D1CCFF',
  300: '#B8B0FF',
  400: '#9D91FF',
  500: '#3629B7',  // Base
  600: '#2D21A0',
  700: '#241A89',
  800: '#1B1472',
  900: '#120D5B',  // Darkest
};

// Black shades for dark mode
export const BlackShades = {
  50: '#FAFAFA',   // Almost white
  100: '#F5F5F5',
  200: '#EEEEEE',
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
  950: '#0A0A0A',  // Almost black
};

export const Colors = {
  light: {
    // Primary colors
    primary: PRIMARY_COLOR,
    primaryLight: PrimaryColors[400],
    primaryDark: PrimaryColors[600],
    primaryBackground: PrimaryColors[50],
    
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#FAFAFA',
    backgroundTertiary: '#F5F5F5',
    
    // Text colors
    text: '#000000',
    textPrimary: '#000000',
    textSecondary: '#424242',
    textTertiary: '#757575',
    textInverse: '#FFFFFF',
    
    // UI elements
    border: '#E0E0E0',
    borderLight: '#F5F5F5',
    divider: '#EEEEEE',
    
    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Interactive
    tint: PRIMARY_COLOR,
    icon: '#424242',
    iconSecondary: '#757575',
    tabIconDefault: '#9E9E9E',
    tabIconSelected: PRIMARY_COLOR,
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    // Primary colors
    primary: PrimaryColors[400], // Lighter shade for dark mode
    primaryLight: PrimaryColors[300],
    primaryDark: PrimaryColors[500],
    primaryBackground: PrimaryColors[900],
    
    // Backgrounds (black shades)
    background: '#000000',
    backgroundSecondary: '#0A0A0A',
    backgroundTertiary: '#212121',
    
    // Text colors
    text: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0E0E0',
    textTertiary: '#9E9E9E',
    textInverse: '#000000',
    
    // UI elements
    border: '#424242',
    borderLight: '#212121',
    divider: '#2A2A2A',
    
    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Interactive
    tint: PrimaryColors[400],
    icon: '#E0E0E0',
    iconSecondary: '#9E9E9E',
    tabIconDefault: '#616161',
    tabIconSelected: PrimaryColors[400],
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
