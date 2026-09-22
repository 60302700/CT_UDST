import argparse
import re
from datetime import datetime, timedelta
from pathlib import Path

from bs4 import BeautifulSoup

DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
DAY_LOOKUP = {
    "SUNDAY": "Sunday",
    "MONDAY": "Monday",
    "TUESDAY": "Tuesday",
    "WEDNESDAY": "Wednesday",
    "THURSDAY": "Thursday",
    "FRIDAY": "Friday",
    "SATURDAY": "Saturday",
}


def get_html_from_file(filename):
    with open(filename, "r", encoding="utf-8") as file:
        return file.read()


def normalize_text(value):
    return re.sub(r"\s+", " ", value or "").strip()


def escape_ics_text(value):
    return (
        str(value or "")
        .replace("\\", "\\\\")
        .replace(",", "\\,")
        .replace(";", "\\;")
        .replace("\n", " ")
    )


def to_decimal_time(hours, minutes, meridiem):
    hour = int(hours)
    minute = int(minutes)
    suffix = (meridiem or "").upper()

    if suffix == "PM" and hour != 12:
        hour += 12
    if suffix == "AM" and hour == 12:
        hour = 0

    return hour + minute / 60


def parse_time_range(title):
    match = re.search(
        r"(\d{1,2}):(\d{2})\s*(AM|PM)\s*(?:-|to)\s*(\d{1,2}):(\d{2})\s*(AM|PM)",
        title,
        flags=re.IGNORECASE,
    )
    if not match:
        return None

    start = to_decimal_time(match.group(1), match.group(2), match.group(3))
    end = to_decimal_time(match.group(4), match.group(5), match.group(6))
    return {"start": start, "end": end}


def get_day_name_from_text(value):
    text = normalize_text(value).upper()
    for key, day in DAY_LOOKUP.items():
        if key in text or day.upper() in text:
            return day
    for day in DAY_ORDER:
        if day.upper() in text:
            return day
    return None


def get_day_from_cell(cell, fallback_day=None):
    classes = [item.upper() for item in cell.get("class", [])]
    for class_name in classes:
        day_name = DAY_LOOKUP.get(class_name)
        if day_name:
            return day_name

    cell_id = (cell.get("id") or "").upper()
    for day in DAY_ORDER:
        if day.upper() in cell_id:
            return day

    return fallback_day


def parse_plain_text_schedule(html_content):
    events = []
    seen = set()
    matches = re.finditer(
        r"Days:\s*(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)[\s\S]*?Times:\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(?:to|-)\s*(\d{1,2}:\d{2}\s*(?:AM|PM))",
        html_content,
        flags=re.IGNORECASE,
    )

    for match in matches:
        day_name = match.group(1).title()
        start_text = normalize_text(match.group(2))
        end_text = normalize_text(match.group(3))
        start_time = parse_time_range(f"{start_text} to {end_text}")
        if not start_time:
            continue

        title = f"{day_name} {start_text} to {end_text}"
        event_key = f"{day_name}|{title}|{start_time['start']}|{start_time['end']}"
        if event_key in seen:
            continue
        seen.add(event_key)

        events.append(
            {
                "day": day_name,
                "title": normalize_text(title),
                "start": start_time["start"],
                "end": start_time["end"],
            }
        )

    return events


