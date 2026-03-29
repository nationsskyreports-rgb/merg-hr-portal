import {
  Text, View, TextInput, Alert, ActivityIndicator,
  TouchableOpacity, Animated, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import * as Location from 'expo-location';
import {
  SafeAreaProvider, SafeAreaView, useSafeAreaInsets
} from 'react-native-safe-area-context';

/* ═══════════════════════════════════════════════════════════════
   Maps — dynamic import عشان متكسرش على الويب
   ═══════════════════════════════════════════════════════════════ */
let MapView = null, Marker = null;
if (Platform.OS !== 'web') {
  try {
    const m = require('react-native-maps');
    MapView = m.default;
    Marker = m.Marker;
  } catch (_) { /* Maps not installed */ }
}

/* ═══════════════════════════════════════════════════════════════
   THEME — Navy + Gold Design System
   ═══════════════════════════════════════════════════════════════ */
const T = {
  dark: {
    bg:       '#060A13',
    card:     '#0F1623',
    surface:  '#161F30',
    border:   '#1C2940',
    text:     '#EDF0F7',
    sub:      '#6E7F95',
    gold:     '#C9A84C',
    goldLight:'#E8D48B',
    goldDim:  'rgba(201,168,76,0.10)',
    goldBorder:'rgba(201,168,76,0.18)',
    green:    '#22C55E',
    red:      '#EF4444',
    amber:    '#F59E0B',
    blue:     '#3B82F6',
    indigo:   '#6366F1',
    purple:   '#A855F7',
    inputBg:  '#0A0F1A',
  },
  light: {
    bg:       '#F4F5F9',
    card:     '#FFFFFF',
    surface:  '#EEF0F5',
    border:   '#DEE2EA',
    text:     '#0A0E1A',
    sub:      '#5F6B7A',
    gold:     '#B8942E',
    goldLight:'#D4B84A',
    goldDim:  'rgba(184,148,46,0.07)',
    goldBorder:'rgba(184,148,46,0.15)',
    green:    '#16A34A',
    red:      '#DC2626',
    amber:    '#D97706',
    blue:     '#2563EB',
    indigo:   '#4F46E5',
    purple:   '#9333EA',
    inputBg:  '#F8F9FC',
  },
};

const useT = (dark) => T[dark ? 'dark' : 'light'];

/* ═══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toR = x => x * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fmtTime = (t) => t ? t.slice(0, 5) : '—';
const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const nowISO = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toTimeString().split(' ')[0];

/* ═══════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

// — Safe-area wrapper —
const ScreenWrap = ({ children, dark }) => {
  const insets = useSafeAreaInsets();
  const t = useT(dark);
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {children}
    </View>
  );
};

// — Logo —
const Logo = ({ dark, size = 22 }) => {
  const t = useT(dark);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        width: size * 1.6, height: size * 1.6, borderRadius: (size * 1.6) / 3,
        backgroundColor: t.gold, alignItems: 'center', justifyContent: 'center',
        shadowColor: t.gold, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
      }}>
        <Text style={{ color: '#0A0E1A', fontWeight: '900', fontSize: size * 0.7 }}>M</Text>
      </View>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: size, marginLeft: 8, letterSpacing: 1 }}>MERGE</Text>
    </View>
  );
};

// — Screen Header —
const ScreenHeader = ({ dark, title, onBack, right }) => {
  const t = useT(dark);
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14,
      backgroundColor: t.bg,
      borderBottomWidth: 1, borderBottomColor: t.border,
      marginTop: insets.top,
    }}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7}
        style={{
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: t.goldDim, alignItems: 'center', justifyContent: 'center',
        }}>
        <Text style={{ color: t.gold, fontSize: 18, fontWeight: '700' }}>‹</Text>
      </TouchableOpacity>
      <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: t.text, marginLeft: 12 }}>{title}</Text>
      {right}
    </View>
  );
};

// — Button —
const AppBtn = ({ dark, label, icon, color, loading, disabled, onPress, style }) => {
  const t = useT(dark);
  const c = color || t.gold;
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.75}
      style={[{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 52, borderRadius: 14, paddingHorizontal: 20,
        backgroundColor: isDisabled ? t.surface : c,
        opacity: isDisabled ? 0.5 : 1,
      }, style]}>
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <>
            {icon && <Text style={{ fontSize: 18, marginRight: 8 }}>{icon}</Text>}
            <Text style={{ color: isDisabled ? t.sub : '#fff', fontWeight: '700', fontSize: 15 }}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  );
};

// — Action Card (Home grid) —
const ActionCard = ({ dark, icon, label, color, disabled, onPress }) => {
  const t = useT(dark);
  const c = color || t.gold;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}
      style={{
        flex: 1, paddingVertical: 18, paddingHorizontal: 10, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: t.card, borderWidth: 1.5,
        borderColor: disabled ? t.border : c + '30',
        opacity: disabled ? 0.4 : 1,
      }}>
      <Text style={{ fontSize: 26, marginBottom: 8 }}>{icon}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: disabled ? t.sub : c, letterSpacing: 0.3 }}>{label}</Text>
    </TouchableOpacity>
  );
};

// — Status Badge —
const Badge = ({ dark, label, color }) => {
  const t = useT(dark);
  const c = color || t.gold;
  return (
    <View style={{
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
      backgroundColor: c + '18',
    }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c, letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
};

// — Empty State —
const Empty = ({ dark, icon, title, sub }) => {
  const t = useT(dark);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 50 }}>
      <Text style={{ fontSize: 52, marginBottom: 16 }}>{icon}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontSize: 14, color: t.sub, textAlign: 'center', lineHeight: 20 }}>{sub}</Text>
    </View>
  );
};

// — Stat Box —
const StatBox = ({ dark, value, label, color }) => {
  const t = useT(dark);
  const c = color || t.gold;
  return (
    <View style={{
      flex: 1, borderRadius: 14, padding: 16, alignItems: 'center',
      backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
    }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: c }}>{value}</Text>
      <Text style={{ fontSize: 11, color: t.sub, marginTop: 2, fontWeight: '600', letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
};

// — Info Row —
const InfoRow = ({ dark, label, value }) => {
  const t = useT(dark);
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: t.border }}>
      <Text style={{ width: 110, fontSize: 13, color: t.sub, fontWeight: '500' }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 14, color: t.text, fontWeight: '600' }}>{value || '—'}</Text>
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════════════════════════ */
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) return Alert.alert('Missing Email', 'Please enter your email address.');
    if (!password.trim()) return Alert.alert('Missing Password', 'Please enter your password.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert('Login Failed', error.message);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#060A13' }}>

      {/* Decorative circles */}
      <View style={{ position: 'absolute', top: -150, right: -100, width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(201,168,76,0.04)' }} />
      <View style={{ position: 'absolute', bottom: -200, left: -150, width: 600, height: 600, borderRadius: 300, backgroundColor: 'rgba(99,102,241,0.03)' }} />

      {/* Watermark */}
      <View style={{ position: 'absolute', top: '18%', left: 0, right: 0, alignItems: 'center', opacity: 0.03, transform: [{ scale: 3 }] }}>
        <Text style={{ fontSize: 60, fontWeight: '900', color: '#C9A84C', letterSpacing: 4 }}>MERGE</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 50 }}
        bounces={false} keyboardShouldPersistTaps="handled">

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Brand */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 22, backgroundColor: '#C9A84C',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
            }}>
              <Text style={{ color: '#060A13', fontWeight: '900', fontSize: 32 }}>M</Text>
            </View>
            <Text style={{ color: '#C9A84C', fontWeight: '800', fontSize: 28, marginTop: 16, letterSpacing: 2 }}>MERGE</Text>
            <Text style={{ color: '#6E7F95', fontSize: 12, marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase' }}>Nations of Sky · HR Portal</Text>
          </View>

          {/* Card */}
          <View style={{
            backgroundColor: '#0F1623', borderRadius: 24, padding: 28,
            borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)',
            shadowColor: '#000', shadowOffset: { width: 0, height: 24 },
            shadowOpacity: 0.3, shadowRadius: 48, elevation: 12,
          }}>
            <Text style={{ color: '#EDF0F7', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>Welcome Back</Text>
            <Text style={{ color: '#6E7F95', fontSize: 14, marginBottom: 28 }}>Sign in to your employee account</Text>

            {/* Email */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: '#6E7F95', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Email Address</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', height: 54,
                backgroundColor: '#0A0F1A', borderRadius: 14, paddingHorizontal: 16,
                borderWidth: 1.5, borderColor: '#1C2940',
              }}>
                <Text style={{ fontSize: 16, marginRight: 10 }}>✉</Text>
                <TextInput style={{ flex: 1, color: '#EDF0F7', fontSize: 15, fontWeight: '500' }}
                  placeholder="name@nationsofsky.com" placeholderTextColor="#3D4F65"
                  value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#6E7F95', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Password</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', height: 54,
                backgroundColor: '#0A0F1A', borderRadius: 14, paddingHorizontal: 16,
                borderWidth: 1.5, borderColor: '#1C2940',
              }}>
                <Text style={{ fontSize: 16, marginRight: 10 }}>🔒</Text>
                <TextInput style={{ flex: 1, color: '#EDF0F7', fontSize: 15, fontWeight: '500' }}
                  placeholder="Enter your password" placeholderTextColor="#3D4F65"
                  value={password} onChangeText={setPassword}
                  secureTextEntry={!showPw} />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={8}>
                  <Text style={{ fontSize: 16, color: '#6E7F95' }}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}
              style={{
                height: 56, borderRadius: 14, backgroundColor: '#C9A84C',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.35, shadowRadius: 24, elevation: 6,
                opacity: loading ? 0.6 : 1,
              }}>
              {loading
                ? <ActivityIndicator color="#060A13" size="small" />
                : <Text style={{ color: '#060A13', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 }}>Sign In</Text>
              }
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#3D4F65', fontSize: 11, textAlign: 'center', marginTop: 24 }}>
            Nations of Sky © {new Date().getFullYear()} · Merge HR Portal v2.0
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HOME SCREEN
   ═══════════════════════════════════════════════════════════════ */
