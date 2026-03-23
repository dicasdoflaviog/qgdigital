import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // ============================================
      // 🎨 CORES - QG Digital
      // ============================================
      colors: {
        // Tokens shadcn/ui — mapeados para CSS vars do src/index.css
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:            "hsl(var(--sidebar-background))",
          foreground:         "hsl(var(--sidebar-foreground))",
          primary:            "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:             "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:             "hsl(var(--sidebar-border))",
          ring:               "hsl(var(--sidebar-ring))",
        },
        // Azul QG Digital - Cor primária
        qg: {
          blue: {
            900: "#1E3A8A",
            800: "#1E40AF",
            700: "#1D4ED8",
            600: "#2563EB",
            500: "#3B82F6",
            400: "#60A5FA",
            300: "#93C5FD",
            200: "#BFDBFE",
            100: "#DBEAFE",
            50: "#EFF6FF",
          },
          // Status - Sucesso
          green: {
            700: "#15803D",
            600: "#16A34A",
            500: "#22C55E",
            100: "#DCFCE7",
            50: "#F0FDF4",
          },
          // Status - Alerta/Pendente
          amber: {
            700: "#B45309",
            600: "#D97706",
            500: "#F59E0B",
            100: "#FEF3C7",
            50: "#FFFBEB",
          },
          // Status - Erro/Urgente
          red: {
            700: "#B91C1C",
            600: "#DC2626",
            500: "#EF4444",
            100: "#FEE2E2",
            50: "#FEF2F2",
          },
        },
        // Mapa de calor
        heat: {
          low: "#3B82F6",
          medium: "#F59E0B",
          high: "#EF4444",
        },
      },

      // ============================================
      // 📝 TIPOGRAFIA
      // ============================================
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        // Mobile-first sizes
        xs: ["0.75rem", { lineHeight: "1rem" }],       // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }],   // 14px
        base: ["1rem", { lineHeight: "1.5rem" }],      // 16px - mínimo para body
        lg: ["1.125rem", { lineHeight: "1.75rem" }],   // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }],    // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }],     // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px - KPIs
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        // Não usar 600 ou 700
      },

      // ============================================
      // 📐 ESPAÇAMENTO - Grid de 4px
      // ============================================
      spacing: {
        "safe": "env(safe-area-inset-bottom)",
        "4.5": "1.125rem",   // 18px
        "13": "3.25rem",     // 52px
        "15": "3.75rem",     // 60px
        "18": "4.5rem",      // 72px
      },

      // ============================================
      // 📦 COMPONENTES
      // ============================================
      borderRadius: {
        "xl": "0.75rem",    // 12px - inputs
        "2xl": "1rem",      // 16px - cards mobile
        "3xl": "1.5rem",    // 24px - bottom sheets
      },
      boxShadow: {
        // Sombras sutis
        "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "DEFAULT": "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        // Sombra para FAB
        "fab": "0 4px 14px 0 rgb(0 0 0 / 0.15)",
        // Sombra para bottom sheet
        "sheet": "0 -4px 20px 0 rgb(0 0 0 / 0.1)",
      },

      // ============================================
      // 📱 MOBILE UTILITIES
      // ============================================
      height: {
        "touch": "3rem",        // 48px - touch target
        "touch-lg": "3.5rem",   // 56px - FAB
        "header": "3.5rem",     // 56px - mobile header
        "bottom-nav": "4rem",   // 64px - bottom nav
      },
      minHeight: {
        "touch": "3rem",        // 48px
        "touch-lg": "3.5rem",   // 56px
      },
      width: {
        "touch": "3rem",        // 48px
        "touch-lg": "3.5rem",   // 56px
      },
      minWidth: {
        "touch": "3rem",        // 48px
      },

      // ============================================
      // 🎭 ANIMAÇÕES - Rápidas para mobile
      // ============================================
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
      },
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out-expo",
        "slide-down": "slide-down 0.3s ease-out-expo",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },

      // ============================================
      // 📐 Z-INDEX - Organizado
      // ============================================
      // Espelha a escala --z-* do src/index.css (fonte canônica)
      zIndex: {
        "map-base":       "0",
        "map-pane":       "1",
        "map-density":    "30",
        "sidebar":        "40",
        "intel-panel":    "50",
        "bottombar":      "55",
        "fab":            "58",
        "detail-sheet":   "60",
        "map-controls":   "120",
        "dialog":         "150",
        "popover":        "200",
        "select":         "200",
        "toast":          "200",
        "map-select":     "300",
        "modal-elevated": "400",
        "chat-fab":       "450",
        "role-fab":       "500",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Plugin para safe areas
    function({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        ".pt-safe": {
          "padding-top": "env(safe-area-inset-top)",
        },
        ".pb-safe": {
          "padding-bottom": "env(safe-area-inset-bottom)",
        },
        ".pl-safe": {
          "padding-left": "env(safe-area-inset-left)",
        },
        ".pr-safe": {
          "padding-right": "env(safe-area-inset-right)",
        },
        ".touch-manipulation": {
          "touch-action": "manipulation",
        },
        ".tap-highlight-none": {
          "-webkit-tap-highlight-color": "transparent",
        },
      });
    },
  ],
};

export default config;