def parse_html_schedule(html_content):
    soup = BeautifulSoup(html_content, "html.parser")
    table = soup.find("table")
    if not table:
        events = parse_plain_text_schedule(html_content)
        return events

    # Prefer the first header row in the thead; fallback to the first table row with THs
    thead = table.find("thead")
    if thead:
        header_row = thead.find("tr")
        header_cells = header_row.find_all("th") if header_row else []
    else:
        first_tr_with_th = table.find("tr", lambda tag: tag.find("th") is not None)
        header_cells = first_tr_with_th.find_all("th") if first_tr_with_th else []
    day_index_map = {}

    for index, cell in enumerate(header_cells):
        text = normalize_text(cell.get_text(" ", strip=True))
        classes = [item.upper() for item in cell.get("class", [])]
        candidate_text = " ".join(classes + [text])
        day_name = None

        for key, day in DAY_LOOKUP.items():
            if key in candidate_text or day.upper() in candidate_text:
                day_name = day
                break

        if day_name is None:
            for day in DAY_ORDER:
                if day.upper() in candidate_text:
                    day_name = day
                    break

        if day_name:
            day_index_map[index] = day_name

    events = []
    seen = set()

    for row in table.select("tbody tr"):
        cells = row.find_all(["td", "th"], recursive=False)
        col_index = 0
        for cell in cells:
            # account for time-column markers
            if cell.get("class") and "psc_time" in cell.get("class", []):
                colspan = int(cell.get("colspan", 1))
                col_index += colspan
                continue

            colspan = int(cell.get("colspan", 1))
            day_name = get_day_from_cell(cell, day_index_map.get(col_index))
            if not day_name:
                continue

            anchor = cell.find("a")
            title = (
                cell.get("title")
                or (anchor and anchor.get("title"))
                or (anchor and normalize_text(anchor.get_text(" ", strip=True)))
                or normalize_text(cell.get_text(" ", strip=True))
                or ""
            )
            if not title:
                continue

            if title.upper() == day_name.upper():
                continue
            if cell.get("aria-disabled") == "true" and not re.search(r"\d{1,2}:\d{2}", title):
                continue

            time_range = parse_time_range(title)
            if not time_range:
                continue

            # Normalize start/end to minute resolution for robust deduplication
            start_min = int(round(time_range["start"] * 60))
            end_min = int(round(time_range["end"] * 60))
            event_key = f"{day_name}|{normalize_text(title)}|{start_min}|{end_min}"
            if event_key in seen:
                continue
            seen.add(event_key)

            events.append(
                {
                    "day": day_name,
                    "title": normalize_text(title),
                    "start": time_range["start"],
                    "end": time_range["end"],
                }
            )

    if not events:
        return parse_plain_text_schedule(html_content)

    return events


def get_event_date(day_name):
    base_date = datetime(2026, 9, 14)  # Monday of the generated schedule week
    offset = {
        "Sunday": 6,
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5,
    }
    return base_date + timedelta(days=offset.get(day_name, 0))


def to_ics_datetime(date_obj, decimal_hour):
    hour = int(decimal_hour)
    minute = int(round((decimal_hour - hour) * 60))
    if minute == 60:
        hour += 1
        minute = 0
    dt = datetime(date_obj.year, date_obj.month, date_obj.day, hour, minute)
    # Use a floating local time format (no trailing Z) to avoid implying UTC
    return dt.strftime("%Y%m%dT%H%M%S")


def build_ics_calendar(events):
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CommonTime App//EN",
        "CALSCALE:GREGORIAN",
    ]

    for index, event in enumerate(events):
        event_day = event.get("day", "Monday")
        event_date = get_event_date(event_day)
        summary = escape_ics_text(event.get("title") or "Busy block")

        lines.extend(
            [
                "BEGIN:VEVENT",
                f"UID:{int(datetime.utcnow().timestamp() * 1000)}-{index}@common-time.app",
                f"DTSTAMP:{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}",
                f"SUMMARY:{summary}",
                f"DTSTART:{to_ics_datetime(event_date, event['start'])}",
                f"DTEND:{to_ics_datetime(event_date, event['end'])}",
                # Make timetable events repeat every single day
                "RRULE:FREQ=DAILY;INTERVAL=1",
                "END:VEVENT",
            ]
        )

    lines.append("END:VCALENDAR")
    return "\r\n".join(lines)


def create_ics(html_content, output_filename="schedule_a.ics"):
    events = parse_html_schedule(html_content)
    calendar_text = build_ics_calendar(events)

    output_path = Path(output_filename)
    output_path.write_text(calendar_text, encoding="utf-8")
    return calendar_text


def main():
    parser = argparse.ArgumentParser(description="Convert a university HTML timetable to an ICS calendar.")
    parser.add_argument("input_html", help="Path to the HTML schedule file")
    parser.add_argument("output_ics", nargs="?", default="schedule_a.ics", help="Output .ics filename")
    args = parser.parse_args()

    html_content = get_html_from_file(args.input_html)
    ics_content = create_ics(html_content, args.output_ics)
    print(f"Converted {len(parse_html_schedule(html_content))} time blocks successfully.")
    print(f"Saved to: {args.output_ics}")
    return ics_content


if __name__ == "__main__":
    main()
