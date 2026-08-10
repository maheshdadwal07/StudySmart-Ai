# StudySmart AI Design System

## 1. Overall Design Philosophy

- **Overall visual style**: Modern, clean, and AI-focused with a premium aesthetic. Relies on subtle glassmorphism (`backdrop-filter: blur`), soft layered shadows, and vibrant gradients.
- **Design language**: Highly structured, container-based UI with clear visual hierarchies. Prioritizes readability through rounded corners, distinct borders, and contrasting card surfaces.
- **UI personality**: Professional, smart, trustworthy, and dynamic.
- **Layout philosophy**: Modular panel and card system utilizing CSS Grid and Flexbox. Makes use of fixed sidebars, sticky topbars, and split-screen workspaces for study/document modes.

## 2. Color System

- **Primary**: `#4F46E5` (Indigo)
- **Secondary**: `#6366F1` (Lighter Indigo)
- **Accent**: `#06B6D4` (Cyan)
- **Success**: `#22C55E`
- **Warning**: `#F59E0B`
- **Error/Danger**: `#EF4444`
- **Background (Global)**: `#FFFFFF`
- **Surface**: `#1E293B` (Used occasionally in dark code blocks)
- **Card Background**: `#F8FAFC` (Often paired with `#FFFFFF` for contrast)
- **Border**: `#E5E7EB`
- **Text Primary**: `#111827`
- **Text Secondary/Muted**: `#6B7280` (Also `#9AA1AE` for placeholders and subtle labels)

**Gradient Colors**:
- Primary to Secondary: `linear-gradient(135deg, #4F46E5, #6366F1)`
- Primary to Accent: `linear-gradient(135deg, #4F46E5, #06B6D4)`
- Secondary to Primary (Vertical): `linear-gradient(180deg, #6366F1, #4F46E5)`
- Cyan to Accent (Vertical): `linear-gradient(180deg, #67E8F9, #06B6D4)`

---

## 3. Typography

- **Font Family**: `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif`
- **Font Sizes**:
  - Hero H1: `56px`
  - Page/Upload H1: `26px` - `28px`
  - H2: `32px` - `38px`
  - H3/Stat Numbers: `16.5px` - `26px`
  - H4/Panel Titles: `14px` - `15.5px`
  - Paragraph/Body: `13.5px`, `14px`, `14.5px`
  - Captions/Badges/Labels: `10.5px`, `11px`, `11.5px`, `12.5px`
- **Font Weights**:
  - Regular/Medium: `500` (Body default)
  - Semi-Bold: `600` (Buttons, Nav links, Subtitles)
  - Bold: `700` (Headers, Active states, Labels)
  - Extra Bold: `800` (H1, H2, Stat Numbers, Logo)
- **Heading hierarchy**: Highly distinct using weight `800` and tight letter spacing.
- **Paragraph styles**: Color `var(--text-muted)` (`#6B7280`), weight `500`.
- **Caption styles**: Often uppercase, letter-spacing `0.05em` to `0.08em`, weight `700`.
- **Button text styles**: `14.5px` or `15.5px` (lg), weight `600`.
- **Letter spacing**: `-0.02em` to `-0.03em` for large headers, `0.05em` to `0.08em` for uppercase eyebrow labels.
- **Line height**: `1.6` for general body text, `1.08` for Hero H1, `1.75` - `1.85` for reading/study notes.

---

## 4. Spacing System

The spacing scale is primarily based on a 2px/4px incremental system:
- `2px`, `4px`, `6px`, `8px`, `10px`, `12px`, `14px`, `16px`, `18px`, `20px`, `24px`, `28px`, `32px`, `36px`, `40px`, `48px`, `56px`, `64px`, `72px`, `96px`, `100px`.

**Consistent Application**:
- Component gaps (icons to text, flex items): `8px`, `10px`, `12px`, `14px`
- Component inner padding (buttons, inputs): `10px` to `14px` vertical, `14px` to `22px` horizontal
- Card padding: `20px`, `24px`, `28px`, `32px`
- Section/Page spacing: `32px` container padding, `100px` vertical section padding.

---

## 5. Border Radius

- **Buttons**: `12px` (default), `14px` (large)
- **Cards/Panels**: `16px`, `18px`, `20px` (large cards), `24px` (featured/visual containers)
- **Inputs/Search**: `12px`, `14px` (chat input)
- **Modals/Floating**: `16px`
- **Badges/Chips**: `999px` (pill shape), `10px`, `12px`
- **Icons/Small elements**: `9px`, `11px`, `12px`, `16px` (large icons)

---

## 6. Shadows

