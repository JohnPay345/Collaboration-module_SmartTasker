import React, { ReactNode } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  TextStyle,
  Dimensions,
  DimensionValue,
} from 'react-native';
import { MainColors } from '@/constants';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface ModalItemProps {
  isVisible: boolean;
  onClose: () => void;
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  animationType?: "none" | "slide" | "fade";
  overlayColor?: string;
  position?: 'center' | 'bottom';
  closeOnOverlayPress?: boolean;
  width?: DimensionValue;
  height?: DimensionValue;
}

export const ModalItem: React.FC<ModalItemProps> = ({
  isVisible,
  onClose,
  children,
  containerStyle,
  contentStyle,
  animationType = "fade",
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  position = 'center',
  closeOnOverlayPress = true,
  width = WINDOW_WIDTH * 0.9,
  height,
}) => {
  const handleOverlayPress = () => {
    if (closeOnOverlayPress) {
      onClose();
    }
  };

  const contentStyles: ViewStyle = {
    width,
    height,
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <View style={[
        styles.overlay,
        { backgroundColor: overlayColor },
        containerStyle
      ]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleOverlayPress}
          activeOpacity={1}
        />
        <View style={[
          styles.content,
          styles[position],
          contentStyles,
          contentStyle
        ]}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: MainColors.white,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  center: {
    alignSelf: 'center',
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 34,
  },
});
