import Link from 'next/link';
import { Calendar, Users, Clock, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">MentorHub</span>
            </div>
            <nav className="flex gap-6">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl">
            Schedule Mentoring Sessions
            <br />
            <span className="text-blue-600">Effortlessly</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
            The all-in-one platform for managing your mentoring sessions with calendar booking,
            admin panel, and instant Telegram notifications.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/book"
              className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700"
            >
              Book a Session
            </Link>
            <Link
              href="/admin"
              className="rounded-lg border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-900 hover:border-gray-400"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">Why MentorHub?</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Calendar className="h-8 w-8 text-blue-600" />}
            title="Easy Scheduling"
            description="Calendar-based booking with automatic availability management"
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-blue-600" />}
            title="Admin Dashboard"
            description="Manage all your sessions, mentees, and meeting types in one place"
          />
          <FeatureCard
            icon={<Clock className="h-8 w-8 text-blue-600" />}
            title="Smart Reminders"
            description="Automatic email and Telegram notifications before meetings"
          />
          <FeatureCard
            icon={<CheckCircle className="h-8 w-8 text-blue-600" />}
            title="Multi-Platform"
            description="Access from web, iOS, and Android devices"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 MentorHub. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
