import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { appSettings, likes, participantPrivate, participants, submissions, taskFields, tasks } from "@/db/schema";
import { seedTasks } from "./seed-data";
import type { Answers } from "@/db/schema";

const SEED_VERSION = "elka-2026-v2";
const CALENDAR_SYNC_KEY = "calendar_sync_msk_midnight";

type DemoAnswer = { taskNumber: number; answers: Answers };

type DemoParticipant = {
  alias: string;
  name: string;
  email: string;
  submissions: DemoAnswer[];
};

const demoParticipants: DemoParticipant[] = [
  {
    alias: "Мандариновый Бэклог",
    name: "Демо-участник 1",
    email: "demo1@example.com",
    submissions: [
      {
        taskNumber: 1,
        answers: {
          user_story:
            "Как аналитик, который весь год жил в спринтах, я хочу провести десять дней без единого уведомления, чтобы наконец услышать тишину и почувствовать праздник.",
          acceptance_criteria:
            "1. Ни одного рабочего сообщения за 10 дней. 2. Телефон заряжается раз в два дня. 3. К 3 января я знаю, какой сегодня день недели.",
          constraints: "Никаких «быстрых созвонов на 15 минут» и «просто посмотреть, как там релиз».",
        },
      },
      {
        taskNumber: 2,
        answers: {
          problem: "Нет новогоднего настроения",
          why_1: "Кажется, что праздник придёт сам, но декабрь заканчивается быстрее, чем появляется настроение.",
          why_2: "Все силы уходят на закрытие года, а не на подготовку.",
          why_3: "Закрытие года — это десятки мелких задач без явного приоритета.",
          why_4: "Приоритеты не расставлены заранее, поэтому каждая задача кажется срочной.",
          why_5: "Нет ритуала, который отделяет рабочий декабрь от праздничного.",
          root_cause: "Отсутствие заранее запланированных «праздничных» слотов в календаре.",
          solution: "Забронировать в календаре 3 вечера на ёлку, подарки и каток — и защитить их как встречу с заказчиком.",
        },
      },
      {
        taskNumber: 4,
        answers: {
          goal: "Сменить роль: из системного аналитика в продукт-аналитика",
          need: "Хотелось влиять на решения, а не только описывать требования.",
          planned: "Пройти курс, собрать три кейса в портфолио, поговорить с тимлидами.",
          result: "Курс прошла, два кейса собраны, оффер пока не получила.",
          status: "Частично реализована",
          factors: "Помогли поддерживающие коллеги и менторство. Помешал плотный квартал и страх публичных выступлений.",
          advice: "Не откладывай разговоры о развитии до «спокойного месяца» — спокойного месяца не будет.",
        },
      },
    ],
  },
  {
    alias: "Полярный Сторителлер",
    name: "Демо-участник 2",
    email: "demo2@example.com",
    submissions: [
      {
        taskNumber: 1,
        answers: {
          user_story:
            "Как человек, который каждый год обещает «всё купить заранее», я хочу получить 5 готовых идей подарков с ценами и ссылками до 15 декабря, чтобы не бегать по магазинам 30-го.",
          acceptance_criteria: "Все подарки куплены до 20 декабря, упакованы, подписаны и лежат в одном месте.",
          constraints: "Никаких сертификатов «на потом» и подарков, которые нужно доставлять из другого города.",
        },
      },
      {
        taskNumber: 2,
        answers: {
          problem: "Не успеваю подготовиться к празднику",
          why_1: "Дедлайны по работе идут плотным потоком.",
          why_2: "Каждый день заканчивается позже, чем планировалось.",
          why_3: "Оценки задач не учитывают встречи и внезапные обсуждения.",
          why_4: "Нет буфера в плане и нет отказа от части входящих задач.",
          why_5: "Страшно показаться недостаточно гибким коллегой.",
          root_cause: "Нет границ: любая задача из любого канала автоматически становится моей.",
          solution: "Ввести правило одного входящего канала и защищённый час без встреч для глубокой работы.",
        },
      },
      {
        taskNumber: 5,
        answers: {
          task_name: "Еженедельный сбор статусов по проектам",
          as_is: "Каждый понедельник я обхожу 6 чатов, вручную собираю обновления и переношу их в таблицу.",
          pain: "Уходит около двух часов и регулярно теряются свежие данные.",
          to_be: "Команды заполняют одну форму, бот собирает ответы и сам публикует сводку в канал.",
          tool: "Google Forms + скрипт в Slack, позже — AI-суммаризация",
          effect: ["Экономия времени", "Снижение количества ошибок", "Ускорение процесса"],
        },
      },
    ],
  },
  {
    alias: "Хвойный Ресерчер",
    name: "Демо-участник 3",
    email: "demo3@example.com",
    submissions: [
      {
        taskNumber: 2,
        answers: {
          problem: "Не могу выбрать подарки",
          why_1: "Слишком много вариантов и все кажутся «нормальными».",
          why_2: "Не понимаю, что действительно порадует получателей.",
          why_3: "Не спрашиваю напрямую, чтобы сохранить сюрприз.",
          why_4: "Боюсь, что «правильный» подарок должен быть неожиданным.",
          why_5: "Оцениваю подарок по реакции в момент вручения, а не по пользе.",
          root_cause: "Нет критериев выбора: оцениваю эмоцию, а не пользу для человека.",
          solution: "Собрать список интересов каждого получателя и выбрать подарок, который он использовал бы чаще раза в год.",
        },
      },
      {
        taskNumber: 4,
        answers: {
          goal: "Прочитать 12 профильных книг за год",
          need: "Хотелось перестать решать сложные задачи интуитивно.",
          planned: "Читать 30 минут в день, вести заметки, обсуждать в книжном клубе.",
          result: "Прочитано 9 книг, заметки по 6, клуб стал регулярной привычкой.",
          status: "В процессе",
          factors: "Помогли короткие материалы и клубные дедлайны. Помешали поездки и сезон высокой нагрузки.",
          advice: "Читай не для галочки, а сразу применяй одну идею из книги в ближайший спринт.",
        },
      },
      {
        taskNumber: 6,
        answers: {
          participated: "Нет, но хотел(а) бы",
          liked: "Очень понравились квесты с логическими задачками — читала ответы коллег.",
          improve: "Хочется больше подсказок по ходу и понятнее правила.",
          formats: ["Командные квизы", "Онлайн-квесты", "Игры на логику и эрудицию"],
          idea: "«Аналитический детектив»: команда получает требования от подозрительного заказчика и ищет противоречия.",
        },
      },
    ],
  },
  {
    alias: "Гирляндовый Гроус",
    name: "Демо-участник 4",
    email: "demo4@example.com",
    submissions: [
      {
        taskNumber: 1,
        answers: {
          user_story:
            "Как владелец двух котов, я хочу встретить Новый год в доме, где ёлка стоит до утра 1 января, чтобы праздничный декор дожил до полуночи.",
          acceptance_criteria: "Ёлка стоит на месте в 00:30, игрушки целы, коты выглядят разочарованными, но здоровыми.",
          constraints: "Никаких стеклянных шаров и дождика на нижних ветках.",
        },
      },
      {
        taskNumber: 3,
        answers: {
          attended: "Регулярно",
          webinar_score: 9,
          liked: ["Темы и актуальность", "Практические примеры и кейсы", "Возможность задавать вопросы"],
          improve: "Хочется записей и списка материалов сразу после встречи.",
          topics: ["AI и автоматизация", "Архитектура и проектирование", "Карьера и профессиональное развитие"],
          format: "Разбор реального кейса",
          experts: "Практиков из продуктовых команд — можно с внутренними спикерами S7.",
          theme: "Как проектировать интеграции, когда требования меняются каждую неделю.",
        },
      },
      {
        taskNumber: 5,
        answers: {
          task_name: "Ручной перенос задач между двумя трекерами",
          as_is: "После каждой встречи переношу задачи из доски заказчика в наш Jira вручную.",
          pain: "Ошибки в формулировках и потерянные ссылки.",
          to_be: "Интеграция через API: задачи создаются автоматически с шаблоном и обратной ссылкой.",
          tool: "Интеграция Jira + n8n",
          effect: ["Уменьшение ручной работы", "Снижение количества ошибок"],
        },
      },
    ],
  },
  {
    alias: "Мятный Скрам-мастер",
    name: "Демо-участник 5",
    email: "demo5@example.com",
    submissions: [
      {
        taskNumber: 3,
        answers: {
          attended: "Не участвовал(а)",
          topics: ["Бизнес-анализ", "Soft skills и коммуникации", "Личный бренд"],
          format: "Воркшоп",
          experts: "",
          theme: "Как аналитику говорить с бизнесом на языке денег.",
        },
      },
      {
        taskNumber: 6,
        answers: {
          participated: "Да, участвовал(а)",
          liked: "Атмосфера и скорость: за час успели решить пять задачек и посмеяться.",
          improve: "Больше командных форматов и таблицы лидеров между встречами.",
          formats: ["Командные квизы", "Профессиональные симуляции", "Разборы кейсов и бизнес-ситуаций"],
          idea: "Симуляция «Релиз 31 декабря»: команды договариваются о скоупе с внезапно меняющимся заказчиком.",
        },
      },
    ],
  },
  {
    alias: "Снежный Требователь",
    name: "Демо-участник 6",
    email: "demo6@example.com",
    submissions: [
      {
        taskNumber: 4,
        answers: {
          goal: "Выступить на большом внутреннем митапе",
          need: "Хотелось проверить, что мой опыт интересен не только команде.",
          planned: "Написать заявку, собрать материал, отрепетировать с коллегой.",
          result: "Заявка не отправлена: победил страх и загруженность.",
          status: "Отложена",
          factors: "Помогло обсуждение темы с коллегами. Помешал перфекционизм: «нужно ещё доработать».",
          advice: "Отправляй заявку с тем, что уже есть. Дорабатывать можно после одобрения.",
        },
      },
      {
        taskNumber: 5,
        answers: {
          task_name: "Подготовка еженедельного отчёта по метрикам",
          as_is: "Собираю данные из трёх дашбордов и вручную собираю их в презентацию.",
          pain: "Полдня повторяющейся работы и риск опечаток.",
          to_be: "Один дашборд с готовыми срезами и автоматическая выгрузка в PDF по расписанию.",
          tool: "BI-дашборд + scheduled export",
          effect: ["Экономия времени", "Ускорение процесса"],
        },
      },
    ],
  },
  {
    alias: "Ватрушечный Валидатор",
    name: "Демо-участник 7",
    email: "demo7@example.com",
    submissions: [
      {
        taskNumber: 1,
        answers: {
          user_story:
            "Как человек, который весь год собирал чужие требования, я хочу один день, когда никто ничего от меня не хочет, чтобы просто почитать книгу и выпить какао.",
          acceptance_criteria: "День без встреч, уведомлений и списков задач. Какао выпито. Книга прочитана.",
          constraints: "Нельзя заменить отдых «продуктивным утром».",
        },
      },
      {
        taskNumber: 2,
        answers: {
          problem: "Не хватает времени на отдых",
          why_1: "Вечера уходят на доделывание работы.",
          why_2: "Днём много встреч, работа начинается вечером.",
          why_3: "Календарь заполняется чужими встречами по умолчанию.",
          why_4: "Не ставлю блоки на свою работу и не отказываюсь от встреч без повестки.",
          why_5: "Кажется, что отказ — это невежливо.",
          root_cause: "Отсутствие собственных приоритетов в календаре.",
          solution: "Два защищённых блока в календаре каждую неделю и вежливый шаблон отказа от встреч без повестки.",
        },
      },
    ],
  },
  {
    alias: "Тимлидовый Снеговик",
    name: "Демо-участник 8",
    email: "demo8@example.com",
    submissions: [
      {
        taskNumber: 4,
        answers: {
          goal: "Собрать внутреннее сообщество аналитиков в своём дивизионе",
          need: "Специалисты были разбросаны по командам и не обменивались опытом.",
          planned: "Запустить ежемесячные встречи, найти 5 спикеров, сделать канал.",
          result: "Проведено 7 встреч, 42 участника, канал живёт.",
          status: "Реализована",
          factors: "Помогли поддержка руководителя и простой формат встреч без слайдов.",
          advice: "Не готовь идеальную программу — начни с одной встречи и спроси, что улучшить.",
        },
      },
      {
        taskNumber: 6,
        answers: {
          participated: "Да, участвовал(а)",
          liked: "Разбор бизнес-кейсов — можно было применить инструменты сразу.",
          improve: "Добавить уровни сложности: для новичков и для опытных.",
          formats: ["Разборы кейсов и бизнес-ситуаций", "Индивидуальные интеллектуальные задания"],
          idea: "«Баттл требований»: две команды защищают разные решения одной задачи, сообщество голосует.",
        },
      },
      {
        taskNumber: 3,
        answers: {
          attended: "Несколько раз",
          webinar_score: 8,
          liked: ["Эксперты и спикеры", "Общение с участниками"],
          improve: "Больше практики и меньше теории, добавить разбор домашних заданий.",
          topics: ["Продуктовый подход", "Управление и лидерство", "Data Science и ML"],
          format: "Мастер-класс",
          experts: "",
          theme: "Как строить продуктовые метрики, когда данных мало.",
        },
      },
    ],
  },
];

