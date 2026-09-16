const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

const DEMO_HTML = `COMP 4101 Practicum
Status
Units
Grading Basis
Grade
Academic Program
Requirement Designation
Enrolled
3.00
60% and Letter Grade
 
B.Sc. - IT
 
Class
Start/End Dates
Days and Times
Room
Lecture - Class 3157 -Section 21
25/08/2026 - 03/12/2026
 
Days: Tuesday
Times: 4:00PM to 5:00PM
01.1.06
 
 
Laboratory - Class 3158 -Section 22
25/08/2026 - 03/12/2026
 
Days: Tuesday
Times: 8:00PM to 9:00PM
OFFS
 
 
DACS 3201 Network Security
Status
Units
Grading Basis
Grade
Academic Program
Requirement Designation
Enrolled
3.00
60% and Letter Grade
 
B.Sc. - IT
 
Class
Start/End Dates
Days and Times
Room
Lecture - Class 3183 -Section 1
25/08/2026 - 03/12/2026
 
Days: Tuesday
Times: 12:00PM to 2:00PM
10.1.18
 
 
Laboratory - Class 3184 -Section 2
25/08/2026 - 03/12/2026
 
Days: Wednesday
Times: 10:00AM to 1:00PM
10.1.18
 
 
DACS 4101 Security Engineering Principle
Status
Units
Grading Basis
Grade
Academic Program
Requirement Designation
Enrolled
3.00
60% and Letter Grade
 
B.Sc. - IT
 
Class
Start/End Dates
Days and Times
Room
Lecture - Class 3197 -Section 7
25/08/2026 - 03/12/2026
 
Days: Wednesday
Times: 4:00PM to 6:00PM
10.2.25
 
 
Laboratory - Class 3198 -Section 8
25/08/2026 - 03/12/2026
 
Days: Monday
Times: 5:00PM to 8:00PM
10.2.25
 
 
DACS 4103 Scripting for Cyber Security
Status
Units
Grading Basis
Grade
Academic Program
Requirement Designation
Enrolled
3.00
60% and Letter Grade
 
B.Sc. - IT
 
Class
Start/End Dates
Days and Times
Room
Lecture - Class 3209 -Section 7
25/08/2026 - 03/12/2026
 
Days: Monday
Times: 8:00AM to 10:00AM
10.1.18
 
 
Laboratory - Class 3210 -Section 8
25/08/2026 - 03/12/2026
 
Days: Sunday
Times: 8:00AM to 11:00AM
10.1.18
 
 
`;

function safeText(value) {
  return String(value || "")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\\n/g, " ");
}

/* Accessibility: announce short messages to screen readers */
function announce(message, priority = "polite") {
  try {
    const liveId = priority === "assertive" ? "a11yAssertive" : "a11yLive";
    const live = document.getElementById(liveId);
    if (live) {
      live.textContent = "";
      window.setTimeout(() => {
        live.textContent = message;
      }, 10);
    }
  } catch (e) {
    // no-op
  }
}

function announceDetail(message) {
  try {
    const live = document.getElementById("a11yDetails");
    if (live) {
      live.textContent = "";
      window.setTimeout(() => {
        live.textContent = message;
      }, 10);
    }
  } catch (e) {
    // no-op
  }
}

function parseTimeLabel(label) {
  if (!label) return null;
  const match = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return hours + minutes / 60;
}

function parseTimeRangeFromTitle(title) {
  if (!title) return null;
  const match = title.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*(?:-|to)\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
  );
  if (!match) return null;

  const start = toDecimalTime(match[1], match[2], match[3]);
  const end = toDecimalTime(match[4], match[5], match[6]);
  return { start, end };
}

