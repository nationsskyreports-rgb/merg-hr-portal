import { Text, View, TextInput, Alert, ActivityIndicator, Switch, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import * as Location from 'expo-location';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import HistoryScreen from "./screens/HistoryScreen";
import MyLocationScreen from "./screens/MyLocationScreen";
import LeaveRequestScreen from "./screens/LeaveRequestScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import HRDashboardScreen from "./screens/HRDashboardScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";
import Logo from './components/Logo';
import { getStyles } from "./styles";

const BRAND_NAVY   = '#0F172A';
const BRAND_CARD   = '#1E293B';
const BRAND_BLUE   = '#1D4ED8';
const BRAND_LIGHT  = '#60A5FA';
const BRAND_GREEN  = '#3AAA35';
const BRAND_INDIGO = '#4F46E5';

const ScreenWrapper = ({ children, darkMode }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: darkMode ? '#0F172A' : '#F8FAFF' }}>
      {children}
    </View>
  );
};

export default function App() {
  const [screen, setScreen] = useState("login");
  const [darkMode, setDarkMode] = useState(false);
  const styles = getStyles(darkMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [employeeRole, setEmployeeRole] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { setScreen("home"); startAnimation(); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) { setScreen("home"); startAnimation(); }
      else setScreen("login");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session?.user) getEmployeeProfile(); }, [session]);
  useEffect(() => { if (employee?.id) { fetchUnreadCount(); checkTodayStatus(); fetchEmployeeRole(); } }, [employee]);

  const getEmployeeProfile = async () => {
    const { data } = await supabase.from('employees').select('*').eq('email', session.user.email);
    if (data?.length > 0) setEmployee(data[0]);
  };

  const fetchEmployeeRole = async () => {
    if (!employee?.role_id) return;
    const { data } = await supabase.from('roles').select('name').eq('id', employee.role_id).single();
    if (data) setEmployeeRole(data.name);
  };

  const fetchUnreadCount = async () => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).or(`employee_id.eq.${employee.id},employee_id.is.null`).eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const checkTodayStatus = async () => {
    if (!employee?.id) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("attendance_records").select("*").eq("employee_id", employee.id).eq("attendance_date", today).maybeSingle();
    setIsClockedIn(!!(data && data.check_in_time && !data.check_out_time));
  };

  const getOfficeLocation = async () => {
    const { data } = await supabase.from("office_location").select("*").eq("is_active", true).single();
    return data;
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
      ]);
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch (e) { return null; }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const verifyLocation = async () => {
    const office = await getOfficeLocation();
    const userLoc = await getUserLocation();
    if (!office || !userLoc) return null;
    const distance = calculateDistance(userLoc.latitude, userLoc.longitude, office.latitude, office.longitude);
    if (distance > office.radius_meters) {
      Alert.alert("📍 Out of Range", `You are ${distance.toFixed(0)}m away.\nMax allowed: ${office.radius_meters}m`);
      return null;
    }
    return { office, distance };
  };

  const handleCheckIn = async () => {
    if (!employee) return;
    setCheckingIn(true);
    const result = await verifyLocation();
    if (!result) { setCheckingIn(false); return; }
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0];
    const { data: existing } = await supabase.from("attendance_records").select("id").eq("employee_id", employee.id).eq("attendance_date", today).maybeSingle();
    if (existing) { Alert.alert("⚠️ Already Checked In", "You already checked in today."); setCheckingIn(false); return; }
    const { error } = await supabase.from("attendance_records").insert([{ employee_id: employee.id, attendance_date: today, check_in_time: currentTime, office_id: result.office.id }]);
    if (error) { Alert.alert("Error", error.message); }
    else { Alert.alert("✅ Checked In!", `Time: ${currentTime.slice(0, 5)}\nDistance: ${result.distance.toFixed(0)}m`); setIsClockedIn(true); }
    setCheckingIn(false);
  };

  const handleCheckOut = async () => {
    if (!employee) return;
    setCheckingOut(true);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0];
    const { data: todayRecord } = await supabase.from("attendance_records").select("*").eq("employee_id", employee.id).eq("attendance_date", today).maybeSingle();
    if (!todayRecord) { Alert.alert("⚠️ Not Checked In", "You haven't checked in today."); setCheckingOut(false); return; }
    if (todayRecord.check_out_time) { Alert.alert("⚠️ Already Checked Out", "You already checked out today."); setCheckingOut(false); return; }
    const { error } = await supabase.from("attendance_records").update({ check_out_time: currentTime }).eq("id", todayRecord.id);
    if (error) { Alert.alert("Error", error.message); }
    else { Alert.alert("👋 Checked Out!", `Time: ${currentTime.slice(0, 5)}`); setIsClockedIn(false); }
    setCheckingOut(false);
  };

  const adminRoles = ['a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'];
  const isHROrAdmin = employeeRole === 'admin' || employeeRole === 'manager' || adminRoles.includes(employee?.role_id);

  const bg    = darkMode ? '#0F172A' : '#F8FAFF';
  const card  = darkMode ? '#1E293B' : '#FFFFFF';
  const text  = darkMode ? '#F1F5F9' : '#111827';
  const sub   = darkMode ? '#94A3B8' : '#6B7280';
  const border = darkMode ? '#334155' : '#E5E7EB';
  const inputBg = darkMode ? '#0F172A' : '#F9FAFB';

  const ActionBtn = ({ icon, label, color, lightColor, onPress, disabled, loading: btnLoading }) => (
    <TouchableOpacity onPress={onPress} disabled={disabled || btnLoading} activeOpacity={0.8}
      style={{ backgroundColor: disabled ? (darkMode ? '#1E293B' : '#F3F4F6'), borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: disabled ? border : color + '40', flex: 1 }}>
      {btnLoading
        ? <ActivityIndicator color={color} size="small" />
        : <>
            <Text style={{ fontSize: 22, marginBottom: 6 }}>{icon}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: disabled ? sub : color }}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  );

  const renderScreen = () => {
    if (screen === "history") return <ScreenWrapper darkMode={darkMode}><HistoryScreen employee={employee} goBack={() => setScreen("home")} darkMode={darkMode} /></ScreenWrapper>;
    if (screen === "map") return <ScreenWrapper darkMode={darkMode}><MyLocationScreen goBack={() => setScreen("home")} darkMode={darkMode} /></ScreenWrapper>;
    if (screen === "leave") return <ScreenWrapper darkMode={darkMode}><LeaveRequestScreen employee={employee} goBack={() => setScreen("home")} darkMode={darkMode} /></ScreenWrapper>;
    if (screen === "notifications") return <ScreenWrapper darkMode={darkMode}><NotificationsScreen employee={employee} goBack={() => { setScreen("home"); fetchUnreadCount(); }} darkMode={darkMode} /></ScreenWrapper>;
    if (screen === "profile") return (
      <ScreenWrapper darkMode={darkMode}>
        <ProfileScreen employee={employee} goBack={() => setScreen("home")} darkMode={darkMode} setDarkMode={setDarkMode} onChangePassword={() => setScreen("change_password")} />
      </ScreenWrapper>
    );
    if (screen === "hr_dashboard") return <HRDashboardScreen goBack={() => setScreen("home")} session={session} />;
    if (screen === "change_password") return <ChangePasswordScreen goBack={() => setScreen("home")} darkMode={darkMode} />;

    // ── LOGIN ──────────────────────────────────────────────────
    if (screen === "login") {
      return (
        <View style={{ flex: 1, backgroundColor: BRAND_NAVY, alignItems: 'center', justifyContent: 'center', padding: 24 }}>

          {/* Logo Area */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: '#1E3A8A', borderWidth: 1, borderColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Logo darkMode={true} />
            </View>
            <Text style={{ color: BRAND_LIGHT, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>Merg HR Portal</Text>
            <Text style={{ color: '#475569', fontSize: 11, marginTop: 4, letterSpacing: 1 }}>Employee Management System</Text>
          </View>

          {/* Card */}
          <View style={{ backgroundColor: BRAND_CARD, borderWidth: 1, borderColor: '#334155', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400 }}>
            <Text style={{ color: '#F1F5F9', fontSize: 20, fontWeight: '500', marginBottom: 4 }}>Welcome back</Text>
            <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 28 }}>Sign in to your account</Text>

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Email</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 14, height: 48 }}>
                <Text style={{ fontSize: 16, marginRight: 10 }}>📧</Text>
                <TextInput
                  style={{ flex: 1, color: '#F1F5F9', fontSize: 14 }}
                  placeholder="example@merge.com"
                  placeholderTextColor="#475569"
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 28 }}>
              <Text style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Password</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 14, height: 48 }}>
                <Text style={{ fontSize: 16, marginRight: 10 }}>🔒</Text>
                <TextInput
                  style={{ flex: 1, color: '#F1F5F9', fontSize: 14 }}
                  placeholder="Enter your password"
                  placeholderTextColor="#475569"
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={async () => { setLoading(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) Alert.alert("Login Error", error.message); setLoading(false); }}
              disabled={loading} activeOpacity={0.85}
              style={{ backgroundColor: BRAND_BLUE, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 20 }}>
              {loading ? <ActivityIndicator color="#fff" /> : <>
                <Text style={{ color: '#fff', fontWeight: '500', fontSize: 15 }}>Sign in</Text>
                <Text style={{ color: '#fff', fontSize: 16, marginLeft: 8 }}>→</Text>
              </>}
            </TouchableOpacity>

            {/* Dark Mode */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={{ color: '#475569', fontSize: 13 }}>🌙 Dark Mode</Text>
              <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#334155', true: BRAND_BLUE }} thumbColor="#fff" />
            </View>
          </View>
        </View>
      );
    }

    // ── HOME ──────────────────────────────────────────────────
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Logo darkMode={darkMode} />
            <TouchableOpacity onPress={() => setScreen("notifications")}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: border }}>
              <Text style={{ fontSize: 20 }}>🔔</Text>
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Employee Card */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {employee ? (
              <TouchableOpacity onPress={() => setScreen("profile")}
                style={{ backgroundColor: BRAND_BLUE, borderRadius: 20, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{employee.first_name?.[0]}{employee.last_name?.[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{employee.first_name} {employee.last_name}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>{employee.job_title || employee.position} · {employee.department}</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 12 }}>Profile ›</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={{ backgroundColor: card, borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center' }}>
                <ActivityIndicator color={BRAND_BLUE} />
              </View>
            )}
          </Animated.View>

          {/* Attendance */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isClockedIn ? BRAND_GREEN : '#94A3B8', marginRight: 8 }} />
                <Text style={{ fontSize: 12, color: sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {isClockedIn ? 'Currently checked in' : "Today's Attendance"}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <ActionBtn icon="✅" label="Check In" color={BRAND_GREEN} onPress={handleCheckIn} disabled={isClockedIn} loading={checkingIn} />
                <ActionBtn icon="🚪" label="Check Out" color="#EF4444" onPress={handleCheckOut} disabled={!isClockedIn} loading={checkingOut} />
              </View>
            </View>

            {/* Quick Actions */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Quick Actions</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <ActionBtn icon="🗺️" label="Location" color="#2563EB" onPress={() => setScreen("map")} />
              <ActionBtn icon="📜" label="History" color="#059669" onPress={() => setScreen("history")} />
              <ActionBtn icon="🌴" label="Leave" color="#7C3AED" onPress={() => setScreen("leave")} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <ActionBtn icon="🔐" label="Password" color="#475569" onPress={() => setScreen("change_password")} />
              {isHROrAdmin && <ActionBtn icon="🏢" label="HR" color={BRAND_INDIGO} onPress={() => setScreen("hr_dashboard")} />}
              <ActionBtn icon="🚪" label="Logout" color="#EF4444" onPress={() => supabase.auth.signOut()} />
            </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    );
  };

  return (
    <SafeAreaProvider>
      {renderScreen()}
    </SafeAreaProvider>
  );
}
