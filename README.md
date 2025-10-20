# Navigate — FBLA Web Design Project (2025)

Navigate is a static web prototype for delivering structured history learning: scheduled live sessions, recorded videos, resources, and a student progress dashboard.

Quick links to important files
- Project root: [README.md](README.md)
- App entry: [src/index.html](src/index.html)
- Controller
  - [`MainController`](src/controller/main.js) — [src/controller/main.js](src/controller/main.js)
  - [`Router`](src/controller/router.js) — [src/controller/router.js]
- Pages: [src/view/sample.html](src/view/sample.html), and the page templates in [src/view/pages/](src/view/pages/)
  - [src/view/pages/services.html](src/view/pages/services.html)
  - [src/view/pages/schedule.html](src/view/pages/schedule.html)
  - [src/view/pages/dashboard.html](src/view/pages/dashboard.html)
  - [src/view/pages/resources.html](src/view/pages/resources.html)
  - [src/view/pages/about.html](src/view/pages/about.html)
  - [src/view/pages/live-sessions.html](src/view/pages/live-sessions.html)
  - [src/view/pages/join-session.html](src/view/pages/join-session.html)
- Client-side live sessions logic: [`generateMeetLink`](src/js/live-sessions.js) and UI logic — [src/js/live-sessions.js](src/js/live-sessions.js)
- Styles: [src/css/styles.css](src/css/styles.css), [src/css/live-sessions.css](src/css/live-sessions.css), [src/css/dashboard.css](src/css/dashboard.css)

Getting started (preview locally)
1. Open the project folder in your editor (VS Code).
2. Serve the `src/` folder with a static server:
   - Quick (Python): run in terminal from project root:
     
     ```sh
     python -m http.server 8000 --directory src
     ```
     
     Then open http://localhost:8000
   - Or use the VS Code Live Server extension and point it at [index.html](http://_vscodecontentref_/0).

How the app is organized
- [index.html](http://_vscodecontentref_/1) — main landing page and menu linking to pages under [pages](http://_vscodecontentref_/2).
- [router.js](http://_vscodecontentref_/3) implements a simple client-side router class ([Router](http://_vscodecontentref_/4)) used if you want single-page navigation.
- [main.js](http://_vscodecontentref_/5) bootstraps the app ([MainController](http://_vscodecontentref_/6)).
- [live-sessions.js](http://_vscodecontentref_/7) contains the booking UI, session persistence (uses localStorage), pagination and helper functions like [generateMeetLink](http://_vscodecontentref_/8).
- CSS files live in [css](http://_vscodecontentref_/9) and style the site globally and per-page.

Editing & Development tips
- Edit page templates in [pages](http://_vscodecontentref_/10). Keep header/nav/footer consistent across pages.
- Session data is stored in localStorage by the live sessions code — clearing localStorage resets bookings.
- To link pages from the SPA-router instead of full page loads, inspect [Router](http://_vscodecontentref_/11) and adapt anchors to use absolute paths beginning with `/`.

Common tasks
- Add a new page: create `src/view/pages/yourpage.html` and add a nav link in [index.html](http://_vscodecontentref_/12).
- Add a new style: put it in [css](http://_vscodecontentref_/13) and include it in the page head.
- Debug JS: open browser DevTools console; errors point to the file paths above.

Contributing
- Keep markup semantic, reuse shared header/footer markup.
- Keep CSS variables in [styles.css](http://_vscodecontentref_/14) for consistent theming.

License
- Add a LICENSE file as needed for your project.