function toDecimalTime(hours, minutes, meridiem) {
  let hour = Number(hours);
  const minute = Number(minutes);
  const suffix = (meridiem || "").toUpperCase();

  if (suffix === "PM" && hour !== 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;

  return hour + minute / 60;
}

function getDayNameFromClassName(className) {
  const normalized = className.toUpperCase();
  const map = {
    SUNDAY: "Sunday",
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
    SATURDAY: "Saturday",
  };

  return map[normalized] || null;
}

function getDayFromCell(cell, fallbackDayName) {
  const classNames = Array.from(cell.classList || []);
  for (const className of classNames) {
    const dayName = getDayNameFromClassName(className);
    if (dayName) return dayName;
  }

  const idText = (cell.id || "").toUpperCase();
  const matchedDay = DAY_ORDER.find((day) =>
    idText.includes(day.toUpperCase()),
  );
  if (matchedDay) return matchedDay;

  return fallbackDayName || null;
}

function parsePlainTextSchedule(rawText) {
  const schedule = Object.fromEntries(DAY_ORDER.map((day) => [day, []]));
  const seen = new Set();

  const text = rawText || "";
  const matches = [
    ...text.matchAll(
      /Days:\s*(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)[\s\S]*?Times:\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(?:to|-)\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/gi,
    ),
  ];

  matches.forEach((match) => {
    const dayName = match[1].trim();
    const startText = match[2].trim();
    const endText = match[3].trim();

    const start = parseTimeText(startText);
    const end = parseTimeText(endText);
    if (start === null || end === null) return;

    const title = `${dayName} ${startText} to ${endText}`;
    const eventKey = `${dayName}|${title}|${start}|${end}`;
    if (seen.has(eventKey)) return;

    seen.add(eventKey);
    schedule[dayName].push({
      start,
      end,
      title,
    });
  });

  const flatEvents = [];
  DAY_ORDER.forEach((day) => {
    schedule[day].forEach((event) => {
      flatEvents.push({ day, ...event });
    });
  });

  return { schedule, events: flatEvents, total: flatEvents.length };
}

function parseTimeText(value) {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  const hour = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  let hours24 = hour;

  if (meridiem === "PM" && hours24 !== 12) hours24 += 12;
  if (meridiem === "AM" && hours24 === 12) hours24 = 0;

  return hours24 + minutes / 60;
}

function parseHtmlSchedule(htmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
  const schedule = Object.fromEntries(DAY_ORDER.map((day) => [day, []]));

  const table = doc.querySelector("table") || doc.body.querySelector("table");
  if (!table) {
    const plainTextResult = parsePlainTextSchedule(htmlText);
    return plainTextResult;
  }

  const headerRow =
    table.querySelector("thead tr") || table.querySelector("tr");
  const dayIndexMap = {};
  if (headerRow) {
    const headerCells = Array.from(headerRow.children);
    headerCells.forEach((cell, index) => {
      const text = (cell.textContent || "").replace(/\s+/g, " ").trim();
      const classNames = Array.from(cell.classList || []);
      const dayName =
        classNames
          .map((value) => getDayNameFromClassName(value))
          .find(Boolean) ||
        DAY_ORDER.find((day) => day.toUpperCase() === text.toUpperCase()) ||
        DAY_ORDER.find((day) => text.toUpperCase().includes(day.toUpperCase()));
      if (dayName) {
        dayIndexMap[index] = dayName;
      }
    });
  }

  const seen = new Set();
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td, th"));
    if (!cells.length) return;

    cells.forEach((cell, index) => {
      const classNames = Array.from(cell.classList || []);
      if (
        classNames.includes("psc_time") ||
        classNames.includes("ps_grid-cell")
      ) {
        if (classNames.includes("psc_time")) return;
      }

      const fallbackDayName = dayIndexMap[index];
      const dayName = getDayFromCell(cell, fallbackDayName);
      if (!dayName) return;

      const anchor = cell.querySelector("a");
      const rawTitle =
        cell.getAttribute("title") ||
        anchor?.getAttribute("title") ||
        anchor?.textContent ||
        cell.textContent ||
        "";
      const cleanedTitle = rawTitle.replace(/\s+/g, " ").trim();

      if (!cleanedTitle) return;
      if (cleanedTitle.toUpperCase() === dayName.toUpperCase()) return;
      if (cleanedTitle.toLowerCase().includes("disabled")) return;
      if (
        cell.getAttribute("aria-disabled") === "true" &&
        !/\d{1,2}:\d{2}/.test(cleanedTitle)
      ) {
        return;
      }

      const timeRange = parseTimeRangeFromTitle(cleanedTitle);
      if (!timeRange) return;

      const eventKey = `${dayName}|${cleanedTitle}|${timeRange.start}|${timeRange.end}`;
      if (seen.has(eventKey)) return;

      seen.add(eventKey);
      schedule[dayName].push({
        start: timeRange.start,
        end: timeRange.end,
        title: cleanedTitle,
      });
    });
  });

  const flatEvents = [];
  DAY_ORDER.forEach((day) => {
    schedule[day].forEach((event) => {
      flatEvents.push({ day, ...event });
    });
  });

  if (!flatEvents.length) {
    return parsePlainTextSchedule(htmlText);
  }

  return { schedule, events: flatEvents, total: flatEvents.length };
}

