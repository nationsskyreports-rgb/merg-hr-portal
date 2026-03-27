import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { getStyles } from "../styles";

// ─── Helper Functions ──────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "--:--";
  // timeStr ممكن يكون "HH:MM:SS" أو ISO string
  const t = timeStr.includes("T") ? new Date(timeStr) : null;
  if (t) {
    return t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return timeStr.slice(0, 5); // أخد أول 5 حروف "HH:MM"
};

const calcDuration = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  const parseTime = (t) => {
    if (t.includes("T")) return new Date(t);
    const [h, m, s] = t.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, s || 0);
    return d;
  };
  const diff = (parseTime(checkOut) - parseTime(checkIn)) / (1000 * 60);
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 60);
  const mins = Math.round(diff % 60);
  return `${hours}h ${mins}m`;
};

const getStatusInfo = (record) => {
  if (!record.check_in_time) {
    return { label: "Absent", color: "#E74C3C", bg: "#E74C3C18", icon: "✗" };
  }
  if (!record.check_out_time) {
    return { label: "Checked In", color: "#F39C12", bg: "#F39C1218", icon: "◑" };
  }
  return { label: "Present", color: "#27AE60", bg: "#27AE6018", icon: "✓" };
};

// ─── Summary Card ──────────────────────────────────────────────
const SummaryCard = ({ records, darkMode }) => {
  const total = records.length;
  const present = records.filter((r) => r.check_in_time && r.check_out_time).length;
  const absent = records.filter((r) => !r.check_in_time).length;
  const incomplete = records.filter((r) => r.check_in_time && !r.check_out_time).length;

  const bg = darkMode ? "#1E1E1E" : "#ffffff";
  const border = darkMode ? "#333" : "#EEEEEE";
  const textPrimary = darkMode ? "#ffffff" : "#1A1A2E";
  const textSub = darkMode ? "#AAAAAA" : "#777777";

  const stats = [
    { value: total, label: "Total", color: "#2E86C1" },
    { value: present, label: "Present", color: "#27AE60" },
    { value: absent, label: "Absent", color: "#E74C3C" },
    { value: incomplete, label: "Partial", color: "#F39C12" },
  ];

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: border,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: textSub,
          letterSpacing: 1.2,
          marginBottom: 14,
          textTransform: "uppercase",
        }}
      >
        Monthly Summary
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {stats.map((s) => (
          <View key={s.label} style={{ alignItems: "center", flex: 1 }}>
            {/* Progress ring placeholder using a colored circle */}
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                borderWidth: 3,
                borderColor: s.color,
                backgroundColor: s.color + "15",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "800", color: s.color }}>
                {s.value}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: textSub, fontWeight: "600" }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── History Item Card ─────────────────────────────────────────
const HistoryCard = ({ item, darkMode, index }) => {
  const status = getStatusInfo(item);
  const duration = calcDuration(item.check_in_time, item.check_out_time);

  const bg = darkMode ? "#1E1E1E" : "#ffffff";
  const border = darkMode ? "#2a2a2a" : "#F0F0F0";
  const textPrimary = darkMode ? "#ffffff" : "#1A1A2E";
  const textSub = darkMode ? "#AAAAAA" : "#777777";
  const divider = darkMode ? "#2a2a2a" : "#F5F5F5";

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: border,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 },
      }}
    >
      {/* Top strip with color */}
      <View style={{ height: 3, backgroundColor: status.color, opacity: 0.7 }} />

      <View style={{ padding: 14 }}>

        {/* Row 1: Date + Status Badge */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: textPrimary }}>
              {formatDate(item.attendance_date)}
            </Text>
            {item.office_location?.name && (
              <Text style={{ fontSize: 11, color: textSub, marginTop: 2 }}>
                📍 {item.office_location.name}
              </Text>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: status.bg,
              borderWidth: 1,
              borderColor: status.color + "44",
            }}
          >
            <Text style={{ fontSize: 11, color: status.color, marginRight: 4 }}>
              {status.icon}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: status.color }}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: divider, marginBottom: 12 }} />

        {/* Row 2: Check-in / Check-out / Duration */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>

          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 10, color: textSub, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>
              Check In
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: item.check_in_time ? "#27AE60" : textSub }}>
              {formatTime(item.check_in_time)}
            </Text>
          </View>

          {/* Center divider */}
          <View style={{ width: 1, backgroundColor: divider }} />

          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 10, color: textSub, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>
              Check Out
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: item.check_out_time ? "#E74C3C" : textSub }}>
              {formatTime(item.check_out_time)}
            </Text>
          </View>

          {/* Center divider */}
          <View style={{ width: 1, backgroundColor: divider }} />

          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 10, color: textSub, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>
              Duration
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: duration ? "#2E86C1" : textSub }}>
              {duration || "--"}
            </Text>
          </View>

        </View>
      </View>
    </View>
  );
};

// ─── Empty State ───────────────────────────────────────────────
const EmptyState = ({ darkMode }) => (
  <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
    <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
    <Text style={{ fontSize: 17, fontWeight: "700", color: darkMode ? "#fff" : "#1A1A2E", marginBottom: 6 }}>
      No Records Yet
    </Text>
    <Text style={{ fontSize: 13, color: darkMode ? "#AAAAAA" : "#777777", textAlign: "center" }}>
      Your attendance history will appear here once you start checking in.
    </Text>
  </View>
);

// ─── Main Screen ───────────────────────────────────────────────
export default function HistoryScreen({ employee, goBack, darkMode }) {
  const styles = getStyles(darkMode);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from("attendance_records")
      .select(`
        id,
        attendance_date,
        check_in_time,
        check_out_time,
        office_location(name)
      `)
      .eq("employee_id", employee.id)
      .order("attendance_date", { ascending: false });

    setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const bgColor = darkMode ? "#121212" : "#F4F6F9";
  const textPrimary = darkMode ? "#ffffff" : "#1A1A2E";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#1A1A1A" : "#ffffff" }}>
      
      {/* Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Attendance History</Text>
        <TouchableOpacity
          onPress={fetchHistory}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: darkMode ? "#2a2a2a" : "#F0F0F0",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 16 }}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#27AE60" />
            <Text style={{ marginTop: 12, color: darkMode ? "#AAAAAA" : "#777", fontSize: 13 }}>
              Loading records...
            </Text>
          </View>
        ) : (
          <FlatList
            data={records}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 30,
            }}
            ListHeaderComponent={
              records.length > 0 ? (
                <SummaryCard records={records} darkMode={darkMode} />
              ) : null
            }
            ListEmptyComponent={<EmptyState darkMode={darkMode} />}
            renderItem={({ item, index }) => (
              <HistoryCard item={item} darkMode={darkMode} index={index} />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}