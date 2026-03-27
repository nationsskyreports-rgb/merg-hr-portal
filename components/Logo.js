// components/Logo.js
import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

export default function Logo({ darkMode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200, 
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
      <View style={[
        styles.logoContainer, 
        // لو Dark Mode شغل، نضيف خلفية بيضاء وظل
        darkMode && styles.logoContainerDark
      ]}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logoImage}
          resizeMode="contain" 
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    // الوضع العادي (Light Mode): مفيش خلفية
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  logoContainerDark: {
    // الوضع الليلي (Dark Mode): خلفية بيضاء دائرية وظل
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoImage: {
    width: 140,  // ممكن تظبط العرض
    height: 45,  // وممكن تظبط الارتفاع
  },
});