# FUTURISTIC DESIGN THEME SPECIFICATION
Project: Global Disaster Intelligence Dashboard
Theme Name: Neo Command Center
Style Direction: Futuristic, Strategic, AI-Control Room
Mode: Dark (Primary)

--------------------------------------------------
1. DESIGN PHILOSOPHY

The dashboard must feel like a global intelligence control room.

It should communicate:
- Authority
- Precision
- Urgency when required
- Calm analytical tone

Avoid playful UI elements.
Avoid bright consumer-style gradients.
Avoid excessive decoration.

The interface must feel mission-critical.

--------------------------------------------------
2. COLOR SYSTEM

### Background Colors
- Primary Background: #0B1220
- Secondary Surface: #111827
- Card Background: #0F172A
- Border Color: rgba(255, 255, 255, 0.06)

### Accent Colors
- Primary Accent (Data Highlight): #00E5FF
- Secondary Accent: #6366F1

### Alert Severity Colors
- Critical (Red): #FF3B3B
- Warning (Orange): #FFB020
- Moderate (Yellow): #FFD166
- Safe (Green): #00D26A
- Neutral (Blue): #3B82F6

Severity badges must be high contrast and clearly distinguishable.

--------------------------------------------------
3. VISUAL STYLE

### Cards
- Rounded corners (12px–16px)
- Subtle shadow (soft, diffused)
- Light glow border on hover using primary accent
- Slight elevation animation on hover
- Smooth transition (200ms–300ms)

### Glow Effect Rules
- Apply subtle outer glow for critical alerts
- No heavy neon or aggressive cyberpunk styling
- Glow should feel refined, not flashy

### Layout
- Grid-based layout
- 3-column layout on desktop
- Stacked layout on mobile
- Consistent spacing system (8px scale)

--------------------------------------------------
4. TYPOGRAPHY

### Headings
- Font: Inter or Space Grotesk
- Weight: 600–700
- Uppercase for section headers
- Slight letter spacing for intelligence feel

### Body Text
- Clean sans-serif
- High readability
- Avoid decorative fonts

### Data / Numbers
- Monospace font (JetBrains Mono recommended)
- Clear alignment for metrics
- Large size for key values

--------------------------------------------------
5. DASHBOARD SEGMENT VISUAL BEHAVIOR

### Disaster Severity Card
- Red glow pulse animation if alert level = Critical
- Severity badge must be visually dominant
- Population exposed displayed as large numeric metric

### Regional Risk Heatmap Card
- Dark map background
- Heat intensity color scale:
    Low → Blue
    Medium → Yellow
    High → Red
- Smooth hover interaction for region highlight

### Disaster Trend Analyzer Card
- Clean line chart
- Primary accent color for trend line
- Subtle gridlines
- Highlight anomaly points

--------------------------------------------------
6. INTERACTION STATES

### Loading State
- Skeleton placeholder
- Animated shimmer effect
- No layout shift

### Error State
- Red accent border
- Clear readable error message
- Retry button with primary accent

### Success State
- Smooth fade-in animation
- Timestamp showing "Last Updated"

--------------------------------------------------
7. ICONOGRAPHY

- Minimal outline ico
