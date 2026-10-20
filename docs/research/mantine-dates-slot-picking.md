# Возможности `@mantine/dates` для выбора даты и времени слота

Research-заметка по wayfinder-тикету #7. Фиксирует, что умеет пакет `@mantine/dates`
(+ обязательная зависимость `dayjs`) для UI «запись гостя на слот»: какие компоненты
покрывают выбор даты и времени, какие ограничения дат/времени поддерживаются,
combined vs. двухшаговый flow, и что нужно для подключения стилей.

Версия из `package.json` репозитория: `@mantine/dates ^9.7.3`, `dayjs ^1.11.23`.
Установленная версия в `node_modules/@mantine/dates/package.json` — **9.7.3** (docs на
`mantine.dev` раскрываются на v9.7.3).

## Состав пакета (экспортируемые компоненты)

Полный список экспортов из точки входа — `node_modules/@mantine/dates/lib/index.d.ts`
(`export *` по каждому компоненту):

- **Даты / календари**: `Calendar`, `MiniCalendar`, `DatePicker`, `DatePickerInput`,
  `MonthPicker`, `MonthPickerInput`, `YearPicker`, `YearPickerInput`, `Month`,
  `MonthsList`, `YearsList`, `Day`, `WeekdaysRow`, `CalendarHeader`, `MonthLevel`,
  `YearLevel`, `DecadeLevel`, `DecadeLevelGroup`, `YearLevelGroup`, `MonthLevelGroup`,
  `PickerControl`, `LevelsGroup`.
- **Дата + время**: `DateTimePicker`, `InlineDateTimePicker`.
- **Время**: `TimeInput`, `TimePicker`, `TimeGrid`, `TimeValue`.
- **Инфраструктура**: `DatesProvider`, `HiddenDatesInput`, `PickerInputBase`.
- Утилита формата — `getFormattedDate` (`node_modules/@mantine/dates/lib/utils/index.d.ts`).
- Утилита генерации слотов — `getTimeRange` (реэкспортируется из
  `node_modules/@mantine/dates/lib/components/TimePicker/index.d.ts`).

Список компонентов в сайдбаре docs совпадает: `@mantine/dates`
(`https://mantine.dev/dates/getting-started/`).

> Примечание: в `node_modules/@mantine/dates/lib/components` есть папка `SpinInput`,
> но в `lib/index.d.ts` она **не** экспортируется — наружу доступна только как часть
> внутренностей `TimePicker`/`TimeInput`, не как публичный API пакета.

## Ключевые компоненты под кейс «слот»

### Выбор даты

| Компонент | Что делает | Источник |
| --- | --- | --- |
| `DatePicker` | Inline-календарь для одной даты, нескольких дат (`type="multiple"`) или диапазона (`type="range"`) | `https://mantine.dev/dates/date-picker/` |
| `DatePickerInput` | Тот же выбор дат, упакованный в input-поле с Popover/Modal-дропдауном | `https://mantine.dev/dates/date-picker-input/` |
| `DateInput` | Input для одной даты (без календарной логики множеств/диапазонов), со свободным вводом строки и `dateParser` | `https://mantine.dev/dates/date-input/` |
| `Calendar` | Низкоуровневый календарь (месяц/год/декада), на котором построен `DatePicker` | `https://mantine.dev/dates/calendar/` |
| `MiniCalendar` | Компактный календарь без навигации по уровням | `https://mantine.dev/dates/mini-calendar/` |

`DatePicker`/`DatePickerInput` имеют проп `type: 'default' | 'multiple' | 'range'`
(`node_modules/@mantine/dates/lib/types/DatePickerValue.d.ts`).

### Выбор времени

| Компонент | Что делает | Источник |
| --- | --- | --- |
| `TimeInput` | Простой input времени (HH:mm или HH:mm:ss), с пропами `withSeconds`, `minTime`, `maxTime` | `https://mantine.dev/dates/time-input/`; `node_modules/@mantine/dates/lib/components/TimeInput/TimeInput.d.ts` |
| `TimePicker` | Подробный степпер времени (часы/минуты/секунды/AM-PM), с дропдауном пресетов; поддерживает `withDropdown`, `format: '12h'`, пресеты | `https://mantine.dev/dates/time-picker/` |
| **`TimeGrid`** | **Сетка заранее заданных слотов** — ровно «выбор слота» из кнопок | `https://mantine.dev/dates/time-grid/` |

### Комбинированный date+time

| Компонент | Что делает | Источник |
| --- | --- | --- |
| `DateTimePicker` | Календарь + `TimePicker` в одном input-поле (Popover/Modal). Поддерживает `type="range"` (два времени) и `withSeconds` | `https://mantine.dev/dates/date-time-picker/` |
| `InlineDateTimePicker` | То же, но inline (без input-обертки), с кнопкой «submit» (`onSubmit`) | `https://mantine.dev/dates/inline-date-time-picker/` |

