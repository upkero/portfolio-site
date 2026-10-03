// All copy lives here. Keys map to [data-i18n] attributes in index.html.

export const CONTACTS = {
  email: 'upkero@icloud.com',
  github: 'https://github.com/upkero',
  // TODO: replace with the real handle
  telegram: 'https://t.me/your_handle',
};

const REPO = (name) => `${CONTACTS.github}/${name}`;

export const dict = {
  ru: {
    'meta.title': 'upkero — AI-инженер: голосовые и чат-агенты, RAG, автоматизация',
    'meta.description':
      'Проектирую и запускаю AI-системы для бизнеса: голосовые и чат-агенты, базы знаний, AI-продажи и интеграции.',
    skip: 'Перейти к содержанию',
    'nav.services': 'Услуги',
    'nav.work': 'Работы',
    'nav.approach': 'Подход',
    'nav.contact': 'Контакт',
    'nav.menu': 'Меню',
    'nav.close': 'Закрыть',
    'nav.role': 'ai engineer',
    'hero.title': 'AI, который раб<i>о</i>тает',
    'hero.sub':
      'upkero — AI-инженер. Проектирую и запускаю голосовых и чат-агентов, базы знаний и автоматизацию для бизнеса.',
    'hero.cta1': 'Обсудить задачу',
    'hero.cta2': 'Смотреть работы',
    'hero.scroll': 'Листайте вниз · Листайте вниз · ',
    'hero.scrollLabel': 'Прокрутить к следующему разделу',
    manifesto:
      'Я строю AI-системы, которые берут на себя рутину: отвечают на звонки, консультируют клиентов, продают и находят ответы в ваших документах. Не демо ради демо — надёжный софт, который работает каждый день.',
    'services.title': 'Что я могу сделать для вашего бизнеса',
    'services.more': 'Нет вашей задачи в списке? Скорее всего, она тоже решается.',
    'services.moreCta': 'Напишите мне',
    'services.example': 'Пример',
    'work.title': 'Избранные проекты',
    'work.lead':
      'Пять сервисов одной вымышленной компании — ресторан, клиника и переговорные под одной крышей. Это примеры подхода, а не граница того, что я умею.',
    'work.open': 'Открыть',
    'work.source': 'Исходный код',
    'work.ctaTitle': 'Ваш проект может быть следующим',
    'work.live': 'Живое демо',
    'work.offline': 'Демо офлайн',
    'work.ctaBtn': 'Обсудить задачу',
    'approach.title': 'Как я работаю',
    'approach.lead': 'От первого звонка до системы, которая живёт в продакшене.',
    'contact.title': 'Есть задача? <i>О</i>бсудим.',
    'contact.lead': 'Расскажите, что хотите автоматизировать, — предложу решение и оценю сроки.',
    'contact.copy': 'Скопировать',
    'contact.copied': 'Скопировано',
    'footer.top': 'Наверх',
    'footer.rights': 'AI-инженер',
    'case.close': 'Закрыть',
    'case.task': 'Задача',
    'case.solution': 'Решение',
    'case.how': 'Как устроено',
    'case.business': 'Что это даёт бизнесу',
    'case.stack': 'Стек',
    'case.source': 'Код на GitHub',
    'case.next': 'Следующий проект',
    cursorOpen: 'Демо',
  },
  en: {
    'meta.title': 'upkero — AI engineer: voice & chat agents, RAG, automation',
    'meta.description':
      'I design and ship AI systems for businesses: voice and chat agents, knowledge bases, AI sales and integrations.',
    skip: 'Skip to content',
    'nav.services': 'Services',
    'nav.work': 'Work',
    'nav.approach': 'Approach',
    'nav.contact': 'Contact',
    'nav.menu': 'Menu',
    'nav.close': 'Close',
    'nav.role': 'ai engineer',
    'hero.title': 'AI, put to w<i>o</i>rk',
    'hero.sub':
      'upkero — AI engineer. I design and ship voice & chat agents, knowledge bases and automation for businesses.',
    'hero.cta1': 'Discuss a project',
    'hero.cta2': 'See the work',
    'hero.scroll': 'Scroll down · Scroll down · ',
    'hero.scrollLabel': 'Scroll to the next section',
    manifesto:
      'I build AI systems that take routine off your plate: they answer calls, advise customers, sell, and find answers in your documents. Not demos for the sake of demos — dependable software that shows up every day.',
    'services.title': 'What I can build for your business',
    'services.more': "Don't see your task here? It's most likely solvable too.",
    'services.moreCta': 'Get in touch',
    'services.example': 'Example',
    'work.title': 'Selected work',
    'work.lead':
      'Five services for one fictional company — a restaurant, a clinic and meeting rooms under one roof. Examples of the approach, not the limit of what I do.',
    'work.open': 'Open',
    'work.source': 'Source code',
    'work.ctaTitle': 'Your project could be next',
    'work.live': 'Live demo',
    'work.offline': 'Demo offline',
    'work.ctaBtn': 'Discuss a project',
    'approach.title': 'How I work',
    'approach.lead': 'From the first call to a system that lives in production.',
    'contact.title': 'Got a task? <i>L</i>et’s talk.',
    'contact.lead': "Tell me what you'd like to automate — I'll propose a solution and estimate the timeline.",
    'contact.copy': 'Copy',
    'contact.copied': 'Copied',
    'footer.top': 'Back to top',
    'footer.rights': 'AI engineer',
    'case.close': 'Close',
    'case.task': 'Problem',
    'case.solution': 'Solution',
    'case.how': 'How it works',
    'case.business': 'What it gives a business',
    'case.stack': 'Stack',
    'case.source': 'Code on GitHub',
    'case.next': 'Next project',
    cursorOpen: 'Demo',
  },
};

