# MentorHub

**Кросс-платформенная система управления менторскими сессиями**

MentorHub - это современная платформа для управления менторскими сессиями с календарным бронированием, административной панелью и Telegram-интеграцией для мгновенных уведомлений.

## 🚀 Возможности

- 📅 **Календарное бронирование** - удобная система записи на сессии с автоматическим управлением доступностью
- 👥 **Управление встречами** - настраиваемые типы встреч, формы и уведомления
- 📱 **Мультиплатформенность** - Web, iOS, Android приложения
- 🤖 **Telegram интеграция** - мгновенные уведомления и управление через бота
- 🔐 **Безопасность** - JWT аутентификация, 2FA для админов, GDPR compliance
- 📊 **Аналитика** - детальная статистика и отчеты

## 🏗️ Архитектура

Проект построен как монорепозиторий с использованием npm workspaces:

```
mentor-hub/
├── apps/
│   ├── api/          # Backend API (NestJS + PostgreSQL)
│   ├── web/          # Web приложение (Next.js + React)
│   └── telegram-bot/ # Telegram бот
├── packages/
│   ├── types/        # Общие TypeScript типы
│   ├── ui/           # Переиспользуемые UI компоненты
│   └── utils/        # Утилиты и хелперы
└── docs/             # Документация
```

## 🛠️ Технологический стек

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL 15+ с Prisma ORM
- **Cache**: Redis 7+
- **Auth**: JWT + Refresh Tokens
- **Notifications**: Bull Queue + Nodemailer

### Frontend (Web)
- **Framework**: Next.js 14+ (App Router)
- **UI**: React 18+ + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod

### Mobile
- **iOS**: Swift + SwiftUI (iOS 16+)
- **Android**: Kotlin + Jetpack Compose (API 26+)

## 📋 Требования

- Node.js >= 18.0.0
- PostgreSQL >= 15
- Redis >= 7
- npm >= 9.0.0

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Создайте `.env` файлы в каждом приложении на основе `.env.example`

### 3. Настройка базы данных

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

### 4. Запуск в режиме разработки

```bash
# Запустить все приложения
npm run dev

# Или запустить конкретное приложение
cd apps/api && npm run dev
cd apps/web && npm run dev
```

## 📚 Документация

- [Архитектурные требования](./docs/ARCHITECTURE.md)
- [API документация](./docs/API.md)
- [Руководство разработчика](./docs/DEVELOPMENT.md)
- [Deployment guide](./docs/DEPLOYMENT.md)

## 🧪 Тестирование

```bash
# Запустить все тесты
npm test

# Запустить тесты с coverage
npm run test:coverage
```

## 📦 Сборка

```bash
# Сборка всех приложений
npm run build

# Сборка конкретного приложения
cd apps/api && npm run build
```

## 🔄 Development Workflow

### Phase 1: MVP (4-6 недель)
- ✅ Backend foundation
- ✅ Authentication system
- ✅ Booking APIs
- ✅ Web app
- ✅ Telegram bot
- ✅ Email notifications

### Phase 2: Enhanced Features (3-4 недели)
- 🔄 iOS app
- 🔄 Android app
- 🔄 Advanced integrations

### Phase 3: Advanced Features (2-3 недели)
- ⏳ Live Activities
- ⏳ Widgets
- ⏳ Analytics dashboard
- ⏳ Performance optimization

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 👥 Team

- **Product Owner**: Slava Petrov
- **Architecture**: MentorHub Team

## 📞 Support

For support, email support@mentorhub.com or open an issue.

---

Made with ❤️ by MentorHub Team
