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
  Modal,
  FlatList,
} from "react-native";
import { supabase } from "../supabase";

// ─── COLORS ───────────────────────────────────────────────
const C = {
  bg: "#0F1117",
  card: "#1A1D27",
  cardBorder: "#2A2D3E",
  accent: "#6C63FF",
  accentLight: "#8B85FF",
  accentBg: "#6C63FF20",
  green: "#22C55E",
  greenBg: "#22C55E20",
  red: "#EF4444",
  redBg: "#EF444420",
  yellow: "#F59E0B",
  yellowBg: "#F59E0B20",
  blue: "#3B82F6",
  blueBg: "#3B82F620",
  text: "#F1F5F9",
  textSub: "#94A3B8",
  textMuted: "#475569",
  white: "#FFFFFF",
};

// ─── COMPONENTS ───────────────────────────────────────────

const StatCard = ({ icon, label, value, color, bg }) => (
  <View style={{
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: C.cardBorder,
  }}>
    <View style={{
      width: 40, height: 40,
      borderRadius: 12,
      backgroundColor: bg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
    <Text style={{ fontSize: 22, fontWeight: "700", color, marginBottom: 2 }}>{value}</Text>
    <Text style={{ fontSize: 12, color: C.textSub }}>{label}</Text>
  </View>
);

const SectionHeader = ({ title, subtitle }) => (
  <View style={{ marginBottom: 12, marginTop: 24 }}>
    <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>{title}</Text>
    {subtitle && <Text style={{ fontSize: 13, color: C.textSub, marginTop: 2 }}>{subtitle}</Text>}
  </View>
);

const Badge = ({ label, color, bg }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
    <Text style={{ fontSize: 11, fontWeight: "600", color }}>{label}</Text>
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

  // Reports
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadAttendance(), loadLeaves(), loadEmployees(), loadReport()]);
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

  const loadReport = async () => {
    const { data } = await supabase
      .from("attendance_records")
      .select("attendance_date, status, employees(department)")
      .order("attendance_date", { ascending: false })
      .limit(50);
    setReportData(data || []);
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
      Alert.alert("تنبيه", "اكتب نص الإشعار الأول");
      return;
    }
    setNotifSending(true);
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
    setNotifSending(false);
    Alert.alert("✅ تم", "تم إرسال الإشعار بنجاح!");
  };

  const getStatusColor = (status) => {
    if (status === "approved" || status === "present") return { color: C.green, bg: C.greenBg, label: "✓ موافق" };
    if (status === "rejected") return { color: C.red, bg: C.redBg, label: "✗ مرفوض" };
    if (status === "pending") return { color: C.yellow, bg: C.yellowBg, label: "⏳ قيد المراجعة" };
    return { color: C.textSub, bg: C.cardBorder, label: status };
  };

  const filteredEmps = employees.filter(
    (e) =>
      empSearch === "" ||
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.employee_code?.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.department?.toLowerCase().includes(empSearch.toLowerCase())
  );

  // ── TABS ──
  const tabs = [
    { id: "overview", label: "📊 الرئيسية" },
    { id: "attendance", label: "📍 الحضور" },
    { id: "leaves", label: "🌴 الإجازات" },
    { id: "employees", label: "👥 الموظفين" },
    { id: "notifications", label: "🔔 إشعار" },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={{ color: C.textSub, marginTop: 12, fontSize: 14 }}>جاري تحميل لوحة التحكم...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── HEADER ── */}
      <View style={{
        paddingTop: Platform.OS === "ios" ? 50 : 40,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: C.card,
        borderBottomWidth: 1,
        borderBottomColor: C.cardBorder,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>🏢 HR Dashboard</Text>
          <Text style={{ fontSize: 13, color: C.textSub, marginTop: 2 }}>
            {new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={goBack}
          style={{ backgroundColor: C.accentBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
          <Text style={{ color: C.accent, fontWeight: "600", fontSize: 13 }}>← رجوع</Text>
        </TouchableOpacity>
      </View>

      {/* ── TAB BAR ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.cardBorder }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
              backgroundColor: tab === t.id ? C.accent : "transparent",
              borderWidth: 1,
              borderColor: tab === t.id ? C.accent : C.cardBorder,
            }}>
            <Text style={{
              fontSize: 13,
              fontWeight: "600",
              color: tab === t.id ? C.white : C.textSub,
            }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── CONTENT ── */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === "overview" && (
          <View>
            {/* Stats Row 1 */}
            <SectionHeader title="إحصائيات اليوم" subtitle={`${new Date().toLocaleDateString("ar-EG")}`} />
            <View style={{ flexDirection: "row", marginHorizontal: -4, marginBottom: 12 }}>
              <StatCard icon="👥" label="إجمالي الموظفين" value={stats.total} color={C.blue} bg={C.blueBg} />
              <StatCard icon="✅" label="حاضرين اليوم" value={stats.present} color={C.green} bg={C.greenBg} />
            </View>
            <View style={{ flexDirection: "row", marginHorizontal: -4 }}>
              <StatCard icon="❌" label="غائبين اليوم" value={stats.absent} color={C.red} bg={C.redBg} />
              <StatCard icon="🌴" label="طلبات إجازة" value={stats.pendingLeaves} color={C.yellow} bg={C.yellowBg} />
            </View>

            {/* Quick Actions */}
            <SectionHeader title="إجراءات سريعة" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[
                { label: "📍 مراجعة الحضور", tab: "attendance", color: C.blue, bg: C.blueBg },
                { label: "🌴 طلبات الإجازة", tab: "leaves", color: C.yellow, bg: C.yellowBg },
                { label: "👥 الموظفين", tab: "employees", color: C.green, bg: C.greenBg },
                { label: "🔔 إرسال إشعار", tab: "notifications", color: C.accent, bg: C.accentBg },
              ].map((a) => (
                <TouchableOpacity
                  key={a.tab}
                  onPress={() => setTab(a.tab)}
                  style={{
                    backgroundColor: a.bg,
                    borderRadius: 14,
                    padding: 16,
                    width: "47%",
                    borderWidth: 1,
                    borderColor: a.color + "40",
                  }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: a.color }}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Attendance */}
            <SectionHeader title="آخر سجلات الحضور" subtitle="اليوم" />
            {attendance.slice(0, 5).map((a) => (
              <View key={a.id} style={{
                backgroundColor: C.card,
                borderRadius: 14,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: C.cardBorder,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "600", fontSize: 14 }}>
                    {a.employees?.first_name} {a.employees?.last_name}
                  </Text>
                  <Text style={{ color: C.textSub, fontSize: 12, marginTop: 2 }}>
                    {a.employees?.department} · {a.employees?.employee_code}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: C.green, fontSize: 13, fontWeight: "600" }}>
                    {a.check_in_time?.slice(0, 5) || "--:--"}
                  </Text>
                  <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>دخول</Text>
                </View>
              </View>
            ))}
            {attendance.length === 0 && (
              <View style={{ alignItems: "center", padding: 30 }}>
                <Text style={{ fontSize: 40 }}>📭</Text>
                <Text style={{ color: C.textSub, marginTop: 8 }}>لا يوجد حضور مسجل اليوم</Text>
              </View>
            )}
          </View>
        )}

        {/* ══ ATTENDANCE TAB ══ */}
        {tab === "attendance" && (
          <View>
            <SectionHeader title="سجلات الحضور" subtitle={`اليوم - ${attendance.length} سجل`} />
            {attendance.map((a) => {
              const st = getStatusColor(a.status);
              return (
                <View key={a.id} style={{
                  backgroundColor: C.card,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: C.cardBorder,
                }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                    <View>
                      <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>
                        {a.employees?.first_name} {a.employees?.last_name}
                      </Text>
                      <Text style={{ color: C.textSub, fontSize: 12, marginTop: 2 }}>
                        {a.employees?.employee_code} · {a.employees?.department}
                      </Text>
                    </View>
                    <Badge label={st.label} color={st.color} bg={st.bg} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View style={{ backgroundColor: C.greenBg, padding: 10, borderRadius: 10, flex: 1, alignItems: "center" }}>
                      <Text style={{ color: C.textMuted, fontSize: 11 }}>دخول</Text>
                      <Text style={{ color: C.green, fontWeight: "700", fontSize: 16, marginTop: 2 }}>
                        {a.check_in_time?.slice(0, 5) || "---"}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: C.redBg, padding: 10, borderRadius: 10, flex: 1, alignItems: "center" }}>
                      <Text style={{ color: C.textMuted, fontSize: 11 }}>خروج</Text>
                      <Text style={{ color: a.check_out_time ? C.red : C.textMuted, fontWeight: "700", fontSize: 16, marginTop: 2 }}>
                        {a.check_out_time?.slice(0, 5) || "لم يخرج"}
                      </Text>
                    </View>
                    {a.distance_meters && (
                      <View style={{ backgroundColor: C.blueBg, padding: 10, borderRadius: 10, flex: 1, alignItems: "center" }}>
                        <Text style={{ color: C.textMuted, fontSize: 11 }}>المسافة</Text>
                        <Text style={{ color: C.blue, fontWeight: "700", fontSize: 14, marginTop: 2 }}>
                          {a.distance_meters}م
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            {attendance.length === 0 && (
              <View style={{ alignItems: "center", padding: 40 }}>
                <Text style={{ fontSize: 50 }}>📭</Text>
                <Text style={{ color: C.textSub, marginTop: 10, fontSize: 15 }}>لا يوجد حضور مسجل اليوم</Text>
              </View>
            )}
          </View>
        )}

        {/* ══ LEAVES TAB ══ */}
        {tab === "leaves" && (
          <View>
            <SectionHeader
              title="طلبات الإجازة"
              subtitle={`${leaveRequests.filter((l) => l.status === "pending").length} طلب قيد المراجعة`}
            />
            {leaveLoading && <ActivityIndicator color={C.accent} style={{ marginBottom: 10 }} />}
            {leaveRequests.map((l) => {
              const st = getStatusColor(l.status);
              const days = l.start_date && l.end_date
                ? Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24)) + 1
                : 0;
              return (
                <View key={l.id} style={{
                  backgroundColor: C.card,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: l.status === "pending" ? C.yellow + "60" : C.cardBorder,
                }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                    <View>
                      <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>
                        {l.employees?.first_name} {l.employees?.last_name}
                      </Text>
                      <Text style={{ color: C.textSub, fontSize: 12, marginTop: 2 }}>
                        {l.employees?.department} · {l.employees?.employee_code}
                      </Text>
                    </View>
                    <Badge label={st.label} color={st.color} bg={st.bg} />
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                    <View style={{ backgroundColor: C.accentBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                      <Text style={{ color: C.accent, fontSize: 12, fontWeight: "600" }}>{l.leave_type}</Text>
                    </View>
                    <View style={{ backgroundColor: C.blueBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                      <Text style={{ color: C.blue, fontSize: 12, fontWeight: "600" }}>{days} يوم</Text>
                    </View>
                  </View>

                  <Text style={{ color: C.textSub, fontSize: 13, marginBottom: 4 }}>
                    📅 {l.start_date} → {l.end_date}
                  </Text>
                  {l.reason && (
                    <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 10 }}>💬 {l.reason}</Text>
                  )}

                  {l.status === "pending" && (
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleLeaveAction(l.id, "approved")}
                        style={{ flex: 1, backgroundColor: C.greenBg, borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: C.green + "60" }}>
                        <Text style={{ color: C.green, fontWeight: "700", fontSize: 14 }}>✓ موافقة</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleLeaveAction(l.id, "rejected")}
                        style={{ flex: 1, backgroundColor: C.redBg, borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: C.red + "60" }}>
                        <Text style={{ color: C.red, fontWeight: "700", fontSize: 14 }}>✗ رفض</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
            {leaveRequests.length === 0 && (
              <View style={{ alignItems: "center", padding: 40 }}>
                <Text style={{ fontSize: 50 }}>🌴</Text>
                <Text style={{ color: C.textSub, marginTop: 10 }}>لا توجد طلبات إجازة</Text>
              </View>
            )}
          </View>
        )}

        {/* ══ EMPLOYEES TAB ══ */}
        {tab === "employees" && (
          <View>
            <SectionHeader title="الموظفين" subtitle={`${employees.length} موظف نشط`} />
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: C.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.cardBorder,
              paddingHorizontal: 14,
              marginBottom: 16,
            }}>
              <Text style={{ color: C.textMuted, marginRight: 8 }}>🔍</Text>
              <TextInput
                value={empSearch}
                onChangeText={setEmpSearch}
                placeholder="ابحث بالاسم أو الكود أو القسم..."
                placeholderTextColor={C.textMuted}
                style={{ flex: 1, color: C.text, paddingVertical: 12, fontSize: 14 }}
              />
            </View>
            {filteredEmps.map((e) => (
              <View key={e.id} style={{
                backgroundColor: C.card,
                borderRadius: 14,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: C.cardBorder,
                flexDirection: "row",
                alignItems: "center",
              }}>
                <View style={{
                  width: 44, height: 44,
                  borderRadius: 22,
                  backgroundColor: C.accentBg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 18 }}>
                    {e.first_name?.[0]}{e.last_name?.[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "700", fontSize: 14 }}>
                    {e.first_name} {e.last_name}
                  </Text>
                  <Text style={{ color: C.textSub, fontSize: 12, marginTop: 2 }}>
                    {e.job_title} · {e.department}
                  </Text>
                  <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>{e.email}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: C.accent, fontSize: 12, fontWeight: "600" }}>{e.employee_code}</Text>
                  <View style={{ marginTop: 4, backgroundColor: e.status === "active" ? C.greenBg : C.redBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, color: e.status === "active" ? C.green : C.red, fontWeight: "600" }}>
                      {e.status === "active" ? "نشط" : "غير نشط"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ══ NOTIFICATIONS TAB ══ */}
        {tab === "notifications" && (
          <View>
            <SectionHeader title="إرسال إشعار" subtitle="أرسل إشعار لكل الموظفين" />

            <View style={{
              backgroundColor: C.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: C.cardBorder,
            }}>
              {/* Type Selector */}
              <Text style={{ color: C.textSub, fontSize: 13, marginBottom: 8 }}>نوع الإشعار</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {[
                  { id: "announcement", label: "📢 إعلان" },
                  { id: "reminder", label: "⏰ تذكير" },
                  { id: "alert", label: "🚨 تنبيه" },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setNotifType(t.id)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: "center",
                      backgroundColor: notifType === t.id ? C.accentBg : "transparent",
                      borderWidth: 1,
                      borderColor: notifType === t.id ? C.accent : C.cardBorder,
                    }}>
                    <Text style={{ fontSize: 12, color: notifType === t.id ? C.accent : C.textSub, fontWeight: "600" }}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message */}
              <Text style={{ color: C.textSub, fontSize: 13, marginBottom: 8 }}>نص الإشعار *</Text>
              <TextInput
                value={notifMsg}
                onChangeText={setNotifMsg}
                placeholder="اكتب نص الإشعار هنا..."
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: C.bg,
                  borderRadius: 12,
                  padding: 14,
                  color: C.text,
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: C.cardBorder,
                  minHeight: 100,
                  textAlignVertical: "top",
                  marginBottom: 16,
                }}
              />

              {/* Send Button */}
              <TouchableOpacity
                onPress={sendNotification}
                disabled={notifSending}
                style={{
                  backgroundColor: notifSending ? C.textMuted : C.accent,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                }}>
                {notifSending
                  ? <ActivityIndicator color={C.white} />
                  : <Text style={{ color: C.white, fontWeight: "700", fontSize: 16 }}>📤 إرسال للكل</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={{
              marginTop: 16,
              backgroundColor: C.accentBg,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: C.accent + "40",
              flexDirection: "row",
              alignItems: "center",
            }}>
              <Text style={{ fontSize: 30, marginRight: 12 }}>📊</Text>
              <View>
                <Text style={{ color: C.accent, fontWeight: "700", fontSize: 15 }}>سيتم الإرسال لـ</Text>
                <Text style={{ color: C.text, fontSize: 22, fontWeight: "800", marginTop: 2 }}>
                  {stats.total} موظف
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
