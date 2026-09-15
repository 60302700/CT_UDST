# Common Time

A lightweight, client-side schedule planner that lets users:

- upload or paste a timetable HTML/text schedule and convert it into an `.ics` file
- review and edit the generated schedule before exporting
- upload multiple calendar files and find shared free time across people

There is no login, no signup, and no backend. Everything runs in the browser.

## Project files

This app is designed to be hosted as a static website. The core files are:

- `index.html`
- `styles.css`
- `app.js`

## Run locally

From the project folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this project to a GitHub repository.
2. Open the repository in GitHub.
3. Go to Settings > Pages.
4. Under Source, choose "Deploy from a branch".
5. Select the main branch and the root folder `/`.
6. Save the settings.

Your site will be published at:

```text
https://<your-username>.github.io/<your-repository-name>/
```

## Deploy to Netlify

1. Import the repository into Netlify.
2. Keep the publish directory as the project root.
3. Leave the build command empty.
4. Deploy the site.

Netlify will serve the app as a static site without needing any server code.

## Notes

- This app works entirely in the browser.
- No authentication or database is required.
- It is suitable for static hosting on GitHub Pages, Netlify, or any simple web server.
