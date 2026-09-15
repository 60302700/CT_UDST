from pandas.core import arraylike
from pandas._libs import indexing
from icalendar import Calendar, Event
from datetime import datetime
from pprint import pprint
from datetime import datetime, timedelta


def ranges(x):

    ranges = []

    for mini, maxi in x:

        while mini < maxi:
            ranges.append(mini)
            mini += 0.5

    return set(ranges)


def common_times(data):

    Universal_Time = {
        8.0, 8.5, 9.0, 9.5, 10.0, 10.5,
        11.0, 11.5, 12.0, 12.5, 13.0, 13.5,
        14.0, 14.5, 15.0, 15.5, 16.0, 16.5,
        17.0, 17.5, 18.0, 18.5, 19.0, 19.5,
        20.0,20.5,21
    }

    common_times = {}
    # Same logic as your original code
    for i in data:

        for k in data[i]:

            if not common_times.get(k):
                common_times[k] = []

            common_times[k].append(
                ranges(data[i][k])
            )
    new_data = {}
    for j in common_times:

        # Your original logic:
        # take universal time and remove all busy times
        k = list(
            sorted(
                Universal_Time -
                set.union(*common_times[j])
            )
        )

        if not new_data.get(j):
            new_data[j] = k
    pprint(new_data)
    print("-"*10)
    common_time_to_ics(new_data)
            
def common_time_to_ics(data):

    r = []

    nd = {}

    for day in data:

        start = data[day][0]

        print(day)

        for time in range(len(data[day]) - 1):

            d = data[day]

            if d[time + 1] - d[time] != 0.5:

                if not nd.get(day):
                    nd[day] = []

                print(d[time])

                nd[day].append(
                    (start, d[time] + 0.5)
                )

                start = d[time + 1]

        # Add the final range
        if not nd.get(day):
            nd[day] = []
        nd[day].append(
            (start, data[day][-1] + 0.5)
        )

        print("-" * 10)
        cal = Calendar()

    monday = datetime(2026, 9, 14)

    day_numbers = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5,
        "Sunday": 6
    }

    for day, times in nd.items():

        for start, end in times:

            date = monday + timedelta(
                days=day_numbers[day]
            )

            start_hour = int(start)
            start_minute = int((start - start_hour) * 60)

            end_hour = int(end)
            end_minute = int((end - end_hour) * 60)

            start_datetime = date.replace(
                hour=start_hour,
                minute=start_minute
            )

            end_datetime = date.replace(
                hour=end_hour,
                minute=end_minute
            )

            event = Event()

            event.add(
                "summary",
                "Common Free Time"
            )

            event.add(
                "dtstart",
                start_datetime
            )

            event.add(
                "dtend",
                end_datetime
            )

            cal.add_component(event)

    with open("common_free_time.ics", "wb") as f:
        f.write(cal.to_ical())

    print("ICS file created!")



def ics_to_data(files):

    """
    Convert multiple ICS files into the same data structure
    your original code used.

    Output:

    {
        0: {
            'Monday': [(8.0, 10.0), (12.0, 14.0)],
            'Tuesday': [(10.0, 11.0)]
        },

        1: {
            'Monday': [(10.0, 11.0), (14.0, 16.0)]
        }
    }
    """

    data = {}

    for index, filename in enumerate(files):

        days_time = {}

        with open(filename, "rb") as f:
            calendar = Calendar.from_ical(f.read())

        for component in calendar.walk():

            if component.name != "VEVENT":
                continue

            start = component.get("dtstart").dt
            end = component.get("dtend").dt

            # ICS can contain either datetime or date objects
            if not isinstance(start, datetime):
                start = datetime.combine(
                    start,
                    datetime.min.time()
                )

            if not isinstance(end, datetime):
                end = datetime.combine(
                    end,
                    datetime.min.time()
                )

            # Get day name
            day = start.strftime("%A")

            if day not in days_time:
                days_time[day] = []

            # Convert to decimal hours
            start_time = start.hour + (start.minute / 60)
            end_time = end.hour + (end.minute / 60)

            days_time[day].append(
                (start_time, end_time)
            )

        data[index] = days_time

    return data


def ics_to_table(files):

    data = ics_to_data(files)

    common_times(data)


# --------------------------------
# INPUT
# --------------------------------

me = "schedule.ics"
person_2 = "schedule_a.ics"

ics_to_table([
    me,
    person_2
])