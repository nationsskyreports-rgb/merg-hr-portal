import { View, Text, TextInput, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { supabase } from '../supabase';
import { getStyles } from "../styles"; // استيراد الستايلات الموحدة

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Emergency Leave', 'Unpaid Leave'];

export default function LeaveRequestScreen({ employee, goBack, darkMode }) {
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // استخدام الستايلات الموحدة بناءً على الـ Dark Mode
  const styles = getStyles(darkMode);
  const accent = '#27AE60';

  const validateDate = (dateStr) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d);
  };

  const calcDays = () => {
    if (!validateDate(startDate) || !validateDate(endDate)) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : null;
  };

  const handleSubmit = async () => {
    if (!validateDate(startDate) || !validateDate(endDate)) {
      Alert.alert('Error', 'Please enter valid dates in YYYY-MM-DD format');
      return;
    }
    const days = calcDays();
    if (!days) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please enter a reason for your leave');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('leave_requests').insert([{
      employee_id: employee.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      total_days: days,
      reason: reason.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    }]);

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success ✅', 'Leave request submitted successfully!', [
        { text: 'OK', onPress: goBack }
      ]);
    }
  };

  const days = calcDays();

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? "#121212" : "#F4F6F9" }}>
      
      {/* Header الموحد - سيعالج مشكلة التداخل مع شريط الحالة */}
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Leave Request</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Employee Card باستخدام ستايل الـ Shared Card */}
        {employee && (
          <View style={styles.card}>
            <Text style={{ color: accent, fontWeight: 'bold', fontSize: 16 }}>
              👤 {employee.first_name} {employee.last_name}
            </Text>
            <Text style={styles.historySubText}>
              {employee.position} • {employee.department}
            </Text>
          </View>
        )}

        {/* Leave Type */}
        <Text style={styles.cardTitle}>Leave Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {LEAVE_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setLeaveType(type)}
              style={[
                styles.leaveChip,
                leaveType === type ? styles.leaveChipActive : styles.leaveChipInactive
              ]}
            >
              <Text style={leaveType === type ? styles.leaveChipTextActive : styles.leaveChipTextInactive}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dates */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#777"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#777"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        {/* Days Badge */}
        {days && (
          <View style={styles.daysBadge}>
            <Text style={styles.daysBadgeText}>
              📅 Total: {days} day{days > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Reason */}
        <Text style={styles.cardTitle}>Reason</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Explain your reason..."
          placeholderTextColor="#777"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
        />

        {/* Submit Button بتصميم مخصص */}
        <View style={{ marginTop: 10 }}>
          {loading ? (
            <ActivityIndicator size="large" color={accent} />
          ) : (
            <TouchableOpacity 
              style={[styles.leaveChip, styles.leaveChipActive, { alignItems: 'center', paddingVertical: 15, marginRight: 0 }]} 
              onPress={handleSubmit}
            >
              <Text style={styles.leaveChipTextActive}>Submit Request</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}