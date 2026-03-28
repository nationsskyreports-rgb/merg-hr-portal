import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Keyboard, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

export default function ChangePasswordScreen({ goBack, darkMode }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const bg = darkMode ? '#0F1117' : '#F4F6FB';
  const card = darkMode ? '#1A1D27' : '#FFFFFF';
  const text = darkMode ? '#F1F5F9' : '#111827';
  const sub = darkMode ? '#94A3B8' : '#6B7280';
  const border = darkMode ? '#2A2D3E' : '#E5E7EB';
  const inputBg = darkMode ? '#12141C' : '#F9FAFB';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleChangePassword = async () => {
    Keyboard.dismiss();
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) { setError('All fields are required.'); return; }
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      Alert.alert('Success', 'Password changed successfully!', [{ text: 'OK', onPress: goBack }]);
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, marginTop: 40, marginBottom: 10 }}>
        <TouchableOpacity onPress={goBack} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: border, backgroundColor: inputBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: text, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ marginLeft: 16 }}>
          <Text style={{ color: text, fontSize: 20, fontWeight: '700' }}>Change Password</Text>
          <Text style={{ color: sub, fontSize: 13 }}>Keep your account secure</Text>
        </View>
      </View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={{ backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: border, padding: 20, marginBottom: 16, marginTop: 10 }}>
          {['Current Password', 'New Password', 'Confirm New Password'].map((label, i) => {
            const values = [currentPassword, newPassword, confirmPassword];
            const setters = [setCurrentPassword, setNewPassword, setConfirmPassword];
            return (
              <View key={i} style={{ marginBottom: i < 2 ? 16 : 0 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{label}</Text>
                <TextInput
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={sub}
                  value={values[i]}
                  onChangeText={setters[i]}
                  style={{ height: 50, borderRadius: 10, borderWidth: 1, borderColor: border, backgroundColor: inputBg, paddingHorizontal: 14, fontSize: 15, color: text }}
                />
              </View>
            );
          })}
          {error ? (
            <View style={{ marginTop: 16, padding: 10, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
              <Text style={{ color: '#EF4444', textAlign: 'center', fontWeight: '600' }}>{error}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity onPress={handleChangePassword} disabled={loading}
          style={{ height: 54, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{loading ? 'Saving...' : 'Update Password'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
