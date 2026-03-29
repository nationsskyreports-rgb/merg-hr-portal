import { StyleSheet, Platform } from "react-native";

export const getStyles = (darkMode) =>
  StyleSheet.create({
    // ─── Colors (نظام ثابت زي Web Portal) ───
    colors: {
      primary:     '#D4AF37',
      primaryDark:  '#AA841C',
      primaryLight:'#F4D03F',
      navy:       '#0F172A',
      navyCard:   '#1E293B',
      navyLight:  '#334155',
      surface:    darkMode ? '#1E293B' : '#FFFFFF',
      surface2:   darkMode ? '#0F172A' : '#F1F5F9',
      text:       darkMode ? '#F1F5F9' : '#0F172A',
      sub:       darkMode ? '#94A3B8' : '#64748B',
      border:     darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
      inputBg:    darkMode ? '#0F172A' : '#F9FAFB',
      white:      '#FFFFFF',
      shadow:     darkMode ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.08)',
      shadowCol:   darkMode ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.08)',
      errorRed:    '#EF4444',
      successGr:  '#059669',
      warnAmber:   '#F59E0B',
      blue:       '#3B82F6',
      indigo:     '#4F46E5',
      purple:     '#A855F7',
      pink:       '#EC4899',
    },

    // ─── Login ───────────────────────────────────────────
    loginBg: {
      flex: 1,
      backgroundColor: darkMode ? '#0F172A' : '#F4F6F9',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },

    loginCircle: {
      position: 'absolute',
      top: -120,
      left: -120,
      width: 480,
      height: 480,
      borderRadius: 240,
      backgroundColor: darkMode
        ? 'rgba(15,118,110,0.08)'
        : 'rgba(212,175,55,0.06)',
    },

    loginWatermark: {
      position: 'absolute',
      top: '20%',
      left: 0,
      right: 0,
      alignItems: 'center',
      opacity: darkMode ? 0.03 : 0.06,
      transform: [{ scale: 2.5 }],
    },

    loginWatermarkText: {
      fontSize: 48,
      fontWeight: '900',
      color: darkMode ? '#333' : '#CBD5E1',
      marginTop: 10,
      letterSpacing: 3,
    },

    loginScroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 50,
    },

    loginHeaderBox: {
      marginBottom: 32,
      alignItems: 'center',
    },

    loginBrandSub: {
      fontSize: 12,
      color: darkMode ? '#94A3B8' : '#64748B',
      marginBottom: 6,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },

    loginBrandTitle: {
      fontSize: 34,
      fontWeight: '900',
      color: darkMode ? '#F1F5F9' : '#0F172A',
      letterSpacing: 1,
    },

    loginCard: {
      backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
      borderRadius: 28,
      padding: 28,
      width: '100%',
      borderWidth: 1,
      borderColor: darkMode ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.08)',
      ...Platform.select({
        shadowColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.12,
        shadowRadius: 48,
        elevation: 8,
      }),
    },

    loginWelcomeTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: darkMode ? '#F1F5F9' : '#0F172A',
      marginBottom: 6,
      letterSpacing: -0.3,
    },

    loginWelcomeSub: {
      fontSize: 14,
      color: darkMode ? '#94A3B8' : '#64748B',
      marginBottom: 32,
    },

    inputGroup: {
      marginBottom: 18,
    },

    inputLabel: {
      fontSize: 12,
      color: darkMode ? '#94A3B8' : '#64748B',
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: 8,
      letterSpacing: 0.6,
    },

    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: darkMode ? '#0F172A' : '#F9FAFB',
      borderRadius: 14,
      paddingHorizontal: 18,
      height: 58,
      borderWidth: 1.5,
      borderColor: darkMode ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    },

    input: {
      flex: 1,
      color: darkMode ? '#F1F5F9' : '#0F172A',
      fontSize: 15,
      fontWeight: '500',
    },

    eyeIcon: {
      padding: 10,
    },

    loginButton: {
      height: 58,
      borderRadius: 14,
      backgroundColor: darkMode
        ? 'linear-gradient(135deg, #D4AF37, #F4D03F, #D4AF37)'
        : 'linear-gradient(135deg, #1D4ED8, #3B82F6, #1D4ED8)',
      shadowColor: darkMode
        ? 'rgba(212,175,55,0.35)'
        : 'rgba(29,78,216,0.25)',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 6,
      marginTop: 20,
    },

    loginButtonText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 17,
      letterSpacing: 0.3,
    },

    // ─── Home Screen ─────────────────────────────────────
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 14,
      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
      marginBottom: 20,
      width: '100%',
    },

    profileCard: {
      backgroundColor: darkMode
        ? 'linear-gradient(135deg, #1E293B, #0F172A)'
        : 'linear-gradient(135deg, #FFFFFF, #F1F5F9, #FFFFFF)',
      borderRadius: 22,
      padding: 22,
      marginBottom: 18,
      borderWidth: 0,
      ...Platform.select({
        shadowColor: darkMode
          ? 'rgba(212,175,55,0.2)'
          : 'rgba(0,0,0,0.06)',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.15,
        shadowRadius: 32,
        elevation: 6,
      }),
    },

    empAvatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: 'linear-gradient(135deg, #D4AF37, #F4D03F, #D4AF37)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      shadowColor: 'rgba(212,175,55,0.3)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },

    empAvatarText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 20,
    },

    profileArrow: {
      backgroundColor: darkMode
        ? 'rgba(212,175,55,0.15)'
        : 'rgba(212,175,55,0.08)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },

    profileArrowText: {
      color: darkMode ? '#D4AF37' : '#1D4ED8',
      fontWeight: '700',
      fontSize: 13,
    },

    empInfo: {
      fontSize: 15,
      color: darkMode ? 'rgba(255,255,255,0.65)' : '#64748B',
      marginTop: 3,
    },

    attendanceCard: {
      backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: darkMode
        ? 'rgba(212,175,55,0.12)'
        : 'rgba(29,78,216,0.08)',
      ...Platform.select({
        shadowColor: darkMode
          ? 'rgba(0,0,0,0.15)'
          : 'rgba(0,0,0,0.04)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 28,
        elevation: 4,
      }),
    },

    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
      boxShadow: darkMode
        ? '0 0 0 6px rgba(5,150,105,0.4)'
        : '0 0 0 6px rgba(5,150,105,0.25)',
    },

    statusLabel: {
      fontSize: 12,
      color: darkMode ? '#94A3B8' : '#64748B',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // ─── Action Button (محسّن من Web Portal) ─────────
    actionBtn: {
      flex: 1,
      padding: 18,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(212,175,55,0.25)',
      backgroundColor: 'transparent',
      ...Platform.select({
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      }),
    },

    actionBtnIcon: {
      fontSize: 24,
      marginBottom: 6,
    },

    actionBtnLabel: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.3,
    },

    // ─── Screen Header (منظمط) ─────────────────────
    screenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 14,
      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
      width: '100%',
    },

    screenTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: darkMode ? '#F1F5F9' : '#0F172A',
      marginLeft: 12,
      flex: 1,
      letterSpacing: -0.3,
    },

    backBtn: {
      fontSize: 22,
      color: darkMode ? '#D4AF37' : '#2E86C1',
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: darkMode
        ? 'rgba(212,175,55,0.1)'
        : 'rgba(46,174,230,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ─── Cards General ──────────────────────────────────
    card: {
      width: '100%',
      padding: 18,
      borderRadius: 16,
      backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
      borderWidth: 1,
      borderColor: darkMode ? 'rgba(255,255,255,0.08)' : '#EEEEEE',
      marginBottom: 14,
      ...Platform.select({
        shadowColor: darkMode
          ? 'rgba(0,0,0,0.15)'
          : 'rgba(0,0,0,0.04)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 28,
        elevation: 4,
      }),
    },

    cardTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: darkMode ? '#F1F5F9' : '#0F172A',
      marginBottom: 10,
      letterSpacing: -0.2,
    },

    // ─── History ──────────────────────────────────────
    historyItem: {
      padding: 16,
      marginBottom: 10,
      borderRadius: 14,
      backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
      borderWidth: 1,
      borderColor: darkMode ? '#333333' : '#EEEEEE',
      ...Platform.select({
        shadowColor: darkMode
          ? 'rgba(0,0,0,0.12)'
          : 'rgba(0,0,0,0.03)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 2,
      }),
    },

    historyText: {
      color: darkMode ? '#F1F5F9' : '#0F172A',
      fontSize: 14,
      letterSpacing: -0.2,
    },

    historySubText: {
      color: darkMode ? '#94A3B8' : '#777777',
      fontSize: 12,
      marginTop: 4,
    },

    // ─── Notifications ──────────────────────────────
    notifCard: {
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 10,
      backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
      borderColor: darkMode ? '#333333' : '#EEEEEE',
      ...Platform.select({
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0,
        shadowRadius: 16,
        elevation: 2,
      }),
    },

    notifTag: {
      fontSize: 11,
      fontWeight: '700',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
      letterSpacing: 0.3,
    },

    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    // ─── Profile ──────────────────────────────────
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: 'linear-gradient(135deg, #D4AF37, #F4D03F, #D4AF37)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: 'rgba(212,175,55,0.35)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 5,
    },

    avatarText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 34,
    },

    deptBadge: {
      marginTop: 10,
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(212,175,55,0.25)',
      backgroundColor: 'rgba(212,175,55,0.06)',
    },

    deptBadgeText: {
      color: '#D4AF37',
      fontWeight: '700',
      fontSize: 12,
      letterSpacing: 0.3,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? '#333' : '#EEEEEE',
    },

    infoLabel: {
      color: darkMode ? '#94A3B8' : '#64748B',
      fontSize: 13,
      width: 110,
    },

    infoValue: {
      color: darkMode ? '#F1F5F9' : '#0F172A',
      fontWeight: '600',
      fontSize: 14,
      flex: 1,
      letterSpacing: -0.2,
    },

    statBox: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1.5,
      padding: 18,
      borderColor: darkMode
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.04)',
      backgroundColor: darkMode
        ? 'rgba(212,175,55,0.04)'
        : 'rgba(212,175,55,0.02)',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        shadowColor: darkMode
          ? 'rgba(212,175,55,0.15)'
          : 'rgba(0,0,0,0.04)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 5,
      }),
    },

    statValue: {
      fontWeight: '800',
      fontSize: 30,
      color: darkMode ? '#F1F5F9' : '#0F172A',
      letterSpacing: -1,
    },

    statLabel: {
      color: darkMode ? '#94A3B8' : '#64748B',
      fontSize: 12,
      marginTop: 2,
      letterSpacing: 0.3,
    },

    leaveHistoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? '#333' : '#EEEEEE',
    },

    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },

    statusBadgeText: {
      fontWeight: '700',
      fontSize: 12,
      letterSpacing: 0.3,
    },

    // ─── Notification Bell ──────────────────────────
    bellBadge: {
      position: 'absolute',
      top:: 4,
      right: 4,
      backgroundColor: '#EF4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: darkMode
        ? '0 0 0 8px rgba(239,68,68,0.4)'
        : '0 0 0 8px rgba(239,68,68,0.2)',
    },

    bellBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
    },

    // ─── Empty State ──────────────────────────────
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 50,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: darkMode ? '#F1F5F9' : '#0F172A',
      marginTop: 15,
      letterSpacing: -0.3,
    },

    emptySub: {
      fontSize: 14,
      color: darkMode ? '#94A3B8' : '#777777',
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },

    // ─── Leave Request ──────────────────────────
    leaveChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      marginRight: 8,
    },

    leaveChipActive: {
      backgroundColor: '#059669',
      borderColor: '#059669',
    },

    leaveChipInactive: {
      backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
      borderColor: darkMode ? '#444' : '#DDDDDD',
    },

    leaveChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },

    leaveChipTextInactive: {
      color: darkMode ? '#AAAAAA' : '#555555',
      fontWeight: '600',
      fontSize: 13,
    },

    daysBadge: {
      borderWidth: 1.5,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      marginBottom: 12,
      borderColor: 'rgba(5,150,105,0.3)',
      backgroundColor: 'rgba(5,150,105,0.04)',
    },

    daysBadgeText: {
      color: '#059669',
      fontWeight: 'bold',
      fontSize: 15,
    },

    textarea: {
      height: 110,
      paddingTop: 12,
      textAlignVertical: 'top',
    },

    // ─── Change Password ──────────────────────
    pwField: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      backgroundColor: darkMode ? '#0F172A' : '#F9FAFB',
      borderRadius: 14,
      paddingHorizontal: 18,
      borderWidth: 1.5,
      borderColor: darkMode ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
      flex: 1,
    },

    pwInput: {
      flex: 1,
      color: darkMode ? '#F1F5F9' : '#0F172A',
      fontSize: 15,
      fontWeight: '500',
    },

    pwEye: {
      padding: 10,
    },
  });
