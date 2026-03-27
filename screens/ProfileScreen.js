import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import Logo from '../components/Logo'; // ❗ استدعاء الشعار اللي عملناه

export default function ProfileScreen({ employee, goBack, darkMode, setDarkMode }) {
  const [stats, setStats] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. متغيرات الحركة
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // الألوان
  const bg = darkMode ? '#121212' : '#F4F6F9';
  const card = darkMode ? '#1E1E1E' : '#FFFFFF';
  const text = darkMode ? '#FFFFFF' : '#1A1A2E';
  const sub = darkMode ? '#AAAAAA' : '#777777';
  const border = darkMode ? '#333333' : '#EEEEEE';
  const green = '#27AE60';
  const blue = '#2E86C1';

  useEffect(() => {
    if (employee) fetchData();
    
    // 2. تشغيل الحركة
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  }, [employee]);

  const fetchData = async () => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employee.id)
      .gte('attendance_date', firstOfMonth)
      .lte('attendance_date', today);

    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const present = attendance?.length || 0;
    const fullDays = attendance?.filter(r => r.check_in_time && r.check_out_time).length || 0;

    setStats({ present, fullDays });
    setLeaveHistory(leaves || []);
    setLoading(false);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const STATUS_COLOR = { pending: '#F39C12', approved: '#27AE60', rejected: '#E74C3C' };
  const STATUS_ICON = { pending: '⏳', approved: '✅', rejected: '❌' };

  const InfoRow = ({ label, value, icon }) => (
    <View style={[s.row, { borderBottomColor: border }]}>
      <Text style={{ color: sub, fontSize: 13, width: 110 }}>{icon} {label}</Text>
      <Text style={{ color: text, fontWeight: '600', fontSize: 14, flex: 1 }}>{value || '—'}</Text>
    </View>
  );

  const StatBox = ({ label, value, color }) => (
    <View style={[s.statBox, { backgroundColor: color + '18', borderColor: color }]}>
      <Text style={{ color, fontWeight: 'bold', fontSize: 28 }}>{value}</Text>
      <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 20 }}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center' }}>
        <TouchableOpacity onPress={goBack} style={{ position: 'absolute', left: 0 }}>
          <Text style={{ fontSize: 22, color: blue }}>←</Text>
        </TouchableOpacity>
        
        {/* ❗ هنا حطينا الشعار مكان العنوان القديم */}
        <Logo darkMode={darkMode} /> 
      </View>

      {/* 3. تطبيق الحركة على باقي المحتوى */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* Avatar + Name */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={[s.avatar, { backgroundColor: green }]}>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                {employee?.first_name?.[0]}{employee?.last_name?.[0]}
              </Text>
            </View>
            <Text style={{ color: text, fontWeight: 'bold', fontSize: 20, marginTop: 12 }}>
              {employee?.first_name} {employee?.last_name}
            </Text>
            <Text style={{ color: sub, fontSize: 14, marginTop: 4 }}>
              {employee?.position}
            </Text>
            <View style={[s.deptBadge, { backgroundColor: blue + '22', borderColor: blue }]}>
              <Text style={{ color: blue, fontWeight: '700', fontSize: 12 }}>{employee?.department}</Text>
            </View>
          </View>

          {/* Info Card */}
          <View style={[s.card, { backgroundColor: card, borderColor: border, marginBottom: 20 }]}>
            <Text style={[s.sectionTitle, { color: text }]}>Personal Info</Text>
            <InfoRow icon="📧" label="Email" value={employee?.email} />
            <InfoRow icon="📞" label="Phone" value={employee?.phone} />
            <InfoRow icon="🎂" label="Hire Date" value={employee?.hire_date ? formatDate(employee.hire_date) : null} />
            <InfoRow icon="🏢" label="Department" value={employee?.department} />
            <InfoRow icon="💼" label="Position" value={employee?.position} />
          </View>

          {/* Stats */}
          <Text style={[s.sectionTitle, { color: text, marginBottom: 12 }]}>This Month</Text>
          {loading ? (
            <ActivityIndicator color={green} />
          ) : (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <StatBox label="Days Present" value={stats?.present ?? '—'} color={green} />
              <StatBox label="Full Days" value={stats?.fullDays ?? '—'} color={blue} />
            </View>
          )}

          {/* Leave History */}
          <View style={[s.card, { backgroundColor: card, borderColor: border, marginBottom: 20 }]}>
            <Text style={[s.sectionTitle, { color: text }]}>Recent Leave Requests</Text>
            {leaveHistory.length === 0 ? (
              <Text style={{ color: sub, textAlign: 'center', paddingVertical: 16 }}>No leave requests yet</Text>
            ) : (
              leaveHistory.map(item => (
                <View key={item.id} style={[s.leaveRow, { borderBottomColor: border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: text, fontWeight: '600', fontSize: 14 }}>{item.leave_type}</Text>
                    <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>
                      {formatDate(item.start_date)} → {formatDate(item.end_date)} • {item.total_days}d
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: (STATUS_COLOR[item.status] || '#888') + '22' }]}>
                    <Text style={{ color: STATUS_COLOR[item.status] || '#888', fontWeight: '700', fontSize: 12 }}>
                      {STATUS_ICON[item.status]} {item.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Dark Mode Toggle */}
          <View style={[s.card, { backgroundColor: card, borderColor: border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={{ color: text, fontWeight: '600', fontSize: 15 }}>🌙 Dark Mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: green }} />
          </View>

      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  leaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});