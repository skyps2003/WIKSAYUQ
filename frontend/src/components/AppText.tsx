import React from 'react';
import { Text, TextProps } from 'react-native';
import { useAccessibilityStore } from '../store/accessibility-store';
import { getScaledTypography } from '../theme/typography';
import { colors } from '../theme/colors';

interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'caption';
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const AppText: React.FC<AppTextProps> = ({ 
  variant = 'body1', 
  color = colors.textPrimary, 
  align = 'left',
  style, 
  children, 
  ...props 
}) => {
  const fontSize = useAccessibilityStore((s) => s.fontSize);
  const typ = getScaledTypography(fontSize);

  return (
    <Text 
      style={[
        typ[variant], 
        { color, textAlign: align },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};