function toIcsDate(dateObj, decimalHour) {
  const hour = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hour) * 60);
  const clone = new Date(dateObj.getTime());
  clone.setUTCHours(hour, minutes, 0, 0);
  return clone
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function buildIcsCalendar(events, summaryLabel = "Schedule") {
  const baseDate = new Date(Date.UTC(2026, 8, 14));
  const dayOffsetMap = {
    Sunday: 6,
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
  };

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CommonTime App//EN",
    "CALSCALE:GREGORIAN",
  ];

  events.forEach((event, index) => {
    const dayName = event.day || "Monday";
    const eventDate = new Date(
      baseDate.getTime() + dayOffsetMap[dayName] * 86400000,
    );
    const summary = safeText(event.title || summaryLabel || "Busy block");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${Date.now()}-${index}@common-time.app`,
      `DTSTAMP:${new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z")}`,
      `SUMMARY:${summary}`,
      `DTSTART:${toIcsDate(eventDate, event.start)}`,
      `DTEND:${toIcsDate(eventDate, event.end)}`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function formatForDisplay(scheduleMap) {
  return DAY_ORDER.map((day) => {
    const events = scheduleMap[day] || [];
    if (events.length === 0) return `${day}: free`;
    return `${day}: ${events.map((event) => `${formatHour(event.start)}-${formatHour(event.end)}`).join(", ")}`;
  }).join("\n");
}

function formatHour(value) {
  const totalMinutes = Math.round(value * 60);
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  let displayHour = hours24 % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

function updateIcsArea(value) {
  const generatedIcs = document.getElementById("generatedIcs");
  if (generatedIcs) {
    generatedIcs.value = value;
  }
}

function getDisplayTimeFromDecimal(decimalHour) {
  const totalMinutes = Math.round(decimalHour * 60);
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  let displayHour = hour24 % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatIcsDate(dateObj, decimalHour) {
  const hour = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hour) * 60);
  const clone = new Date(dateObj.getTime());
  clone.setUTCHours(hour, minutes, 0, 0);
  return clone
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

async function loadHtmlFile(file) {
  if (!file) return;
  const text = await file.text();
  document.getElementById("htmlInput").value = text;
  convertHtmlToIcs(text);
}

function convertHtmlToIcs(rawHtml) {
  const status = document.getElementById("conversionStatus");
  const parsed = parseHtmlSchedule(
    rawHtml || document.getElementById("htmlInput").value,
  );

  if (!parsed.total) {
    status.textContent =
      "No class blocks were found in that HTML. Try a different schedule file.";
    announce("No class blocks were found in that HTML.", "assertive");
    return;
  }

  const ics = buildIcsCalendar(parsed.events, "Busy block");
  updateIcsArea(ics);
  status.textContent = `Converted ${parsed.total} time blocks successfully.`;
  announce(`Converted ${parsed.total} time blocks successfully.`);
  announceDetail(`Converted ${parsed.total} time blocks into an ICS calendar.`);
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  announce(`${filename} download started`);
}

function parseIcsText(icsText) {
  const schedule = Object.fromEntries(DAY_ORDER.map((day) => [day, []]));
  const blocks = [...icsText.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)];

  blocks.forEach((block) => {
    const content = block[1];
    const startMatch = content.match(/DTSTART(?:;[^:]+)?:([A-Z0-9]+)/i);
    const endMatch = content.match(/DTEND(?:;[^:]+)?:([A-Z0-9]+)/i);

    if (!startMatch || !endMatch) return;

    const startValue = startMatch[1];
    const endValue = endMatch[1];

    const startDate = parseIcsDateValue(startValue);
    const endDate = parseIcsDateValue(endValue);

    if (!startDate || !endDate) return;

    const dayName = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }).format(startDate);
    const startHour = startDate.getUTCHours() + startDate.getUTCMinutes() / 60;
    const endHour = endDate.getUTCHours() + endDate.getUTCMinutes() / 60;

    if (DAY_ORDER.includes(dayName)) {
      schedule[dayName].push({ start: startHour, end: endHour });
    }
  });

  return schedule;
}

function parseIcsDateValue(value) {
  if (!value) return null;
  if (value.length === 8) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    return new Date(Date.UTC(year, month - 1, day));
  }

  if (value.length >= 15 && value.includes("T")) {
    const rawDate = value.slice(0, 8);
    const rawTime = value.slice(9, 15);
    const year = Number(rawDate.slice(0, 4));
    const month = Number(rawDate.slice(4, 6));
    const day = Number(rawDate.slice(6, 8));
    const hour = Number(rawTime.slice(0, 2));
    const minute = Number(rawTime.slice(2, 4));
    const second = Number(rawTime.slice(4, 6));
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  }

  return null;
}

