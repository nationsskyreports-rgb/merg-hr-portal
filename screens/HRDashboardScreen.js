import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import { supabase } from "../supabase";

const { width } = Dimensions.get("window");

// ─── COLORS ───────────────────────────────────────────────
const C = {
  bg: "#0F1117",
  card: "#1A1D27",
  cardBorder: "#2A2D3E",
  accent: "#6C63FF",
  accentLight: "#8B85FF",
  accentBg: "rgba(108, 99, 255, 0.15)",
  green: "#22C55E",
  greenBg: "rgba(34, 197, 94, 0.15)",
  red: "#EF4444",
  redBg: "rgba(239, 68, 68, 0.15)",
  yellow: "#F59E0B",
  yellowBg: "rgba(245, 158, 11, 0.15)",
  blue: "#3B82F6",
  blueBg: "rgba(59, 130, 246, 0.15)",
  text: "#F1F5F9",
  textSub: "#94A3B8",
  textMuted: "#64748B",
  white: "#FFFFFF",
};

// ─── COMPONENTS ───────────────────────────────────────────

const StatCard = ({ icon, label, value, color, bg }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: bg }]}>
      <Text style={styles.statIcon}>{icon}</Text>
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SectionHeader = ({ title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

const Badge = ({ label, color, bg }) => (
  <View style={[styles.badge, { backgroundColor: bg }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// ─── MAIN SCREEN ──────────────────────────────────────────
export default function HRDashboardScreen({ goBack, session }) {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, pendingLeaves: 0 });

  // Attendance
  const [attendance, setAttendance] = useState([]);

  // Leave Requests
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Employees
  const [employees, setEmployees] = useState([]);
  const [empSearch, setEmpSearch] = useState("");

  // Notifications
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg] = useState("");
  const [notifType, setNotifType] = useState("announcement");
  const [notifTarget, setNotifTarget] = useState("all");
  const [notifSending, setNotifSending] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadAttendance(), loadLeaves(), loadEmployees()]);
    setLoading(false);
  };

  const loadStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data: empData } = await supabase.from("employees").select("id").eq("status", "active");
    const { data: attData } = await supabase.from("attendance_records").select("employee_id").eq("attendance_date", today);
    const { data: leaveData } = await supabase.from("leave_requests").select("id").eq("status", "pending");
    const total = empData?.length || 0;
    const present = attData?.length || 0;
    setStats({
      total,
      present,
      absent: total - present,
      pendingLeaves: leaveData?.length || 0,
    });
  };

  const loadAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("attendance_records")
      .select("*, employees(first_name, last_name, employee_code, department)")
      .eq("attendance_date", today)
      .order("check_in_time", { ascending: false });
    setAttendance(data || []);
  };

  const loadLeaves = async () => {
    const { data } = await supabase
      .from("leave_requests")
      .select("*, employees(first_name, last_name, employee_code, department)")
      .order("created_at", { ascending: false });
    setLeaveRequests(data || []);
  };

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, employee_code, first_name, last_name, department, job_title, status, email")
      .order("employee_code");
    setEmployees(data || []);
  };

  const handleLeaveAction = async (id, action) => {
    setLeaveLoading(true);
    await supabase.from("leave_requests").update({ status: action }).eq("id", id);
    await loadLeaves();
    await loadStats();
    setLeaveLoading(false);
  };

  const sendNotification = async () => {
    if (!notifMsg.trim()) {
      Alert.alert("تنبيه", "الرجاء كتابة نص الإشعار");
      return;
    }
    setNotifSending(true);
    try {
      if (notifTarget === "all") {
        const { data: emps } = await supabase.from("employees").select("id").eq("status", "active");
        const inserts = emps.map((e) => ({
          employee_id: e.id,
          type: notifType,
          message: notifMsg,
          is_read: false,
        }));
        await supabase.from("notifications").insert(inserts);
      } else {
        await supabase.from("notifications").insert({
          employee_id: null,
          type: notifType,
          message: notifMsg,
          is_read: false,
        });
      }
      setNotifMsg("");
      setNotifTitle("");
      Alert.alert("تم", "تم إرسال الإشعار بنجاح!");
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ أثناء الإرسال");
    } finally {
      setNotifSending(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      approved: { color: C.green, bg: C.greenBg, label: "موافق" },
      present: { color: C.green, bg: C.greenBg, label: "حاضر" },
      rejected: { color: C.red, bg: C.redBg, label: "مرفوض" },
      pending: { color: C.yellow, bg: C.yellowBg, label: "قيد المراجعة" },
    };
    return configs[status] || { color: C.textSub, bg: C.cardBorder, label: status };
  };

  const filteredEmps = employees.filter(
    (e) =>
      empSearch === "" ||
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.employee_code?.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.department?.toLowerCase().includes(empSearch.toLowerCase())
  );

  const tabs = [
    { id: "overview", label: "الرئيسية", icon: "📊" },
    { id: "attendance", label: "الحضور", icon: "📍" },
    { id: "leaves", label: "الإجازات", icon: "🌴" },
    { id: "employees", label: "الموظفين", icon: "👥" },
    { id: "notifications", label: "إشعار", icon: "🔔" },
  ];

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loaderText}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </Text>
        </View>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← رجوع</Text>
        </TouchableOpacity>
      </View>

      {/* ── TAB BAR ── */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[
                styles.tabItem,
                tab === t.id && styles.tabItemActive,
              ]}
            >
              <Text style={[
                styles.tabLabel,
                tab === t.id && styles.tabLabelActive
              ]}>
                {t.icon} {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── CONTENT ── */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === "overview" && (
          <View>
            <SectionHeader title="إحصائيات اليوم" />
            <View style={styles.statsGrid}>
              <StatCard icon="👥" label="إجمالي الموظفين" value={stats.total} color={C.blue} bg={C.blueBg} />
              <StatCard icon="✅" label="حاضرين" value={stats.present} color={C.green} bg={C.greenBg} />
            </View>
            <View style={styles.statsGrid}>
              <StatCard icon="❌" label="غائبين" value={stats.absent} color={C.red} bg={C.redBg} />
              <StatCard icon="🌴" label="طلبات معلقة" value={stats.pendingLeaves} color={C.yellow} bg={C.yellowBg} />
            </View>

            <SectionHeader title="إجراءات سريعة" />
            <View style={styles.actionsGrid}>
              {[
                { label: "مراجعة الحضور", tab: "attendance", icon: "📍", color: C.blue, bg: C.blueBg },
                { label: "طلبات الإجازة", tab: "leaves", icon: "🌴", color: C.yellow, bg: C.yellowBg },
                { label: "الموظفين", tab: "employees", icon: "👥", color: C.green, bg: C.greenBg },
                { label: "إرسال إشعار", tab: "notifications", icon: "🔔", color: C.accent, bg: C.accentBg },
              ].map((a) => (
                <TouchableOpacity
                  key={a.tab}
                  onPress={() => setTab(a.tab)}
                  style={[styles.actionCard, { backgroundColor: a.bg, borderColor: a.color + "30" }]}
                >
                  <Text style={[styles.actionIcon, { color: a.color }]}>{a.icon}</Text>
                  <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionHeader title="آخر سجلات الحضور" />
            {attendance.slice(0, 4).map((a) => (
              <View key={a.id} style={styles.listItem}>
                <View style={styles.listItemAvatar}>
                  <Text style={styles.listItemAvatarText}>
                    {a.employees?.first_name?.[0]}{a.employees?.last_name?.[0]}
                  </Text>
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>
                    {a.employees?.first_name} {a.employees?.last_name}
                  </Text>
                  <Text style={styles.listItemSubtitle}>
                    {a.employees?.department}
                  </Text>
                </View>
                <View style={styles.listItemRight}>
                  <Text style={styles.timeText}>{a.check_in_time?.slice(0, 5) || "--:--"}</Text>
                  <Text style={styles.timeLabel}>دخول</Text>
                </View>
              </View>
            ))}
            {attendance.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>لا يوجد حضور مسجل اليوم</Text>
              </View>
            )}
          </View>
        )}

        {/* ══ ATTENDANCE TAB ══ */}
        {tab === "attendance" && (
          <View>
            <SectionHeader title="سجلات الحضور" subtitle={`${attendance.length} سجل`} />
            {attendance.map((a) => {
              const st = getStatusConfig(a.status);
              return (
                <View key={a.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>
                        {a.employees?.first_name} {a.employees?.last_name}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {a.employees?.employee_code} · {a.employees?.department}
                      </Text>
                    </View>
                    <Badge label={st.label} color={st.color} bg={st.bg} />
                  </View>
                  <View style={styles.timeRow}>
                    <View style={[styles.timeBox, { backgroundColor: C.greenBg }]}>
                      <Text style={[styles.timeBoxLabel, { color: C.green }]}>دخول</Text>
                      <Text style={[styles.timeBoxValue, { color: C.green }]}>
                        {a.check_in_time?.slice(0, 5) || "---"}
                      </Text>
                    </View>
                    <View style={[styles.timeBox, { backgroundColor: C.redBg }]}>
                      <Text style={[styles.timeBoxLabel, { color: C.red }]}>خروج</Text>
                      <Text style={[styles.timeBoxValue, { color: a.check_out_time ? C.red : C.textMuted }]}>
                        {a.check_out_time?.slice(0, 5) || "---"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {attendance.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>لا يوجد سجلات</Text>
              </View>
            )}
          </View>
        )}

        {/* ══ LEAVES TAB ══ */}
        {tab === "leaves" && (
          <View>
            <SectionHeader title="طلبات الإجازة" subtitle={`${leaveRequests.filter((l) => l.status === "pending").length} قيد المراجعة`} />
            {leaveLoading && <ActivityIndicator color={C.accent} style={{ marginBottom: 10 }} />}
            
            {leaveRequests.map((l) => {
              const st = getStatusConfig(l.status);
              const days = l.start_date && l.end_date
                ? Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24)) + 1
                : 0;
              return (
                <View key={l.id} style={[styles.card, l.status === "pending" && styles.cardHighlight]}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>
                        {l.employees?.first_name} {l.employees?.last_name}
                      </Text>
                      <Text style={styles.cardSubtitle}>{l.employees?.department}</Text>
                    </View>
                    <Badge label={st.label} color={st.color} bg={st.bg} />
                  </View>

                  <View style={styles.leaveInfoRow}>
                    <View style={styles.leaveTag}>
                      <Text style={styles.leaveTagText}>{l.leave_type}</Text>
                    </View>
                    <View style={[styles.leaveTag, { backgroundColor: C.blueBg }]}>
                      <Text style={[styles.leaveTagText, { color: C.blue }]}>{days} يوم</Text>
                    </View>
                  </View>

                  <Text style={styles.dateRange}>
                    📅 {l.start_date} → {l.end_date}
                  </Text>
                  {l.reason && <Text style={styles.reasonText}>💬 {l.reason}</Text>}

                  {l.status === "pending" && (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        onPress={() => handleLeaveAction(l.id, "approved")}
                        style={[styles.actionBtn, { backgroundColor: C.greenBg, borderColor: C.green + "40" }]}>
                        <Text style={[styles.actionBtnText, { color: C.green }]}>✓ موافقة</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleLeaveAction(l.id, "rejected")}
                        style={[styles.actionBtn, { backgroundColor: C.redBg, borderColor: C.red + "40" }]}>
                        <Text style={[styles.actionBtnText, { color: C.red }]}>✗ رفض</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ══ EMPLOYEES TAB ══ */}
        {tab === "employees" && (
          <View>
            <SectionHeader title="قائمة الموظفين" subtitle={`${employees.length} موظف`} />
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={empSearch}
                onChangeText={setEmpSearch}
                placeholder="ابحث بالاسم أو الكود..."
                placeholderTextColor={C.textMuted}
                style={styles.searchInput}
              />
            </View>
            {filteredEmps.map((e) => (
              <View key={e.id} style={styles.listItem}>
                <View style={styles.listItemAvatar}>
                  <Text style={styles.listItemAvatarText}>
                    {e.first_name?.[0]}{e.last_name?.[0]}
                  </Text>
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>
                    {e.first_name} {e.last_name}
                  </Text>
                  <Text style={styles.listItemSubtitle}>
                    {e.job_title} · {e.department}
                  </Text>
                </View>
                <View style={styles.listItemRight}>
                   <Badge 
                     label={e.status === "active" ? "نشط" : "غير نشط"} 
                     color={e.status === "active" ? C.green : C.red} 
                     bg={e.status === "active" ? C.greenBg : C.redBg} 
                   />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ══ NOTIFICATIONS TAB ══ */}
        {tab === "notifications" && (
          <View>
            <SectionHeader title="إرسال إشعار عام" />
            <View style={styles.card}>
              {/* Type Selector */}
              <Text style={styles.inputLabel}>نوع الإشعار</Text>
              <View style={styles.typeSelector}>
                {[
                  { id: "announcement", label: "إعلان", icon: "📢" },
                  { id: "reminder", label: "تذكير", icon: "⏰" },
                  { id: "alert", label: "تنبيه", icon: "🚨" },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setNotifType(t.id)}
                    style={[
                      styles.typeButton,
                      notifType === t.id && styles.typeButtonActive,
                    ]}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      notifType === t.id && styles.typeButtonTextActive
                    ]}>
                      {t.icon} {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message */}
              <Text style={styles.inputLabel}>نص الإشعار</Text>
              <TextInput
                value={notifMsg}
                onChangeText={setNotifMsg}
                placeholder="اكتب نص الإشعار هنا..."
                placeholderTextColor={C.textMuted}
                multiline
                style={styles.textArea}
              />

              {/* Send Button */}
              <TouchableOpacity
                onPress={sendNotification}
                disabled={notifSending}
                style={[styles.sendButton, notifSending && styles.sendButtonDisabled]}
              >
                {notifSending
                  ? <ActivityIndicator color={C.white} />
                  : <Text style={styles.sendButtonText}>📤 إرسال للجميع</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Stats Box */}
            <View style={styles.receiversBox}>
              <Text style={styles.receiversIcon}>👥</Text>
              <View>
                <Text style={styles.receiversLabel}>سيتم الإرسال إلى</Text>
                <Text style={styles.receiversValue}>{stats.total} موظف</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    color: C.textSub,
    marginTop: 12,
    fontSize: 15,
  },
  
  // Header
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
  },
  headerDate: {
    fontSize: 13,
    color: C.textSub,
    marginTop: 4,
  },
  backButton: {
    backgroundColor: C.accentBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backButtonText: {
    color: C.accent,
    fontWeight: "700",
    fontSize: 14,
  },

  // Tabs
  tabBarContainer: {
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabItem: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: "transparent",
  },
  tabItemActive: {
    backgroundColor: C.accent,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSub,
  },
  tabLabelActive: {
    color: C.white,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: C.textSub,
    marginTop: 4,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: C.textSub,
  },

  // Actions
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  actionCard: {
    width: (width - 40 - 12) / 2,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  // List Items
  listItem: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    flexDirection: "row",
    alignItems: "center",
  },
  listItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemAvatarText: {
    color: C.accent,
    fontWeight: "700",
    fontSize: 16,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 14,
  },
  listItemTitle: {
    color: C.text,
    fontWeight: "700",
    fontSize: 15,
  },
  listItemSubtitle: {
    color: C.textSub,
    fontSize: 12,
    marginTop: 3,
  },
  listItemRight: {
    alignItems: "flex-end",
  },
  timeText: {
    color: C.green,
    fontSize: 15,
    fontWeight: "700",
  },
  timeLabel: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  // Cards
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  cardHighlight: {
    borderColor: C.yellow + "60",
    backgroundColor: C.yellow + "08",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  cardTitle: {
    color: C.text,
    fontWeight: "700",
    fontSize: 16,
  },
  cardSubtitle: {
    color: C.textSub,
    fontSize: 12,
    marginTop: 3,
  },
  
  // Time Row
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  timeBoxLabel: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.8,
  },
  timeBoxValue: {
    fontWeight: "700",
    fontSize: 18,
    marginTop: 4,
  },

  // Leaves
  leaveInfoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  leaveTag: {
    backgroundColor: C.accentBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  leaveTagText: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  dateRange: {
    color: C.textSub,
    fontSize: 13,
    marginBottom: 6,
  },
  reasonText: {
    color: C.textMuted,
    fontSize: 12,
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  actionBtnText: {
    fontWeight: "700",
    fontSize: 14,
  },

  // Badge
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    paddingVertical: 14,
    fontSize: 15,
  },

  // Notifications
  inputLabel: {
    color: C.textSub,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  typeButtonActive: {
    backgroundColor: C.accentBg,
    borderColor: C.accent,
  },
  typeButtonText: {
    fontSize: 13,
    color: C.textSub,
    fontWeight: "600",
  },
  typeButtonTextActive: {
    color: C.accent,
  },
  textArea: {
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 16,
    color: C.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.cardBorder,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: C.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: C.textMuted,
  },
  sendButtonText: {
    color: C.white,
    fontWeight: "700",
    fontSize: 16,
  },
  receiversBox: {
    marginTop: 20,
    backgroundColor: C.accentBg,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.accent + "30",
  },
  receiversIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  receiversLabel: {
    color: C.accent,
    fontWeight: "600",
    fontSize: 14,
  },
  receiversValue: {
    color: C.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: C.card,
    borderRadius: 16,
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyText: {
    color: C.textSub,
    fontSize: 15,
    fontWeight: "500",
  },
});