export const services = [
  {
    case: 'voice',
    ru: ['Голосовые агенты', 'Принимают звонки 24/7, записывают клиентов, отвечают на частые вопросы и передают сложные случаи человеку.'],
    en: ['Voice agents', 'Answer calls 24/7, book appointments, handle FAQs and hand tricky cases over to a human.'],
  },
  {
    case: 'rag',
    ru: ['Чат-ассистенты', 'На сайте, в Telegram и WhatsApp: консультируют, подбирают услугу и принимают заявки.'],
    en: ['Chat assistants', 'On your website, Telegram or WhatsApp: advise customers, recommend a service, take requests.'],
  },
  {
    case: 'rag',
    ru: ['Базы знаний (RAG)', 'Ответы строго по вашим документам и регламентам. Если ответа нет — агент честно скажет, а не выдумает.'],
    en: ['Knowledge bases (RAG)', "Answers strictly from your documents and policies. If the answer isn't there, the agent says so instead of making it up."],
  },
  {
    case: 'sales',
    ru: ['AI-продажи', 'Квалификация лидов, работа с возражениями, допродажи — и реальные цены из вашей системы.'],
    en: ['AI sales', 'Lead qualification, objection handling and upsells — with real prices pulled from your system.'],
  },
  {
    case: 'mcp',
    ru: ['Автоматизация и интеграции', 'Связываю AI с CRM, календарями, таблицами, мессенджерами и внутренними API — чтобы данные не переносили руками.'],
    en: ['Automation & integrations', 'I connect AI to your CRM, calendars, spreadsheets, messengers and internal APIs — so nobody copies data by hand.'],
  },
  {
    case: 'core',
    ru: ['AI в ваш продукт', 'Бэкенд, LLM-функции, MCP-инструменты и агенты внутри существующего продукта — от прототипа до продакшена.'],
    en: ['AI inside your product', 'Backend, LLM features, MCP tools and agents inside an existing product — from prototype to production.'],
  },
];

export const steps = [
  {
    ru: ['Разбор', 'Созваниваемся, разбираем ваш процесс и находим, где AI реально сэкономит время или деньги. Если не сэкономит — так и скажу.'],
    en: ['Discovery', "We walk through your process and find where AI will genuinely save time or money. If it won't, I'll tell you."],
  },
  {
    ru: ['Прототип', 'Быстро собираю рабочую версию на ваших данных — чтобы вы увидели результат, а не презентацию.'],
    en: ['Prototype', 'I quickly build a working version on your data, so you see results rather than slides.'],
  },
  {
    ru: ['Запуск', 'Довожу до продакшена: интеграции, безопасность, тесты, мониторинг. Агент работает с вашими системами, а не рядом с ними.'],
    en: ['Launch', 'I take it to production: integrations, security, tests, monitoring. The agent works with your systems, not beside them.'],
  },
  {
    ru: ['Развитие', 'Слежу за качеством ответов, улучшаю систему по реальным диалогам и расширяю её вместе с бизнесом.'],
    en: ['Growth', 'I watch answer quality, improve the system based on real conversations and extend it as your business grows.'],
  },
];

