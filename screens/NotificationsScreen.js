import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const TYPE_CONFIG = {
  leave_approved:  { icon: '✅', color: '#27AE60', label: 'Leave Approved' },
  leave_rejected:  { icon: '❌', color: '#E74C3C', label: 'Leave Rejected' },
  leave_pending:   { icon: '⏳', color: '#F39C12', label: 'Leave Pending' },
  reminder:        { icon: '🔔', color: '#2E86C1', label: 'Reminder' },
  announcement:    { icon: '📢', color: '#8E44AD', label: 'Announcement' },
  general:         { icon: '📋', color: '#555555', label: 'General' },
};

export default function NotificationsScreen({ employee, goBack, darkMode }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bg = darkMode ? '#121212' : '#F4F6F9';
  const card = darkMode ? '#1E1E1E' : '#FFFFFF';
  const text = darkMode ? '#FFFFFF' : '#1A1A2E';
  const sub = darkMode ? '#AAAAAA' : '#777777';
  const border = darkMode ? '#333333' : '#EEEEEE';
  const accent = '#2E86C1';

  const fetchNotifications = async () => {
    if (!employee) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`employee_id.eq.${employee.id},employee_id.is.null`)
      .order('created_at', { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [employee]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
    return (
      <TouchableOpacity
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.8}
        style={[s.card, {
          backgroundColor: item.is_read ? card : (darkMode ? '#1A2A1A' : '#F0FFF4'),
          borderColor: item.is_read ? border : cfg.color,
          borderLeftWidth: 4,
        }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 22, marginRight: 12 }}>{cfg.icon}</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[s.tag, { backgroundColor: cfg.color + '22', color: cfg.color }]}>
                {cfg.label}
              </Text>
              {!item.is_read && <View style={[s.dot, { backgroundColor: cfg.color }]} />}
            </View>
            <Text style={{ color: text, fontWeight: item.is_read ? '400' : '700', marginTop: 6, fontSize: 14, lineHeight: 20 }}>
              {item.message}
            </Text>
            <Text style={{ color: sub, fontSize: 11, marginTop: 6 }}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: darkMode ? '#1A1A1A' : '#fff', borderBottomColor: border }]}>
        <TouchableOpacity onPress={goBack}>
          <Text style={{ fontSize: 22, color: accent }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: text }}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={{ color: sub, fontSize: 12 }}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={{ color: accent, fontSize: 13, fontWeight: '600' }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={accent} style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 80 }}>
          <Text style={{ fontSize: 50 }}>🔕</Text>
          <Text style={{ color: sub, marginTop: 12, fontSize: 15 }}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});