const HomeScreen = ({ dark, employee, isClockedIn, checkingIn, checkingOut, unreadCount,
  onCheckIn, onCheckOut, onNav }) => {
  const t = useT(dark);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fadeAnim.setValue(0); slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const initials = employee
    ? (employee.first_name?.[0] || '') + (employee.last_name?.[0] || '')
    : '??';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Logo dark={dark} />
        <TouchableOpacity onPress={() => onNav('notifications')} activeOpacity={0.7}
          style={{
            width: 44, height: 44, borderRadius: 22, backgroundColor: t.card,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.border,
          }}>
          <Text style={{ fontSize: 20 }}>🔔</Text>
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute', top: 2, right: 2, backgroundColor: t.red,
              borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Greeting + Date */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: t.sub, fontWeight: '500' }}>{getGreeting()}</Text>
          <Text style={{ fontSize: 11, color: t.sub, marginTop: 2, fontWeight: '400' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Employee Card */}
        {employee ? (
          <TouchableOpacity onPress={() => onNav('profile')} activeOpacity={0.8}
            style={{
              backgroundColor: t.card, borderRadius: 20, padding: 20, marginBottom: 16,
              flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: t.goldBorder,
            }}>
            <View style={{
              width: 54, height: 54, borderRadius: 27, backgroundColor: t.gold,
              alignItems: 'center', justifyContent: 'center', marginRight: 16,
              shadowColor: t.gold, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
            }}>
              <Text style={{ color: '#060A13', fontWeight: '800', fontSize: 20 }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 17 }}>{employee.first_name} {employee.last_name}</Text>
              <Text style={{ color: t.sub, fontSize: 13, marginTop: 2 }}>{employee.job_title || employee.position} · {employee.department}</Text>
            </View>
            <View style={{ backgroundColor: t.goldDim, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
              <Text style={{ color: t.gold, fontSize: 12, fontWeight: '700' }}>Profile ›</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ backgroundColor: t.card, borderRadius: 20, padding: 30, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
            <ActivityIndicator color={t.gold} />
          </View>
        )}

        {/* Attendance Card */}
        <View style={{
          backgroundColor: t.card, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: t.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={{
              width: 10, height: 10, borderRadius: 5, backgroundColor: isClockedIn ? t.green : t.sub, marginRight: 10,
              shadowColor: isClockedIn ? t.green : 'transparent', shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isClockedIn ? 0.6 : 0, shadowRadius: isClockedIn ? 8 : 0,
            }} />
            <Text style={{ fontSize: 13, color: t.sub, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {isClockedIn ? 'Currently Clocked In' : "Today's Attendance"}
            </Text>
            {isClockedIn && <Badge dark={dark} label="ACTIVE" color={t.green} />}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <AppBtn dark={dark} icon="✅" label="Check In" color={t.green}
              loading={checkingIn} disabled={isClockedIn} onPress={onCheckIn} style={{ flex: 1 }} />
            <AppBtn dark={dark} icon="🚪" label="Check Out" color={t.red}
              loading={checkingOut} disabled={!isClockedIn} onPress={onCheckOut} style={{ flex: 1 }} />
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: t.sub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          Quick Actions
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <ActionCard dark={dark} icon="🗺️" label="Location" color={t.blue} onPress={() => onNav('map')} />
          <ActionCard dark={dark} icon="📊" label="History" color={t.green} onPress={() => onNav('history')} />
          <ActionCard dark={dark} icon="🌴" label="Leave" color={t.purple} onPress={() => onNav('leave')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <ActionCard dark={dark} icon="🔐" label="Password" color={t.sub} onPress={() => onNav('change_password')} />
          <ActionCard dark={dark} icon="🏢" label="HR Panel" color={t.indigo} onPress={() => onNav('hr_dashboard')} />
          <ActionCard dark={dark} icon="🚪" label="Logout" color={t.red} onPress={() => supabase.auth.signOut()} />
        </View>

        {/* Footer branding */}
        <View style={{ alignItems: 'center', paddingVertical: 20, marginTop: 10 }}>
          <Text style={{ color: t.border, fontSize: 10, letterSpacing: 1 }}>NATIONS OF SKY · MERGE HR v2.0</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HISTORY SCREEN
   ═══════════════════════════════════════════════════════════════ */
const HistoryScreenComp = ({ dark, employee, goBack }) => {
  const t = useT(dark);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee?.id) return;
    (async () => {
      const { data } = await supabase.from('attendance_records')
        .select('*').eq('employee_id', employee.id)
        .order('attendance_date', { ascending: false }).limit(60);
      setRecords(data || []);
      setLoading(false);
    })();
  }, [employee]);

  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title="Attendance History" onBack={goBack}
        right={<Badge dark={dark} label={`${records.length} records`} />} />
      {loading
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.gold} /></View>
        : records.length === 0
          ? <Empty dark={dark} icon="📋" title="No Records" sub="Your attendance history will appear here after your first check-in." />
          : <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              {records.map((r, i) => {
                const isComplete = r.check_in_time && r.check_out_time;
                const isLate = r.check_in_time && r.check_in_time > '09:15:00';
                return (
                  <View key={r.id || i} style={{
                    backgroundColor: t.card, borderRadius: 14, padding: 16, marginBottom: 10,
                    borderWidth: 1, borderColor: isComplete ? t.green + '25' : t.border,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{fmtDate(r.attendance_date)}</Text>
                      {isComplete
                        ? <Badge dark={dark} label="COMPLETE" color={t.green} />
                        : r.check_in_time
                          ? <Badge dark={dark} label="IN PROGRESS" color={t.amber} />
                          : <Badge dark={dark} label="MISSING" color={t.red} />
                      }
                    </View>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.sub, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Check In</Text>
                        <Text style={{ color: isLate ? t.red : t.text, fontWeight: '700', fontSize: 16 }}>{fmtTime(r.check_in_time)}</Text>
                      </View>
                      <View style={{ width: 1, backgroundColor: t.border }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.sub, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Check Out</Text>
                        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{fmtTime(r.check_out_time)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
      }
    </ScreenWrap>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MY LOCATION SCREEN
   ═══════════════════════════════════════════════════════════════ */
const MyLocationScreenComp = ({ dark, goBack }) => {
  const t = useT(dark);
  const [office, setOffice] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dist, setDist] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('office_location').select('*').eq('is_active', true).single();
      if (data) setOffice(data);
      // Get user location
      let loc = null;
      if (Platform.OS === 'web') {
        loc = await new Promise(res => {
          navigator.geolocation?.getCurrentPosition(
            p => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
            () => res(null), { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      } else {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
            loc = { latitude: p.coords.latitude, longitude: p.coords.longitude };
          }
        } catch (_) {}
      }
      setUserLoc(loc);
      if (data && loc) setDist(haversine(loc.latitude, loc.longitude, data.latitude, data.longitude));
      setLoading(false);
    })();
  }, []);

  const mapUrl = office
    ? `https://www.google.com/maps?q=${office.latitude},${office.longitude}&z=16`
    : null;

  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title="My Location" onBack={goBack} />
      {loading
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.gold} /></View>
        : <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
            {/* Map */}
            <View style={{ height: 240, borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: t.surface }}>
              {Platform.OS !== 'web' && MapView && userLoc
                ? <MapView style={{ flex: 1 }}
                    initialRegion={{
                      latitude: userLoc.latitude, longitude: userLoc.longitude,
                      latitudeDelta: 0.005, longitudeDelta: 0.005,
                    }}>
                    {userLoc && <Marker coordinate={userLoc} title="You" />}
                    {office && <Marker coordinate={{ latitude: office.latitude, longitude: office.longitude }} title="Office" />}
                  </MapView>
                : mapUrl
                  ? <View style={{ flex: 1 }}>
                      <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Office Map" />
                    </View>
                  : <Empty dark={dark} icon="🗺️" title="Map Unavailable" sub="Location data not available on this platform." />
              }
            </View>

            {/* Office Info */}
            {office && (
              <View style={{ backgroundColor: t.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: t.border, marginBottom: 12 }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, marginBottom: 4 }}>{office.name}</Text>
                <Text style={{ color: t.sub, fontSize: 13, marginBottom: 12 }}>
                  Lat: {office.latitude.toFixed(6)} · Lon: {office.longitude.toFixed(6)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <StatBox dark={dark} value={`${office.radius_meters}m`} label="Allowed Radius" color={t.blue} />
                  <StatBox dark={dark} value={dist !== null ? `${dist.toFixed(0)}m` : '—'} label="Your Distance" color={dist !== null && dist <= office.radius_meters ? t.green : t.red} />
                </View>
              </View>
            )}

            {!userLoc && (
              <View style={{ backgroundColor: t.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.amber, fontWeight: '600', fontSize: 14 }}>⚠️ Location access denied</Text>
                <Text style={{ color: t.sub, fontSize: 13, marginTop: 4 }}>Enable location permissions to see your position on the map.</Text>
              </View>
            )}
          </ScrollView>
      }
    </ScreenWrap>
  );
};

/* ═══════════════════════════════════════════════════════════════
   LEAVE REQUEST SCREEN
   ═══════════════════════════════════════════════════════════════ */
const LeaveRequestScreenComp = ({ dark, employee, goBack }) => {
  const t = useT(dark);
  const leaveTypes = ['Annual', 'Sick', 'Emergency', 'Personal', 'Maternity', 'Unpaid'];
  const [type, setType] = useState('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const [tab, setTab] = useState('new');

  useEffect(() => {
    if (!employee?.id) return;
    (async () => {
      const { data } = await supabase.from('leave_requests')
        .select('*').eq('employee_id', employee.id)
        .order('created_at', { ascending: false }).limit(20);
      setMyLeaves(data || []);
    })();
  }, [employee]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate), e = new Date(endDate);
    if (e < s) return 0;
    return Math.ceil((e - s) / 86400000) + 1;
  }, [startDate, endDate]);

  const handleSubmit = async () => {
    if (!startDate || !endDate) return Alert.alert('Missing Dates', 'Please select start and end dates.');
    if (totalDays <= 0) return Alert.alert('Invalid Dates', 'End date must be after start date.');
    if (!reason.trim()) return Alert.alert('Missing Reason', 'Please provide a reason.');
    setSubmitting(true);
    const { error } = await supabase.from('leave_requests').insert([{
      employee_id: employee.id, leave_type: type,
      start_date: startDate, end_date: endDate,
      total_days: totalDays, reason: reason.trim(), status: 'pending',
    }]);
    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Submitted ✓', `Your ${type} leave request for ${totalDays} day(s) has been submitted.`, async () => {
      setStartDate(''); setEndDate(''); setReason('');
      const { data } = await supabase.from('leave_requests')
        .select('*').eq('employee_id', employee.id)
        .order('created_at', { ascending: false }).limit(20);
      setMyLeaves(data || []);
      setTab('history');
    });
  };

  const statusColor = (s) => {
    if (s === 'approved') return t.green;
    if (s === 'rejected') return t.red;
    return t.amber;
  };

  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title="Leave Request" onBack={goBack} />
      {/* Tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: t.surface, borderRadius: 12, padding: 4 }}>
        {['new', 'history'].map(tabKey => (
          <TouchableOpacity key={tabKey} onPress={() => setTab(tabKey)} style={{
            flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
            backgroundColor: tab === tabKey ? t.card : 'transparent',
            shadowColor: tab === tabKey ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: tab === tabKey ? 2 : 0,
          }}>
            <Text style={{ color: tab === tabKey ? t.gold : t.sub, fontWeight: '700', fontSize: 13, letterSpacing: 0.3 }}>
              {tabKey === 'new' ? 'New Request' : 'My Leaves'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'new' ? (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Type selector */}
          <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Leave Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            {leaveTypes.map(lt => (
              <TouchableOpacity key={lt} onPress={() => setType(lt)} style={{
                paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, marginRight: 8,
                backgroundColor: type === lt ? t.gold : t.card,
                borderWidth: 1.5, borderColor: type === lt ? t.gold : t.border,
              }}>
                <Text style={{ color: type === lt ? '#060A13' : t.sub, fontWeight: '700', fontSize: 13 }}>{lt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Dates */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Start Date</Text>
              <TextInput style={{
                height: 50, backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 14,
                color: t.text, fontSize: 14, fontWeight: '500', borderWidth: 1.5, borderColor: t.border,
              }} placeholder="YYYY-MM-DD" placeholderTextColor="#3D4F65" value={startDate} onChangeText={setStartDate} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>End Date</Text>
              <TextInput style={{
                height: 50, backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 14,
                color: t.text, fontSize: 14, fontWeight: '500', borderWidth: 1.5, borderColor: t.border,
              }} placeholder="YYYY-MM-DD" placeholderTextColor="#3D4F65" value={endDate} onChangeText={setEndDate} />
            </View>
          </View>

          {totalDays > 0 && (
            <View style={{ backgroundColor: t.green + '10', borderWidth: 1.5, borderColor: t.green + '25', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center' }}>
              <Text style={{ color: t.green, fontWeight: '700', fontSize: 15 }}>{totalDays} Day{totalDays > 1 ? 's' : ''}</Text>
            </View>
          )}

          {/* Reason */}
          <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Reason</Text>
          <TextInput style={{
            height: 110, backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingTop: 14,
            color: t.text, fontSize: 14, fontWeight: '500', borderWidth: 1.5, borderColor: t.border,
            textAlignVertical: 'top',
          }} placeholder="Describe your reason..." placeholderTextColor="#3D4F65"
            value={reason} onChangeText={setReason} multiline numberOfLines={4} />

          <AppBtn dark={dark} label="Submit Request" icon="📤" color={t.gold} loading={submitting}
            onPress={handleSubmit} style={{ marginTop: 20, marginBottom: 30 }} />
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
          {myLeaves.length === 0
            ? <Empty dark={dark} icon="🌴" title="No Leave Requests" sub="You haven't submitted any leave requests yet." />
            : myLeaves.map((l, i) => (
                <View key={l.id || i} style={{
                  backgroundColor: t.card, borderRadius: 14, padding: 16, marginBottom: 10,
                  borderWidth: 1, borderColor: t.border,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{l.leave_type} Leave</Text>
                    <Badge dark={dark} label={l.status?.toUpperCase()} color={statusColor(l.status)} />
                  </View>
                  <Text style={{ color: t.sub, fontSize: 13 }}>{fmtDate(l.start_date)} — {fmtDate(l.end_date)} · {l.total_days} day(s)</Text>
                  {l.reason && <Text style={{ color: t.sub, fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>"{l.reason}"</Text>}
                </View>
              ))
          }
        </ScrollView>
      )}
    </ScreenWrap>
  );
};

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS SCREEN
   ═══════════════════════════════════════════════════════════════ */
const NotificationsScreenComp = ({ dark, employee, goBack, onRead }) => {
  const t = useT(dark);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!employee?.id) return;
    const { data } = await supabase.from('notifications')
      .select('*')
      .or(`employee_id.eq.${employee.id},employee_id.is.null`)
      .order('created_at', { ascending: false }).limit(50);
    setNotifs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotifs(); }, [employee]);

  const markRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    onRead?.();
  };

  const tagColor = (type) => {
    if (type === 'leave') return t.purple;
    if (type === 'attendance') return t.green;
    if (type === 'system') return t.blue;
    return t.gold;
  };

  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title="Notifications" onBack={goBack}
        right={notifs.filter(n => !n.is_read).length > 0
          ? <TouchableOpacity onPress={async () => {
              const unread = notifs.filter(n => !n.is_read);
              for (const u of unread) await supabase.from('notifications').update({ is_read: true }).eq('id', u.id);
              setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
              onRead?.();
            }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: t.goldDim }}>
              <Text style={{ color: t.gold, fontSize: 11, fontWeight: '700' }}>Mark All Read</Text>
            </TouchableOpacity>
          : null
        } />
      {loading
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.gold} /></View>
        : notifs.length === 0
          ? <Empty dark={dark} icon="🔕" title="No Notifications" sub="You're all caught up. New notifications will appear here." />
          : <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              {notifs.map((n, i) => (
                <TouchableOpacity key={n.id || i} onPress={() => !n.is_read && markRead(n.id)} activeOpacity={0.7}
                  style={{
                    backgroundColor: n.is_read ? t.card : t.card,
                    borderRadius: 14, padding: 16, marginBottom: 10,
                    borderWidth: 1, borderColor: n.is_read ? t.border : t.goldBorder,
                    flexDirection: 'row',
                  }}>
                  {!n.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.gold, marginRight: 12, marginTop: 6 }} />}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                      <Badge dark={dark} label={n.type || 'INFO'} color={tagColor(n.type)} />
                      <Text style={{ color: t.sub, fontSize: 11 }}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</Text>
                    </View>
                    <Text style={{ color: t.text, fontSize: 14, fontWeight: '600', lineHeight: 20 }}>{n.title || n.message || 'Notification'}</Text>
                    {n.message && n.title && <Text style={{ color: t.sub, fontSize: 13, marginTop: 4, lineHeight: 18 }}>{n.message}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
      }
    </ScreenWrap>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PROFILE SCREEN
   ═══════════════════════════════════════════════════════════════ */
const ProfileScreenComp = ({ dark, employee, goBack, setDarkMode, onChangePassword }) => {
  const t = useT(dark);
  const initials = employee
    ? (employee.first_name?.[0] || '') + (employee.last_name?.[0] || '')
    : '??';

  const [stats, setStats] = useState({ days: 0, thisMonth: 0, onTime: 0 });
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    if (!employee?.id) return;
    (async () => {
      const { data: recs } = await supabase.from('attendance_records')
        .select('*').eq('employee_id', employee.id);
      const completed = (recs || []).filter(r => r.check_in_time && r.check_out_time);
      const onTime = completed.filter(r => r.check_in_time <= '09:15:00');
      const thisMonth = completed.filter(r => {
        const d = new Date(r.attendance_date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      setStats({ days: completed.length, thisMonth: thisMonth.length, onTime: onTime.length });

      const { data: lv } = await supabase.from('leave_requests')
        .select('*').eq('employee_id', employee.id).order('created_at', { ascending: false }).limit(10);
      setLeaves(lv || []);
    })();
  }, [employee]);

  const statusColor = (s) => s === 'approved' ? t.green : s === 'rejected' ? t.red : t.amber;

  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title="My Profile" onBack={goBack} />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Avatar Section */}
        <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
          <View style={{
            width: 96, height: 96, borderRadius: 48, backgroundColor: t.gold,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: t.gold, shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35, shadowRadius: 20, elevation: 6,
          }}>
            <Text style={{ color: '#060A13', fontWeight: '900', fontSize: 36 }}>{initials}</Text>
          </View>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 22, marginTop: 14 }}>
            {employee?.first_name} {employee?.last_name}
          </Text>
          <Text style={{ color: t.sub, fontSize: 14, marginTop: 4 }}>{employee?.job_title || employee?.position}</Text>
          <View style={{
            marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
            backgroundColor: t.goldDim, borderWidth: 1, borderColor: t.goldBorder,
          }}>
            <Text style={{ color: t.gold, fontWeight: '700', fontSize: 12, letterSpacing: 0.3 }}>{employee?.department}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 20 }}>
          <StatBox dark={dark} value={stats.days} label="Total Days" color={t.gold} />
          <StatBox dark={dark} value={stats.thisMonth} label="This Month" color={t.blue} />
          <StatBox dark={dark} value={`${stats.days > 0 ? Math.round(stats.onTime / stats.days * 100) : 0}%`} label="On Time" color={t.green} />
        </View>

        {/* Info */}
        <View style={{ backgroundColor: t.card, borderRadius: 16, padding: 4, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: t.border }}>
          <InfoRow dark={dark} label="Email" value={employee?.email} />
          <InfoRow dark={dark} label="Phone" value={employee?.phone} />
          <InfoRow dark={dark} label="Position" value={employee?.position} />
          <InfoRow dark={dark} label="Department" value={employee?.department} />
          <InfoRow dark={dark} label="Joined" value={employee?.hire_date ? fmtDate(employee.hire_date) : '—'} />
        </View>

        {/* Dark Mode Toggle */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: t.card, borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 16,
          borderWidth: 1, borderColor: t.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>{dark ? '🌙' : '☀️'}</Text>
            <Text style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>{dark ? 'Dark Mode' : 'Light Mode'}</Text>
          </View>
          <Switch value={dark} onValueChange={setDarkMode}
            trackColor={{ false: t.border, true: t.gold }}
            thumbColor={dark ? t.goldLight : '#fff'} />
        </View>

        {/* Change Password */}
        <TouchableOpacity onPress={onChangePassword} activeOpacity={0.7}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: t.card, borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 24,
            borderWidth: 1, borderColor: t.border,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>🔐</Text>
            <Text style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>Change Password</Text>
          </View>
          <Text style={{ color: t.sub, fontSize: 18 }}>›</Text>
        </TouchableOpacity>

        {/* Recent Leaves */}
        {leaves.length > 0 && (
          <>
            <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, marginBottom: 10 }}>Recent Leave Requests</Text>
            <View style={{ backgroundColor: t.card, borderRadius: 16, padding: 4, marginHorizontal: 16, marginBottom: 30, borderWidth: 1, borderColor: t.border }}>
              {leaves.slice(0, 5).map((l, i) => (
                <View key={l.id || i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: t.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>{l.leave_type} · {l.total_days}d</Text>
                    <Text style={{ color: t.sub, fontSize: 12 }}>{fmtDate(l.start_date)} — {fmtDate(l.end_date)}</Text>
                  </View>
                  <Badge dark={dark} label={l.status?.toUpperCase()} color={statusColor(l.status)} />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrap>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CHANGE PASSWORD SCREEN
   ═══════════════════════════════════════════════════════════════ */
const ChangePasswordScreenComp = ({ dark, goBack }) => {
  const t = useT(dark);
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!current.trim() || !newPw.trim() || !confirm.trim()) return Alert.alert('Missing Fields', 'Please fill in all fields.');
    if (newPw.length < 6) return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
    if (newPw !== confirm) return Alert.alert('Mismatch', 'New password and confirmation do not match.');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success ✓', 'Your password has been changed successfully.', goBack);
  };

  const PwField = ({ label, value, setValue, show, setShow }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{label}</Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', height: 54,
        backgroundColor: t.inputBg, borderRadius: 14, paddingHorizontal: 16,
        borderWidth: 1.5, borderColor: t.border,
      }}>
        <TextInput style={{ flex: 1, color: t.text, fontSize: 15, fontWeight: '500' }}
          placeholder="••••••••" placeholderTextColor="#3D4F65"
          value={value} onChangeText={setValue} secureTextEntry={!show} />
        <TouchableOpacity onPress={() => setShow(!show)} hitSlop={8}>
          <Text style={{ fontSize: 16, color: t.sub }}>{show ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title="Change Password" onBack={goBack} />
      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{
          backgroundColor: t.card, borderRadius: 18, padding: 24,
          borderWidth: 1, borderColor: t.border, marginBottom: 20,
        }}>
          <PwField label="Current Password" value={current} setValue={setCurrent} show={showCurrent} setShow={setShowCurrent} />
          <PwField label="New Password" value={newPw} setValue={setNewPw} show={showNew} setShow={setShowNew} />
          <PwField label="Confirm New Password" value={confirm} setValue={confirm} show={showNew} setShow={setShowNew} />
          <AppBtn dark={dark} label="Update Password" icon="🔒" color={t.gold} loading={loading} onPress={handleChange} />
        </View>
        <Text style={{ color: t.sub, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
          Use a strong password with at least 6 characters including numbers and special characters.
        </Text>
      </ScrollView>
    </ScreenWrap>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HR DASHBOARD SCREEN (Minimal)
   ═══════════════════════════════════════════════════════════════ */
const HRDashboardScreenComp = ({ dark, goBack }) => {
  const t = useT(dark);
  const [employees, setEmployees] = useState([]);
  const [todayRecs, setTodayRecs] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = nowISO();

  useEffect(() => {
    (async () => {
      const [{ data: emps }, { data: recs }, { data: leaves }] = await Promise.all([
        supabase.from('employees').select('id, first_name, last_name, department, position, email').order('first_name'),
        supabase.from('attendance_records').select('*, employees(first_name, last_name, department)').eq('attendance_date', today),
        supabase.from('leave_requests').select('*, employees(first_name, last_name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
      ]);
      setEmployees(emps || []);
      setTodayRecs(recs || []);
      setPendingLeaves(leaves || []);
      setLoading(false);
    })();
  }, []);

  const handleLeaveAction = async (id, status) => {
    const { error } = await supabase.from('leave_requests').update({ status }).eq('id', id);
    if (error) { Alert.alert('Error', error.message); return; }
    setPendingLeaves(prev => prev.filter(l => l.id !== id));
    Alert.alert('Done', `Leave request ${status}.`);
  };

  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title="HR Dashboard" onBack={goBack} />
      {loading
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.gold} size="large" /></View>
        : <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <StatBox dark={dark} value={employees.length} label="Employees" color={t.gold} />
              <StatBox dark={dark} value={todayRecs.length} label="Present Today" color={t.green} />
              <StatBox dark={dark} value={pendingLeaves.length} label="Pending Leaves" color={t.amber} />
            </View>

            {/* Pending Leaves */}
            <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Pending Leave Requests</Text>
            {pendingLeaves.length === 0
              ? <View style={{ backgroundColor: t.card, borderRadius: 14, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: t.border, marginBottom: 16 }}>
                  <Text style={{ color: t.sub, fontSize: 14 }}>No pending requests</Text>
                </View>
              : pendingLeaves.map((l, i) => (
                  <View key={l.id || i} style={{
                    backgroundColor: t.card, borderRadius: 14, padding: 16, marginBottom: 10,
                    borderWidth: 1, borderColor: t.border,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
                        {l.employees?.first_name} {l.employees?.last_name}
                      </Text>
                      <Badge dark={dark} label={l.leave_type} color={t.purple} />
                    </View>
                    <Text style={{ color: t.sub, fontSize: 13 }}>{fmtDate(l.start_date)} — {fmtDate(l.end_date)} · {l.total_days} day(s)</Text>
                    {l.reason && <Text style={{ color: t.sub, fontSize: 12, marginTop: 4 }}>"{l.reason}"</Text>}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <AppBtn dark={dark} label="Approve" color={t.green} onPress={() => handleLeaveAction(l.id, 'approved')} style={{ flex: 1, height: 40 }} />
                      <AppBtn dark={dark} label="Reject" color={t.red} onPress={() => handleLeaveAction(l.id, 'rejected')} style={{ flex: 1, height: 40 }} />
                    </View>
                  </View>
                ))
            }

            {/* Today's Attendance */}
            <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 8 }}>Today's Attendance</Text>
            {todayRecs.length === 0
              ? <View style={{ backgroundColor: t.card, borderRadius: 14, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: t.border, marginBottom: 30 }}>
                  <Text style={{ color: t.sub, fontSize: 14 }}>No check-ins recorded today</Text>
                </View>
              : todayRecs.map((r, i) => (
                  <View key={r.id || i} style={{
                    backgroundColor: t.card, borderRadius: 14, padding: 14, marginBottom: 8,
                    borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center',
                  }}>
                    <View style={{
                      width: 38, height: 38, borderRadius: 19, backgroundColor: t.goldDim,
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}>
                      <Text style={{ color: t.gold, fontWeight: '800', fontSize: 14 }}>
                        {r.employees?.first_name?.[0]}{r.employees?.last_name?.[0]}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>
                        {r.employees?.first_name} {r.employees?.last_name}
                      </Text>
                      <Text style={{ color: t.sub, fontSize: 12 }}>{r.employees?.department}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: t.green, fontWeight: '700', fontSize: 14 }}>{fmtTime(r.check_in_time)}</Text>
                      <Text style={{ color: r.check_out_time ? t.red : t.sub, fontSize: 12 }}>{r.check_out_time ? fmtTime(r.check_out_time) : 'Working'}</Text>
                    </View>
                  </View>
                ))
            }
            <View style={{ height: 30 }} />
          </ScrollView>
      }
    </ScreenWrap>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState('login');
  const [darkMode, setDarkMode] = useState(true);
  const [session, setSession] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [employeeRole, setEmployeeRole] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ── Auth ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) setScreen('home');
    });
    const { data: { sub } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) setScreen('home'); else { setScreen('login'); setEmployee(null); }
    });
    return () => sub.unsubscribe();
  }, []);

  /* ── Employee data ── */
  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const { data } = await supabase.from('employees').select('*').eq('email', session.user.email);
      if (data?.length > 0) setEmployee(data[0]);
    })();
  }, [session]);

  useEffect(() => {
    if (!employee?.id) return;
    (async () => {
      if (employee.role_id) {
        const { data } = await supabase.from('roles').select('name').eq('id', employee.role_id).single();
        if (data) setEmployeeRole(data.name);
      }
      fetchUnread();
      checkTodayStatus();
    })();
  }, [employee]);

  const fetchUnread = async () => {
    if (!employee?.id) return;
    const { count } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .or(`employee_id.eq.${employee.id},employee_id.is.null`)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const checkTodayStatus = async () => {
    if (!employee?.id) return;
    const { data } = await supabase.from('attendance_records')
      .select('*').eq('employee_id', employee.id).eq('attendance_date', nowISO()).maybeSingle();
    setIsClockedIn(!!(data && data.check_in_time && !data.check_out_time));
  };

  /* ── Location helpers ── */
  const getOffice = async () => {
    const { data } = await supabase.from('office_location').select('*').eq('is_active', true).single();
    return data;
  };

  const getUserLoc = async () => {
    if (Platform.OS === 'web') {
      return new Promise(res => {
        navigator.geolocation?.getCurrentPosition(
          p => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          () => res(null), { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
      ]);
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch (_) { return null; }
  };

  /* ── Check In ── */
  const handleCheckIn = async () => {
    if (!employee) return;
    setCheckingIn(true);
    const [office, userLoc] = await Promise.all([getOffice(), getUserLoc()]);
    if (!office || !userLoc) {
      Alert.alert('Location Error', 'Could not determine your location. Please enable GPS and try again.');
      setCheckingIn(false); return;
    }
    const dist = haversine(userLoc.latitude, userLoc.longitude, office.latitude, office.longitude);
    if (dist > office.radius_meters) {
      Alert.alert('Out of Range', `You are ${dist.toFixed(0)}m away from the office.\nAllowed radius: ${office.radius_meters}m.`);
      setCheckingIn(false); return;
    }
    const today = nowISO(), time = nowTime();
    const { data: existing } = await supabase.from('attendance_records')
      .select('id').eq('employee_id', employee.id).eq('attendance_date', today).maybeSingle();
    if (existing) {
      Alert.alert('Already Checked In', 'You have already checked in today.');
      setCheckingIn(false); return;
    }
    const { error } = await supabase.from('attendance_records').insert([{
      employee_id: employee.id, attendance_date: today,
      check_in_time: time, office_id: office.id,
    }]);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Checked In ✓', `Time: ${fmtTime(time)}\nDistance: ${dist.toFixed(0)}m from office.`); setIsClockedIn(true); }
    setCheckingIn(false);
  };

  /* ── Check Out ── */
  const handleCheckOut = async () => {
    if (!employee) return;
    setCheckingOut(true);
    const today = nowISO(), time = nowTime();
    const { data: rec } = await supabase.from('attendance_records')
      .select('*').eq('employee_id', employee.id).eq('attendance_date', today).maybeSingle();
    if (!rec) { Alert.alert('Not Checked In', 'You need to check in first.'); setCheckingOut(false); return; }
    if (rec.check_out_time) { Alert.alert('Already Checked Out', 'You already checked out today.'); setCheckingOut(false); return; }
    const { error } = await supabase.from('attendance_records').update({ check_out_time: time }).eq('id', rec.id);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Checked Out ✓', `Time: ${fmtTime(time)}`); setIsClockedIn(false); }
    setCheckingOut(false);
  };

  /* ── Role check ── */
  const adminIds = ['a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'];
  const isHROrAdmin = employeeRole === 'admin' || employeeRole === 'manager' || adminIds.includes(employee?.role_id);

  /* ── Navigate helper ── */
  const nav = useCallback((s) => setScreen(s), []);

  /* ── Render ── */
  const renderScreen = () => {
    if (screen === 'login') return <LoginScreen onLogin={() => setScreen('home')} />;

    if (screen === 'home') return (
      <SafeAreaView style={{ flex: 1 }}>
        <HomeScreen dark={darkMode} employee={employee} isClockedIn={isClockedIn}
          checkingIn={checkingIn} checkingOut={checkingOut} unreadCount={unreadCount}
          onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} onNav={nav} />
      </SafeAreaView>
    );

    if (screen === 'history') return <HistoryScreenComp dark={darkMode} employee={employee} goBack={() => nav('home')} />;
    if (screen === 'map') return <MyLocationScreenComp dark={darkMode} goBack={() => nav('home')} />;
    if (screen === 'leave') return <LeaveRequestScreenComp dark={darkMode} employee={employee} goBack={() => nav('home')} />;
    if (screen === 'notifications') return <NotificationsScreenComp dark={darkMode} employee={employee} goBack={() => nav('home')} onRead={fetchUnread} />;
    if (screen === 'profile') return <ProfileScreenComp dark={darkMode} employee={employee} goBack={() => nav('home')} setDarkMode={setDarkMode} onChangePassword={() => nav('change_password')} />;
    if (screen === 'change_password') return <ChangePasswordScreenComp dark={darkMode} goBack={() => nav('home')} />;
    if (screen === 'hr_dashboard') return <HRDashboardScreenComp dark={darkMode} goBack={() => nav('home')} />;

    return null;
  };

  return (
    <SafeAreaProvider>
      {renderScreen()}
    </SafeAreaProvider>
  );
}