`DateTimePicker` рендерит внутренний `TimePicker`, пропсы в него передаются через
`timePickerProps` (и `endTimePickerProps` для range) —
`node_modules/@mantine/dates/lib/components/DateTimePicker/DateTimePicker.d.ts`.

## Ограничения дат

Пропы ограничения дат живут в `MonthSettings` (для calendar-подобных компонентов):
`node_modules/@mantine/dates/lib/components/Month/Month.d.ts`. Они наследуются
`DatePicker`/`DatePickerInput`/`DateInput`/`Calendar`/`DateTimePicker` (через
`MonthLevelSettings` / `CalendarSettings`).

- **Диапазон дат**: `minDate` / `maxDate` (строка `YYYY-MM-DD` или `Date`). Если
  следующий/предыдущий месяц недоступен — соответствующая кнопка навигации
  отключается. Doc: «Min and max date» на `https://mantine.dev/dates/date-picker/`.
- **Исключить конкретные даты (занятые слоты)**: `excludeDate?: (date: string) => boolean`
  — если вернуть `true`, дата становится disabled. Наиболее прямой способ «скрыть
  занятые дни». Doc: «Exclude dates» на `https://mantine.dev/dates/date-picker/`.
- **Кастомные disabled-состояния / перенос пропсов на кнопку дня**: `getDayProps?:
  (date: string) => Omit<Partial<DayProps>, 'classNames' | 'styles' | 'vars'> & DataAttributes`.
  Можно вернуть `{ disabled: true }`, произвольный `style`, `aria-label` и т.п.
  `DayProps` расширяет `ElementProps<'button'>` (включая нативный `disabled`) —
  `node_modules/@mantine/dates/lib/components/Day/Day.d.ts`. Аналогично на уровне
  year/month — `getYearControlProps` / `getMonthControlProps` (doc «Add props to day,
  year and month control»).
- **Дополнительно**: `hideOutsideDates`, `hideWeekdays`, `firstDayOfWeek`, `weekendDays`,
  `renderDay` (кастомный рендер ячейки, напр. Indicator для занятости), `withWeekNumbers`,
  `highlightToday` — все из `MonthSettings` (`node_modules/.../Month/Month.d.ts`).
- **Календарь в режиме отображения**: `static` — рендерит дни как `<div>`, без
  интерактивности (для «только показать месяц»).

Формат значения дат — строка `YYYY-MM-DD` (тип `DateStringValue`),
`node_modules/@mantine/dates/lib/types/GeneralTypes.d.ts`.

## Ограничения времени / слотов

- `TimeGrid` (сетка слотов) напрямую поддерживает:
  - `data: string[]` — список временных значений 24h (`['10:00', '18:30']`, уникальные),
    `node_modules/@mantine/dates/lib/components/TimeGrid/TimeGrid.d.ts`;
  - `minTime` / `maxTime` — отключает все кнопки до/после времени;
  - `disableTime: string[] | ((time: string) => boolean)` — **отключить занятые слоты**;
  - `disabled` — отключить все кнопки;
  - `getControlProps?: (time: string) => props` — перенос пропсов на кнопку слота;
  - `allowDeselect`, `format: '12h' | '24h'`, `withSeconds`, `amPmLabels`,
    `simpleGridProps`. Doc: `https://mantine.dev/dates/time-grid/`.
  - Генерация слотов: `getTimeRange({ startTime, endTime, interval })` → `string[]`
    (сигнатура из `node_modules/@mantine/dates/lib/components/TimePicker/utils/get-time-range/get-time-range.d.ts`).
    ⚠️ Документация на `mantine.dev/dates/time-grid/` показывает пример с ключами
    `{ from, to, step }`, что **расходится** с реальной типизированной сигнатурой
    `{ startTime, endTime, interval }` — ориентироваться на типы из `node_modules`.
- `TimeInput`: `withSeconds`, `minTime`, `maxTime` (строки `HH:mm` / `HH:mm:ss`) —
  `node_modules/@mantine/dates/lib/components/TimeInput/TimeInput.d.ts`.
- `TimePicker`: `min`, `max` (`hh:mm:ss`), `hoursStep`, `minutesStep`, `secondsStep`,
  `format: '24h' | '12h'`, `withDropdown`, `presets`, `disabled`, `readOnly` —
  `node_modules/@mantine/dates/lib/components/TimePicker/TimePicker.d.ts`.

## Combined date+time vs. двухшаговый date→time

