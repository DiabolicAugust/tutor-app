import type { PartialDictionary } from '../dictionary';

import type { AppDictionary } from './en';

/**
 * Ukrainian. Typed as a partial: any key omitted here falls back to English at
 * runtime, and any key that does not exist in English is a compile error.
 *
 * Note the four plural categories — `Intl.PluralRules` picks between them.
 */
export const uk = {
  common: {
    appName: 'Fox Academy',
    save: 'Зберегти',
    cancel: 'Скасувати',
    delete: 'Видалити',
    edit: 'Редагувати',
    done: 'Готово',
    close: 'Закрити',
    retry: 'Повторити',
    search: 'Пошук',
    loading: 'Завантаження…',
    empty: 'Тут поки нічого немає',
    error: 'Щось пішло не так',
  },
  settings: {
    title: 'Налаштування',
    appearance: {
      title: 'Оформлення',
      accent: 'Акцентний колір',
      system: 'Як у системі',
      light: 'Світле',
      dark: 'Темне',
    },
    navigation: {
      title: 'Нижня навігація',
      hint: 'Виберіть, які таби показувати і в якому порядку.',
      moveUp: 'Вище',
      moveDown: 'Нижче',
      toggle: 'Показати або приховати',
      reset: 'Скинути до типових',
    },
    language: {
      title: 'Мова',
      system: 'Мова пристрою',
    },
  },
  auth: {
    signIn: 'Увійти',
    signOut: 'Вийти',
    email: 'Електронна пошта',
    password: 'Пароль',
    forgotPassword: 'Забули пароль?',
    signInTitle: 'З поверненням',
    signInSubtitle: 'Увійдіть, щоб керувати заняттями та учнями.',
    emailPlaceholder: 'you@school.com',
    signingIn: 'Вхід…',
    signInFailed: 'Не вдалося увійти. Спробуйте ще раз.',
    mockNotice: 'Бекенду ще немає — підійде будь-яка пошта й пароль.',
  },
  tabs: {
    calendar: 'Календар',
    news: 'Новини',
    more: 'Ще',
  },
  news: {
    title: 'Новини',
    empty: 'Новин ще немає',
    emptyHint: 'Тут з’являтимуться оголошення, нагадування про оплату та заняття, які треба підтвердити.',
    markAllRead: 'Позначити всі прочитаними',
    unread: {
      zero: 'Усе прочитано',
      one: '{{count}} непрочитане',
      few: '{{count}} непрочитані',
      many: '{{count}} непрочитаних',
      other: '{{count}} непрочитаного',
    },
    actions: {
      markHeld: 'Відбулося',
      markMissed: 'Не відбулося',
    },
    kinds: {
      adminAnnouncement: {
        title: 'Оголошення',
        body: '{{text}}',
      },
      tutorJoined: {
        title: 'Новий репетитор',
        body: '{{personName}} долучився до школи як репетитор з предмету {{text}}.',
      },
      paymentRunningOut: {
        title: 'Оплачені заняття закінчуються',
        body: {
          one: 'У {{studentName}} залишилося {{count}} оплачене заняття.',
          few: 'У {{studentName}} залишилося {{count}} оплачені заняття.',
          many: 'У {{studentName}} залишилося {{count}} оплачених занять.',
          other: 'У {{studentName}} залишилося {{count}} оплаченого заняття.',
        },
      },
      lessonStartingSoon: {
        title: 'Скоро заняття',
        body: 'Заняття з {{studentName}} о {{time}}.',
      },
      lessonNeedsConfirmation: {
        title: 'Це заняття відбулося?',
        body: 'Заняття з {{studentName}} о {{time}} ще не підтверджене.',
      },
    },
  },
  calendarSettings: {
    title: 'Налаштування календаря',
    view: 'Відображення',
    day: 'День',
    threeDays: '3 дні',
    month: 'Місяць',
  },
  filters: {
    title: 'Фільтри',
    calendars: 'Календарі',
    calendarsHint: 'Виберіть, чий розклад показувати у вашому календарі.',
    visibleCount: {
      zero: 'Календарі не показуються',
      one: 'Показується {{count}} календар',
      few: 'Показуються {{count}} календарі',
      many: 'Показується {{count}} календарів',
      other: 'Показується {{count}} календаря',
    },
  },
  event: {
    add: 'Нове заняття',
    student: 'Учень',
    studentPlaceholder: 'З ким заняття?',
    subject: 'Предмет',
    subjectPlaceholder: 'Математика',
    date: 'Дата',
    startTime: 'Початок',
    duration: 'Тривалість',
    calendar: 'Календар',
    minutes: '{{count}} хв',
    create: 'Додати заняття',
    missingStudent: 'Вкажіть імʼя учня.',
  },
  calendar: {
    title: 'Календар',
    today: 'Сьогодні',
    previous: 'Назад',
    next: 'Далі',
    empty: 'Цього дня занять немає',
  },
  more: {
    title: 'Ще',
    settings: 'Налаштування',
    preferences: 'Налаштування',
    account: 'Акаунт',
  },
  lessons: {
    title: 'Заняття',
    count: {
      zero: 'Занять не заплановано',
      one: '{{count}} заняття',
      few: '{{count}} заняття',
      many: '{{count}} занять',
      other: '{{count}} заняття',
    },
    nextWith: 'Наступне заняття з {{name}}',
  },
  students: {
    title: 'Учні',
    count: {
      zero: 'Учнів ще немає',
      one: '{{count}} учень',
      few: '{{count}} учні',
      many: '{{count}} учнів',
      other: '{{count}} учня',
    },
  },
} as const satisfies PartialDictionary<AppDictionary>;
