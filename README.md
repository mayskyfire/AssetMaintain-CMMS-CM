# AssetMaintain CMMS CM - Nuxt 4 Application

> Corrective Maintenance Mobile Application สำหรับระบบ CMMS (Computerized Maintenance Management System)

## 📋 ข้อมูลโปรเจกต์

- **เทคโนโลยี**: Nuxt 4 + Tailwind CSS + TypeScript
- **วัตถุประสงค์**: Web Application สำหรับช่างหน้างาน (Mobile/Tablet + PWA-ready)
- **หลักการ**: Pixel-perfect parity กับ React version
- **สถานะ**: Phase 1 Complete ✅

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm หรือ yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd AssetMaintain-CMMS-CM

# Install dependencies
npm install

# Run development server
npm run dev
```

Application จะรันที่ `http://localhost:3000`

### Build for Production

```bash
# Build
npm run build

# Preview production build
npm run preview
```

## 📱 User Roles & Features

### 1. Requester (ผู้แจ้งซ่อม)
- ✅ สแกน QR Code เพื่อแจ้งซ่อม
- ✅ สร้างใบแจ้งซ่อม (ประเภท, ความสำคัญ, รายละเอียด)
- ✅ อัพโหลดรูปภาพหลักฐาน
- ✅ ติดตามสถานะการซ่อม
- ✅ ดู Timeline การดำเนินงาน
- ✅ ประเมินผลการซ่อม (Star rating + Comment)
- ✅ ดูสถิติการแจ้งซ่อม

### 2. Supervisor (หัวหน้างาน)
- ✅ รับงานแจ้งซ่อมใหม่
- ✅ มอบหมายงานให้ช่าง (Multi-select)
- ✅ ตรวจสอบสถานะช่าง (ว่าง/ไม่ว่าง)
- ✅ ดูสถิติการมอบหมายงาน

### 3. Technician (ช่างซ่อม)
- ✅ รับงานที่ได้รับมอบหมาย
- ✅ บันทึก Worklog (Timer + Notes)
- ✅ เบิกอะไหล่ (Quantity controls)
- ✅ อัพโหลดรูปภาพหลังซ่อม
- ✅ ลายเซ็นผู้ดูแล
- ✅ ปิดงาน (Closeout)
- ✅ ดูสถิติการซ่อม

## 🎨 Components Library

### UI Components (14 components)
- **UiButton** - 4 variants, 3 sizes
- **UiInput** - With validation support
- **UiTextarea** - Multi-line input with validation
- **UiSelect** - Dropdown with options
- **UiCard** - Container with clickable variant
- **UiBadge** - Status indicators (5 variants)
- **UiModal** - Confirmation dialogs
- **UiTimeline** - Activity timeline
- **UiToast** - Toast notifications (4 variants)
- **UiToastContainer** - Global toast manager
- **UiLoading** - Loading spinners (3 sizes)
- **UiOfflineBanner** - Offline indicator

### Layout Components
- **LayoutMobileHeader** - Header with back button
- **LayoutBottomNav** - Role-based navigation

### Composables
- **useToast()** - Toast notification management
- **useFormValidation()** - Form validation with rules

## 📄 Pages Structure

```
/                              # Login (Role selection)

/requester/*
  /home                        # Dashboard with stats
  /scan-qr                     # QR Scanner
  /notifications               # List with search & filter
  /notification/:id            # Detail with Timeline
  /create-notification         # Create form
  /evidence-upload             # Photo upload
  /submit-success              # Success page
  /evaluation/:id              # Rating & feedback
  /profile                     # User profile

/supervisor/*
  /inbox                       # New jobs
  /assign/:id                  # Assign technicians
  /profile                     # User profile

/technician/*
  /jobs                        # My jobs
  /accept/:id                  # Accept job
  /worklog/:id                 # Work logging
  /parts/:id                   # Parts management
  /closeout/:id                # Close job
  /profile                     # User profile

/offline/*
  /outbox                      # Offline queue

/test-components               # Component showcase
```