export const stack = [
  'Python', 'FastAPI', 'PostgreSQL', 'pgvector', 'LiveKit', 'WebRTC', 'OpenAI', 'Ollama',
  'MCP', 'RAG', 'Whisper', 'Docker', 'SQLAlchemy', 'Pydantic', 'SSE', 'CI/CD',
];

export const projects = [
  {
    id: 'voice',
    repo: REPO('voice-agent-service'),
    tags: ['LiveKit', 'WebRTC', 'Whisper', 'Piper', 'Gemini TTS', 'Python'],
    ru: {
      title: 'Голосовой агент «Мила»',
      line: 'Принимает звонки и бронирует столики в ресторане голосом — в реальном времени.',
      task: 'Ресторан теряет звонки в часы пик, а администратор тратит время на одни и те же вопросы про свободные столы и время.',
      solution: 'Голосовой агент на LiveKit: слушает, отвечает и вызывает типизированные инструменты — проверяет свободные столы, предлагает ближайшее время, бронирует и отменяет.',
      how: [
        'Настоящий WebRTC-пайплайн: потоковое распознавание → LLM → синтез речи',
        'Детерминированные инструменты с валидацией — ослышка не займёт чужой стол',
        'Два языка: русский и английский переключаются одной настройкой',
        'Если бэкенд недоступен, агент объясняет ситуацию, а не молчит',
      ],
      business: 'Ни одного пропущенного звонка в час пик и запись гостей без участия администратора.',
    },
    en: {
      title: 'Voice agent “Mila”',
      line: 'Takes phone calls and books restaurant tables by voice, in real time.',
      task: 'A restaurant misses calls at peak hours, and staff spend their time answering the same questions about free tables and times.',
      solution: 'A LiveKit voice agent that listens, replies and calls typed tools — it checks free tables, offers the nearest slots, books and cancels.',
      how: [
        'A real WebRTC pipeline: streaming speech-to-text → LLM → text-to-speech',
        "Deterministic, validated tools — a mishearing can't take someone else's table",
        'Bilingual: Russian and English switch with a single setting',
        'If the backend is down, the agent explains what happened instead of going silent',
      ],
      business: 'No missed calls at peak hours, and guests get booked without a receptionist.',
    },
  },
  {
    id: 'sales',
    repo: REPO('sales-agent-service'),
    tags: ['FastAPI', 'State machine', 'LLM', 'Python'],
    ru: {
      title: 'AI-продавец',
      line: 'Ведёт клиента по воронке продаж и называет реальную цену со скидкой из системы.',
      task: 'Менеджеры отвечают на типовые запросы по одному сценарию, а цены в переписке расходятся с прайсом.',
      solution: 'Диалоговый агент с явной машиной состояний: приветствие → квалификация → презентация → возражения → допродажа → закрытие.',
      how: [
        'Каждый этап воронки — отдельный небольшой класс: новый этап добавляется без правки оркестратора',
        'Цена запрашивается из операционного ядра — клиент слышит ту сумму, которую реально выставит бизнес',
        'Единственный разрешённый «прыжок» по воронке зафиксирован и проверяется',
        'Промпты отделены от кода, клиент получает ответы на своём языке',
      ],
      business: 'Каждый лид проходит одинаково качественный разговор, а цены всегда совпадают с прайсом.',
    },
    en: {
      title: 'Sales agent',
      line: 'Walks a customer through the sales funnel and quotes the real price, discount included.',
      task: 'Managers answer routine requests with the same script, and prices in chats drift from the price list.',
      solution: 'A dialogue agent built on an explicit state machine: greeting → qualify → present → objections → upsell → close.',
      how: [
        'Each funnel stage is a small class — a new stage is added without touching the orchestrator',
        'Prices come from the operations core, so the customer hears what the business will actually charge',
        'The only permitted funnel “jump” is explicit and enforced',
        'Prompts live apart from code; customers get replies in their own language',
      ],
      business: 'Every lead gets an equally good conversation, and quoted prices always match the price list.',
    },
  },
  {
    id: 'rag',
    repo: REPO('rag-chat-service'),
    tags: ['RAG', 'pgvector', 'FastAPI', 'OpenAI / Ollama'],
    ru: {
      title: 'Чат по базе знаний',
      line: 'Отвечает на вопросы клиентов строго по документам компании — и честно говорит, когда не уверен.',
      task: 'Клиенты задают одни и те же вопросы про правила, отмены и цены, а обычный чат-бот на LLM уверенно выдумывает ответы.',
      solution: 'RAG-сервис: находит релевантные фрагменты документов по смыслу и просит модель ответить только по ним.',
      how: [
        'Семантический поиск по базе знаний на pgvector',
        'Порог уверенности: при слабом совпадении модель даже не вызывается — экономия и никаких выдумок',
        'В каждом ответе — ссылки на источники',
        'Работает с OpenAI или с локальной моделью через Ollama',
      ],
      business: 'Поддержка отвечает мгновенно и по регламенту, а сложные вопросы уходят живому сотруднику.',
    },
    en: {
      title: 'Knowledge-base chat',
      line: 'Answers customer questions strictly from company documents — and is honest when it is unsure.',
      task: 'Customers keep asking the same questions about policies, cancellations and prices, and a plain LLM chatbot confidently makes answers up.',
      solution: 'A RAG service that retrieves the relevant document chunks by meaning and asks the model to answer from them only.',
      how: [
        'Semantic search over the knowledge base with pgvector',
        'A confidence gate: on a weak match the model is never called — cheaper and no made-up answers',
        'Every answer cites its sources',
        'Runs on OpenAI or a local model via Ollama',
      ],
      business: 'Support answers instantly and by the book, while hard questions go to a human.',
    },
  },
  {
    id: 'mcp',
    repo: REPO('mcp-ops-agent'),
    tags: ['MCP', 'FastMCP', 'SSE', 'Agents'],
    ru: {
      title: 'MCP-агент операционного отдела',
      line: 'Агент сам пользуется инструментами компании: календарь, клиенты, расчёт стоимости, уведомления.',
      task: 'Операторы переключаются между системами, чтобы проверить слот, найти клиента и посчитать стоимость.',
      solution: 'Настоящий MCP-сервер с инструментами компании и встроенный агент, который вызывает их по тому же протоколу.',
      how: [
        'Инструменты подключаются к Claude Desktop и любому MCP-клиенту',
        'Встроенный оркестратор ходит в те же инструменты по протоколу — без обходных путей',
        'Шаги агента транслируются в браузер в реальном времени (SSE)',
        'Пять инструментов: свободные слоты, поиск клиента, каталог услуг, расчёт стоимости, уведомления',
      ],
      business: 'Один запрос обычным языком вместо пяти вкладок — и любой AI-ассистент получает доступ к данным компании.',
    },
    en: {
      title: 'MCP operations agent',
      line: 'An agent that uses the company’s own tools: calendar, customers, quotes, notifications.',
      task: 'Operators jump between systems to check a slot, find a customer and work out a price.',
      solution: 'A real MCP server exposing the company’s tools, plus a built-in agent that calls them over the same protocol.',
      how: [
        'Tools plug into Claude Desktop and any MCP client',
        'The built-in orchestrator reaches the same tools over the protocol — no back doors',
        'Agent steps stream to the browser in real time (SSE)',
        'Five tools: free slots, customer lookup, service catalogue, quotes, notifications',
      ],
      business: 'One plain-language request instead of five tabs — and any AI assistant can work with company data.',
    },
  },
  {
    id: 'core',
    repo: REPO('ops-core-api'),
    tags: ['FastAPI', 'PostgreSQL', 'pgvector', 'Alembic'],
    ru: {
      title: 'Операционное ядро',
      line: 'Единый бэкенд бизнеса: клиенты, слоты, бронирования, цены и база знаний с поиском по смыслу.',
      task: 'Четырём агентам нужен один надёжный источник правды о клиентах, расписании и ценах.',
      solution: 'Слоистый HTTP API без агентских фреймворков внутри — на нём держатся все остальные сервисы.',
      how: [
        'Правило «одна бронь на слот» закреплено и в сервисе, и ограничением базы данных',
        'Цены со скидками за объём через сменяемую политику',
        'Документы режутся на фрагменты и индексируются при записи',
        'Миграции, rate limiting, API-ключи и тесты',
      ],
      business: 'Данные в одном месте: агенты и люди видят одно и то же расписание и одни и те же цены.',
    },
    en: {
      title: 'Operations core API',
      line: 'One backend for the business: customers, slots, bookings, pricing and a semantic knowledge base.',
      task: 'Four agents need a single reliable source of truth for customers, schedules and prices.',
      solution: 'A layered HTTP API with no agent framework inside — every other service stands on it.',
      how: [
        'The “one party per slot” rule is enforced in the service and by a database constraint',
        'Volume-discount pricing through an interchangeable policy',
        'Documents are chunked and embedded on write',
        'Migrations, rate limiting, API keys and tests',
      ],
      business: 'Data in one place: agents and people see the same schedule and the same prices.',
    },
  },
];
