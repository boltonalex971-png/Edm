# EDM Platform - Industrial UI Design System

## Overview

This design system proposes a strict, professional industrial interface for the EDM (Enterprise Data Management) Platform Main SPA. The design focuses on:

- **Master-Detail Pattern** with resizable panels
- **Endless Scroll** in detail relations view
- **Role-Based Access Control** (Admin, Technologist, Operator)
- **Mixed Data Density** (compact lists, spacious detail)
- **Clear Visual Hierarchy** and status indicators
- **Consistent Material Design** principles using MUI

## Design Principles

### 1. Industrial Clarity
- High contrast for readability
- Clear status indicators (color-coded badges)
- Consistent spacing and typography
- Professional blue/indigo color scheme

### 2. Efficient Navigation
- Hierarchical tree view with virtual scrolling
- Persistent search in master panel
- Breadcrumb navigation in detail view
- Keyboard-friendly interactions

### 3. Context-Aware UI
- Role-based navigation visibility
- Contextual action buttons
- Inline editing with clear mode indicators
- Permission-aware feature disabling

### 4. Feedback & Loading
- Skeleton screens during loading
- Progress indicators for long operations
- Clear empty states with actionable CTAs
- Error states with recovery options

## File Structure

```
design-stubs/
├── master-detail-design.html      # Main master-detail view
├── form-edit-mode.html            # Edit mode with form validation
├── role-based-views.html          # Role-based access demonstration
├── empty-states.html              # Loading and empty states
└── README.md                      # This file
```

## HTML Stubs

### 1. master-detail-design.html
**Purpose:** Main master-detail interface

**Features:**
- Fixed header with navigation and user menu
- Resizable master panel (320px default)
- Virtual scrolling tree view with 1000+ items capability
- Detail panel with tabbed interface
- Endless scroll in Relations tab
- Form layout in General tab
- Status badges (Active/Inactive/Warning/Error)
- Breadcrumb navigation

**Key UX Patterns:**
- Left panel for entity selection
- Right panel for detail viewing/editing
- Sticky header with entity actions
- Smooth transitions between states

### 2. form-edit-mode.html
**Purpose:** Data editing interface

**Features:**
- Edit mode indicator in header
- Form validation with error messages
- Required field indicators
- Toggle switches for boolean values
- Tags input component
- Sticky footer with save/cancel actions
- Validation summary panel

**Key UX Patterns:**
- Clear visual distinction between view and edit modes
- Inline validation with helpful error messages
- Sticky save button always visible
- Discard changes confirmation
- Form hints and constraints

### 3. role-based-views.html
**Purpose:** Demonstrate different UI based on user roles

**Roles Demonstrated:**
- **Administrator:** Full access (create, edit, delete, admin settings)
- **Technologist:** View and edit (no delete, no admin)
- **Operator:** Read-only (monitoring only)

**Features:**
- Dynamic navigation based on role
- Disabled actions with tooltips
- Permission info banners
- View selector for testing different roles

**Key UX Patterns:**
- Graceful degradation (hide/disable vs. hide completely)
- Clear permission indicators
- Consistent layout across roles
- Role badge in header

### 4. empty-states.html
**Purpose:** Loading, error, and empty state patterns

**States Demonstrated:**
- **Loading:** Skeleton screens with shimmer effect
- **Empty Selection:** "Select an item" prompt
- **No Results:** Search with no matches
- **Error:** Failed data load with retry
- **All Deleted:** Empty folder with restore option

**Features:**
- Animated skeleton loading
- Progress bar for data fetching
- Contextual empty state illustrations
- Action buttons for recovery

**Key UX Patterns:**
- Never show blank screens
- Provide actionable next steps
- Clear error messages with codes
- Consistent loading patterns

## Color Palette

### Primary Colors
- **Primary Dark:** #1a237e (Header background)
- **Primary Main:** #1976d2 (Actions, active states)
- **Primary Light:** #3949ab (Logo, icons)

### Status Colors
- **Success:** #388e3c (Active, Online)
- **Warning:** #f57c00 (Warning, Attention)
- **Error:** #d32f2f (Error, Inactive, Delete)
- **Info:** #1976d2 (Info, Links)

### Neutral Colors
- **Background:** #f5f5f5 (Page background)
- **Surface:** #ffffff (Cards, panels)
- **Border:** #e0e0e0 (Dividers, borders)
- **Text Primary:** #212121 (Headlines)
- **Text Secondary:** #616161 (Body text)
- **Text Disabled:** #9e9e9e (Hints, disabled)

## Typography

- **Font Family:** Roboto
- **Header:** 18px, weight 700
- **Title:** 24px, weight 600
- **Subtitle:** 16px, weight 600
- **Body:** 14px, weight 400
- **Caption:** 12px, weight 400
- **Button:** 14px, weight 500

## Component Specifications

### Header
- Height: 64px
- Background: Linear gradient (135deg, #1a237e, #283593)
- Logo: 40x40px with 8px radius
- Navigation items: 8px 16px padding
- User menu: Rounded pill shape

### Master Panel
- Width: 320px (resizable: 280-400px)
- Search box: 36px height with icon
- Tree items: 52px height
- Selected state: Blue left border + background
- Status badges: 20px height, 4px radius

### Detail Panel
- Header: Sticky, 64px+ height
- Tabs: 48px height, bottom border indicator
- Cards: 4px radius, 1px border, subtle shadow
- Form fields: 48px height, 4px radius
- Relations: 100px height per item

## Implementation Notes

### Technologies
- **React 18** with TypeScript
- **MUI v7** for components
- **react-window** for virtual scrolling
- **react-window-infinite-loader** for endless scroll

### Key Dependencies
```json
{
  "@mui/material": "^7.3.5",
  "@mui/icons-material": "^7.3.5",
  "react-window": "^1.8.10",
  "react-window-infinite-loader": "^1.0.9"
}
```

### Performance Considerations
- Use virtual scrolling for lists > 50 items
- Implement infinite scroll with 20 items per page
- Lazy load tab content
- Debounce search input (300ms)
- Memoize expensive computations

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators visible
- Color contrast ratio >= 4.5:1
- Screen reader friendly markup

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- IE11 not supported (uses CSS Grid, Flexbox)

## Responsive Behavior

### Desktop (1200px+)
- Full master-detail layout
- Both panels visible
- Maximum content width: 100%

### Tablet (768px - 1199px)
- Collapsible master panel
- Drawer navigation for mobile
- Stacked form layouts

### Mobile (< 768px)
- Master panel as drawer
- Full-screen detail view
- Bottom sheet for actions
- Simplified navigation

## Next Steps

1. **Component Library:** Extract reusable components into Storybook
2. **Theme Configuration:** Create MUI theme file with design tokens
3. **Animation Library:** Add Framer Motion for smooth transitions
4. **Testing:** Implement visual regression testing with Chromatic
5. **Documentation:** Add interactive component documentation

## Questions & Feedback

For questions about this design system or to request changes:

1. Review the HTML stubs in a browser
2. Test different view states using the switchers
3. Check responsive behavior at different widths
4. Validate color contrast and accessibility

---

**Created:** 2026-03-02  
**Version:** 1.0  
**Author:** EDM Platform Team