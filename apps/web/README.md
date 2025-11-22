# MentorHub Web Application

Modern web application for MentorHub platform built with Next.js 14, React 18, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Development

```bash
# Start development server
npm run dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Authentication pages
│   ├── (public)/       # Public booking pages
│   ├── admin/          # Admin dashboard
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── booking/       # Booking components
│   └── admin/         # Admin components
├── lib/               # Utilities & API client
├── hooks/             # Custom React hooks
└── types/             # TypeScript types
```

## 🎨 Features

### Public Pages
- 🏠 Landing page with features showcase
- 📅 Public booking page with calendar
- ✅ Booking confirmation page

### Admin Dashboard
- 📊 Dashboard with statistics
- 📋 Bookings management table
- 🎯 Meeting types CRUD
- ⏰ Availability settings
- ⚙️ Profile & settings

### Technical
- ⚡ Next.js 14 with App Router
- 🎨 Tailwind CSS + shadcn/ui
- 📊 React Query for data fetching
- 🔒 JWT authentication
- 📱 Fully responsive design
- ♿ Accessibility (WCAG 2.1 AA)

## 🧰 Tech Stack

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Calendar**: react-big-calendar
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📝 Available Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

## 🎨 Design System

The app uses a custom design system based on shadcn/ui components with Tailwind CSS:

- **Colors**: Blue primary (#3B82F6), semantic colors
- **Typography**: Inter font family
- **Spacing**: Consistent spacing scale (4px base)
- **Components**: Fully accessible Radix UI primitives

## 📄 License

MIT
