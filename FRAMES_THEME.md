# FRAMES Branding & UI Template

**Product Name:** FRAMES (Smart Campus Management)

## 1. Visual Identity Overview

**Philosophy:** Trust-oriented, institutional security, and calm control.
FRAMES is designed to convey a sense of reliability and authority while maintaining an approachable, academic atmosphere. The interface balances high-security signaling with a user-friendly, non-intimidating experience for students and faculty.

## 2. Color Tokens Table

The following palette defines the core visual language of the application.

| Role               | Hex Code  | Token Name       | Usage Guidelines                                                                                  |
| :----------------- | :-------- | :--------------- | :------------------------------------------------------------------------------------------------ |
| **Primary**        | `#0F172A` | `brand-primary`  | **Authority Color.** Use for global headers, side navigation, and primary call-to-action buttons. |
| **Primary Text**   | `#F8FAFC` | `text-on-dark`   | High-contrast text for use on `brand-primary` backgrounds.                                        |
| **Secondary**      | `#F1F5F9` | `ui-surface`     | Secondary containers, sidebars, or panel backgrounds.                                             |
| **Secondary Text** | `#242E42` | `text-body`      | Standard color for body text, headings, and data values.                                          |
| **Accent**         | `#E8F1FC` | `brand-accent`   | Light backgrounds for specific modules (e.g., Student), active state highlights.                  |
| **Accent Text**    | `#163269` | `text-highlight` | Use for links or emphasized text; consistent with `brand-primary`.                                |
| **Success**        | `#2E7D32` | `status-success` | "Present" status, active states, validation confirmation.                                         |
| **Warning**        | `#F9A825` | `status-warning` | "On Break" status, pending states, non-critical alerts.                                           |
| **Danger**         | `#C62828` | `status-danger`  | Security violations, system errors, "Absent" status, destructive actions.                         |

## 3. Application Strategy & Module Branding

To distinguish the user experience while maintaining brand cohesion, specific modules apply color strategies differently:

- **Student Module Strategy:**
  - **Backgrounds:** Use the **Accent Color (`#E8F1FC`)** as the primary background for student-facing pages. This lighter, airier tone creates a **non-intimidating, academic feel**, reducing visual stress while keeping the institutional connection clear.
  - **Context:** This approach softens the "security" aspect for students, framing the app as a supportive tool rather than just a monitoring system.

## 4. Component Styling

Components should feel modern, approachable, and consistent with the "Smart Campus" aesthetic.

- **Dashboard Cards:**
  - **Rounding:** Use a border radius of **8px** to **12px**. This softens the UI, contributing to the "Calm Control" philosophy.
  - **Shadows:** Apply **soft, diffused shadows** (e.g., `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`). Avoid harsh, dark shadows. The goal is to lift content gently off the background.
  - **Surface:** Use pure white (`#FFFFFF`) for card backgrounds to ensure data readability against the `#E6E9F0` or `#E8F1FC` page backgrounds.

## 5. Security Signaling

Consistency is key to maintaining trust in a security-critical application.

- **The "Authority" Color:** The **Primary Navy (`#163269`)** is the designated **"Authority" color**.
- **Usage Rule:** This color must remain **consistent across all modules** (Admin, Faculty, and Student). It serves as the visual anchor that signals **reliability, official status, and institutional trust**. usage in headers and navigation ensures users always know they are within the secure FRAMES environment.

## 6. Layout & Navigation Standards

To ensure a cohesive user experience, the following layout standards are applied globally, particularly within the Student Module.

### A. Header (Universal)

- **Height:** Fixed at **80px**.
- **Styling:** White background (`#FFFFFF`) with a subtle bottom border (`1px solid #E2E8F0`) and shadow (`0 2px 5px rgba(0,0,0,0.1)`).
- **Content:** Minimalist. Contains only the **Notification Bell** and **Page Title** (Slate Grey `#334155`, Font Weight `700`).
- **Z-Index:** Fixed positioning with `z-index: 1001` to stay above content.

### B. Global Style Reference (CSS Classes)

To ensure consistency, use the following global classes defined in `GlobalDashboard.css`:

| Component         | Class Name              | Description                                          |
| :---------------- | :---------------------- | :--------------------------------------------------- |
| **Card**          | `.frames-card`          | White bg, 12px radius, soft shadow, hover lift.      |
| **Sidebar**       | `.frames-sidebar`       | Navy bg (#0F172A), 250px width, collapsible to 80px. |
| **Sidebar Link**  | `.frames-sidebar-link`  | 44px height, 10px padding, hover effects.            |
| **Toggle Button** | `.frames-header-toggle` | Navy square (36x36px), 8px radius, white icon.       |

### C. Sidebar (Primary Navigation)

- **Structure:**
  - **Brand Header:** Clear logo and "FRAMES" text at the top.
  - **Main Navigation:** Central scrollable list of links.
  - **User Footer:** Profile information (Avatar, Name, Role) is anchored at the bottom.
- **Interactivity:**
  - **User Profile:** The footer area is **clickable**, linking directly to the full `/profile` page.
  - **Logout:** A dedicated logout button icon sits adjacent to the profile info.
  - **Hover Effects:** Subtle background shifts (`rgba(255,255,255,0.05)`) indicate interactivity without breaking the dark theme.

### C. Responsive Behavior (Mobile)

- **Breakpoint:** Design adapts at **992px** width.
- **Sidebar:** Transforms into a **slide-in drawer** from the left (`transform: translateX(-100%)` to `0`).
- **Toggle:** A **Hamburger Menu** button appears in the top-left of the viewport.
- **Overlay:** A dark backdrop (`rgba(0,0,0,0.5)`) overlays the main content when the sidebar is open to focus user attention and capturing outside clicks to close.

### D. Embedded Page Patterns

- **Context:** Common pages like **Settings** and **Help & Support** are shared across modules but must fit within distinct layouts (e.g., Student Dashboard).
- **Mechanism:** These pages accept an `isEmbedded` prop.
  - **`isEmbedded={true}`:** Hides the internal Header/Footer and resets container padding/margins to fit seamlessly into the `main-content-area`.
  - **`isEmbedded={false}`:** Renders as a standalone page with its own full Header and Footer.