function getBusySlotsForDay(dayMap) {
  const busySlots = new Set();
  for (const range of dayMap || []) {
    let cursor = range.start;
    while (cursor < range.end - 0.01) {
      busySlots.add(Number(cursor.toFixed(2)));
      cursor += 0.5;
    }
  }
  return busySlots;
}

function getFreeSlotsForDay(dayBusyRanges) {
  const freeRanges = [];
  const blockSet = new Set();
  const dayRanges = dayBusyRanges || [];

  for (const range of dayRanges) {
    let cursor = range.start;
    while (cursor < range.end - 0.01) {
      blockSet.add(Number(cursor.toFixed(2)));
      cursor += 0.5;
    }
  }

  const allSlots = [];
  for (let t = 8; t <= 21.5; t += 0.5) {
    allSlots.push(Number(t.toFixed(2)));
  }

  let previous = null;
  for (const slot of allSlots) {
    if (blockSet.has(slot)) {
      if (previous !== null && previous < slot) {
        freeRanges.push({ start: previous, end: slot });
      }
      previous = null;
    } else {
      if (previous === null) previous = slot;
    }
  }

  if (previous !== null) {
    freeRanges.push({ start: previous, end: 21.5 });
  }

  return freeRanges;
}

function computeCommonFreeTimeForPeople(personSchedules) {
  const commonSchedule = Object.fromEntries(DAY_ORDER.map((day) => [day, []]));

  DAY_ORDER.forEach((day) => {
    const unionBusy = new Set();
    personSchedules.forEach((person) => {
      const busyRanges = person[day] || [];
      const busySlots = getBusySlotsForDay(busyRanges);
      busySlots.forEach((slot) => unionBusy.add(slot));
    });

    const allSlots = [];
    for (let t = 8; t <= 21.5; t += 0.5) {
      allSlots.push(Number(t.toFixed(2)));
    }

    const freeSlots = [];
    for (const slot of allSlots) {
      if (!unionBusy.has(slot)) {
        freeSlots.push(slot);
      }
    }

    let start = null;
    for (let i = 0; i < freeSlots.length; i++) {
      const slot = freeSlots[i];
      if (start === null) start = slot;
      const next = freeSlots[i + 1];
      if (next === undefined || Math.abs(next - slot - 0.5) > 0.001) {
        commonSchedule[day].push({ start, end: slot + 0.5 });
        start = null;
      }
    }
  });

  return commonSchedule;
}

function formatRangeLabel(start, end) {
  return `${getDisplayTimeFromDecimal(start)} - ${getDisplayTimeFromDecimal(end)}`;
}

function renderCommonResults(commonSchedule) {
  const container = document.getElementById("commonTimeResults");
  const lines = DAY_ORDER.map((day) => {
    const slots = commonSchedule[day] || [];
    if (!slots.length) return `${day}: no common free time`;
    return `${day}: ${slots
      .map((slot) => formatRangeLabel(slot.start, slot.end))
      .join(", ")}`;
  });
  container.textContent = lines.join("\n");

  renderCommonFreeTimeGrid(commonSchedule);

  const commonIcs = buildIcsCalendar(
    DAY_ORDER.flatMap((day) => {
      return (commonSchedule[day] || []).map((slot) => ({
        day,
        start: slot.start,
        end: slot.end,
        title: `Common free time`,
      }));
    }),
    "Common free time",
  );

  document.getElementById("commonIcsOutput").value = commonIcs;
  return commonIcs;
}