## 🎯 Key Features

### ✅ Form Validation
```vue
<UiInput
  v-model="value"
  label="ชื่อ"
  required
  :error="errorMessage"
  @blur="validate"
/>
```

### ✅ Toast Notifications
```typescript
const { success, error } = useToast()

success('บันทึกสำเร็จ', 'ข้อมูลถูกบันทึกแล้ว')
error('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง')
```

### ✅ Loading States
```vue
<UiLoading
  :is-loading="isLoading"
  fullscreen
  size="large"
  message="กำลังประมวลผล..."
/>
```

### ✅ Responsive Design
- Mobile-first (320px - 768px)
- Sticky header (56px)
- Bottom navigation (64px)
- Safe area insets for iOS

## 🎨 Design System

### Colors
- **Primary**: #00a6ff (Blue)
- **Success**: #6dd400 (Green)
- **Warning**: #fe9a00 (Orange)
- **Danger**: #ff3b30 (Red)
- **Neutral**: Slate palette (50-900)

### Typography
- Font sizes: 11px - 32px
- Font family: System fonts (-apple-system, Segoe UI)

### Spacing
- xs: 4px, sm: 8px, md: 12px, lg: 16px
- xl: 24px, 2xl: 32px, 3xl: 48px

### Border Radius
- sm: 8px, md: 12px, lg: 16px, xl: 20px

## 📚 Documentation

- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Project overview & progress
- [ENHANCEMENT_FEATURES.md](./ENHANCEMENT_FEATURES.md) - Enhancement features guide

## 🔧 Development

### Project Structure
```
AssetMaintain-CMMS-CM/
├── app/
│   ├── app.vue                 # Root component
│   ├── assets/
│   │   └── css/
│   │       ├── fonts.css       # Font imports
│   │       └── main.css        # Global styles + Tailwind
│   ├── components/
│   │   ├── ui/                 # UI components
│   │   └── layout/             # Layout components
│   ├── composables/            # Composables
│   └── pages/                  # Pages (auto-routing)
├── public/                     # Static assets
├── nuxt.config.ts              # Nuxt configuration
├── package.json
└── tsconfig.json
```

### Tech Stack
- **Framework**: Nuxt 4
- **Styling**: Tailwind CSS
- **Icons**: @nuxt/icon (Lucide icons)
- **Language**: TypeScript
- **Routing**: File-based (Nuxt auto-routing)

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run generate     # Generate static site
```

## 🧪 Testing Components

Visit `/test-components` to see:
- Toast notifications (all variants)
- Loading spinners (all sizes)
- Form validation examples
- Component showcase

## 📝 Mock Data

Phase 1 ใช้ mock data ทั้งหมด:
- Notification IDs: CM-2026-XXXX
- Equipment: เครื่องปรับอากาศ AC-XX, ปั๊มน้ำ P-XX
- Status: pending, inProgress, completed, assigned
- Priority: 1-4 (High to Low)

## 🚧 Phase 2: API Integration (Coming Soon)

- [ ] Database schema analysis
- [ ] Type definitions from schema
- [ ] REST API contract design
- [ ] API services/repositories
- [ ] Replace mock data with real API calls
- [ ] Pinia state management
- [ ] Authentication flow
- [ ] Offline queue management

## 📱 PWA Features (Future)

- [ ] Service Worker setup
- [ ] Offline support
- [ ] Local storage
- [ ] Push notifications
- [ ] Install prompt

## 🤝 Contributing

1. Follow Nuxt 4 conventions
2. Use TypeScript
3. Follow existing component patterns
4. Test on mobile devices (320px - 768px)
5. Maintain pixel-perfect parity with React version

## 📄 License

[Your License Here]

---

**Status**: Phase 1 Complete ✅  
**Updated**: 26 ก.พ. 2026  
**Version**: 1.0.0
