# Design Guidelines: Finance AI Platform

## Design Approach

**Selected Approach**: Reference-Based (Financial Technology Leaders)
- Primary inspiration: Stripe (trust/clarity), Plaid (data visualization), Mercury (modern banking), Robinhood (accessible finance)
- Purpose: Utility-focused platform balancing data density with visual clarity
- Key principle: Make complex financial data feel approachable and secure

## Typography

**Font Families** (via Google Fonts):
- Primary: 'Inter' - Professional, highly legible for data-heavy interfaces
- Display: 'DM Sans' - Clean, modern for headers and key metrics
- Monospace: 'Roboto Mono' - For currency amounts, account numbers, transaction IDs

**Hierarchy**:
- Dashboard Headers: DM Sans Bold, 3xl-4xl
- Section Titles: DM Sans SemiBold, xl-2xl
- Card Headers: DM Sans Medium, lg
- Body Text: Inter Regular, sm-base
- Data Labels: Inter Medium, xs-sm
- Financial Figures: Roboto Mono SemiBold, lg-2xl (large amounts), base (inline amounts)

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4, p-6 (cards, panels)
- Section spacing: py-8, py-12 (dashboard sections)
- Data density: gap-2, gap-4 (tight spacing for financial tables)
- Page containers: px-6, py-8

**Grid System**:
- Container: max-w-7xl mx-auto
- Dashboard: 4-column responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Analytics: 3-column layout (2-col main content + 1-col sidebar)
- Transaction lists: Full-width with alternating row treatment

## Component Library

**Navigation**:
- Persistent sidebar (w-64) with collapsible sections: Dashboard, Transactions, Analytics, Budgets, Settings
- Top bar with search, notifications, security indicators, user profile
- Breadcrumb navigation for deep sections

**Dashboard Cards**:
- Metric cards (shadow-sm, rounded-lg) displaying key financial health scores
- Large numerical displays with trend indicators (arrows, percentages)
- Sparkline charts showing 7-day/30-day trends
- Fraud alerts with warning badges

**Data Visualization**:
- Primary charts: Line charts (spending over time), bar charts (category breakdown), donut charts (budget allocation)
- Transaction heatmap showing spending patterns by day/time
- Financial health score with radial progress indicator
- Use Chart.js library via CDN

**Transaction List**:
- Infinite scroll table with sticky headers
- Row structure: Icon (category) | Description | Date | Amount | Status badge
- Expandable rows revealing transaction details, merchant info, categorization controls
- Bulk selection with checkboxes for batch actions
- Real-time fraud detection flags with inline alerts

**Budget Manager**:
- Category cards with progress bars showing spent/remaining
- Visual overflow indicators when budget exceeded
- Drag-and-drop to adjust allocations
- Comparison view: planned vs actual spending

**Security Dashboard**:
- Security score widget with breakdown of contributing factors
- Recent login activity timeline
- Connected accounts list with last sync status
- Two-factor authentication status panel

**Analytics Panels**:
- Monthly spending trend graphs
- Category comparison (current vs previous period)
- Predictive spending forecasts with confidence intervals
- Cash flow visualization (income vs expenses waterfall chart)

**Empty States**:
- Illustrated graphics: locked safe for no transactions, growth chart for no budgets
- Clear CTAs to guide first actions

## Images

**Hero Section**:
- Large hero image (h-[500px]) showing professional workspace with laptop displaying financial graphs, or abstract visualization of data security
- Semi-transparent overlay gradient for text legibility
- Centered value proposition with primary CTA buttons (blurred backgrounds)
- Trust indicators below fold: "Bank-level encryption", "SOC 2 certified", "Your data never sold"

**Supporting Images**:
- Feature sections: Screenshots of actual dashboard views (800x500) showing real interface with sample data
- Security section: Icon-based illustrations (lock, shield, fingerprint)
- Testimonial section: Professional headshots (circular, 80x80)
- Trust badges: Partner bank logos, security certifications (displayed as small badges, 120x40)

## Page Structure

**Landing Page** (6 sections):
1. Hero with professional finance workspace imagery, headline emphasizing AI-powered insights and security
2. Key features grid (4-col): AI Analysis, Fraud Detection, Smart Budgeting, Privacy-First
3. Interactive demo showing live dashboard with animated charts (use static screenshot with overlay highlights)
4. Security & privacy section with certifications, encryption details, data handling transparency
5. Testimonials from users with financial metrics improvements
6. Pricing/CTA section with clear signup flow

**Main Dashboard**:
- Top summary row: 4 metric cards (Net Worth, Monthly Spending, Savings Rate, Financial Health Score)
- Middle section: 2-column layout (Spending Chart + Recent Transactions)
- Bottom row: 3-column (Budget Overview, Alerts, Insights Feed)
- Right sidebar: Quick actions, upcoming bills, AI recommendations

**Transaction Analysis Page**:
- Filter bar with date range, categories, amounts, merchant search
- Main transaction table with sortable columns
- Right panel: Analytics (category breakdown pie chart, spending trends)
- Bulk action toolbar appears on selection

**Budget Planning Page**:
- Left: Category budget list with sliders
- Center: Visual budget allocation donut chart
- Right: Recommendations panel with AI suggestions

**Financial Health Page**:
- Large circular score display (0-100) at top
- Breakdown sections: Credit utilization, savings ratio, spending habits, debt management
- Historical score trend line chart
- Action items to improve score

## Interactions

**Minimal, Purposeful Animations**:
- Chart data: Smooth entry animations on load (fade-in with slight scale)
- Card hover: Subtle shadow increase (no movement)
- Number counters: Animated count-up for financial figures on initial render
- Fraud alerts: Gentle pulse on new detection
- NO scroll animations
- NO unnecessary transitions

**Data Refresh**:
- Pull-to-refresh on mobile
- Live update indicators (small pulse dot) when new transactions sync
- Loading skeletons for data fetching (matching card structure)

## Accessibility

- WCAG AA compliant contrast ratios throughout
- Keyboard shortcuts for common actions (N for new transaction, / for search)
- Screen reader labels for all chart data points
- High contrast mode with distinct data visualization patterns
- Focus indicators (ring-2 ring-offset-2) on interactive elements
- Alternative text descriptions for financial trends

## Special Considerations

**Data Security Visual Indicators**:
- Lock icon in navigation showing encrypted connection
- Last sync timestamp visible on all data displays
- Session timeout warning with countdown
- Masked account numbers (show last 4 digits only)

**Trust-Building Elements**:
- Transparent data usage explanations in tooltips
- Visible privacy controls throughout interface
- Clear indication of AI recommendations vs verified data
- Download/export capabilities for user data ownership