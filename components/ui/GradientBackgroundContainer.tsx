import React from 'react';
import { StyleSheet, Image, ImageSourcePropType, ViewStyle, StyleProp, ImageStyle } from 'react-native';
import { ThemedGradientContainer } from '@/components/ui/ThemedGradientContainer';

interface GradientBackgroundContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundImage?: ImageSourcePropType;
  imageOpacity?: number;
  imageStyle?: StyleProp<ImageStyle>;
}

export const GradientBackgroundContainer: React.FC<GradientBackgroundContainerProps> = ({
  children,
  style,
  backgroundImage = require('@/assets/images/red.jpg'),
  imageOpacity = 0.6,
  imageStyle,
}) => {
  // Convert StyleProp<ViewStyle> to ViewStyle to match ThemedGradientContainer's prop type
  const containerStyle: ViewStyle = style 
    ? StyleSheet.flatten(style as ViewStyle) 
    : styles.container;

  return (
    <ThemedGradientContainer style={containerStyle}>
      <Image
        source={backgroundImage}
        style={[
          styles.backgroundImage,
          { opacity: imageOpacity },
          imageStyle as ImageStyle
        ]}
        resizeMode="cover"
      />
      {children}
    </ThemedGradientContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