const pendingDemo: Array<{ alias: string; taskNumber: number; answers: Answers }> = [
  {
    alias: "Морозный Медиатор",
    taskNumber: 2,
    answers: {
      problem: "Слишком много дел перед Новым годом",
      why_1: "Список дел растёт быстрее, чем я успеваю его сокращать.",
      why_2: "В список попадает всё подряд, без фильтра.",
      why_3: "Боюсь что-то забыть и записываю каждую мелочь.",
      why_4: "Нет разделения на обязательное и приятное.",
      why_5: "Отдых не считается делом, поэтому его нет в списке.",
      root_cause: "Список дел не связан с ценностью, а только со страхом упустить.",
      solution: "Разделить список на «обязательно», «приятно» и «можно не делать», а отдых внести в обязательное.",
    },
  },
  {
    alias: "Ледяной Лессонс-Лиард",
    taskNumber: 5,
    answers: {
      task_name: "Ручная сверка данных между отчётами",
      as_is: "Раз в месяц сверяю два отчёта глазами, около трёх часов.",
      pain: "Ошибки и невозможность воспроизвести сверку.",
      to_be: "SQL-скрипт с автоматической проверкой расхождений и предупреждением в чат.",
      tool: "SQL + cron + бот",
      effect: ["Экономия времени", "Снижение количества ошибок"],
    },
  },
];

