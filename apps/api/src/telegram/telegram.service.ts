import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string;
  private webhookUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
    this.webhookUrl = this.configService.get('TELEGRAM_WEBHOOK_URL');
  }

  onModuleInit() {
    if (this.botToken) {
      this.logger.log('Telegram bot initialized');
      // TODO: Setup webhook or polling
    } else {
      this.logger.warn('Telegram bot token not configured');
    }
  }

  async sendMessage(chatId: number, text: string, options?: any) {
    if (!this.botToken) {
      this.logger.warn('Cannot send Telegram message: bot token not configured');
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to send Telegram message: ${error.message}`);
      throw error;
    }
  }

  async sendNewBookingNotification(booking: any) {
    const mentor = await this.prisma.user.findUnique({
      where: { id: booking.mentorId },
      select: { telegramId: true },
    });

    if (!mentor?.telegramId) {
      return;
    }

    const message = `
🆕 <b>Новая заявка на менторинг!</b>

👤 Менти: ${booking.menteeName}
📧 Email: ${booking.menteeEmail}
📅 Дата: ${new Date(booking.startTime).toLocaleString('ru-RU')}
📝 Тип: ${booking.meetingType.name}

Статус: ${booking.status === 'PENDING' ? '⏳ Требует одобрения' : '✅ Подтверждено'}
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Одобрить', callback_data: `approve_${booking.id}` },
          { text: '❌ Отклонить', callback_data: `reject_${booking.id}` },
        ],
        [{ text: '📋 Детали', callback_data: `view_${booking.id}` }],
      ],
    };

    await this.sendMessage(mentor.telegramId, message, {
      reply_markup: keyboard,
    });
  }

  async sendReminderNotification(booking: any, timeframe: string) {
    const mentor = await this.prisma.user.findUnique({
      where: { id: booking.mentorId },
      select: { telegramId: true },
    });

    if (!mentor?.telegramId) {
      return;
    }

    const message = `
⏰ <b>Напоминание о встрече через ${timeframe}</b>

👤 Менти: ${booking.menteeName}
📅 Время: ${new Date(booking.startTime).toLocaleString('ru-RU')}
📝 Тип: ${booking.meetingType.name}
${booking.videoUrl ? `🔗 <a href="${booking.videoUrl}">Ссылка на встречу</a>` : ''}
    `;

    const keyboard = {
      inline_keyboard: [[{ text: '📋 Детали', callback_data: `view_${booking.id}` }]],
    };

    await this.sendMessage(mentor.telegramId, message, {
      reply_markup: keyboard,
    });
  }

  async handleWebhook(update: any) {
    this.logger.log('Received Telegram update:', update);

    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  private async handleMessage(message: any) {
    const chatId = message.chat.id;
    const text = message.text;

    if (text === '/start') {
      await this.sendMessage(
        chatId,
        '👋 Добро пожаловать в MentorHub Bot!\n\nИспользуйте /help для просмотра доступных команд.'
      );
    } else if (text === '/help') {
      const helpText = `
📚 <b>Доступные команды:</b>

/start - Начало работы
/help - Помощь
/today - Встречи сегодня
/week - Встречи на неделю
/pending - Заявки на одобрение
/stats - Статистика
      `;
      await this.sendMessage(chatId, helpText);
    }
  }

  private async handleCallbackQuery(callbackQuery: any) {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    if (data.startsWith('approve_')) {
      const bookingId = data.replace('approve_', '');
      await this.sendMessage(chatId, `✅ Заявка ${bookingId} одобрена!`);
      // TODO: Implement approval logic
    } else if (data.startsWith('reject_')) {
      const bookingId = data.replace('reject_', '');
      await this.sendMessage(chatId, `❌ Заявка ${bookingId} отклонена.`);
      // TODO: Implement rejection logic
    }
  }
}