function renderCommonFreeTimeGrid(commonSchedule) {
  const grid = document.getElementById("commonFreeTimeGrid");
  if (!grid) return;

  const header = document.createElement("div");
  header.className = "time-grid-header";

  const corner = document.createElement("div");
  corner.className = "time-grid-corner";
  corner.textContent = "Time";
  header.appendChild(corner);

  DAY_ORDER.forEach((day) => {
    const dayCell = document.createElement("div");
    dayCell.className = "time-grid-day";
    dayCell.textContent = day;
    header.appendChild(dayCell);
  });

  const body = document.createElement("div");
  body.className = "calendar-grid-body";

  const timeScale = document.createElement("div");
  timeScale.className = "time-scale";

  const timeSlots = [];
  for (let hour = 8; hour <= 21.5; hour += 0.5) {
    timeSlots.push(Number(hour.toFixed(2)));
  }

  document.documentElement.style.setProperty(
    "--time-slot-count",
    String(timeSlots.length),
  );

  timeSlots.forEach((slot) => {
    const label = document.createElement("div");
    label.className = "time-scale-label";
    label.textContent = getDisplayTimeFromDecimal(slot);
    timeScale.appendChild(label);
  });

  body.appendChild(timeScale);

  DAY_ORDER.forEach((day) => {
    const dayColumn = document.createElement("div");
    dayColumn.className = "day-column";

    timeSlots.forEach((slot) => {
      const cell = document.createElement("div");
      cell.className = "day-slot";
      dayColumn.appendChild(cell);
    });

    const ranges = commonSchedule[day] || [];
    // position blocks absolutely using computed slot height so they span correctly
    const slotHeightPx = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--slot-height",
      ) || "28",
    );
    ranges.forEach((range) => {
      const startIndex = Math.max(0, Math.round((range.start - 8) / 0.5));
      const span = Math.max(1, Math.round((range.end - range.start) / 0.5));
      const block = document.createElement("div");
      block.className = "free-block";
      // calculate pixel top and height
      const top = startIndex * slotHeightPx + 2; // small offset for margin
      const height = Math.max(20, span * slotHeightPx - 4);
      block.style.top = `${top}px`;
      block.style.height = `${height}px`;
      const labelText = formatRangeLabel(range.start, range.end);
      block.textContent = labelText;
      // accessibility and keyboard
      block.setAttribute("role", "button");
      block.tabIndex = 0;
      block.setAttribute("aria-label", `Free from ${labelText}`);
      block.setAttribute("aria-pressed", "false");
      block.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          block.classList.toggle("selected");
          const selected = block.classList.contains("selected");
          block.setAttribute("aria-pressed", String(selected));
          announce(
            selected ? `Selected ${labelText}` : `Deselected ${labelText}`,
            "polite",
          );
          announceDetail(
            selected
              ? `Availability block selected: ${labelText} on ${day}.`
              : `Availability block cleared: ${labelText} on ${day}.`,
          );
        }
      });
      block.addEventListener("click", () => {
        block.classList.toggle("selected");
        const selected = block.classList.contains("selected");
        block.setAttribute("aria-pressed", String(selected));
        announce(
          selected ? `Selected ${labelText}` : `Deselected ${labelText}`,
          "polite",
        );
        announceDetail(
          selected
            ? `Availability block selected: ${labelText} on ${day}.`
            : `Availability block cleared: ${labelText} on ${day}.`,
        );
      });
      dayColumn.appendChild(block);
    });

    body.appendChild(dayColumn);
  });

  grid.innerHTML = "";
  grid.appendChild(header);
  grid.appendChild(body);
}

