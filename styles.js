import { StyleSheet } from "react-native";

export const getStyles = (darkMode) =>
  StyleSheet.create({

    // ─── Global ───────────────────────────────────────────
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backgroundColor: darkMode ? "#121212" : "#F4F6F9",
    },

    logo: {
      fontSize: 36,
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#1A1A2E",
      marginBottom: 5,
    },

    slogan: {
      fontSize: 14,
      color: darkMode ? "#cccccc" : "#666",
      marginBottom: 25,
    },

    input: {
      width: "100%",
      height: 50,
      backgroundColor: darkMode ? "#1E1E1E" : "#ffffff",
      borderColor: darkMode ? "#333" : "#DDDDDD",
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 15,
      marginBottom: 12,
      color: darkMode ? "#ffffff" : "#1A1A2E",
    },

    buttonWrapper: {
      width: "100%",
      marginBottom: 12,
    },

    // ─── Home Profile Card ────────────────────────────────
    profileCard: {
      width: "100%",
      padding: 20,
      borderRadius: 14,
      backgroundColor: darkMode ? "#1E1E1E" : "#ffffff",
      marginBottom: 20,
      elevation: 3,
      alignItems: "center",
      borderWidth: 1,
      borderColor: darkMode ? "#333" : "#EEEEEE",
    },

    empName: {
      fontSize: 22,
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#1A1A2E",
      marginBottom: 4,
    },

    empInfo: {
      fontSize: 14,
      color: darkMode ? "#AAAAAA" : "#777777",
    },

    // ─── History Screen ───────────────────────────────────
    historyItem: {
      padding: 15,
      marginBottom: 10,
      borderRadius: 12,
      backgroundColor: darkMode ? "#1E1E1E" : "#ffffff",
      borderWidth: 1,
      borderColor: darkMode ? "#333" : "#EEEEEE",
      elevation: 2,
    },

    historyText: {
      color: darkMode ? "#ffffff" : "#1A1A2E",
      fontSize: 14,
    },

    historySubText: {
      color: darkMode ? "#AAAAAA" : "#777777",
      fontSize: 12,
      marginTop: 4,
    },

    // ─── Shared Card ──────────────────────────────────────
    card: {
      width: "100%",
      padding: 16,
      borderRadius: 14,
      backgroundColor: darkMode ? "#1E1E1E" : "#ffffff",
      borderWidth: 1,
      borderColor: darkMode ? "#333333" : "#EEEEEE",
      marginBottom: 14,
      elevation: 2,
    },

    cardTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#1A1A2E",
      marginBottom: 10,
    },

    // ─── Screen Header (تم تعديله ليكون مرناً) ──────────────
    screenHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 10, // تقليل المساحة لأن SafeAreaView ستتكفل بالباقي
      paddingBottom: 14,
      backgroundColor: darkMode ? "#1A1A1A" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? "#333" : "#EEEEEE",
      width: "100%",
    },

    screenTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#1A1A2E",
      marginLeft: 12,
      flex: 1,
    },

    backButton: {
      fontSize: 22,
      color: "#2E86C1",
    },

    // ─── Empty State (تمت إضافته لتحسين مظهر الشاشات الفارغة) ──
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#1A1A2E",
      marginTop: 15,
    },
    emptySub: {
      fontSize: 14,
      color: darkMode ? "#AAAAAA" : "#777777",
      textAlign: "center",
      marginTop: 8,
    },

    // ─── Leave Request ────────────────────────────────────
    leaveChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      marginRight: 8,
    },

    leaveChipActive: {
      backgroundColor: "#27AE60",
      borderColor: "#27AE60",
    },

    leaveChipInactive: {
      backgroundColor: darkMode ? "#1E1E1E" : "#ffffff",
      borderColor: darkMode ? "#444" : "#DDDDDD",
    },

    leaveChipTextActive: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: 13,
    },

    leaveChipTextInactive: {
      color: darkMode ? "#AAAAAA" : "#555555",
      fontWeight: "600",
      fontSize: 13,
    },

    daysBadge: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      alignItems: "center",
      marginBottom: 12,
      borderColor: "#27AE60",
      backgroundColor: "#27AE6022",
    },

    daysBadgeText: {
      color: "#27AE60",
      fontWeight: "bold",
      fontSize: 15,
    },

    textarea: {
      height: 110,
      paddingTop: 12,
      textAlignVertical: "top",
    },

    // ─── Notifications ────────────────────────────────────
    notifCard: {
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 10,
    },

    notifTag: {
      fontSize: 11,
      fontWeight: "700",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: "flex-start",
    },

    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    // ─── Profile Screen ───────────────────────────────────
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#27AE60",
      alignItems: "center",
      justifyContent: "center",
    },

    avatarText: {
      color: "#ffffff",
      fontSize: 30,
      fontWeight: "bold",
    },

    deptBadge: {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2E86C1",
      backgroundColor: "#2E86C122",
    },

    deptBadgeText: {
      color: "#2E86C1",
      fontWeight: "700",
      fontSize: 12,
    },

    infoRow: {
      flexDirection: "row",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? "#333" : "#EEEEEE",
      alignItems: "center",
    },

    infoLabel: {
      color: darkMode ? "#AAAAAA" : "#777777",
      fontSize: 13,
      width: 110,
    },

    infoValue: {
      color: darkMode ? "#ffffff" : "#1A1A2E",
      fontWeight: "600",
      fontSize: 14,
      flex: 1,
    },

    statBox: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1.5,
      padding: 16,
      alignItems: "center",
    },

    statValue: {
      fontWeight: "bold",
      fontSize: 28,
    },

    statLabel: {
      color: darkMode ? "#AAAAAA" : "#777777",
      fontSize: 12,
      marginTop: 2,
    },

    leaveHistoryRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? "#333" : "#EEEEEE",
    },

    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },

    statusBadgeText: {
      fontWeight: "700",
      fontSize: 12,
    },

    // ─── Notification Bell Badge ──────────────────────────
    bellBadge: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "#E74C3C",
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    bellBadgeText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "bold",
    },

  });