- **Card shadows (shadow-sm)**: `0 1px 2px rgba(17,24,39,0.04), 0 1px 3px rgba(17,24,39,0.04)` (dashboard uses `0.05` opacity)
- **Hover shadows (shadow-md)**: `0 4px 16px rgba(17,24,39,0.06), 0 2px 6px rgba(17,24,39,0.04)` (dashboard uses `0 8px 24px rgba(17,24,39,0.06)`)
- **Modal/Featured shadows (shadow-lg)**: `0 20px 50px rgba(79,70,229,0.10), 0 8px 20px rgba(17,24,39,0.06)`
- **Floating elements (Buttons)**: `0 6px 16px rgba(79,70,229,0.28)`
- **Button Hover**: `0 8px 22px rgba(79,70,229,0.38)`
- **Logo Mark**: `0 4px 10px rgba(79,70,229,0.30)`

---

## 7. Button System

**Primary Button**
- Background: `linear-gradient(135deg, var(--primary), var(--secondary))`
- Border: `1px solid transparent`
- Text: `#FFFFFF`
- Radius: `12px` (lg: `14px`)
- Hover: `transform: translateY(-1px)`, `box-shadow: 0 8px 22px rgba(79,70,229,0.38)`
- Active: `transform: scale(0.98)`
- Disabled: `opacity: 0.5`, `cursor: not-allowed`
- Padding: `11px 22px` (lg: `14px 28px`)
- Icon placement: Left side, `8px` gap.

**Secondary Button**
- Background: `#FFFFFF`
- Border: `1px solid var(--border)`
- Text: `var(--text)`
- Radius: `12px` (lg: `14px`)
- Hover: Background `#fafafa`, Border `#c7cbd4`
- Active: `transform: scale(0.98)`
- Padding: `11px 22px` (lg: `14px 28px`)

**Ghost Button**
- Background: `transparent`
- Border: `none`
- Text: `var(--text-muted)`
- Hover: Text `var(--text)`, Background `var(--card)`
- Radius: `12px`
- Padding: `11px 22px`

**Icon Button**
- Background: `#FFFFFF`
- Border: `1px solid var(--border)`
- Radius: `9px` or `10px`
- Hover: Background `var(--card)`
- Padding: Fixed dimensions (e.g., `32x32`, `34x34`, `38x38`)
- Active/On state: Background `rgba(79,70,229,0.1)`, Border `rgba(79,70,229,0.3)`

**Outline Button (Configuration/Toggle)**
- Background: `var(--card)`
- Border: `1.5px solid var(--border)`
- Text: `var(--text-muted)`
- Radius: `11px` or `12px`
- Active (Primary): Border `var(--primary)`, Background `rgba(79,70,229,0.06)`, Text `var(--primary)`
- Padding: `10px 14px` or `11px 12px`

---

## 8. Input System

- **Input height**: ~`40px` (`padding: 9px 14px`)
- **Border**: `1px solid var(--border)`
- **Border radius**: `12px` (Standard), `14px` (Chat Input)
- **Placeholder**: `#9AA1AE` (size `13.5px`)
- **Focus state**: `outline: 2px solid var(--primary); outline-offset: 3px; border-radius: 6px;`
- **Error state**: Unspecified, typically relies on `--danger` color mapping.
- **Disabled state**: Unspecified, generally `opacity: 0.5`.
- **Label spacing**: `12px` bottom margin below label, sub-labels `2px` top margin.
- **Icons inside inputs**: Placed on the left, `10px` gap, `16px` size, stroke-width `1.8`, color `#9AA1AE`.

---

## 9. Card System

- **Card backgrounds**: `#FFFFFF` or `#F8FAFC` (`var(--card)`)
- **Radius**: `16px`, `18px`, `20px` (Landing), `24px` (Featured)
- **Padding**: `20px`, `22px`, `24px`, `28px`, `32px`
- **Borders**: `1px solid var(--border)`
- **Shadow**: `var(--shadow-sm)`
- **Hover effects**: `transform: translateY(-2px)` to `-4px`, `box-shadow: var(--shadow-md)`, Background `#FFFFFF` (if originally card color), Border color darken.

---

## 10. Icons

- **Icon library**: Lucide React / Custom SVG
- **Standard icon sizes**: `16px` (Inline/Search), `22px` (Pipeline), `24px` (Features), `32px` to `44px` (Decorative blocks)
- **Icon spacing**: `8px` or `10px` gap from text.
- **Icon colors**: `var(--text-muted)` default. Active/Hover states inherit `var(--primary)` or `#fff`.
- **Button icon sizing**: `16px`, stroke width `1.6` to `1.8`.

---

## 11. Animations

