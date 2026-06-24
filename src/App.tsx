import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './index.css';
import { eagleImg, getLevelImage, stoicBgImg } from './assets/images';

// ═══════════════════════════════════════════════════════════
// TELEGRAM WEB APP INTEGRATION
// ═══════════════════════════════════════════════════════════
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        themeParams: Record<string, string>;
        colorScheme: 'light' | 'dark';
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          setParams: (params: Record<string, unknown>) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        CloudStorage: {
          setItem: (key: string, value: string, callback?: (error: Error | null, stored: boolean) => void) => void;
          getItem: (key: string, callback: (error: Error | null, value: string) => void) => void;
          getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (error: Error | null, removed: boolean) => void) => void;
          getKeys: (callback: (error: Error | null, keys: string[]) => void) => void;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        platform: string;
      };
    };
  }
}

const tg = window.Telegram?.WebApp;
const isTelegram = !!tg?.initDataUnsafe?.user;

// ═══════════════════════════════════════════════════════════
// LOCALIZATION
// ═══════════════════════════════════════════════════════════
type Lang = 'ru' | 'en';

const translations = {
  ru: {
    // App
    appTitle: 'ACTA',
    loading: 'Загрузка...',
    // Navigation
    navTasks: 'Дела',
    navHero: 'Герой',
    navJournal: 'Дневник',
    navGoals: 'Цели',
    navFinance: 'Казна',
    // Attributes
    strength: 'Сила',
    intellect: 'Разум', 
    spirit: 'Дух',
    discipline: 'Воля',
    strengthLat: 'СИЛА',
    intellectLat: 'РАЗУМ',
    spiritLat: 'ДУХ',
    disciplineLat: 'ВОЛЯ',
    // Calendar
    taskLabel: 'Задача',
    addTask: 'Добавить задачу',
    completed: 'Выполнено',
    streak: 'Серия',
    progress: 'Прогресс',
    routine: 'Распорядок дня',
    today: 'Сегодня',
    noRoutine: 'Нет дел на сегодня',
    addRoutine: 'Добавить',
    activity: 'Занятие',
    weekdays: 'Будни',
    weekend: 'Выходные',
    allWeek: 'Вся неделя',
    cancel: 'Отмена',
    selectAttribute: 'К какому качеству отнести?',
    selectAttrDesc: 'XP будет начисляться в выбранное направление',
    // Hero
    level: 'Уровень',
    virtus: 'VIRTUS',
    allAttr: 'Все',
    active: 'Активные',
    done: 'Готовые',
    noTasks: 'Задач нет',
    createFirst: 'Создайте первую задачу',
    newMission: 'Новая задача',
    missionName: 'Название',
    difficulty: 'Сложность',
    steps: 'Этапы',
    addStep: 'Добавить этап',
    create: 'Создать',
    complete: 'Завершить',
    downloadReport: 'Скачать отчёт',
    reportGenerating: 'Формирование...',
    reportTitle: 'Мой путь',
    reportSubtitle: 'Ежемесячный отчёт',
    reportSaveHint: 'Зажмите изображение чтобы сохранить, или нажмите кнопку ниже',
    reportDownloadBtn: 'Сохранить',
    reportTasksDone: 'задач выполнено',
    reportStreak: 'дней подряд',
    reportGoals: 'целей достигнуто',
    reportEntries: 'записей в дневнике',
    reportBalance: 'баланс',
    // Journal
    journal: 'REFLEXIO',
    moodState: 'Состояние духа',
    gratitude: 'Благодарность',
    reflections: 'Размышления дня',
    lessonDay: 'Урок дня',
    tomorrowDiff: 'Что завтра сделаю по-другому',
    save: 'Сохранить',
    pastEntries: 'Прошлые записи',
    edit: 'Редактировать',
    close: 'Закрыть',
    entrySaved: 'Запись сохранена',
    // Goals
    goalsTitle: 'FINIS',
    goalsSubtitle: 'Цели и стремления',
    noGoals: 'Целей пока нет',
    setGoal: 'Поставьте великую цель',
    newGoal: 'Новая цель',
    editGoal: 'Редактировать',
    goalName: 'Название цели',
    description: 'Описание',
    deadline: 'Срок',
    reward: 'Награда за достижение',
    stepsToGoal: 'Шаги к цели',
    goalAchieved: 'Цель достигнута',
    // Finance
    financeTitle: 'AERARIUM',
    income: 'Доходы',
    expenses: 'Расходы',
    balance: 'Баланс',
    overview: 'Обзор',
    savings: 'Накопления',
    history: 'История',
    addIncome: 'Добавить доход',
    addExpense: 'Добавить расход',
    category: 'Категория',
    amount: 'Сумма',
    note: 'Заметка',
    add: 'Добавить',
    noTransactions: 'Записей нет',
    savingsTitle: 'Мои накопления',
    addSaving: 'Добавить накопление',
    savingName: 'Название',
    currentAmount: 'Текущая сумма',
    targetAmount: 'Целевая сумма',
    purpose: 'Цель',
    deposit: 'Пополнить',
    withdraw: 'Снять',
    // Mood
    mood1: 'Тьма',
    mood2: 'Тревога',
    mood3: 'Покой',
    mood4: 'Подъём',
    mood5: 'Триумф',
    // Days
    mon: 'Пн',
    tue: 'Вт',
    wed: 'Ср',
    thu: 'Чт',
    fri: 'Пт',
    sat: 'Сб',
    sun: 'Вс',
    // Months
    months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    monthsLat: ['Ianuarius', 'Februarius', 'Martius', 'Aprilis', 'Maius', 'Iunius', 'Iulius', 'Augustus', 'September', 'October', 'November', 'December'],
    // Journal sections
    sectionReflection: 'Итог дня',
    sectionIdeas: 'Идеи',
    ideasPlaceholder: 'Мысли, идеи, планы...',
    // Other
    noName: 'Без названия',
    futureMark: 'Нельзя отмечать будущее',
    next: 'следующая',
  },
  en: {
    appTitle: 'ACTA',
    loading: 'Loading...',
    navTasks: 'Tasks',
    navHero: 'Hero',
    navJournal: 'Journal',
    navGoals: 'Goals',
    navFinance: 'Treasury',
    strength: 'Strength',
    intellect: 'Mind',
    spirit: 'Spirit',
    discipline: 'Will',
    strengthLat: 'STRENGTH',
    intellectLat: 'MIND',
    spiritLat: 'SPIRIT',
    disciplineLat: 'WILL',
    taskLabel: 'Task',
    addTask: 'Add task',
    completed: 'Completed',
    streak: 'Streak',
    progress: 'Progress',
    routine: 'Daily routine',
    today: 'Today',
    noRoutine: 'No tasks for today',
    addRoutine: 'Add',
    activity: 'Activity',
    weekdays: 'Weekdays',
    weekend: 'Weekend',
    allWeek: 'All week',
    cancel: 'Cancel',
    selectAttribute: 'Which quality to assign?',
    selectAttrDesc: 'XP will be granted to the selected attribute',
    level: 'Level',
    virtus: 'VIRTUS',
    allAttr: 'All',
    active: 'Active',
    done: 'Done',
    noTasks: 'No tasks',
    createFirst: 'Create your first task',
    newMission: 'New task',
    missionName: 'Name',
    difficulty: 'Difficulty',
    steps: 'Steps',
    addStep: 'Add step',
    create: 'Create',
    complete: 'Complete',
    downloadReport: 'Download report',
    reportGenerating: 'Generating...',
    reportTitle: 'My path',
    reportSubtitle: 'Monthly report',
    reportSaveHint: 'Long-press the image to save, or tap the button below',
    reportDownloadBtn: 'Save',
    reportTasksDone: 'tasks done',
    reportStreak: 'day streak',
    reportGoals: 'goals achieved',
    reportEntries: 'journal entries',
    reportBalance: 'balance',
    journal: 'REFLEXIO',
    moodState: 'State of mind',
    gratitude: 'Gratitude',
    reflections: 'Daily reflections',
    lessonDay: 'Lesson of the day',
    tomorrowDiff: 'What I will do differently tomorrow',
    save: 'Save',
    pastEntries: 'Past entries',
    edit: 'Edit',
    close: 'Close',
    entrySaved: 'Entry saved',
    goalsTitle: 'FINIS',
    goalsSubtitle: 'Goals and aspirations',
    noGoals: 'No goals yet',
    setGoal: 'Set a great goal',
    newGoal: 'New goal',
    editGoal: 'Edit',
    goalName: 'Goal name',
    description: 'Description',
    deadline: 'Deadline',
    reward: 'Reward for achievement',
    stepsToGoal: 'Steps to goal',
    goalAchieved: 'Goal achieved',
    financeTitle: 'AERARIUM',
    income: 'Income',
    expenses: 'Expenses',
    balance: 'Balance',
    overview: 'Overview',
    savings: 'Savings',
    history: 'History',
    addIncome: 'Add income',
    addExpense: 'Add expense',
    category: 'Category',
    amount: 'Amount',
    note: 'Note',
    add: 'Add',
    noTransactions: 'No records',
    savingsTitle: 'My savings',
    addSaving: 'Add saving',
    savingName: 'Name',
    currentAmount: 'Current amount',
    targetAmount: 'Target amount',
    purpose: 'Purpose',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    mood1: 'Dark',
    mood2: 'Anxious',
    mood3: 'Calm',
    mood4: 'Rising',
    mood5: 'Triumph',
    mon: 'Mo',
    tue: 'Tu',
    wed: 'We',
    thu: 'Th',
    fri: 'Fr',
    sat: 'Sa',
    sun: 'Su',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthsLat: ['Ianuarius', 'Februarius', 'Martius', 'Aprilis', 'Maius', 'Iunius', 'Iulius', 'Augustus', 'September', 'October', 'November', 'December'],
    sectionReflection: 'Day summary',
    sectionIdeas: 'Ideas',
    ideasPlaceholder: 'Thoughts, ideas, plans...',
    noName: 'Untitled',
    futureMark: 'Cannot mark future',
    next: 'next',
  }
};

// ═══════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════
interface CalendarTask {
  id: string;
  name: string;
  attribute: 'strength' | 'intellect' | 'spirit' | 'discipline';
  checks: Record<string, boolean>;
  xpGranted: Record<string, boolean>;
}

interface RpgTaskStep {
  id: string;
  text: string;
  done: boolean;
}

interface RpgTask {
  id: string;
  name: string;
  description: string;
  attribute: 'strength' | 'intellect' | 'spirit' | 'discipline';
  difficulty: number;
  steps: RpgTaskStep[];
  completed: boolean;
  createdAt: string;
}

interface CharacterStats {
  strength: number;
  intellect: number;
  spirit: number;
  discipline: number;
}

interface CharacterData {
  name: string;
  visibleName: string;
  level: number;
  totalXp: number;
  stats: CharacterStats;
}

interface JournalEntry {
  id: string;
  date: string;
  gratitude: string;
  reflection: string;
  lesson: string;
  differentTomorrow: string;
  ideas: string;
  mood: number;
}

interface GoalStep {
  id: string;
  text: string;
  done: boolean;
  deadline: string;
}

interface GoalEntry {
  id: string;
  title: string;
  description: string;
  attribute: 'strength' | 'intellect' | 'spirit' | 'discipline';
  steps: GoalStep[];
  reward: string;
  deadline: string;
  completed: boolean;
  createdAt: string;
}

interface RoutineItem {
  id: string;
  time: string;
  activity: string;
  days: number[];
}

interface ToastData {
  id: string;
  message: string;
  type: 'xp' | 'levelup' | 'info' | 'negative' | 'error' | 'success';
  leaving?: boolean;
}

interface Quote {
  text: string;
  author: string;
}

// Finance Types
interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note: string;
}

