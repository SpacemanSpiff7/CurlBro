# Design System

## Direction
"Industrial Precision" — utility-forward dark mode. Calm and readable in a loud, bright gym.

## Typography (Google Fonts)
- Display/Timer: `JetBrains Mono` — monospace, technical
- Body/UI: `DM Sans` — geometric sans-serif

## Color System
```
--bg-root: #09090b        zinc-950
--bg-surface: #18181b     zinc-900 (cards)
--bg-elevated: #27272a    zinc-800 (modals)
--bg-interactive: #3f3f46 zinc-700 (hover)
--accent-primary: #06b6d4 cyan-500
--accent-hover: #22d3ee   cyan-400
--accent-muted: #164e63   cyan-900
--text-primary: #fafafa
--text-secondary: #a1a1aa
--text-tertiary: #71717a
--success: #22c55e
--warning: #f59e0b
--destructive: #ef4444
```

## Micro-Interactions (Framer Motion)
1. Card enter: fadeIn + slideUp, 50ms stagger
2. Swipe delete: drag right → red reveal → slide out + collapse
3. Drawer: spring physics (damping: 25, stiffness: 300)
4. Exercise swap: crossfade 200ms
5. Set complete: checkmark spring (stiffness: 500)
6. Timer pulse: scale 1.0→1.02 last 10s
7. Timer complete: shake + glow burst
8. Tab switch: shared layoutId indicator
9. Drag reorder: lift scale 1.03 + shadow

## Touch Targets
- Minimum 44px height for all interactive elements
- Thumb-friendly on 375px+ screens