- **Transition duration**: 
  - `.15s` (Buttons, Hovers, Colors)
  - `.2s` (Cards, Shadows)
  - `.25s` (Sidebars, Accordions, Icon strokes)
  - `.5s` (Flashcard 3D Flips)
- **Timing functions**: `ease`
- **Hover animations**: `transform: translateY(-1px)` (Buttons), `transform: translateY(-4px)` (Cards).
- **Scale animations**: Active buttons `transform: scale(0.98)`.
- **Fade animations**: Background fades `.15s`.
- **Slide animations**: Mobile sidebar `transform: translateX(-100%)` to `translateX(0)`.
- **Keyframes**: `spin` (rotate `360deg`).

---

## 12. Layout Rules

- **Maximum content width**: `1200px` (Landing), `1320px` (Dashboard content), `780px` (Hero text), `760px` (FAQ).
- **Container widths**: Sidebar `256px`, Config Panel `340px`.
- **Grid system**:
  - 4-column (Stat cards, Features)
  - 3-column (Testimonials, Pricing)
  - 2-column (Dashboard main grid `1.55fr 1fr`, Topics `1fr 1fr`)
- **Sidebar width**: `256px`
- **Navbar height**: `72px` (Dashboard), `64px` (Study/Question mode)
- **Card spacing**: `14px`, `18px`, `20px`, `24px` gap logic.
- **Section spacing**: `100px` vertical padding for main sections.

---

## 13. Responsive Design

- **Breakpoints**: `1180px`, `900px`, `860px`, `560px`
- **Mobile layout rules (Max 860px/900px)**:
  - Sidebar changes to fixed position, translates off-screen (`-100%`), uses overlay.
  - Desktop Topnav is hidden, replaced by Mobile Topbar.
  - Split-screen workspaces (Study mode) change from `row` to `column` direction (`doc-pane` takes 100% width, fixed height).
- **Tablet layout (Max 1180px)**:
  - 2-column asymmetric grids become 1-column.
  - 4-column stat grids become 2-column.
- **Desktop layout**: Grid layout prioritized with sticky sidebars.
- **Responsive spacing**: Content padding reduces from `32px` to `20px` on mobile.
- **Responsive typography**: Not explicitly defined in media queries, relies on fluid flex wrapping and ellipsis truncations (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`).

---

## 14. Reusable UI Patterns

- **Dashboard cards**: Panels with header (Title + Link) and inner content.
- **Statistics cards**: 4-column grid. Includes an Icon block, Trend indicator (Up/Down in green/red), large Value number, and Label.
- **Upload areas**: Dashed border (`2px dashed #C7CEDB`), centered gradient icon, title, subtitle, and format chip rows.
- **Empty states**: Dashed borders (`1.5px dashed var(--border)`), centered text.
- **Lists (Documents)**: Row-based with fixed left icon (color-coded by type), expanding center text (Title + Meta), right-aligned tag and "more" icon.
- **Chat messages**: Split by User (right aligned, Primary bubble) and AI (left aligned, Card background bubble + Avatar).
- **Flashcards**: `440px x 230px` perspective cards with 3D Y-axis flip. Gradients on back face.
- **Tabs**: Row of buttons, grey text default, primary color + primary border-bottom when active. Scrollable horizontally on small screens.
- **Navigation (Sidebar)**: Logo + Nav Items (Icon + Text + Badge). Active state uses primary tint background.
- **Modals/Overlays**: Dark semi-transparent background `rgba(17,24,39,0.4)` with `z-index: 39`.

---

## 15. Component Design Tokens

- **Primary Button**: `btn btn-primary` (Gradient bg, white text, shadow, translateY hover)
- **Secondary Button**: `btn btn-secondary` (White bg, border, grey hover bg)
- **Ghost Button**: `btn btn-ghost` (Transparent bg, muted text)
- **Icon Button**: `icon-btn` (Square with rounded corners, border, white bg)
- **Card/Panel**: `panel` or `q-card` (White/Card bg, border, 16px-18px radius, shadow-sm)
- **Input (Search)**: `search-box` (Card bg, 12px radius, left icon)
- **Badge (Pill)**: `status-pill` or `badge` (999px radius, tint background, solid text color, e.g., `badge-easy`, `badge-medium`)
- **Chip/Tag**: `doc-tag` or `format-chip` (Rounded rect, border, muted text)
- **Eyebrow**: `eyebrow` (Pill shape, primary color, primary tint bg, uppercase, bold)
- **Navbar (Topnav)**: `topnav` (White bg, bottom border, sticky top, 64px/72px height)
- **Sidebar**: `sidebar` (White bg, right border, sticky/fixed, 256px width)
- **Section Header**: `section-head` (Centered, max-width 620px, H2 title + sub-paragraph)