interface FinanceCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface SavingsAccount {
  id: string;
  name: string;
  amount: number;
  target: number;
  purpose: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// ICON COMPONENTS - SVG SYMBOLS ONLY
// ═══════════════════════════════════════════════════════════
const StarIcon = ({ filled, size = 20 }: { filled: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#c9a84c' : '#222'} style={filled ? { filter: 'drop-shadow(0 0 2px rgba(201,168,76,0.4))' } : {}}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// Shield Icon - centered
const ShieldIcon = ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// Crossed Swords Icon for Strength
const CrossedSwordsIcon = ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
    <path d="M16 16l4 4" />
    <path d="M19 21l2-2" />
    <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" />
    <path d="M11 19l-6-6" />
    <path d="M8 16l-4 4" />
    <path d="M5 21l-2-2" />
  </svg>
);

// Open book icon for Intellect
const BookIcon = ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

// Eye Icon for Spirit (inner vision)
const EyeIcon = ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// ═══════════════════════════════════════════════════════════
// КОНСТАНТЫ
// ═══════════════════════════════════════════════════════════
const ATTR_COLORS: Record<string, string> = {
  strength: '#8b3a3a',
  intellect: '#9a7b30',
  spirit: '#6a4a7a',
  discipline: '#4a7a5a',
};

const ATTR_COLORS_LIGHT: Record<string, string> = {
  strength: '#d45050',
  intellect: '#d4a840',
  spirit: '#a070c0',
  discipline: '#60b080',
};

const DIFFICULTY_XP = [0, 1, 2, 3, 5, 8];
const XP_PER_LEVEL = 20;

const toRoman = (n: number): string => {
  if (n <= 0) return '0';
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
};

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const isWeekend = (year: number, month: number, day: number) => {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
};
const dateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const getLevelTitle = (level: number): string => {
  if (level >= 60) return 'Divus';
  if (level >= 50) return 'Augustus';
  if (level >= 35) return 'Caesar';
  if (level >= 25) return 'Imperator';
  if (level >= 16) return 'Tribunus';
  if (level >= 9) return 'Centurio';
  if (level >= 4) return 'Legionarius';
  return 'Tiro';
};

const haptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
  if (!tg?.HapticFeedback) return;
  if (type === 'selection') {
    tg.HapticFeedback.selectionChanged();
  } else if (['success', 'error', 'warning'].includes(type)) {
    tg.HapticFeedback.notificationOccurred(type as 'success' | 'error' | 'warning');
  } else {
    tg.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy');
  }
};

const storage = {
  set: (key: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      if (tg?.CloudStorage && isTelegram) {
        tg.CloudStorage.setItem(key, value, () => resolve());
      } else {
        localStorage.setItem(key, value);
        resolve();
      }
    });
  },
  get: (key: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (tg?.CloudStorage && isTelegram) {
        tg.CloudStorage.getItem(key, (err, value) => {
          resolve(err ? null : value || null);
        });
      } else {
        resolve(localStorage.getItem(key));
      }
    });
  }
};

const formatMoney = (n: number) => n.toLocaleString('ru-RU');

// ═══════════════════════════════════════════════════════════
// ATTRIBUTE ICON COMPONENT
// ═══════════════════════════════════════════════════════════
const AttrIcon = ({ attr, size = 20, color }: { attr: string; size?: number; color?: string }) => {
  const c = color || ATTR_COLORS_LIGHT[attr] || '#fff';
  switch (attr) {
    case 'strength': return <CrossedSwordsIcon color={c} size={size} />;
    case 'intellect': return <BookIcon color={c} size={size} />;
    case 'spirit': return <ShieldIcon color={c} size={size} />;
    case 'discipline': return <EyeIcon color={c} size={size} />;
    default: return <EyeIcon color={c} size={size} />;
  }
};

