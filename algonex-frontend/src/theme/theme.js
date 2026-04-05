export const theme = {
  // Ant Design ConfigProvider token overrides
  antd: {
    token: {
      colorPrimary: "#00B4D8",
      colorSuccess: "#22c55e",
      colorWarning: "#f59e0b",
      colorError: "#ef4444",
      colorInfo: "#3b82f6",
      colorBgBase: "#ffffff",
      colorTextBase: "#2c3e50",
      borderRadius: 8,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: 14,
      controlHeight: 40,
    },
    components: {
      Button: {
        colorPrimary: "#00B4D8",
        colorPrimaryHover: "#0891b2",
        borderRadius: 8,
      },
      Card: {
        borderRadiusLG: 16,
      },
      Menu: {
        colorItemBgSelected: "#e0f7fa",
      },
      Tag: {
        borderRadiusSM: 12,
      },
    },
  },

  // Custom tokens for SCSS and non-antd components
  colors: {
    primary: "#00B4D8",
    primaryDark: "#0891b2",
    primaryLight: "#CCF6FF",
    primaryBg: "#EBFBFF",
    accent: "#66E5FF",
    text: {
      primary: "#2c3e50",
      secondary: "#666666",
      muted: "#999999",
    },
    bg: {
      page: "#f8fafc",
      card: "#ffffff",
      section: "#EBFBFF",
    },
    status: {
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },

  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },

  breakpoints: { mobile: 480, tablet: 768, desktop: 1024, wide: 1400 },

  shadows: {
    card: "0 2px 8px rgba(0,0,0,0.06)",
    cardHover: "0 4px 16px rgba(0,0,0,0.1)",
    nav: "0 2px 4px rgba(0,0,0,0.04)",
  },

  radius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 },
};