function updateSelectedIcsList(files) {
  const list = document.getElementById("selectedIcsList");
  if (!list) return;

  const fileList = Array.from(files || []);
  if (!fileList.length) {
    list.innerHTML = "";
    list.classList.add("hidden");
    announce("No ICS files selected.");
    return;
  }

  const previouslyChecked = new Set(
    Array.from(list.querySelectorAll('input[type="checkbox"]:checked')).map(
      (checkbox) => checkbox.dataset.fileName,
    ),
  );

  list.innerHTML = "";
  fileList.forEach((file, index) => {
    const item = document.createElement("label");
    item.className = "selection-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.fileName = file.name;
    checkbox.dataset.fileIndex = String(index);
    checkbox.checked =
      previouslyChecked.has(file.name) || previouslyChecked.size === 0;

    const label = document.createElement("span");
    label.textContent = file.name;

    item.appendChild(checkbox);
    item.appendChild(label);
    list.appendChild(item);
  });

  list.classList.remove("hidden");
  announce(
    `${fileList.length} file${fileList.length === 1 ? "" : "s"} ready for selection.`,
  );
}

function getSelectedIcsFiles() {
  const fileInput = document.getElementById("friendIcsInput");
  const files = Array.from(fileInput?.files || []);
  const selectedList = document.getElementById("selectedIcsList");

  if (!selectedList) return files;

  const boxes = Array.from(
    selectedList.querySelectorAll('input[type="checkbox"]'),
  );

  if (!boxes.length) return [];

  const checkedIndexes = new Set(
    boxes
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => Number(checkbox.dataset.fileIndex)),
  );

  return files.filter((_, index) => checkedIndexes.has(index));
}

function compareIcsFiles(files) {
  const status = document.getElementById("compareStatus");
  const selectedFiles = files || getSelectedIcsFiles();

  if (!selectedFiles || selectedFiles.length < 2) {
    status.textContent =
      "Select at least two ICS files to compare availability.";
    announce(
      "Select at least two ICS files to compare availability.",
      "assertive",
    );
    return;
  }

  Promise.all(Array.from(selectedFiles).map((file) => file.text()))
    .then((contents) => {
      const schedules = contents.map((content) => parseIcsText(content));
      const commonSchedule = computeCommonFreeTimeForPeople(schedules);
      const commonIcs = renderCommonResults(commonSchedule);
      status.textContent = `Found shared availability across ${schedules.length} schedules.`;
      announce(
        `Found shared availability across ${schedules.length} schedules.`,
      );
      announceDetail(
        `Shared schedule updated. ${DAY_ORDER.map((day) => `${day}: ${(commonSchedule[day] || []).length || 0} windows`).join("; ")}`,
      );
      document.getElementById("downloadCommonButton").dataset.ics = commonIcs;
    })
    .catch((error) => {
      status.textContent =
        "One of the files could not be read. Please try again.";
      announce(
        "One of the files could not be read. Please try again.",
        "assertive",
      );
      console.error(error);
    });
}

function wireEvents() {
  document.getElementById("sampleHtmlButton").addEventListener("click", () => {
    document.getElementById("htmlInput").value = DEMO_HTML;
    convertHtmlToIcs(DEMO_HTML);
  });

  document.getElementById("convertButton").addEventListener("click", () => {
    convertHtmlToIcs(document.getElementById("htmlInput").value);
  });

  document.getElementById("downloadIcsButton").addEventListener("click", () => {
    const content = document.getElementById("generatedIcs").value;
    if (!content) return;
    downloadTextFile("schedule-export.ics", content);
  });

  document
    .getElementById("copyIcsButton")
    .addEventListener("click", async () => {
      const text = document.getElementById("generatedIcs").value;
      if (!text) return;
      await navigator.clipboard.writeText(text);
      document.getElementById("conversionStatus").textContent =
        "ICS copied to your clipboard.";
      announce("ICS copied to your clipboard.");
    });

  document
    .getElementById("friendIcsInput")
    .addEventListener("change", (event) => {
      updateSelectedIcsList(event.target.files);
    });

  document.getElementById("compareButton").addEventListener("click", () => {
    compareIcsFiles(getSelectedIcsFiles());
  });

  document
    .getElementById("downloadCommonButton")
    .addEventListener("click", () => {
      const content = document.getElementById("commonIcsOutput").value;
      if (!content) return;
      downloadTextFile("common-free-time.ics", content);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  renderCommonFreeTimeGrid({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
});
