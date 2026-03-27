import { Text, View, TextInput, Alert, ActivityIndicator, Switch, TouchableOpacity, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import * as Location from 'expo-location';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import HistoryScreen from "./screens/HistoryScreen";
import MyLocationScreen from "./screens/MyLocationScreen";
import LeaveRequestScreen from "./screens/LeaveRequestScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import HRDashboardScreen from "./screens/HRDashboardScreen"; // ✅ جديد

import Logo from './components/Logo';
import { getStyles } from "./styles";

// ─── Wrapper للشاشات الفرعية ──────────────────────────────────
const ScreenWrapper = ({ children, darkMode }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      backgroundColor: darkMode ? '#1A1A1A' : '#ffffff',
    }}>
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
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [employeeRole, setEmployeeRole] = useState(null); // ✅ جديد - role الموظف
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ─── Animation ────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  };

  // ─── Auth ─────────────────────────────────────────────────
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

  // ─── Data Fetching ────────────────────────────────────────
  const getEmployeeProfile = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('email', session.user.email);
    if (data?.length > 0) setEmployee(data[0]);
  };

  // ✅ جديد - جلب الـ role بتاع الموظف
  const fetchEmployeeRole = async () => {
    if (!employee?.role_id) return;
    const { data } = await supabase
      .from('roles')
      .select('name')
      .eq('id', employee.role_id)
      .single();
    if (data) setEmployeeRole(data.name);
  };

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .or(`employee_id.eq.${employee.id},employee_id.is.null`)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  // ─── تحقق من حالة الموظف النهارده ────────────────────────
  const checkTodayStatus = async () => {
    if (!employee?.id) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("attendance_date", today)
      .maybeSingle();

    setIsClockedIn(!!(data && data.check_in_time && !data.check_out_time));
  };

  // ─── Location Helpers ─────────────────────────────────────
  const getOfficeLocation = async () => {
    const { data } = await supabase
      .from("office_location")
      .select("*")
      .eq("is_active", true)
      .single();
    return data;
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
      ]);
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch (e) {
      return null;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const verifyLocation = async () => {
    const office = await getOfficeLocation();
    const userLoc = await getUserLocation();
    if (!office || !userLoc) return null;
    const distance = calculateDistance(
      userLoc.latitude, userLoc.longitude,
      office.latitude, office.longitude
    );
    if (distance > office.radius_meters) {
      Alert.alert("📍 Out of Range", `You are ${distance.toFixed(0)}m away.\nMax allowed: ${office.radius_meters}m`);
      return null;
    }
    return { office, distance };
  };

  // ─── Check In ────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!employee) return;
    setCheckingIn(true);
    const result = await verifyLocation();
    if (!result) { setCheckingIn(false); return; }
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0];
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("employee_id", employee.id)
      .eq("attendance_date", today)
      .maybeSingle();
    if (existing) {
      Alert.alert("⚠️ Already Checked In", "You already checked in today.");
      setCheckingIn(false);
      return;
    }
    const { error } = await supabase.from("attendance_records").insert([{
      employee_id: employee.id,
      attendance_date: today,
      check_in_time: currentTime,
      office_id: result.office.id,
    }]);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("✅ Checked In!", `Time: ${currentTime.slice(0, 5)}\nDistance: ${result.distance.toFixed(0)}m`);
      setIsClockedIn(true);
    }
    setCheckingIn(false);
  };

  // ─── Check Out ────────────────────────────────────────────
  const handleCheckOut = async () => {
    if (!employee) return;
    setCheckingOut(true);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0];
    const { data: todayRecord } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("attendance_date", today)
      .maybeSingle();
    if (!todayRecord) {
      Alert.alert("⚠️ Not Checked In", "You haven't checked in today.");
      setCheckingOut(false);
      return;
    }
    if (todayRecord.check_out_time) {
      Alert.alert("⚠️ Already Checked Out", "You already checked out today.");
      setCheckingOut(false);
      return;
    }
    const { error } = await supabase
      .from("attendance_records")
      .update({ check_out_time: currentTime })
      .eq("id", todayRecord.id);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("👋 Checked Out!", `Time: ${currentTime.slice(0, 5)}`);
      setIsClockedIn(false);
    }
    setCheckingOut(false);
  };

  // ─── Colors ───────────────────────────────────────────────
  const bg = darkMode ? '#121212' : '#F4F6F9';
  const text = darkMode ? '#fff' : '#1A1A2E';
  const sub = darkMode ? '#aaa' : '#555';
  const card = darkMode ? '#1E1E1E' : '#fff';
  const border = darkMode ? '#333' : '#DDD';

  // ─── Custom Button ─────────────────────────────────────────
  const AppButton = ({ title, color, onPress, disabled, isLoading }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.75}
      style={{
        backgroundColor: disabled ? (darkMode ? '#333' : '#ccc') : color,
        padding: 15,
        borderRadius: 12,
        marginVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: disabled ? '#000' : color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: disabled ? 0.1 : 0.3,
        shadowRadius: 8,
        elevation: disabled ? 1 : 5,
      }}
    >
      {isLoading && (
        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
      )}
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // ✅ هل الموظف ده HR أو Admin؟
  const isHROrAdmin = true;

  // ─── Screen Routing ────────────────────────────────────────
  const renderScreen = () => {
    if (screen === "history") return (
      <ScreenWrapper darkMode={darkMode}>
        <HistoryScreen employee={employee} goBack={() => setScreen("home")} darkMode={darkMode} />
      </ScreenWrapper>
    );
    if (screen === "map") return (
      <ScreenWrapper darkMode={darkMode}>
        <MyLocationScreen goBack={() => setScreen("home")} darkMode={darkMode} />
      </ScreenWrapper>
    );
    if (screen === "leave") return (
      <ScreenWrapper darkMode={darkMode}>
        <LeaveRequestScreen employee={employee} goBack={() => setScreen("home")} darkMode={darkMode} />
      </ScreenWrapper>
    );
    if (screen === "notifications") return (
      <ScreenWrapper darkMode={darkMode}>
        <NotificationsScreen employee={employee} goBack={() => { setScreen("home"); fetchUnreadCount(); }} darkMode={darkMode} />
      </ScreenWrapper>
    );
    if (screen === "profile") return (
      <ScreenWrapper darkMode={darkMode}>
        <ProfileScreen employee={employee} goBack={() => setScreen("home")} darkMode={darkMode} setDarkMode={setDarkMode} />
      </ScreenWrapper>
    );

    // ✅ جديد - HR Dashboard
    if (screen === "hr_dashboard") return (
      <HRDashboardScreen goBack={() => setScreen("home")} session={session} />
    );

    // ─── Login ───────────────────────────────────────────────
    if (screen === "login") return (
      <SafeAreaView style={styles.container}>
        <Logo darkMode={darkMode} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#777"
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          placeholderTextColor="#777"
          onChangeText={setPassword}
        />
        <AppButton
          title={loading ? "Logging in..." : "Login"}
          color="#2E86C1"
          isLoading={loading}
          onPress={async () => {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) Alert.alert("Login Error", error.message);
            setLoading(false);
          }}
        />
        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: text }}>🌙 Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </SafeAreaView>
    );

    // ─── Home ────────────────────────────────────────────────
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>

        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: 12,
        }}>
          <Logo darkMode={darkMode} />
          <TouchableOpacity
            onPress={() => setScreen("notifications")}
            style={{ position: 'relative', padding: 8 }}
          >
            <Text style={{ fontSize: 26 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Employee Card */}
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          width: '100%',
        }}>
          {employee ? (
            <TouchableOpacity
              onPress={() => setScreen("profile")}
              style={{
                backgroundColor: card,
                borderRadius: 14,
                padding: 14,
                width: '100%',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: border,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{
                width: 50, height: 50, borderRadius: 25,
                backgroundColor: '#27AE60',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>
                  {employee.first_name?.[0]}{employee.last_name?.[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontWeight: 'bold', fontSize: 18 }}>
                  {employee.first_name} {employee.last_name}
                </Text>
                <Text style={{ color: sub, fontSize: 13 }}>
                  {employee.position} • {employee.department}
                </Text>
              </View>
              <Text style={{ color: sub, fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          ) : (
            <ActivityIndicator size="large" color="#27AE60" />
          )}
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={{ width: '100%', opacity: fadeAnim }}>

          {/* Check In / Check Out */}
          <View style={{ flexDirection: 'row', gap: 10, marginVertical: 4 }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="✅ Check In"
                color="#27AE60"
                disabled={isClockedIn}
                isLoading={checkingIn}
                onPress={handleCheckIn}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="🚪 Check Out"
                color="#E74C3C"
                disabled={!isClockedIn}
                isLoading={checkingOut}
                onPress={handleCheckOut}
              />
            </View>
          </View>

          <AppButton title="🗺️ My Location"       color="#2E86C1" onPress={() => setScreen("map")} />
          <AppButton title="📜 Attendance History" color="#117864" onPress={() => setScreen("history")} />
          <AppButton title="🌴 Leave Request"      color="#8E44AD" onPress={() => setScreen("leave")} />

          {/* ✅ زرار HR Dashboard - بيظهر بس للـ HR والـ Admin */}
          {isHROrAdmin && (
            <AppButton
              title="🏢 HR Dashboard"
              color="#6C63FF"
              onPress={() => setScreen("hr_dashboard")}
            />
          )}

          <AppButton title="🚪 Logout" color="#C0392B" onPress={() => supabase.auth.signOut()} />

        </Animated.View>
      </SafeAreaView>
    );
  };

  return (
    <SafeAreaProvider>
      {renderScreen()}
    </SafeAreaProvider>
  );
}