const pendingLikes: Record<string, number> = {
  "Мандариновый Бэклог:1": 7,
  "Полярный Сторителлер:1": 5,
  "Гирляндовый Гроус:1": 12,
  "Ватрушечный Валидатор:1": 9,
  "Мандариновый Бэклог:2": 11,
  "Полярный Сторителлер:2": 6,
  "Хвойный Ресерчер:2": 8,
  "Ватрушечный Валидатор:2": 4,
  "Мандариновый Бэклог:4": 10,
  "Хвойный Ресерчер:4": 5,
  "Снежный Требователь:4": 13,
  "Тимлидовый Снеговик:4": 16,
  "Полярный Сторителлер:5": 7,
  "Гирляндовый Гроус:5": 3,
  "Снежный Требователь:5": 6,
  "Хвойный Ресерчер:6": 8,
  "Мятный Скрам-мастер:6": 9,
  "Тимлидовый Снеговик:6": 11,
  "Гирляндовый Гроус:3": 14,
  "Мятный Скрам-мастер:3": 4,
  "Тимлидовый Снеговик:3": 7,
};

let seedPromise: Promise<void> | null = null;

async function runSeed(): Promise<void> {
  const existingSetting = await db
    .select()
    .from(appSettings)
    .where(sql`${appSettings.key} = ${"seed_version"}`)
    .limit(1);

  if (existingSetting[0]?.value === SEED_VERSION) return;

  const taskRowsBefore = await db.select({ id: tasks.id, number: tasks.number }).from(tasks);

  if (taskRowsBefore.length === 0) {
    await db
      .insert(tasks)
      .values(
        seedTasks.map((t) => ({
          number: t.number,
          slug: t.slug,
          title: t.title,
          week: t.week,
          weekTitle: t.weekTitle,
          tool: t.tool,
          description: t.description,
          example: t.example ?? null,
          dateLabel: t.dateLabel,
          publishAt: new Date(t.publishAt),
          closesAt: new Date(t.closesAt),
          manualState: t.manualState,
          points: t.points,
          sortOrder: t.number,
        })),
      )
      .onConflictDoNothing();
  }

  const taskRowsForFields = await db.select({ id: tasks.id, number: tasks.number }).from(tasks);
  const idByNumber = new Map(taskRowsForFields.map((row) => [row.number, row.id]));

  const existingFields = await db.select({ id: taskFields.id }).from(taskFields).limit(1);

  if (existingFields.length === 0) {
    await db
      .insert(taskFields)
      .values(
        seedTasks.flatMap((t) =>
          t.fields.map((field, index) => ({
            taskId: idByNumber.get(t.number)!,
            key: field.key,
            label: field.label,
            type: field.type,
            required: field.required ?? false,
            groupLabel: field.group ?? null,
            placeholder: field.placeholder ?? null,
            helpText: field.help ?? null,
            options: field.options ?? [],
            condition: field.condition ?? null,
            cardFields: field.cardFields ?? [],
            minCards: field.minCards ?? 1,
            maxCards: field.maxCards ?? 5,
            numberMin: field.numberMin ?? 1,
            numberMax: field.numberMax ?? 10,
            publish: field.publish ?? true,
            sortOrder: index,
          })),
        ),
      )
      .onConflictDoNothing();
  }

  const existingParticipants = await db.select({ id: participants.id }).from(participants).limit(1);

  if (existingParticipants.length === 0) {
    const allParticipants = [
      ...demoParticipants.map((p) => ({ alias: p.alias, name: p.name, email: p.email })),
      ...pendingDemo.map((p) => ({ alias: p.alias, name: "Демо-участник (модерация)", email: "pending@example.com" })),
    ];

    const insertedParticipants = await db
      .insert(participants)
      .values(allParticipants.map((p) => ({ alias: p.alias })))
      .onConflictDoNothing()
      .returning({ id: participants.id, alias: participants.alias });

    void insertedParticipants;
    const allParticipantRows = await db.select({ id: participants.id, alias: participants.alias }).from(participants);
    const participantByAlias = new Map(allParticipantRows.map((p) => [p.alias, p.id]));

    await db
      .insert(participantPrivate)
      .values(
        allParticipants.map((p) => ({
          participantId: participantByAlias.get(p.alias)!,
          privateName: p.name,
          privateEmail: p.email,
        })),
      )
      .onConflictDoNothing();
    const taskRows = await db.select({ id: tasks.id, number: tasks.number }).from(tasks);
    const taskIdByNumber = new Map(taskRows.map((t) => [t.number, t.id]));

    const approvedRows = demoParticipants.flatMap((p) =>
      p.submissions.map((s) => ({
        taskId: taskIdByNumber.get(s.taskNumber)!,
        participantId: participantByAlias.get(p.alias)!,
        answers: s.answers,
        status: "approved",
        createdAt: new Date(Date.UTC(2026, 11, Math.min(1 + s.taskNumber, 24), 9 + (s.taskNumber % 6))),
        moderatedAt: new Date(Date.UTC(2026, 11, Math.min(1 + s.taskNumber, 24), 12)),
        alias: p.alias,
      })),
    );

    const pendingRows = pendingDemo.map((p) => ({
      taskId: taskIdByNumber.get(p.taskNumber)!,
      participantId: participantByAlias.get(p.alias)!,
      answers: p.answers,
      status: "pending",
      createdAt: new Date(Date.UTC(2026, 11, 22, 15)),
      moderatedAt: null,
      alias: p.alias,
    }));

    const insertedSubmissions = await db
      .insert(submissions)
      .values([...approvedRows, ...pendingRows].map(({ alias: _alias, ...row }) => row))
      .onConflictDoNothing()
      .returning({ id: submissions.id, participantId: submissions.participantId });

    const participantIds = allParticipantRows.map((p) => p.id);
    const likeRows: Array<{ submissionId: number; participantId: number }> = [];

    approvedRows.forEach((row, index) => {
      const submissionId = insertedSubmissions[index]?.id;
      if (!submissionId) return;
      const key = `${row.alias}:${[...taskIdByNumber.entries()].find(([, id]) => id === row.taskId)?.[0]}`;
      const желаемое = pendingLikes[key] ?? 2;
      const others = participantIds.filter((id) => id !== row.participantId);
      for (let i = 0; i < Math.min(желаемое, others.length); i += 1) {
        likeRows.push({ submissionId, participantId: others[(index + i) % others.length] });
      }
    });

    if (likeRows.length > 0) {
      await db.insert(likes).values(likeRows).onConflictDoNothing();
    }
  }

  await db
    .insert(appSettings)
    .values({ key: "seed_version", value: SEED_VERSION })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: SEED_VERSION, updatedAt: new Date() } });
}

/**
 * Однократная синхронизация дат открытия: задания открываются по календарю
 * ровно в 00:00 МСК. Нужна, чтобы уже сохранённые в базе задания тоже получили
 * новые отметки времени и календарную блокировку.
 */
async function syncCalendarDates(): Promise<void> {
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, CALENDAR_SYNC_KEY)).limit(1);
  if (rows[0]?.value === "done") return;

  for (const seedTask of seedTasks) {
    await db
      .update(tasks)
      .set({
        publishAt: new Date(seedTask.publishAt),
        closesAt: new Date(seedTask.closesAt),
        manualState: seedTask.manualState,
        dateLabel: seedTask.dateLabel,
      })
      .where(eq(tasks.number, seedTask.number));
  }

  await db
    .insert(appSettings)
    .values({ key: CALENDAR_SYNC_KEY, value: "done" })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: "done", updatedAt: new Date() } });
}

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed()
      .then(syncCalendarDates)
      .catch((error) => {
        seedPromise = null;
        throw error;
      });
  }
  await seedPromise;
}

