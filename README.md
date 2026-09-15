# Common Time

A lightweight, client-side schedule planner that lets users:

- upload or paste a timetable HTML/text schedule and convert it into an `.ics` file
- review and edit the generated schedule before exporting
- upload multiple calendar files and find shared free time across people

There is no login, no signup, and no backend. Everything runs in the browser.

## What this app does

This tool helps you:

1. take your schedule from PeopleSoft or another timetable source
2. convert it into a calendar file
3. share your exported `.ics` file with friends
4. compare schedules and find free time that matches everyone

## How to get your schedule from PeopleSoft

1. Log in to PeopleSoft.
2. Open your class schedule or academic timetable.
3. Open the weekly timetable view.
4. Use the browser option to save the page as HTML, or copy the timetable content.
5. Paste it into the app, or upload the saved HTML file.

Typical timetable content looks like this:

```text
Days: Sunday Times: 11:00AM to 12:00PM
```

The app is designed to parse schedule blocks like that and turn them into calendar events.

## How to export your `.ics` file

1. Paste your HTML schedule into the app, or upload the saved file.
2. Click the Convert to ICS button.
3. Review the generated calendar output.
4. Click Download .ics to save the file.
5. Open the downloaded file in your calendar app if needed.

Your friends can then upload the `.ics` file to the app and compare free time.

## How to compare with friends

1. Each person exports their own schedule as `.ics`.
2. Open the app and choose multiple `.ics` files in the Compare with friends section.
3. Click Find common free time.
4. The app will show matching free slots across the selected schedules.
5. Download the shared availability `.ics` file if needed.

## How to share it with people

You can share the app by sending:

- the live Netlify URL
- the GitHub repo link
- a short note explaining that everyone just needs to upload their own `.ics` file

This keeps the process simple and private because everything runs in the browser.

## Demo video

Add your recorded walkthrough here:

```md
[Watch the demo video](https://your-video-link-here.com)
```

If you are using a Loom, YouTube, or Google Drive video, paste the public link here so people can see:

- how to get the schedule from PeopleSoft
- how to export the `.ics` file
- how to compare with friends
- how to use the app step by step

## Run locally

From the project folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy to Netlify

1. Import the repository into Netlify.
2. Keep the publish directory as the project root.
3. Leave the build command empty.
4. Deploy the site.

Netlify will serve the app as a static site without needing any server code.

## Project files

This app is designed to be hosted as a static website. The core files are:

- `index.html`
- `styles.css`
- `app.js`

## Notes

- This app works entirely in the browser.
- No authentication or database is required.
- It is suitable for static hosting on GitHub Pages, Netlify, or any simple web server.