// ═══════════════════════════════════════════════════════════
// DONUT CHART COMPONENT
// ═══════════════════════════════════════════════════════════
const DonutChart = ({ stats, t }: { stats: CharacterStats; t: typeof translations.ru }) => {
  const attrs: (keyof CharacterStats)[] = ['strength', 'intellect', 'spirit', 'discipline'];
  const attrLabels = { strength: t.strengthLat, intellect: t.intellectLat, spirit: t.spiritLat, discipline: t.disciplineLat };
  const values = attrs.map(k => stats[k]);
  const total = values.reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 200 200" className="w-40 h-40 flex-shrink-0">
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="30" />
          <circle cx="100" cy="100" r="45" fill="#000" stroke="#222" strokeWidth="1" />
          <text x="100" y="95" textAnchor="middle" fill="#555" fontSize="9" fontFamily="Cormorant SC, serif">{t.virtus}</text>
          <text x="100" y="112" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="Cormorant SC, serif">0</text>
        </svg>
        <div className="flex flex-col gap-2">
          {attrs.map(attr => (
            <div key={attr} className="flex items-center gap-2">
              <div className="w-3 h-3" style={{ background: ATTR_COLORS[attr] }} />
              <span className="text-xs font-cinzel" style={{ color: '#444', letterSpacing: '1px' }}>
                {attrLabels[attr]}
              </span>
              <span className="text-xs ml-1" style={{ color: '#444' }}>0</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const colors = attrs.map(k => ATTR_COLORS[k]);
  let cumulativePercent = 0;
  const segments: { path: string; color: string; attr: keyof CharacterStats; value: number }[] = [];

  attrs.forEach((attr, i) => {
    const value = stats[attr];
    if (value === 0) return;
    const percent = (value / total) * 100;
    const startAngle = (cumulativePercent / 100) * 360 - 90;
    cumulativePercent += percent;
    const endAngle = (cumulativePercent / 100) * 360 - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const outerRadius = 80;
    const innerRadius = 50;
    const x1Outer = 100 + outerRadius * Math.cos(startRad);
    const y1Outer = 100 + outerRadius * Math.sin(startRad);
    const x2Outer = 100 + outerRadius * Math.cos(endRad);
    const y2Outer = 100 + outerRadius * Math.sin(endRad);
    const x1Inner = 100 + innerRadius * Math.cos(endRad);
    const y1Inner = 100 + innerRadius * Math.sin(endRad);
    const x2Inner = 100 + innerRadius * Math.cos(startRad);
    const y2Inner = 100 + innerRadius * Math.sin(startRad);
    const largeArc = percent > 50 ? 1 : 0;
    const path = `M ${x1Outer} ${y1Outer} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer} L ${x1Inner} ${y1Inner} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner} Z`;
    segments.push({ path, color: colors[i], attr, value });
  });

  return (
    <div className="flex items-center gap-4 justify-center">
      <svg viewBox="0 0 200 200" className="w-40 h-40 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 12px rgba(201,168,76,0.2))' }}>
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="30" />
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill={seg.color} stroke="#000" strokeWidth="2" style={{ filter: `drop-shadow(0 0 6px ${seg.color})` }} />
        ))}
        <circle cx="100" cy="100" r="45" fill="#000" stroke="#333" strokeWidth="1" />
        <text x="100" y="95" textAnchor="middle" fill="#666" fontSize="9" fontFamily="Cormorant SC, serif">{t.virtus}</text>
        <text x="100" y="112" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="Cormorant SC, serif">{total}</text>
      </svg>
      <div className="flex flex-col gap-2">
        {attrs.map(attr => (
          <div key={attr} className="flex items-center gap-2">
            <div className="w-3 h-3" style={{ background: stats[attr] > 0 ? ATTR_COLORS[attr] : '#111' }} />
            <span className="text-xs font-cinzel" style={{ color: stats[attr] > 0 ? ATTR_COLORS_LIGHT[attr] : '#333', letterSpacing: '1px' }}>
              {attrLabels[attr]}
            </span>
            <span className="text-xs ml-1" style={{ color: stats[attr] > 0 ? '#fff' : '#333' }}>{stats[attr]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// FINANCE PIE CHART
// ═══════════════════════════════════════════════════════════
const FinancePieChart = ({ data, onCategoryClick, colors }: { data: Record<string, number>; onCategoryClick?: (cat: string) => void; colors: Record<string, string> }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="text-center py-4">
        <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto">
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="30" />
          <circle cx="100" cy="100" r="45" fill="#000" stroke="#222" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  let cumulativePercent = 0;
  const segments: { path: string; color: string; category: string; value: number; percent: number }[] = [];

  Object.entries(data).sort((a, b) => b[1] - a[1]).forEach(([cat, value]) => {
    if (value === 0) return;
    const percent = (value / total) * 100;
    const startAngle = (cumulativePercent / 100) * 360 - 90;
    cumulativePercent += percent;
    const endAngle = (cumulativePercent / 100) * 360 - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const outerRadius = 80;
    const innerRadius = 45;
    const x1Outer = 100 + outerRadius * Math.cos(startRad);
    const y1Outer = 100 + outerRadius * Math.sin(startRad);
    const x2Outer = 100 + outerRadius * Math.cos(endRad);
    const y2Outer = 100 + outerRadius * Math.sin(endRad);
    const x1Inner = 100 + innerRadius * Math.cos(endRad);
    const y1Inner = 100 + innerRadius * Math.sin(endRad);
    const x2Inner = 100 + innerRadius * Math.cos(startRad);
    const y2Inner = 100 + innerRadius * Math.sin(startRad);
    const largeArc = percent > 50 ? 1 : 0;
    const path = `M ${x1Outer} ${y1Outer} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer} L ${x1Inner} ${y1Inner} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner} Z`;
    segments.push({ path, color: colors[cat] || '#444', category: cat, value, percent });
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-36 h-36 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 10px rgba(201,168,76,0.15))' }}>
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill={seg.color} stroke="#000" strokeWidth="2" className="cursor-pointer transition-all hover:opacity-80"
            style={{ filter: `drop-shadow(0 0 4px ${seg.color})` }}
            onClick={() => onCategoryClick?.(seg.category)} />
        ))}
        <circle cx="100" cy="100" r="40" fill="#000" stroke="#333" strokeWidth="1" />
        <text x="100" y="105" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="Cormorant SC, serif">
          {formatMoney(total)}
        </text>
      </svg>
      <div className="flex flex-col gap-1 flex-1">
        {segments.slice(0, 6).map(seg => (
          <div key={seg.category} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors"
            onClick={() => onCategoryClick?.(seg.category)}>
            <div className="w-2.5 h-2.5 flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs text-white truncate font-serif">{seg.category}</span>
            <span className="text-xs ml-auto" style={{ color: '#555' }}>{Math.round(seg.percent)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// REPORT GENERATOR — Canvas-based Instagram Story poster
// ═══════════════════════════════════════════════════════════
function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

function generateReport(
  character: CharacterData,
  calTasks: CalendarTask[],
  _rpgTasks: RpgTask[],
  journalEntries: JournalEntry[],
  _goals: GoalEntry[],
  transactions: Transaction[],
  quotes: Quote[],
  t: typeof translations.ru,
  now: Date
): Promise<string> {
  return new Promise(async (resolve) => {
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const CX = W / 2;
    const F = 'Georgia, "Times New Roman", serif';

    // helpers
    const hline = (y: number, x1 = 160, x2 = W - 160, a = 0.07) => {
      ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    };
    const spaced = (text: string, x: number, y: number, sp: number) => {
      ctx.textAlign = 'center';
      const ch = text.split('');
      const tw = ch.reduce((s, c) => s + ctx.measureText(c).width, 0) + sp * (ch.length - 1);
      let cx = x - tw / 2;
      ch.forEach(c => { const cw = ctx.measureText(c).width; ctx.fillText(c, cx + cw / 2, y); cx += cw + sp; });
    };
    const wrap = (text: string, maxW: number): string[] => {
      const w = text.split(' '); const ls: string[] = []; let c = '';
      w.forEach(word => { const test = c ? c + ' ' + word : word; if (ctx.measureText(test).width > maxW && c) { ls.push(c); c = word; } else c = test; });
      if (c) ls.push(c); return ls;
    };

    // ── Load images first ──
    const [bgImg, eagleImage] = await Promise.all([
      loadImg(stoicBgImg),
      loadImg(eagleImg),
    ]);

    // ══════════════════════════════════════════════
    // 0. BACKGROUND — stoic-bg.jpg like the app
    // ══════════════════════════════════════════════
    if (bgImg) {
      // cover the canvas with background image
      const scale = Math.max(W / bgImg.width, H / bgImg.height);
      const sw = bgImg.width * scale;
      const sh = bgImg.height * scale;
      ctx.drawImage(bgImg, (W - sw) / 2, (H - sh) / 2, sw, sh);
      // dark overlay like in app
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, W, H);
    }

    // corner brackets
    const cO = 40, cL = 50;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    [[cO,cO,1,1],[W-cO,cO,-1,1],[cO,H-cO,1,-1],[W-cO,H-cO,-1,-1]].forEach(([x,y,fx,fy])=>{
      ctx.beginPath(); ctx.moveTo(x,y+fy*cL); ctx.lineTo(x,y); ctx.lineTo(x+fx*cL,y); ctx.stroke();
    });

    // ── COMPUTE DATA ──
    const mo = now.getMonth(), yr = now.getFullYear();
    const dc = daysInMonth(yr, mo);

    let totalChecks = 0;
    calTasks.forEach(task => { for (let d = 1; d <= dc; d++) if (task.checks[dateKey(yr, mo, d)]) totalChecks++; });

    let streak = 0;
    const sd = new Date(now);
    while (calTasks.some(t2 => t2.checks[dateKey(sd.getFullYear(), sd.getMonth(), sd.getDate())])) { streak++; sd.setDate(sd.getDate()-1); }

    let mInc = 0, mExp = 0;
    transactions.forEach(tx => { const d = new Date(tx.date); if (d.getMonth()===mo && d.getFullYear()===yr) { if (tx.type==='income') mInc+=tx.amount; else mExp+=tx.amount; }});
    const mBal = mInc - mExp;

    const attrs: (keyof CharacterStats)[] = ['strength','intellect','spirit','discipline'];
    const aN: Record<string,string> = { strength:t.strengthLat, intellect:t.intellectLat, spirit:t.spiritLat, discipline:t.disciplineLat };
    const aC: Record<string,string> = { strength:'#8b3a3a', intellect:'#9a7b30', spirit:'#6a4a7a', discipline:'#4a7a5a' };
    const aCL: Record<string,string> = { strength:'#d45050', intellect:'#d4a840', spirit:'#a070c0', discipline:'#60b080' };
    const tS = attrs.reduce((s,a) => s + character.stats[a], 0);

    // mood
    const moodLbls = [t.mood1,t.mood2,t.mood3,t.mood4,t.mood5];
    const mEnt = journalEntries.filter(e => e.date.startsWith(`${yr}-${String(mo+1).padStart(2,'0')}`));
    let avgMoodStr = '';
    if (mEnt.length > 0) {
      const avg = mEnt.reduce((s,e)=>s+e.mood,0)/mEnt.length;
      const idx = Math.round(avg)-1;
      avgMoodStr = `${toRoman(Math.round(avg))}  —  ${moodLbls[Math.max(0,Math.min(4,idx))]}`;
    }

    // ══════════════════════════════════════════════
    // LAYOUT — top to bottom
    // ══════════════════════════════════════════════
    let Y = 80;

    // ── 1. EAGLE ──
    const eagleSz = 140;
    if (eagleImage) {
      // draw eagle centered, preserving aspect ratio
      const eAspect = eagleImage.width / eagleImage.height;
      const eW = eAspect >= 1 ? eagleSz : eagleSz * eAspect;
      const eH = eAspect >= 1 ? eagleSz / eAspect : eagleSz;
      ctx.drawImage(eagleImage, CX - eW/2, Y, eW, eH);
      Y += eH + 16;
    } else {
      Y += 20;
    }

    // ── 2. TITLE ──
    ctx.fillStyle = '#fff';
    ctx.font = `bold 72px ${F}`;
    ctx.textAlign = 'center';
    spaced('ACTA', CX, Y, 22);

    Y += 50;

    // ── 3. NAME + RANK ──
    ctx.fillStyle = '#fff';
    ctx.font = `bold 40px ${F}`;
    ctx.fillText(character.visibleName, CX, Y);

    Y += 36;
    ctx.fillStyle = '#888';
    ctx.font = `400 24px ${F}`;
    ctx.fillText(`${getLevelTitle(character.level)}  ·  ${t.level} ${toRoman(character.level)}`, CX, Y);

    // XP bar
    Y += 30;
    const bx = 280, bw = W-560, bh = 8;
    const xpP = (character.totalXp % XP_PER_LEVEL) / XP_PER_LEVEL;
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(bx, Y, bw, bh);
    if (xpP > 0) { ctx.fillStyle = '#fff'; ctx.fillRect(bx, Y, bw * xpP, bh); }
    Y += bh + 16;
    ctx.fillStyle = '#555'; ctx.font = `400 18px ${F}`;
    ctx.fillText(`XP  ${character.totalXp}`, CX, Y);

    Y += 35;
    hline(Y);

    // ══════════════════════════════════════════════
    // 4. DONUT CHART — only colored element
    // ══════════════════════════════════════════════
    Y += 25;
    const dCY = Y + 105;
    const dR = 95, dIR = 58;

    if (tS > 0) {
      let cum = 0;
      attrs.forEach(attr => {
        const v = character.stats[attr]; if (!v) return;
        const sa = cum/tS * Math.PI*2 - Math.PI/2;
        cum += v;
        const ea = cum/tS * Math.PI*2 - Math.PI/2;
        ctx.beginPath(); ctx.arc(CX,dCY,dR,sa,ea); ctx.arc(CX,dCY,dIR,ea,sa,true); ctx.closePath();
        ctx.fillStyle = aC[attr]; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3; ctx.stroke();
      });
    } else {
      ctx.beginPath(); ctx.arc(CX,dCY,dR,0,Math.PI*2); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
    }

    // center hole
    ctx.beginPath(); ctx.arc(CX,dCY,dIR-2,0,Math.PI*2);
    ctx.fillStyle = bgImg ? 'rgba(0,0,0,0.7)' : '#050505'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `bold 30px ${F}`; ctx.textAlign = 'center';
    ctx.fillText(String(tS), CX, dCY + 10);

    // labels left/right
    const lx = CX - dR - 55, rx = CX + dR + 55;
    const dsl = (attr: keyof CharacterStats, x: number, y: number, al: CanvasTextAlign) => {
      ctx.textAlign = al;
      ctx.fillStyle = aCL[attr]; ctx.font = `400 17px ${F}`; ctx.fillText(aN[attr], x, y);
      ctx.font = `bold 26px ${F}`; ctx.fillText(String(character.stats[attr]), x, y+28);
    };
    dsl('strength', lx, dCY-35, 'right');
    dsl('spirit',   lx, dCY+20, 'right');
    dsl('intellect',rx, dCY-35, 'left');
    dsl('discipline',rx, dCY+20, 'left');
    ctx.textAlign = 'center';

    Y = dCY + dR + 40;
    hline(Y);

    // ══════════════════════════════════════════════
    // 5. TASKS COMPLETED — big number
    // ══════════════════════════════════════════════
    Y += 50;
    ctx.fillStyle = '#fff';
    ctx.font = `bold 72px ${F}`;
    ctx.fillText(String(totalChecks), CX, Y);
    Y += 28;
    ctx.fillStyle = '#888';
    ctx.font = `400 22px ${F}`;
    ctx.fillText(t.reportTasksDone, CX, Y);

    Y += 45;
    hline(Y);

    // ══════════════════════════════════════════════
    // 6. CALENDAR HEATMAP — single row
    // ══════════════════════════════════════════════
    Y += 30;
    ctx.fillStyle = '#888';
    ctx.font = `400 18px ${F}`;
    ctx.fillText(t.months[mo].toUpperCase(), CX, Y);
    Y += 18;

    const cs = 26, cg = 3;
    const totalCW = dc * cs + (dc-1)*cg;
    const cx0 = CX - totalCW / 2;

    for (let d = 1; d <= dc; d++) {
      const k = dateKey(yr, mo, d);
      const cnt = calTasks.filter(t2 => t2.checks[k]).length;
      const mx = calTasks.length || 1;
      const int = cnt / mx;
      const cx = cx0 + (d-1) * (cs + cg);

      ctx.fillStyle = int > 0 ? `rgba(255,255,255,${0.12 + int * 0.88})` : 'rgba(255,255,255,0.03)';
      ctx.fillRect(cx, Y, cs, cs);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5; ctx.strokeRect(cx, Y, cs, cs);
    }

    Y += cs + 14;
    ctx.fillStyle = '#555'; ctx.font = `400 14px ${F}`;
    ctx.textAlign = 'left'; ctx.fillText('1', cx0, Y);
    ctx.textAlign = 'center'; ctx.fillText(String(Math.ceil(dc/2)), CX, Y);
    ctx.textAlign = 'right'; ctx.fillText(String(dc), cx0 + totalCW, Y);
    ctx.textAlign = 'center';

    Y += 30;
    hline(Y);

    // ══════════════════════════════════════════════
    // 7. STREAK
    // ══════════════════════════════════════════════
    Y += 50;
    ctx.fillStyle = '#fff';
    ctx.font = `bold 64px ${F}`;
    ctx.fillText(String(streak), CX, Y);
    Y += 28;
    ctx.fillStyle = '#888';
    ctx.font = `400 22px ${F}`;
    ctx.fillText(t.reportStreak, CX, Y);

    if (avgMoodStr) {
      Y += 35;
      ctx.fillStyle = '#555'; ctx.font = `400 18px ${F}`;
      ctx.fillText(t.moodState.toLowerCase(), CX, Y);
      Y += 24;
      ctx.fillStyle = '#fff'; ctx.font = `400 24px ${F}`;
      ctx.fillText(avgMoodStr, CX, Y);
    }

    Y += 40;
    hline(Y);

    // ══════════════════════════════════════════════
    // 8. FINANCES
    // ══════════════════════════════════════════════
    Y += 40;
    ctx.fillStyle = '#888'; ctx.font = `400 18px ${F}`;
    ctx.fillText(t.financeTitle, CX, Y);

    Y += 45;
    const fCols = [CX - 260, CX, CX + 260];
    const fData = [
      { val: '+' + formatMoney(mInc), label: t.income },
      { val: '-' + formatMoney(mExp), label: t.expenses },
      { val: (mBal >= 0 ? '+' : '') + formatMoney(mBal), label: t.balance },
    ];
    fData.forEach((fd, i) => {
      ctx.fillStyle = '#fff';
      ctx.font = `bold 36px ${F}`;
      ctx.fillText(fd.val, fCols[i], Y);
      ctx.fillStyle = '#888';
      ctx.font = `400 18px ${F}`;
      ctx.fillText(fd.label, fCols[i], Y + 28);
    });

    Y += 65;
    hline(Y);

    // ══════════════════════════════════════════════
    // 9. QUOTE — pinned near bottom
    // ══════════════════════════════════════════════
    if (quotes.length > 0) {
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      const qY = Math.max(Y + 50, H - 240);

      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = `italic 24px ${F}`;
      ctx.textAlign = 'center';

      const qL = wrap(quote.text, W - 200);
      qL.forEach((ln, i) => {
        const pre = i === 0 ? '«  ' : '';
        const suf = i === qL.length - 1 ? '  »' : '';
        ctx.fillText(pre + ln + suf, CX, qY + i * 34);
      });

      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.font = `400 20px ${F}`;
      ctx.fillText('— ' + quote.author, CX, qY + qL.length * 34 + 14);
    }

    // ── BOTTOM ──
    hline(H - 85, 120, W - 120, 0.06);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.font = `bold 16px ${F}`;
    ctx.textAlign = 'center';
    spaced('ACTA', CX, H - 55, 8);

    // ── OUTPUT ──
    resolve(canvas.toDataURL('image/png'));
  });
}

// ═══════════════════════════════════════════════════════════
// ГЛАВНЫЙ КОМПОНЕНТ
// ═══════════════════════════════════════════════════════════
export default function App() {
  const telegramUser = tg?.initDataUnsafe?.user;
  const userId = telegramUser?.id?.toString() || 'local_user';
  const userName = telegramUser?.first_name || 'Воин';

  const [lang, setLang] = useState<Lang>('ru');
  const t = translations[lang];

  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'rpg' | 'journal' | 'finance' | 'goals'>('rpg');
  const [tabTransition, setTabTransition] = useState(false);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calTasks, setCalTasks] = useState<CalendarTask[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const calScrollRef = useRef<HTMLDivElement>(null);
  const newTaskInputRef = useRef<HTMLInputElement>(null);

  // NEW: Attribute selection modal for new calendar tasks
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [pendingNewTaskId, setPendingNewTaskId] = useState<string | null>(null);

  const [rpgTasks, setRpgTasks] = useState<RpgTask[]>([]);
  const [showRpgModal, setShowRpgModal] = useState(false);
  const [rpgFilter, setRpgFilter] = useState<string>('all');
  const [rpgStatusFilter, setRpgStatusFilter] = useState<string>('active');

  const [rpgFormName, setRpgFormName] = useState('');
  const [rpgFormAttr, setRpgFormAttr] = useState<'strength' | 'intellect' | 'spirit' | 'discipline'>('strength');
  const [rpgFormDiff, setRpgFormDiff] = useState(1);
  const [rpgFormSteps, setRpgFormSteps] = useState<string[]>(['']);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalDate, setJournalDate] = useState(dateKey(now.getFullYear(), now.getMonth(), now.getDate()));
  const [journalGratitude, setJournalGratitude] = useState('');
  const [journalReflection, setJournalReflection] = useState('');
  const [journalLesson, setJournalLesson] = useState('');
  const [journalDifferent, setJournalDifferent] = useState('');
  const [journalIdeas, setJournalIdeas] = useState('');
  const [journalSection, setJournalSection] = useState<'reflection' | 'ideas'>('reflection');
  const [journalMood, setJournalMood] = useState(3);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  // Goals
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalEntry | null>(null);
  const [goalFormTitle, setGoalFormTitle] = useState('');
  const [goalFormDesc, setGoalFormDesc] = useState('');
  const [goalFormAttr, setGoalFormAttr] = useState<'strength' | 'intellect' | 'spirit' | 'discipline'>('strength');
  const [goalFormReward, setGoalFormReward] = useState('');
  const [goalFormDeadline, setGoalFormDeadline] = useState('');
  const [goalFormSteps, setGoalFormSteps] = useState<{ text: string; deadline: string }[]>([{ text: '', deadline: '' }]);

  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [routineFormTime, setRoutineFormTime] = useState('08:00');
  const [routineFormActivity, setRoutineFormActivity] = useState('');
  const [routineFormDays, setRoutineFormDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [showRoutineSection, setShowRoutineSection] = useState(false);

  // Finance State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [finView, setFinView] = useState<'overview' | 'savings' | 'history'>('overview');
  const [finMonth, setFinMonth] = useState(now.getMonth());
  const [finYear, setFinYear] = useState(now.getFullYear());
  const [selectedFinType, setSelectedFinType] = useState<'income' | 'expense'>('expense');

  // Modals
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState<string | null>(null);

  // Transaction form
  const [txFormType, setTxFormType] = useState<'income' | 'expense'>('expense');
  const [txFormCategory, setTxFormCategory] = useState('');
  const [txFormAmount, setTxFormAmount] = useState('');
  const [txFormNote, setTxFormNote] = useState('');
  const [txFormDate, setTxFormDate] = useState(dateKey(now.getFullYear(), now.getMonth(), now.getDate()));

  // Savings form
  const [savingsFormName, setSavingsFormName] = useState('');
  const [savingsFormAmount, setSavingsFormAmount] = useState('');
  const [savingsFormTarget, setSavingsFormTarget] = useState('');
  const [savingsFormPurpose, setSavingsFormPurpose] = useState('');

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState<'deposit' | 'withdraw'>('deposit');

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastTimeoutsRef = useRef<Map<string, number>>(new Map());

  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef<number>(0);

  // Report generating state
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportImageUrl, setReportImageUrl] = useState<string | null>(null);

  const DAY_NAMES = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun];
  const MOOD_LABELS = [t.mood1, t.mood2, t.mood3, t.mood4, t.mood5];
  const ATTR_LABELS: Record<string, string> = {
    strength: t.strength,
    intellect: t.intellect,
    spirit: t.spirit,
    discipline: t.discipline,
  };

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'calendar' && calScrollRef.current) {
      const todayD = now.getDate();
      const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();
      const targetDay = isCurrentMonth ? todayD : 1;
      const scrollPos = Math.max(0, (targetDay - 4) * 44);
      setTimeout(() => {
        if (calScrollRef.current) {
          calScrollRef.current.scrollLeft = scrollPos;
        }
      }, 100);
    }
  }, [activeTab, calYear, calMonth]);

  useEffect(() => {
    // Load quotes from public/quotes.txt
    // Format: each line "Text | Author"
    fetch('./quotes.txt')
      .then(r => r.text())
      .then(text => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l && l.includes('|'));
        const parsed: Quote[] = lines.map(line => {
          const [t2, a] = line.split('|').map(s => s.trim());
          return { text: t2, author: a || '' };
        });
        if (parsed.length > 0) {
          setQuotes(parsed);
          setQuoteIndex(Math.floor(Math.random() * parsed.length));
        }
      })
      .catch(() => {
        // fallback if file not found
        const fallback: Quote[] = [
          { text: 'Делай что должен — и будь что будет.', author: 'Марк Аврелий' },
          { text: 'Препятствие на пути становится путём.', author: 'Марк Аврелий' },
          { text: 'Познай самого себя.', author: 'Сократ' },
        ];
        setQuotes(fallback);
        setQuoteIndex(0);
      });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const langData = await storage.get(`acta_lang_${userId}`);
        if (langData) setLang(langData as Lang);

        const charData = await storage.get(`acta_char_${userId}`);
        if (charData) {
          const parsed = JSON.parse(charData);
          if (parsed.stats.charisma !== undefined && parsed.stats.spirit === undefined) {
            parsed.stats.spirit = parsed.stats.wisdom || 1;
            parsed.stats.discipline = parsed.stats.charisma || 1;
            delete parsed.stats.wisdom;
            delete parsed.stats.charisma;
          }
          setCharacter(parsed);
          prevLevelRef.current = parsed.level;
        } else {
          const newChar: CharacterData = {
            name: userId,
            visibleName: userName,
            level: 1,
            totalXp: 4,
            stats: { strength: 1, intellect: 1, spirit: 1, discipline: 1 },
          };
          setCharacter(newChar);
          prevLevelRef.current = 1;
          await storage.set(`acta_char_${userId}`, JSON.stringify(newChar));
        }

        const calData = await storage.get(`acta_cal_${userId}`);
        if (calData) setCalTasks(JSON.parse(calData));

        const rpgData = await storage.get(`acta_rpg_${userId}`);
        if (rpgData) setRpgTasks(JSON.parse(rpgData));

        const jData = await storage.get(`acta_journal_${userId}`);
        if (jData) setJournalEntries(JSON.parse(jData));

        const gData = await storage.get(`acta_goals_${userId}`);
        if (gData) setGoals(JSON.parse(gData));

        const rData = await storage.get(`acta_routines_${userId}`);
        if (rData) setRoutines(JSON.parse(rData));

        const txData = await storage.get(`acta_transactions_v2_${userId}`);
        if (txData) setTransactions(JSON.parse(txData));

        const catData = await storage.get(`acta_categories_${userId}`);
        if (catData) setCategories(JSON.parse(catData));

        const savData = await storage.get(`acta_savings_${userId}`);
        if (savData) setSavingsAccounts(JSON.parse(savData));
      } catch (e) {
        console.error('Load error:', e);
      }
      setIsLoading(false);
    };
    loadData();
  }, [userId, userName]);

  const saveCharacter = useCallback(async (ch: CharacterData) => {
    setCharacter(ch);
    await storage.set(`acta_char_${userId}`, JSON.stringify(ch));
  }, [userId]);

  useEffect(() => {
    if (!character || isLoading) return;
    storage.set(`acta_cal_${userId}`, JSON.stringify(calTasks));
  }, [calTasks, userId, character, isLoading]);

  useEffect(() => {
    if (!character || isLoading) return;
    storage.set(`acta_rpg_${userId}`, JSON.stringify(rpgTasks));
  }, [rpgTasks, userId, character, isLoading]);

  useEffect(() => {
    if (!character || isLoading) return;
    storage.set(`acta_journal_${userId}`, JSON.stringify(journalEntries));
  }, [journalEntries, userId, character, isLoading]);

  useEffect(() => {
    if (!character || isLoading) return;
    storage.set(`acta_goals_${userId}`, JSON.stringify(goals));
  }, [goals, userId, character, isLoading]);

  useEffect(() => {
    if (!character || isLoading) return;
    storage.set(`acta_routines_${userId}`, JSON.stringify(routines));
  }, [routines, userId, character, isLoading]);

  useEffect(() => {
    if (!character || isLoading) return;
    storage.set(`acta_transactions_v2_${userId}`, JSON.stringify(transactions));
  }, [transactions, userId, character, isLoading]);

  useEffect(() => {
    if (!character || isLoading) return;
    storage.set(`acta_categories_${userId}`, JSON.stringify(categories));
  }, [categories, userId, character, isLoading]);

  useEffect(() => {
    if (!character || isLoading) return;
    storage.set(`acta_savings_${userId}`, JSON.stringify(savingsAccounts));
  }, [savingsAccounts, userId, character, isLoading]);

  useEffect(() => {
    storage.set(`acta_lang_${userId}`, lang);
  }, [lang, userId]);

  useEffect(() => {
    if (quotes.length === 0) return;
    const iv = setInterval(() => {
      setQuoteIndex(i => (i + 1) % quotes.length);
    }, 30000);
    return () => clearInterval(iv);
  }, [quotes.length]);

  const addToast = useCallback((message: string, type: ToastData['type'] = 'info') => {
    const id = uid();
    setToasts(prev => [...prev, { id, message, type }]);
    const timeout = window.setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
      const timeout2 = window.setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        toastTimeoutsRef.current.delete(id);
      }, 400);
      toastTimeoutsRef.current.set(id + '_leave', timeout2);
    }, 2500);
    toastTimeoutsRef.current.set(id, timeout);
  }, []);

  const grantXp = useCallback((attr: keyof CharacterStats, amount: number) => {
    if (!character) return;
    const newStats = { ...character.stats };
    newStats[attr] = Math.max(0, newStats[attr] + amount);
    const newTotalXp = Math.max(0, character.totalXp + amount);
    const newLevel = Math.floor(newTotalXp / XP_PER_LEVEL) + 1;
    const updated: CharacterData = { ...character, stats: newStats, totalXp: newTotalXp, level: newLevel };
    saveCharacter(updated);

    if (amount > 0) {
      haptic('light');
      addToast(`+${amount} ${ATTR_LABELS[attr]}`, 'xp');
    } else {
      addToast(`${amount} ${ATTR_LABELS[attr]}`, 'negative');
    }

    if (newLevel > prevLevelRef.current && prevLevelRef.current > 0) {
      haptic('success');
      setShowLevelUp(true);
      addToast(`${t.level} ${toRoman(newLevel)}`, 'levelup');
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    prevLevelRef.current = newLevel;
  }, [character, saveCharacter, addToast, ATTR_LABELS, t.level]);

  const isFutureDate = (year: number, month: number, day: number): boolean => {
    const checkDate = new Date(year, month, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return checkDate > today;
  };

  const switchTab = (tab: typeof activeTab) => {
    if (tab === activeTab) return;
    haptic('selection');
    setTabTransition(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTabTransition(false);
    }, 150);
  };

  const toggleLang = () => {
    setLang(l => l === 'ru' ? 'en' : 'ru');
    haptic('selection');
  };

  const prevMonth = () => {
    haptic('selection');
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    haptic('selection');
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const toggleCheck = (taskId: string, day: number) => {
    if (isFutureDate(calYear, calMonth, day)) {
      addToast(t.futureMark, 'error');
      return;
    }
    haptic('light');
    const key = dateKey(calYear, calMonth, day);
    const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
    setCalTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      const wasChecked = task.checks[key];
      const newChecks = { ...task.checks };
      const newXpGranted = { ...task.xpGranted };
      if (wasChecked) {
        delete newChecks[key];
        if (key === todayKey && newXpGranted[key]) {
          delete newXpGranted[key];
          setTimeout(() => grantXp(task.attribute, -1), 50);
        }
      } else {
        newChecks[key] = true;
        if (key === todayKey && !newXpGranted[key]) {
          newXpGranted[key] = true;
          setTimeout(() => grantXp(task.attribute, 1), 50);
        }
      }
      return prev.map(t => t.id === taskId ? { ...t, checks: newChecks, xpGranted: newXpGranted } : t);
    });
  };

  // NEW: addCalTask now opens attribute selection modal first
  const addCalTask = () => {
    haptic('medium');
    const newId = uid();
    setPendingNewTaskId(newId);
    setShowAttrModal(true);
  };

  const confirmNewTaskAttr = (attr: CalendarTask['attribute']) => {
    if (!pendingNewTaskId) return;
    haptic('light');
    const task: CalendarTask = { id: pendingNewTaskId, name: '', attribute: attr, checks: {}, xpGranted: {} };
    setCalTasks(prev => [...prev, task]);
    setEditingTaskId(pendingNewTaskId);
    setEditingName('');
    setShowAttrModal(false);
    setPendingNewTaskId(null);
    setTimeout(() => {
      newTaskInputRef.current?.focus();
    }, 100);
  };

  const removeCalTask = (id: string) => {
    haptic('light');
    setCalTasks(prev => prev.filter(t => t.id !== id));
  };

  const startEditTask = (id: string, currentName: string) => {
    setEditingTaskId(id);
    setEditingName(currentName);
  };

  const saveEditTask = () => {
    if (!editingTaskId) return;
    const name = editingName.trim();
    if (!name) {
      setCalTasks(prev => prev.filter(t => t.id !== editingTaskId));
    } else {
      setCalTasks(prev => prev.map(t => t.id === editingTaskId ? { ...t, name } : t));
    }
    setEditingTaskId(null);
  };

  // changeTaskAttr removed — attribute is set at creation only

  const daysCount = daysInMonth(calYear, calMonth);
  const todayD = now.getDate();
  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();

  const calStats = useMemo(() => {
    let totalChecks = 0;
    const dc = daysInMonth(calYear, calMonth);
    const totalPossible = calTasks.length * dc;
    calTasks.forEach(t => {
      for (let d = 1; d <= dc; d++) {
        const k = dateKey(calYear, calMonth, d);
        if (t.checks[k]) totalChecks++;
      }
    });
    let streak = 0;
    const checkDate = new Date(now);
    while (true) {
      const k = dateKey(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      const anyChecked = calTasks.some(t => t.checks[k]);
      if (anyChecked) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else break;
    }
    const pct = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0;
    return { totalChecks, streak, pct };
  }, [calTasks, calYear, calMonth, now]);

  const createRpgTask = () => {
    if (!rpgFormName.trim()) return;
    haptic('medium');
    const task: RpgTask = {
      id: uid(), name: rpgFormName.trim(), description: '', attribute: rpgFormAttr, difficulty: rpgFormDiff,
      steps: rpgFormSteps.filter(s => s.trim()).map(s => ({ id: uid(), text: s.trim(), done: false })),
      completed: false, createdAt: new Date().toISOString(),
    };
    setRpgTasks(prev => [...prev, task]);
    setRpgFormName(''); setRpgFormAttr('strength'); setRpgFormDiff(1); setRpgFormSteps(['']);
    setShowRpgModal(false);
  };

  const toggleRpgStep = (taskId: string, stepId: string) => {
    haptic('light');
    setRpgTasks(prev => prev.map(t => {
      if (t.id !== taskId || t.completed) return t;
      const newSteps = t.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s);
      return { ...t, steps: newSteps };
    }));
  };

  const completeRpgTask = (taskId: string) => {
    haptic('success');
    setRpgTasks(prev => prev.map(t => {
      if (t.id !== taskId || t.completed) return t;
      const xpAmount = DIFFICULTY_XP[t.difficulty] || 1;
      setTimeout(() => grantXp(t.attribute, xpAmount), 50);
      return { ...t, completed: true, steps: t.steps.map(s => ({ ...s, done: true })) };
    }));
  };

  const filteredRpgTasks = useMemo(() => {
    let tasks = [...rpgTasks];
    if (rpgFilter !== 'all') tasks = tasks.filter(t => t.attribute === rpgFilter);
    if (rpgStatusFilter === 'active') tasks = tasks.filter(t => !t.completed);
    else if (rpgStatusFilter === 'completed') tasks = tasks.filter(t => t.completed);
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return tasks;
  }, [rpgTasks, rpgFilter, rpgStatusFilter]);

  const currentEntry = useMemo(() => journalEntries.find(e => e.date === journalDate), [journalEntries, journalDate]);

  useEffect(() => {
    if (currentEntry) {
      setJournalGratitude(currentEntry.gratitude);
      setJournalReflection(currentEntry.reflection);
      setJournalLesson(currentEntry.lesson);
      setJournalDifferent(currentEntry.differentTomorrow || '');
      setJournalIdeas(currentEntry.ideas || '');
      setJournalMood(currentEntry.mood);
    } else {
      setJournalGratitude(''); setJournalReflection(''); setJournalLesson(''); setJournalDifferent(''); setJournalIdeas(''); setJournalMood(3);
    }
  }, [currentEntry, journalDate]);

  const saveJournalEntry = () => {
    haptic('medium');
    const entry: JournalEntry = {
      id: currentEntry?.id || uid(), date: journalDate, gratitude: journalGratitude, reflection: journalReflection,
      lesson: journalLesson, differentTomorrow: journalDifferent, ideas: journalIdeas, mood: journalMood,
    };
    const isNew = !currentEntry;
    setJournalEntries(prev => {
      const filtered = prev.filter(e => e.date !== journalDate);
      return [...filtered, entry].sort((a, b) => b.date.localeCompare(a.date));
    });
    addToast(t.entrySaved, 'info');
    if (isNew && journalGratitude.trim() && journalReflection.trim() && journalLesson.trim()) {
      setTimeout(() => {
        const attrs: (keyof CharacterStats)[] = ['strength', 'intellect', 'spirit', 'discipline'];
        attrs.forEach((attr, i) => { setTimeout(() => grantXp(attr, 1), i * 100); });
      }, 200);
    }
  };

  // Goals
  const saveGoal = () => {
    if (!goalFormTitle.trim()) return;
    haptic('medium');
    if (editingGoal) {
      setGoals(prev => prev.map(g =>
        g.id === editingGoal.id
          ? {
              ...g, title: goalFormTitle, description: goalFormDesc, attribute: goalFormAttr,
              reward: goalFormReward, deadline: goalFormDeadline,
              steps: goalFormSteps.filter(s => s.text.trim()).map((s, i) => ({
                id: editingGoal.steps[i]?.id || uid(), text: s.text.trim(), done: editingGoal.steps[i]?.done || false, deadline: s.deadline,
              })),
            }
          : g
      ));
    } else {
      const newGoal: GoalEntry = {
        id: uid(), title: goalFormTitle.trim(), description: goalFormDesc, attribute: goalFormAttr,
        steps: goalFormSteps.filter(s => s.text.trim()).map(s => ({ id: uid(), text: s.text.trim(), done: false, deadline: s.deadline })),
        reward: goalFormReward, deadline: goalFormDeadline, completed: false, createdAt: new Date().toISOString(),
      };
      setGoals(prev => [newGoal, ...prev]);
    }
    resetGoalForm();
  };

  const resetGoalForm = () => {
    setGoalFormTitle(''); setGoalFormDesc(''); setGoalFormAttr('strength'); setGoalFormReward('');
    setGoalFormDeadline(''); setGoalFormSteps([{ text: '', deadline: '' }]); setEditingGoal(null); setShowGoalModal(false);
  };

  const openEditGoal = (goal: GoalEntry) => {
    setEditingGoal(goal);
    setGoalFormTitle(goal.title);
    setGoalFormDesc(goal.description);
    setGoalFormAttr(goal.attribute);
    setGoalFormReward(goal.reward);
    setGoalFormDeadline(goal.deadline);
    setGoalFormSteps(goal.steps.length > 0 ? goal.steps.map(s => ({ text: s.text, deadline: s.deadline })) : [{ text: '', deadline: '' }]);
    setShowGoalModal(true);
  };

  const toggleGoalStep = (goalId: string, stepId: string) => {
    haptic('light');
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId || g.completed) return g;
      return { ...g, steps: g.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s) };
    }));
  };

  const completeGoal = (goalId: string) => {
    haptic('success');
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId || g.completed) return g;
      setTimeout(() => {
        grantXp(g.attribute, 10);
        addToast(t.goalAchieved, 'levelup');
      }, 50);
      return { ...g, completed: true, steps: g.steps.map(s => ({ ...s, done: true })) };
    }));
  };

  const deleteGoal = (id: string) => {
    haptic('light');
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Routines
  const addRoutine = () => {
    if (!routineFormActivity.trim()) return;
    haptic('medium');
    const routine: RoutineItem = { id: uid(), time: routineFormTime, activity: routineFormActivity.trim(), days: routineFormDays };
    setRoutines(prev => [...prev, routine].sort((a, b) => a.time.localeCompare(b.time)));
    setRoutineFormTime('08:00'); setRoutineFormActivity(''); setRoutineFormDays([0, 1, 2, 3, 4]);
    setShowRoutineModal(false);
  };

  const toggleRoutineDay = (day: number) => {
    setRoutineFormDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  const deleteRoutine = (id: string) => {
    haptic('light');
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  const todayDayIndex = (now.getDay() + 6) % 7;
  const todayRoutines = useMemo(() =>
    routines.filter(r => r.days.includes(todayDayIndex)).sort((a, b) => a.time.localeCompare(b.time)),
    [routines, todayDayIndex]
  );

  // ═══════════════════════════════════════════════════════════
  // FINANCE Functions
  // ═══════════════════════════════════════════════════════════
  const categoryColors = useMemo(() => {
    const colors: Record<string, string> = {};
    const palette = ['#c45050', '#d4a840', '#a070c0', '#50b080', '#d08050', '#50a0c0', '#c060a0', '#80c060', '#d0c050', '#6090d0'];
    categories.forEach((cat, i) => {
      colors[cat.name] = palette[i % palette.length];
    });
    return colors;
  }, [categories]);

  const addTransaction = () => {
    if (!txFormAmount || parseFloat(txFormAmount) <= 0 || !txFormCategory.trim()) return;
    haptic('medium');
    
    const existingCat = categories.find(c => c.name === txFormCategory.trim() && c.type === txFormType);
    if (!existingCat) {
      const newCat: FinanceCategory = { id: uid(), name: txFormCategory.trim(), type: txFormType };
      setCategories(prev => [...prev, newCat]);
    }
    
    const tx: Transaction = {
      id: uid(), date: txFormDate, type: txFormType, category: txFormCategory.trim(),
      amount: parseFloat(txFormAmount), note: txFormNote,
    };
    setTransactions(prev => [tx, ...prev]);
    setTxFormAmount(''); setTxFormNote(''); setTxFormCategory(''); setShowTxModal(false);
    addToast(txFormType === 'income' ? `+${formatMoney(tx.amount)}` : `-${formatMoney(tx.amount)}`, txFormType === 'income' ? 'success' : 'info');
  };

  const removeTransaction = (id: string) => {
    haptic('light');
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addSavingsAccount = () => {
    if (!savingsFormName.trim()) return;
    haptic('medium');
    const acc: SavingsAccount = {
      id: uid(), name: savingsFormName.trim(), amount: parseFloat(savingsFormAmount) || 0,
      target: parseFloat(savingsFormTarget) || 0, purpose: savingsFormPurpose, createdAt: new Date().toISOString(),
    };
    setSavingsAccounts(prev => [...prev, acc]);
    setSavingsFormName(''); setSavingsFormAmount(''); setSavingsFormTarget(''); setSavingsFormPurpose('');
    setShowSavingsModal(false);
  };

  const removeSavingsAccount = (id: string) => {
    haptic('light');
    setSavingsAccounts(prev => prev.filter(a => a.id !== id));
  };

  const makeDeposit = () => {
    if (!showDepositModal || !depositAmount) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;
    haptic('medium');

    setSavingsAccounts(prev => prev.map(a => {
      if (a.id !== showDepositModal) return a;
      const newAmount = depositType === 'deposit' ? a.amount + amount : Math.max(0, a.amount - amount);
      return { ...a, amount: newAmount };
    }));

    addToast(depositType === 'deposit' ? `+${formatMoney(amount)}` : `-${formatMoney(amount)}`, depositType === 'deposit' ? 'success' : 'info');
    setDepositAmount('');
    setShowDepositModal(null);
  };

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === finMonth && d.getFullYear() === finYear;
    });
  }, [transactions, finMonth, finYear]);

  const finStats = useMemo(() => {
    let income = 0, expense = 0;
    const byIncCat: Record<string, number> = {};
    const byExpCat: Record<string, number> = {};
    
    monthTransactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
        byIncCat[t.category] = (byIncCat[t.category] || 0) + t.amount;
      } else {
        expense += t.amount;
        byExpCat[t.category] = (byExpCat[t.category] || 0) + t.amount;
      }
    });
    
    return { income, expense, balance: income - expense, byIncCat, byExpCat };
  }, [monthTransactions]);

  const totalSavings = useMemo(() => savingsAccounts.reduce((s, a) => s + a.amount, 0), [savingsAccounts]);

  // REPORT HANDLER
  const handleDownloadReport = async () => {
    if (!character) return;
    setReportGenerating(true);
    haptic('medium');
    try {
      const dataUrl = await generateReport(character, calTasks, rpgTasks, journalEntries, goals, transactions, quotes, t, now);
      setReportImageUrl(dataUrl);
    } catch (e) {
      console.error('Report error:', e);
      addToast('Error', 'error');
    }
    setReportGenerating(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center acta-bg">
        <div className="text-center fade-in">
          <img src={eagleImg} alt="" className="w-20 h-20 mx-auto mb-4 object-cover" style={{ borderRadius: 4 }} />
          <h1 className="font-cinzel-dec text-3xl tracking-widest text-white" style={{ letterSpacing: '8px' }}>{t.appTitle}</h1>
          <p className="text-sm mt-2 font-serif" style={{ color: '#333' }}>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!character) return null;

  const xpForNextLevel = XP_PER_LEVEL;
  const currentLevelXp = character.totalXp % XP_PER_LEVEL;
  const xpPct = Math.round((currentLevelXp / xpForNextLevel) * 100);



  return (
    <div className="min-h-screen acta-bg flex flex-col" style={{ backgroundImage: `url(${stoicBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {/* HEADER */}
      <header className="border-b border-gray-800" style={{ background: 'rgba(0,0,0,0.98)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={eagleImg} alt="" className="w-10 h-10 object-cover" style={{ borderRadius: 2 }} />
            <div>
              <h1 className="font-cinzel-dec text-lg tracking-widest text-white" style={{ fontWeight: 700, letterSpacing: '5px' }}>{t.appTitle}</h1>
              <p className="text-xs font-cinzel" style={{ color: '#444' }}>{getLevelTitle(character.level)} · {toRoman(character.level)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="lang-toggle" onClick={toggleLang}>{lang === 'ru' ? 'EN' : 'RU'}</button>
            <div className="text-right">
              <p className="font-cinzel text-sm text-white">{character.visibleName}</p>
              <p className="text-xs font-serif" style={{ color: '#444' }}>XP: {character.totalXp}</p>
            </div>
            <img src={getLevelImage(character.level)} alt="" className="w-10 h-10 avatar-ring object-cover" style={{ borderRadius: 4 }} />
          </div>
        </div>
      </header>

      <main className={`px-3 py-4 flex-1 transition-opacity duration-300 ${tabTransition ? 'opacity-0' : 'opacity-100'}`}>
        {/* CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="fade-in">
            <div className="flex items-center justify-between mb-4">
              <button className="acta-btn-primary text-lg px-4 py-2" onClick={prevMonth}>◂</button>
              <div className="text-center">
                <h2 className="font-cinzel-dec text-xl tracking-wider text-white" style={{ letterSpacing: '3px' }}>{t.monthsLat[calMonth]}</h2>
                <p className="font-cinzel text-xs" style={{ color: '#444' }}>{t.months[calMonth]} {calYear}</p>
              </div>
              <button className="acta-btn-primary text-lg px-4 py-2" onClick={nextMonth}>▸</button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="stat-card py-2">
                <p className="font-cinzel-dec text-lg text-white">{calStats.totalChecks}</p>
                <p className="text-xs font-cinzel" style={{ color: '#444' }}>{t.completed}</p>
              </div>
              <div className="stat-card py-2">
                <p className="font-cinzel-dec text-lg text-white">{calStats.streak}</p>
                <p className="text-xs font-cinzel" style={{ color: '#444' }}>{t.streak}</p>
              </div>
              <div className="stat-card py-2">
                <p className="font-cinzel-dec text-lg text-white">{calStats.pct}%</p>
                <p className="text-xs font-cinzel" style={{ color: '#444' }}>{t.progress}</p>
              </div>
            </div>

            <div className="acta-panel overflow-hidden mb-4">
              <div ref={calScrollRef} className="overflow-x-auto cal-scroll">
                <table className="calendar-table">
                  <thead>
                    <tr>
                      <th className="task-name-cell font-cinzel text-left" style={{ color: '#777' }}>{t.taskLabel}</th>
                      {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                        <th key={d} className={`${isWeekend(calYear, calMonth, d) ? 'weekend-header' : ''} ${isCurrentMonth && d === todayD ? 'today-col' : ''}`}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calTasks.map(task => (
                      <tr key={task.id}>
                        <td className="task-name-cell">
                          <div className="flex items-center gap-2">
                            {editingTaskId === task.id ? (
                              <input
                                ref={newTaskInputRef}
                                className="acta-input text-xs py-0 px-1 flex-1"
                                value={editingName}
                                placeholder={t.taskLabel}
                                onChange={e => setEditingName(e.target.value)}
                                onBlur={saveEditTask}
                                onKeyDown={e => e.key === 'Enter' && saveEditTask()}
                                autoFocus
                              />
                            ) : (
                              <span className="cursor-pointer flex-1 text-xs task-name-text" onClick={() => startEditTask(task.id, task.name)} title={task.name}>{task.name || t.noName}</span>
                            )}

                            <button className="delete-btn text-xs" onClick={() => removeCalTask(task.id)}>×</button>
                          </div>
                        </td>
                        {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => {
                          const k = dateKey(calYear, calMonth, d);
                          const checked = !!task.checks[k];
                          const isFuture = isFutureDate(calYear, calMonth, d);
                          const weekend = isWeekend(calYear, calMonth, d);
                          return (
                            <td key={d} className={`${isCurrentMonth && d === todayD ? 'today-col' : ''} ${weekend ? 'weekend-col' : ''}`}>
                              <div className={`check-cell ${checked ? 'checked' : ''} ${isFuture ? 'disabled' : ''}`} onClick={() => !isFuture && toggleCheck(task.id, d)} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button className="acta-btn-primary w-full py-3 mb-4" onClick={addCalTask}>+ {t.addTask}</button>

            {/* Attribute Selection Modal for new calendar task */}
            {showAttrModal && (
              <div className="modal-overlay" onClick={() => { setShowAttrModal(false); setPendingNewTaskId(null); }}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3 className="font-cinzel-dec text-lg mb-2 text-center text-white">{t.selectAttribute}</h3>
                  <p className="text-xs text-center mb-6 font-serif" style={{ color: '#555' }}>{t.selectAttrDesc}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['strength', 'intellect', 'spirit', 'discipline'] as const).map(attr => (
                      <button
                        key={attr}
                        className="attr-select-card"
                        onClick={() => confirmNewTaskAttr(attr)}
                      >
                        <div className="flex flex-col items-center gap-2 py-3">
                          <AttrIcon attr={attr} size={32} color="#ffffff" />
                          <span className="font-cinzel text-sm text-white">{ATTR_LABELS[attr]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button className="acta-btn w-full mt-4 py-2" onClick={() => { setShowAttrModal(false); setPendingNewTaskId(null); }}>{t.cancel}</button>
                </div>
              </div>
            )}

            {/* Routine */}
            <div className="mb-4">
              <button className="w-full flex items-center justify-between acta-panel-clickable p-3" onClick={() => setShowRoutineSection(!showRoutineSection)}>
                <span className="font-cinzel text-sm text-white">{t.routine}</span>
                <span style={{ color: '#555' }}>{showRoutineSection ? '▴' : '▾'}</span>
              </button>

              {showRoutineSection && (
                <div className="mt-2 acta-panel p-3 slide-down">
                  {todayRoutines.length > 0 ? (
                    <>
                      <p className="text-xs mb-2 font-serif" style={{ color: '#444' }}>{t.today} ({DAY_NAMES[todayDayIndex]}):</p>
                      {todayRoutines.map(r => (
                        <div key={r.id} className="routine-item flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-cinzel text-sm text-white">{r.time}</span>
                            <span className="text-white text-sm font-serif">{r.activity}</span>
                          </div>
                          <button className="delete-btn text-xs" onClick={() => deleteRoutine(r.id)}>×</button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-center py-2 font-serif" style={{ color: '#333' }}>{t.noRoutine}</p>
                  )}
                  <button className="acta-btn w-full mt-3 py-2 text-sm" onClick={() => setShowRoutineModal(true)}>+ {t.addRoutine}</button>
                </div>
              )}
            </div>

            {showRoutineModal && (
              <div className="modal-overlay" onClick={() => setShowRoutineModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3 className="font-cinzel-dec text-lg mb-4 text-center text-white">{t.routine}</h3>
                  <input type="time" className="acta-input w-full mb-3 py-2" value={routineFormTime} onChange={e => setRoutineFormTime(e.target.value)} />
                  <input className="acta-input w-full mb-3 py-2" placeholder={t.activity} value={routineFormActivity} onChange={e => setRoutineFormActivity(e.target.value)} />
                  <div className="flex gap-1 mb-4">
                    {DAY_NAMES.map((name, idx) => (
                      <button key={idx} className={`day-chip ${routineFormDays.includes(idx) ? 'active' : ''}`} onClick={() => toggleRoutineDay(idx)}>{name}</button>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <button className="acta-btn text-xs flex-1 py-1" onClick={() => setRoutineFormDays([0, 1, 2, 3, 4])}>{t.weekdays}</button>
                    <button className="acta-btn text-xs flex-1 py-1" onClick={() => setRoutineFormDays([5, 6])}>{t.weekend}</button>
                    <button className="acta-btn text-xs flex-1 py-1" onClick={() => setRoutineFormDays([0, 1, 2, 3, 4, 5, 6])}>{t.allWeek}</button>
                  </div>
                  <div className="flex gap-2">
                    <button className="acta-btn-primary flex-1 py-2" onClick={addRoutine}>{t.add}</button>
                    <button className="acta-btn flex-1 py-2" onClick={() => setShowRoutineModal(false)}>{t.cancel}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HERO */}
        {activeTab === 'rpg' && (
          <div className="fade-in">
            <div className="acta-panel p-4 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img src={getLevelImage(character.level)} alt="" className="w-20 h-20 avatar-ring object-cover" style={{ borderRadius: 6 }} />
                  {showLevelUp && (
                    <div className="absolute inset-0 flex items-center justify-center level-up-anim">
                      <span className="font-cinzel-dec text-sm font-bold text-white">UP</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-cinzel-dec text-base text-white">{character.visibleName}</p>
                  <p className="font-cinzel text-sm" style={{ color: '#555' }}>{getLevelTitle(character.level)} · {t.level} {toRoman(character.level)}</p>
                  <div className="progress-bar-container mt-2">
                    <div className="progress-bar-fill" style={{ width: `${xpPct}%` }} />
                  </div>
                  <p className="text-xs mt-1 font-serif" style={{ color: '#444' }}>{currentLevelXp}/{xpForNextLevel} XP</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {(Object.keys(ATTR_LABELS) as (keyof CharacterStats)[]).map(attr => (
                  <div key={attr} className="text-center p-2" style={{ borderLeft: '1px solid #333' }}>
                    <div className="flex justify-center mb-1">
                      <AttrIcon attr={attr} size={20} color="#fff" />
                    </div>
                    <p className="font-cinzel text-sm text-white">{character.stats[attr]}</p>
                    <p className="text-xs font-cinzel" style={{ color: '#999', fontSize: '0.5rem' }}>
                      {attr === 'strength' ? t.strengthLat : attr === 'intellect' ? t.intellectLat : attr === 'spirit' ? t.spiritLat : t.disciplineLat}
                    </p>
                  </div>
                ))}
              </div>

              <DonutChart stats={character.stats} t={t} />
            </div>

            <div className="flex gap-2 mb-4">
              <select className="acta-select flex-1 text-sm py-2" value={rpgFilter} onChange={e => setRpgFilter(e.target.value)}>
                <option value="all">{t.allAttr}</option>
                <option value="strength">{t.strength}</option>
                <option value="intellect">{t.intellect}</option>
                <option value="spirit">{t.spirit}</option>
                <option value="discipline">{t.discipline}</option>
              </select>
              <select className="acta-select flex-1 text-sm py-2" value={rpgStatusFilter} onChange={e => setRpgStatusFilter(e.target.value)}>
                <option value="active">{t.active}</option>
                <option value="completed">{t.done}</option>
                <option value="all">{t.allAttr}</option>
              </select>
            </div>

            {filteredRpgTasks.length === 0 && (
              <div className="text-center py-8" style={{ color: '#333' }}>
                <p className="font-cinzel text-base mb-2">{t.noTasks}</p>
                <p className="text-sm font-serif">{t.createFirst}</p>
              </div>
            )}

            {filteredRpgTasks.map(task => {
              const allStepsDone = task.steps.length === 0 || task.steps.every(s => s.done);
              const canComplete = !task.completed && allStepsDone;
              return (
                <div key={task.id} className={`rpg-task-card ${task.completed ? 'completed' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AttrIcon attr={task.attribute} size={18} color={ATTR_COLORS_LIGHT[task.attribute]} />
                        <span className="font-cinzel text-sm text-white">{task.name}</span>
                      </div>
                      <div className="flex gap-1 mb-2 items-center">
                        {[1, 2, 3, 4, 5].map(s => (<span key={s} className="task-star"><StarIcon filled={s <= task.difficulty} size={14} /></span>))}
                        <span className="text-xs ml-2 font-serif" style={{ color: '#555' }}>+{DIFFICULTY_XP[task.difficulty]} XP</span>
                      </div>
                      {task.steps.length > 0 && (
                        <div>
                          {task.steps.map(step => (
                            <div key={step.id} className={`step-item ${step.done ? 'done' : ''}`} onClick={() => !task.completed && toggleRpgStep(task.id, step.id)}>
                              <span className="step-checkbox">{step.done ? '✓' : ''}</span>
                              <span className="step-text text-sm">{step.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {canComplete && (<button className="acta-btn-complete mt-3 py-2 text-sm" onClick={() => completeRpgTask(task.id)}>{t.complete}</button>)}
                    </div>
                    <button className="delete-btn" onClick={() => setRpgTasks(prev => prev.filter(t => t.id !== task.id))}>×</button>
                  </div>
                </div>
              );
            })}

            <button className="acta-btn-primary w-full py-3 mt-4" onClick={() => setShowRpgModal(true)}>+ {t.newMission}</button>

            {/* DOWNLOAD REPORT BUTTON */}
            <button
              className="report-btn w-full mt-4"
              onClick={handleDownloadReport}
              disabled={reportGenerating}
            >
              <div className="flex items-center justify-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{reportGenerating ? t.reportGenerating : t.downloadReport}</span>
              </div>
            </button>

            {/* REPORT IMAGE MODAL */}
            {reportImageUrl && (
              <div className="modal-overlay" onClick={() => setReportImageUrl(null)}>
                <div className="report-modal-content" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-cinzel text-sm text-white">{t.reportTitle}</p>
                    <button className="delete-btn text-lg" onClick={() => setReportImageUrl(null)}>×</button>
                  </div>
                  <p className="text-xs font-serif mb-3" style={{ color: '#555' }}>{t.reportSaveHint}</p>
                  <div className="report-image-wrapper">
                    <img
                      src={reportImageUrl}
                      alt="ACTA Report"
                      className="report-image"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={reportImageUrl}
                      download={`ACTA_Report_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.png`}
                      className="acta-btn-primary flex-1 py-2 text-center"
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      {t.reportDownloadBtn}
                    </a>
                    <button className="acta-btn flex-1 py-2" onClick={() => setReportImageUrl(null)}>{t.close}</button>
                  </div>
                </div>
              </div>
            )}

            {showRpgModal && (
              <div className="modal-overlay" onClick={() => setShowRpgModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3 className="font-cinzel-dec text-lg mb-4 text-center text-white">{t.newMission}</h3>
                  <input className="acta-input w-full mb-3 py-2" placeholder={t.missionName} value={rpgFormName} onChange={e => setRpgFormName(e.target.value)} />
                  <select className="acta-select w-full mb-3 py-2" value={rpgFormAttr} onChange={e => setRpgFormAttr(e.target.value as typeof rpgFormAttr)}>
                    <option value="strength">{t.strength}</option>
                    <option value="intellect">{t.intellect}</option>
                    <option value="spirit">{t.spirit}</option>
                    <option value="discipline">{t.discipline}</option>
                  </select>
                  <div className="mb-4">
                    <p className="text-xs mb-2 font-cinzel" style={{ color: '#444' }}>{t.difficulty}</p>
                    <div className="flex gap-3 items-center justify-center">
                      {[1, 2, 3, 4, 5].map(s => (<span key={s} className="difficulty-star cursor-pointer" onClick={() => setRpgFormDiff(s)}><StarIcon filled={s <= rpgFormDiff} size={32} /></span>))}
                      <span className="text-sm ml-3 font-cinzel text-white">+{DIFFICULTY_XP[rpgFormDiff]} XP</span>
                    </div>
                  </div>
                  <p className="text-xs mb-2 font-cinzel" style={{ color: '#444' }}>{t.steps}</p>
                  {rpgFormSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input className="acta-input flex-1 text-sm py-1" placeholder={`${idx + 1}`} value={step}
                        onChange={e => { const ns = [...rpgFormSteps]; ns[idx] = e.target.value; setRpgFormSteps(ns); }} />
                      {rpgFormSteps.length > 1 && <button className="delete-btn" onClick={() => setRpgFormSteps(prev => prev.filter((_, i) => i !== idx))}>×</button>}
                    </div>
                  ))}
                  <button className="acta-btn w-full mb-4 py-2 text-sm" onClick={() => setRpgFormSteps(prev => [...prev, ''])}>+ {t.addStep}</button>
                  <div className="flex gap-2">
                    <button className="acta-btn-primary flex-1 py-2" onClick={createRpgTask}>{t.create}</button>
                    <button className="acta-btn flex-1 py-2" onClick={() => setShowRpgModal(false)}>{t.cancel}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* JOURNAL */}
        {activeTab === 'journal' && (
          <div className="fade-in">
            <div className="text-center mb-4">
              <h2 className="font-cinzel-dec text-xl text-white" style={{ letterSpacing: '3px' }}>{t.journal}</h2>
            </div>

            <input type="date" className="acta-input w-full text-center mb-4 py-2" value={journalDate} onChange={e => setJournalDate(e.target.value)} />

            <div className="flex gap-1 mb-4">
              <button className={`flex-1 py-2 text-sm ${journalSection === 'reflection' ? 'acta-subtab-active' : 'acta-subtab'}`}
                onClick={() => setJournalSection('reflection')}>{t.sectionReflection}</button>
              <button className={`flex-1 py-2 text-sm ${journalSection === 'ideas' ? 'acta-subtab-active' : 'acta-subtab'}`}
                onClick={() => setJournalSection('ideas')}>{t.sectionIdeas}</button>
            </div>

            {journalSection === 'reflection' && (
              <div className="acta-panel p-4 mb-4 fade-in">
                <p className="text-center text-xs mb-3 font-cinzel" style={{ color: '#444' }}>{t.moodState}</p>
                <div className="flex justify-around mb-4">
                  {[1, 2, 3, 4, 5].map(m => (
                    <button key={m} className={`mood-btn ${journalMood === m ? 'active' : ''}`} onClick={() => { haptic('selection'); setJournalMood(m); }}>
                      <span className="mood-icon">{toRoman(m)}</span>
                      <span className="mood-label">{MOOD_LABELS[m - 1]}</span>
                    </button>
                  ))}
                </div>

                <textarea className="journal-textarea mb-3" style={{ minHeight: 70 }} placeholder={t.gratitude} value={journalGratitude} onChange={e => setJournalGratitude(e.target.value)} />
                <textarea className="journal-textarea mb-3" style={{ minHeight: 80 }} placeholder={t.reflections} value={journalReflection} onChange={e => setJournalReflection(e.target.value)} />
                <textarea className="journal-textarea mb-3" style={{ minHeight: 70 }} placeholder={t.lessonDay} value={journalLesson} onChange={e => setJournalLesson(e.target.value)} />
                <textarea className="journal-textarea mb-4" style={{ minHeight: 70 }} placeholder={t.tomorrowDiff} value={journalDifferent} onChange={e => setJournalDifferent(e.target.value)} />

                <button className="acta-btn-primary w-full py-3" onClick={saveJournalEntry}>{t.save}</button>
              </div>
            )}

            {journalSection === 'ideas' && (
              <div className="acta-panel p-4 mb-4 fade-in">
                <textarea className="journal-textarea mb-4" style={{ minHeight: 200 }} placeholder={t.ideasPlaceholder} value={journalIdeas} onChange={e => setJournalIdeas(e.target.value)} />

                <button className="acta-btn-primary w-full py-3" onClick={saveJournalEntry}>{t.save}</button>
              </div>
            )}

            <p className="text-xs mb-2 font-cinzel" style={{ color: '#444' }}>{t.pastEntries}</p>
            {journalEntries.slice(0, 10).map(entry => (
              <div key={entry.id} className="journal-entry" onClick={() => setViewingEntry(entry)}>
                <div className="flex justify-between items-center">
                  <span className="font-cinzel text-sm text-white">{entry.date}</span>
                  <span className="text-sm font-cinzel" style={{ color: '#555' }}>{toRoman(entry.mood)}</span>
                </div>
                {entry.gratitude && <p className="text-xs mt-1 truncate font-serif" style={{ color: '#555' }}>{entry.gratitude}</p>}
              </div>
            ))}

            {viewingEntry && (
              <div className="modal-overlay" onClick={() => setViewingEntry(null)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-cinzel-dec text-lg text-white">{viewingEntry.date}</h3>
                    <span className="font-cinzel text-white">{toRoman(viewingEntry.mood)} — {MOOD_LABELS[viewingEntry.mood - 1]}</span>
                  </div>
                  {viewingEntry.gratitude && (<div className="mb-4"><p className="text-xs font-cinzel mb-1" style={{ color: '#555' }}>{t.gratitude}</p><p className="text-white text-sm font-serif">{viewingEntry.gratitude}</p></div>)}
                  {viewingEntry.reflection && (<div className="mb-4"><p className="text-xs font-cinzel mb-1" style={{ color: '#555' }}>{t.reflections}</p><p className="text-white text-sm font-serif">{viewingEntry.reflection}</p></div>)}
                  {viewingEntry.lesson && (<div className="mb-4"><p className="text-xs font-cinzel mb-1" style={{ color: '#555' }}>{t.lessonDay}</p><p className="text-white text-sm font-serif">{viewingEntry.lesson}</p></div>)}
                  {viewingEntry.differentTomorrow && (<div className="mb-4"><p className="text-xs font-cinzel mb-1" style={{ color: '#555' }}>{t.tomorrowDiff}</p><p className="text-white text-sm font-serif">{viewingEntry.differentTomorrow}</p></div>)}
                  {viewingEntry.ideas && (<div className="mb-4"><p className="text-xs font-cinzel mb-1" style={{ color: '#555' }}>{t.sectionIdeas}</p><p className="text-white text-sm font-serif">{viewingEntry.ideas}</p></div>)}
                  <div className="flex gap-2">
                    <button className="acta-btn flex-1 py-2" onClick={() => { setJournalDate(viewingEntry.date); setViewingEntry(null); }}>{t.edit}</button>
                    <button className="acta-btn-primary flex-1 py-2" onClick={() => setViewingEntry(null)}>{t.close}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GOALS */}
        {activeTab === 'goals' && (
          <div className="fade-in">
            <div className="text-center mb-4">
              <h2 className="font-cinzel-dec text-xl text-white" style={{ letterSpacing: '3px' }}>{t.goalsTitle}</h2>
              <p className="text-xs font-serif" style={{ color: '#444' }}>{t.goalsSubtitle}</p>
            </div>

            {goals.length === 0 && (
              <div className="text-center py-8" style={{ color: '#333' }}>
                <p className="font-cinzel text-base mb-2">{t.noGoals}</p>
                <p className="text-sm font-serif">{t.setGoal}</p>
              </div>
            )}

            {goals.map(goal => {
              const stepsTotal = goal.steps.length;
              const stepsDone = goal.steps.filter(s => s.done).length;
              const allDone = stepsTotal === 0 || stepsDone === stepsTotal;
              const canComplete = !goal.completed && allDone;
              const progressPct = stepsTotal > 0 ? Math.round((stepsDone / stepsTotal) * 100) : 0;

              return (
                <div key={goal.id} className={`goal-card ${goal.completed ? 'completed' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AttrIcon attr={goal.attribute} size={18} color={ATTR_COLORS_LIGHT[goal.attribute]} />
                        <span className="font-cinzel text-sm text-white">{goal.title}</span>
                        {goal.completed && <span className="text-xs px-2 py-0.5" style={{ background: '#0a2a15', color: '#4ade80', border: '1px solid #1a5c36' }}>✓</span>}
                      </div>
                      {goal.description && <p className="text-xs mb-2 font-serif" style={{ color: '#666' }}>{goal.description}</p>}
                      {goal.deadline && (<p className="text-xs mb-2 font-serif" style={{ color: '#555' }}>{t.deadline}: <span className="text-white">{goal.deadline}</span></p>)}
                      {goal.reward && (<p className="text-xs mb-2 font-serif" style={{ color: '#888' }}>{t.reward}: {goal.reward}</p>)}
                      {stepsTotal > 0 && (
                        <>
                          <div className="w-full h-2 mb-2" style={{ background: '#0a0a0a', borderRadius: 1 }}>
                            <div className="h-full transition-all duration-500" style={{ width: `${progressPct}%`, background: goal.completed ? '#1a5c36' : '#fff', borderRadius: 1 }} />
                          </div>
                          <p className="text-xs mb-2 font-serif" style={{ color: '#555' }}>{stepsDone}/{stepsTotal}</p>
                          {goal.steps.map(step => (
                            <div key={step.id} className={`step-item ${step.done ? 'done' : ''}`} onClick={() => !goal.completed && toggleGoalStep(goal.id, step.id)}>
                              <span className="step-checkbox">{step.done ? '✓' : ''}</span>
                              <div className="flex-1">
                                <span className="step-text text-sm">{step.text}</span>
                                {step.deadline && <span className="text-xs block font-serif" style={{ color: '#444' }}>{step.deadline}</span>}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      {canComplete && (<button className="acta-btn-complete mt-3 py-3 text-sm goal-complete-btn" onClick={() => completeGoal(goal.id)}>{t.goalAchieved}</button>)}
                    </div>
                    <div className="flex flex-col gap-1">
                      {!goal.completed && (<button className="delete-btn text-xs" onClick={() => openEditGoal(goal)} title={t.edit}>✎</button>)}
                      <button className="delete-btn text-xs" onClick={() => deleteGoal(goal.id)}>×</button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button className="acta-btn-primary w-full py-3 mt-4" onClick={() => { setEditingGoal(null); resetGoalForm(); setShowGoalModal(true); }}>+ {t.newGoal}</button>

            {showGoalModal && (
              <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
                <div className="modal-content modal-centered" onClick={e => e.stopPropagation()}>
                  <h3 className="font-cinzel-dec text-lg mb-4 text-center text-white">{editingGoal ? t.editGoal : t.newGoal}</h3>
                  <input className="acta-input w-full mb-3 py-2" placeholder={t.goalName} value={goalFormTitle} onChange={e => setGoalFormTitle(e.target.value)} />
                  <textarea className="journal-textarea mb-3" style={{ minHeight: 60 }} placeholder={t.description} value={goalFormDesc} onChange={e => setGoalFormDesc(e.target.value)} />
                  <div className="flex gap-2 mb-3">
                    <select className="acta-select flex-1 py-2" value={goalFormAttr} onChange={e => setGoalFormAttr(e.target.value as typeof goalFormAttr)}>
                      <option value="strength">{t.strength}</option>
                      <option value="intellect">{t.intellect}</option>
                      <option value="spirit">{t.spirit}</option>
                      <option value="discipline">{t.discipline}</option>
                    </select>
                    <input type="date" className="acta-input flex-1 py-2" value={goalFormDeadline} onChange={e => setGoalFormDeadline(e.target.value)} />
                  </div>
                  <input className="acta-input w-full mb-3 py-2" placeholder={t.reward} value={goalFormReward} onChange={e => setGoalFormReward(e.target.value)} />
                  <p className="text-xs mb-2 font-cinzel" style={{ color: '#444' }}>{t.stepsToGoal}</p>
                  {goalFormSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input className="acta-input flex-1 text-sm py-1" placeholder={`${idx + 1}`} value={step.text}
                        onChange={e => { const ns = [...goalFormSteps]; ns[idx] = { ...ns[idx], text: e.target.value }; setGoalFormSteps(ns); }} />
                      <input type="date" className="acta-input text-sm py-1" style={{ width: 130 }} value={step.deadline}
                        onChange={e => { const ns = [...goalFormSteps]; ns[idx] = { ...ns[idx], deadline: e.target.value }; setGoalFormSteps(ns); }} />
                      {goalFormSteps.length > 1 && <button className="delete-btn" onClick={() => setGoalFormSteps(prev => prev.filter((_, i) => i !== idx))}>×</button>}
                    </div>
                  ))}
                  <button className="acta-btn w-full mb-4 py-2 text-sm" onClick={() => setGoalFormSteps(prev => [...prev, { text: '', deadline: '' }])}>+ {t.addStep}</button>
                  <div className="flex gap-2">
                    <button className="acta-btn-primary flex-1 py-2" onClick={saveGoal}>{editingGoal ? t.save : t.create}</button>
                    <button className="acta-btn flex-1 py-2" onClick={() => setShowGoalModal(false)}>{t.cancel}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINANCE */}
        {activeTab === 'finance' && (
          <div className="fade-in">
            <div className="text-center mb-4">
              <h2 className="font-cinzel-dec text-xl text-white" style={{ letterSpacing: '3px' }}>{t.financeTitle}</h2>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="stat-card py-3 cursor-pointer" onClick={() => { setSelectedFinType('income'); setFinView('overview'); }}>
                <p className="text-xs font-cinzel" style={{ color: '#555' }}>{t.income}</p>
                <p className="font-cinzel text-sm text-green-400">{formatMoney(finStats.income)}</p>
              </div>
              <div className="stat-card py-3 cursor-pointer" onClick={() => { setSelectedFinType('expense'); setFinView('overview'); }}>
                <p className="text-xs font-cinzel" style={{ color: '#555' }}>{t.expenses}</p>
                <p className="font-cinzel text-sm text-red-400">{formatMoney(finStats.expense)}</p>
              </div>
              <div className="stat-card py-3">
                <p className="text-xs font-cinzel" style={{ color: '#555' }}>{t.balance}</p>
                <p className={`font-cinzel text-sm ${finStats.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {finStats.balance >= 0 ? '+' : ''}{formatMoney(finStats.balance)}
                </p>
              </div>
            </div>

            <div className="flex gap-1 mb-4">
              {([['overview', t.overview], ['savings', t.savings], ['history', t.history]] as const).map(([key, label]) => (
                <button key={key}
                  className={`flex-1 py-2 text-xs transition-all duration-300 ${finView === key ? 'acta-subtab-active' : 'acta-subtab'}`}
                  onClick={() => setFinView(key)}
                >{label}</button>
              ))}
            </div>

            {finView === 'overview' && (
              <div className="fade-in">
                <div className="flex items-center justify-between mb-4">
                  <button className="acta-btn px-3 py-1 text-sm" onClick={() => {
                    if (finMonth === 0) { setFinMonth(11); setFinYear(y => y - 1); } else setFinMonth(m => m - 1);
                  }}>◂</button>
                  <span className="font-cinzel text-white">{t.months[finMonth]} {finYear}</span>
                  <button className="acta-btn px-3 py-1 text-sm" onClick={() => {
                    if (finMonth === 11) { setFinMonth(0); setFinYear(y => y + 1); } else setFinMonth(m => m + 1);
                  }}>▸</button>
                </div>

                <div className="flex gap-2 mb-4">
                  <button 
                    className={`flex-1 py-2 text-sm ${selectedFinType === 'income' ? 'acta-subtab-active' : 'acta-subtab'}`}
                    onClick={() => setSelectedFinType('income')}
                  >{t.income}</button>
                  <button 
                    className={`flex-1 py-2 text-sm ${selectedFinType === 'expense' ? 'acta-subtab-active' : 'acta-subtab'}`}
                    onClick={() => setSelectedFinType('expense')}
                  >{t.expenses}</button>
                </div>

                <div className="acta-panel p-3 mb-4">
                  <FinancePieChart 
                    data={selectedFinType === 'income' ? finStats.byIncCat : finStats.byExpCat} 
                    colors={categoryColors}
                  />
                </div>

                <div className="flex gap-2">
                  <button className="acta-btn-primary flex-1 py-2" onClick={() => { setTxFormType('income'); setShowTxModal(true); }}>+ {t.income}</button>
                  <button className="acta-btn-primary flex-1 py-2" onClick={() => { setTxFormType('expense'); setShowTxModal(true); }}>+ {t.expenses}</button>
                </div>
              </div>
            )}

            {finView === 'savings' && (
              <div className="fade-in">
                <div className="stat-card py-3 mb-4">
                  <p className="text-xs font-cinzel" style={{ color: '#555' }}>{t.savingsTitle}</p>
                  <p className="font-cinzel text-lg text-white">{formatMoney(totalSavings)}</p>
                </div>

                {savingsAccounts.length === 0 ? (
                  <p className="text-xs text-center py-8 font-serif" style={{ color: '#333' }}>{t.noTransactions}</p>
                ) : (
                  savingsAccounts.map(acc => {
                    const pct = acc.target > 0 ? Math.round((acc.amount / acc.target) * 100) : 0;
                    return (
                      <div key={acc.id} className="savings-card mb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-cinzel text-white text-sm">{acc.name}</p>
                            {acc.purpose && <p className="text-xs font-serif" style={{ color: '#555' }}>{acc.purpose}</p>}
                          </div>
                          <button className="delete-btn text-xs" onClick={() => removeSavingsAccount(acc.id)}>×</button>
                        </div>
                        <p className="text-xs font-serif mb-1" style={{ color: '#555' }}>
                          {formatMoney(acc.amount)} {acc.target > 0 && `/ ${formatMoney(acc.target)}`}
                        </p>
                        {acc.target > 0 && (
                          <div className="w-full h-2 mb-2" style={{ background: '#0a0a0a', borderRadius: 1 }}>
                            <div className="h-full" style={{ width: `${Math.min(100, pct)}%`, background: '#1a5c36', borderRadius: 1 }} />
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button className="acta-btn flex-1 py-1 text-xs" onClick={() => { setShowDepositModal(acc.id); setDepositType('deposit'); }}>{t.deposit}</button>
                          <button className="acta-btn flex-1 py-1 text-xs" onClick={() => { setShowDepositModal(acc.id); setDepositType('withdraw'); }}>{t.withdraw}</button>
                        </div>
                      </div>
                    );
                  })
                )}

                <button className="acta-btn-primary w-full py-2 mt-4" onClick={() => setShowSavingsModal(true)}>+ {t.addSaving}</button>
              </div>
            )}

            {finView === 'history' && (
              <div className="fade-in">
                {monthTransactions.length === 0 ? (
                  <p className="text-xs text-center py-8 font-serif" style={{ color: '#333' }}>{t.noTransactions}</p>
                ) : (
                  monthTransactions.slice(0, 30).map(tx => {
                    const isIncome = tx.type === 'income';
                    return (
                      <div key={tx.id} className="tx-card mb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white font-serif">{tx.category}</p>
                            {tx.note && <p className="text-xs font-serif" style={{ color: '#555' }}>{tx.note}</p>}
                            <p className="text-xs font-serif" style={{ color: '#333' }}>{tx.date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-cinzel ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                              {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
                            </span>
                            <button className="delete-btn text-xs" onClick={() => removeTransaction(tx.id)}>×</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {showTxModal && (
              <div className="modal-overlay" onClick={() => setShowTxModal(false)}>
                <div className="modal-content modal-centered" onClick={e => e.stopPropagation()}>
                  <h3 className="font-cinzel-dec text-lg mb-4 text-center text-white">{txFormType === 'income' ? t.addIncome : t.addExpense}</h3>
                  <input type="date" className="acta-input w-full mb-3 py-2" value={txFormDate} onChange={e => setTxFormDate(e.target.value)} />
                  <input className="acta-input w-full mb-3 py-2" placeholder={t.category} value={txFormCategory} onChange={e => setTxFormCategory(e.target.value)} 
                    list="categories" />
                  <datalist id="categories">
                    {categories.filter(c => c.type === txFormType).map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                  <input type="number" className="acta-input w-full mb-3 py-2" placeholder={t.amount} value={txFormAmount} onChange={e => setTxFormAmount(e.target.value)} />
                  <input className="acta-input w-full mb-4 py-2" placeholder={t.note} value={txFormNote} onChange={e => setTxFormNote(e.target.value)} />
                  <div className="flex gap-2">
                    <button className="acta-btn-primary flex-1 py-2" onClick={addTransaction}>{t.add}</button>
                    <button className="acta-btn flex-1 py-2" onClick={() => setShowTxModal(false)}>{t.cancel}</button>
                  </div>
                </div>
              </div>
            )}

            {showSavingsModal && (
              <div className="modal-overlay" onClick={() => setShowSavingsModal(false)}>
                <div className="modal-content modal-centered" onClick={e => e.stopPropagation()}>
                  <h3 className="font-cinzel-dec text-lg mb-4 text-center text-white">{t.addSaving}</h3>
                  <input className="acta-input w-full mb-3 py-2" placeholder={t.savingName} value={savingsFormName} onChange={e => setSavingsFormName(e.target.value)} />
                  <input type="number" className="acta-input w-full mb-3 py-2" placeholder={t.currentAmount} value={savingsFormAmount} onChange={e => setSavingsFormAmount(e.target.value)} />
                  <input type="number" className="acta-input w-full mb-3 py-2" placeholder={t.targetAmount} value={savingsFormTarget} onChange={e => setSavingsFormTarget(e.target.value)} />
                  <input className="acta-input w-full mb-4 py-2" placeholder={t.purpose} value={savingsFormPurpose} onChange={e => setSavingsFormPurpose(e.target.value)} />
                  <div className="flex gap-2">
                    <button className="acta-btn-primary flex-1 py-2" onClick={addSavingsAccount}>{t.add}</button>
                    <button className="acta-btn flex-1 py-2" onClick={() => setShowSavingsModal(false)}>{t.cancel}</button>
                  </div>
                </div>
              </div>
            )}

            {showDepositModal && (
              <div className="modal-overlay" onClick={() => setShowDepositModal(null)}>
                <div className="modal-content modal-centered" onClick={e => e.stopPropagation()}>
                  <h3 className="font-cinzel-dec text-lg mb-4 text-center text-white">{depositType === 'deposit' ? t.deposit : t.withdraw}</h3>
                  <input type="number" className="acta-input w-full mb-4 py-2" placeholder={t.amount} value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                  <div className="flex gap-2">
                    <button className="acta-btn-primary flex-1 py-2" onClick={makeDeposit}>{t.add}</button>
                    <button className="acta-btn flex-1 py-2" onClick={() => setShowDepositModal(null)}>{t.cancel}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* QUOTE */}
      {quotes.length > 0 && (
        <div className="quote-footer">
          <div className="text-center px-4">
            <p className="quote-text font-serif">«{quotes[quoteIndex]?.text}»</p>
            <p className="quote-author font-cinzel">— {quotes[quoteIndex]?.author}</p>
            <button className="quote-next"
              onClick={() => setQuoteIndex(i => (i + 1) % quotes.length)}>
              ›› {t.next}
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <div className="flex">
          {([['rpg', 'I', t.navHero], ['calendar', 'II', t.navTasks], ['journal', 'III', t.navJournal], ['goals', 'IV', t.navGoals], ['finance', 'V', t.navFinance]] as const).map(([key, num, label]) => (
            <button key={key} className={`flex-1 py-3 flex flex-col items-center gap-0.5 nav-btn ${activeTab === key ? 'active' : ''}`} onClick={() => switchTab(key)}>
              <span className="text-sm font-cinzel-dec font-bold">{num}</span>
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* TOASTS */}
      <div className="fixed top-16 right-2 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.leaving ? 'toast-out' : 'toast-in'} ${toast.type}`}>
            <p className="font-cinzel text-sm">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