- **Combined (одно поле, календарь + время рядом)** — `DateTimePicker` /
  `InlineDateTimePicker`. Значение — строка `YYYY-MM-DD HH:mm:ss` (тип
  `DateTimeStringValue`, `node_modules/@mantine/dates/lib/types/GeneralTypes.d.ts`).
  Релевантные пропы: `valueFormat`, `withSeconds`, `defaultTimeValue` (время,
  подставляемое при выборе даты), `timePickerProps`, `type="range"`, `presets`,
  `allowSingleDateInRange`. Doc: `https://mantine.dev/dates/date-time-picker/`.
- **Двухшаговый (сначала дата, потом слот времени)** — композиция
  `DatePicker`/`DatePickerInput` (или `DateInput`) + `TimeGrid` (или `TimeInput`/`TimePicker`).
  Это естественно для «скрыть занятые слоты»: по выбранной дате вычисляешь список
  свободных слотов и отдаёшь его в `TimeGrid` через `data`/`getTimeRange` +
  `disableTime` (или `excludeDate` для дней). Библиотека **не** предоставляет готовый
  «date-then-time» wizard; flow собирается из отдельных компонентов. Doc: комбинация
  `TimeGrid` (слоты) и `DatePicker` (`excludeDate`) не связаны между собой — их
  связывание происходит в коде приложения (state: выбранная дата → набор слотов).

Рекомендация по кейсу «запись гостя на временной слот»: двухшаговый flow
`DatePicker`/`DatePickerInput` (c `excludeDate`/`getDayProps({disabled})` для занятых
дней) → `TimeGrid` (c `data` свободных слотов и/или `disableTime` для занятых), затем
собрать итог в `YYYY-MM-DD HH:mm:ss` через `dayjs`. `DateTimePicker` удобен там, где
достаточно произвольного времени в одном поле, а не фиксированного набора слотов.

## Подключение стилей

Пакет отдаёт CSS через `package.json#exports`:
`"./styles.css": "./styles.css"` и `"./styles.layer.css": "./styles.layer.css"`
(`node_modules/@mantine/dates/package.json`). Поэтому импорт —
`import '@mantine/dates/styles.css'` — обязателен вручную; без него «календари и
date-пикеры без стилей и выглядят сломанными».

> В репозитории (`calls_calendar`) стили `@mantine/dates/styles.css` на момент
> исследования **не подключены** — см. `AGENTS.md` («сейчас он нигде не подключён»).
> В `src/main.tsx` импортируется только `@mantine/core/styles.css`.

Порядок импорта важен (docs): core-стили раньше dates-стилей:

```ts
import '@mantine/core/styles.css';
// import dates styles after core package styles
import '@mantine/dates/styles.css';
```

Источники:
- `https://mantine.dev/dates/getting-started/` — разделы «Installation» и
  «Do not forget to import styles»;
- `AGENTS.md` (root репозитория) — пункт «Полезно знать».

## dayjs

`dayjs` — обязательный peer-зависимость `@mantine/dates` (не заменяема на другую
date-библиотеку): `node_modules/@mantine/dates/package.json` →
`peerDependencies.dayjs: ">=1.0.0"`. Используется под капотом для манипуляций и
форматирования; компоненты работают с датами-строками без таймзоны
(`https://mantine.dev/dates/getting-started/`, раздел «dayjs»).

Релевантные детали:

- Форматирование — dayjs-форматы (`https://day.js.org/docs/en/display/format`) в
  пропах `valueFormat`, `valueFormatter`, `monthLabelFormat` и т.д.; те же пропы
  принимают функцию вместо строки формата.
- Для `DateInput` свободного парсинга нужен плагин `customParseFormat`
  (`dayjs.extend(customParseFormat)`) — docs «Custom parse format».
- Локализация — `import 'dayjs/locale/ru'` + `locale` на `DatesProvider` или
  компоненте. `DatesProvider` задаёт общие настройки: `locale`, `firstDayOfWeek`,
  `weekendDays`, `consistentWeeks` (`node_modules/@mantine/dates/lib/components/DatesProvider/DatesProvider.d.ts`).

## Краткий вывод

1. Для «слота» есть всё из коробки: дата — `DatePicker`/`DatePickerInput`/`DateInput`,
   время — `TimeInput`/`TimePicker`, сетка фиксированных слотов — `TimeGrid`, дата+время
   одним полем — `DateTimePicker`/`InlineDateTimePicker`.
2. Ограничения дат — `minDate`/`maxDate` (диапазон), `excludeDate` и
   `getDayProps({disabled})` (занятые/недоступные дни). Ограничения слотов —
   `TimeGrid`'s `data`/`getTimeRange`/`minTime`/`maxTime`/`disableTime`/`getControlProps`.
3. Готового «date-then-time» wizard-флоу нет — собирается из отдельных компонентов
   (двухшаговый flow предпочтительнее для «скрыть занятые слоты», чем один
   `DateTimePicker` с произвольным временем).
4. Стили подключаются вручную: `import '@mantine/dates/styles.css'` после
   `@mantine/core/styles.css`; в репозитории это пока не сделано.
