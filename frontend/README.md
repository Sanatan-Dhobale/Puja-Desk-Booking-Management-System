# PujaDesk frontend

React + Vite + Tailwind CSS with Axios calls to the existing Express/MongoDB backend. The application contains no sample booking records and does not fall back to fixtures when the server is unavailable.

## Run both applications

Requires Node.js 22.12+ and a running MongoDB instance.

From the project root, open two terminals.

Terminal 1:

```powershell
cd backend
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Set `MONGODB_URI` in `backend/.env` to your database URI. The default example uses local MongoDB. Keep any existing `.env` rather than overwriting it.

Terminal 2:

```powershell
cd frontend
npm install
npm run dev
```

Open Vite's printed URL, normally `http://127.0.0.1:5173/`. Both Express and MongoDB must remain running. Creating a booking and changing its status now write to your configured MongoDB database.

Optional frontend environment configuration:

```dotenv
VITE_API_URL=/api
API_PROXY_TARGET=http://127.0.0.1:5000
```

These defaults work without a frontend `.env`. Copy `.env.example` only if you need to configure them. Restart Vite after environment changes.

## How requests work

```text
React component
  -> Axios requests /api/bookings on the frontend origin
  -> Vite development proxy forwards /api to Express on port 5000
  -> Express route /api/bookings
  -> Controller and Mongoose
  -> MongoDB
  -> JSON response updates the React UI
```

The backend routes and response format are unchanged. Using a same-origin development proxy avoids a CORS change in Express. `API_PROXY_TARGET` configures the server-side forwarding target; it is not a secret. `VITE_` variables are included in browser code, so never put credentials in them.

For production, configure your web server/reverse proxy to forward `/api` to Express and serve the Vite `dist/` files. The Vite development proxy is not part of the static build. If hosting frontend and backend on separate origins instead, set `VITE_API_URL` to the backend's public `/api` URL and configure an explicit allowed frontend origin in Express CORS handling. That alternative requires a backend configuration change; this implementation does not make one.

## Existing endpoints used

| Action          | Request                        |
| --------------- | ------------------------------ |
| List bookings   | `GET /api/bookings`            |
| Booking details | `GET /api/bookings/:id`        |
| Create booking  | `POST /api/bookings`           |
| Update status   | `PUT /api/bookings/:id/status` |

The API returns `{ success, message, data }`; list responses also contain `{ page, limit, total, totalPages }` in `pagination`.

Example list request:

```text
/api/bookings?search=asha&status=Confirmed&sortBy=amount&order=desc&page=1&limit=6
```

- `search` is sent only when nonempty. It searches name, phone, email, and puja name according to the backend's matching rules.
- `status` is omitted for All bookings. Supported values are exactly Pending, Confirmed, In Progress, and Completed.
- Sort mappings: newest → `createdAt/desc`; puja date → `date/asc`; amount → `amount/desc`; devotee → `devotee.name/asc`.
- `page` and `limit` go to MongoDB through the existing API. The frontend does not filter or slice a downloaded page to imitate global pagination.
- Search, filter, sort, or page-size changes reset to page 1.
- A 250 ms delay avoids a request for every keystroke. An AbortController cancels superseded requests and prevents old results from replacing newer results.
- If concurrent database changes remove the last page, the frontend requests the last available page automatically.

## Booking details page

Click a booking ID or its arrow to open:

```text
http://127.0.0.1:5173/#/bookings/MONGODB_ID
```

The page independently fetches `GET /api/bookings/:id`. It works when opened directly, shared, refreshed, or reached through browser Back/Forward. A small hash-based route is sufficient for these screens, so no routing library was added. The hash is handled by React, while `/api/bookings/:id` is the Express endpoint.

Selecting a status and clicking Save status sends:

```json
{ "status": "In Progress" }
```

The displayed booking changes only after PUT succeeds. The save button is disabled while saving. A failure keeps the original saved status visible and displays the server's error. Successful changes refresh dashboard counts and the booking list when you return.

## Loading, errors, and empty states

- Initial loads, filter changes, page changes, and details requests show a loading indicator.
- Request errors show a message and a Try again button; no fake records are substituted.
- Server validation messages, invalid IDs, and missing-record messages are displayed to the user.
- A request timeout or unavailable server gives a readable connection message.
- An empty database prompts the user to create a booking.
- A search with no results offers Clear filters.
- The creation form saves through POST, prevents repeated submissions while saving, and keeps entered fields on failure.

## Counts, value, and export

The existing list endpoint already returns database totals. The Bookings screen makes five small list requests for the overall count and the four status counts. Four request only one record each; the Pending request fetches the latest five records for notifications. These run in parallel at startup and after a successful write, rather than downloading the entire collection. Each response is a separate database read; counts can temporarily differ during concurrent writes.

The existing API has no global revenue or service-summary endpoint. To preserve its structure:

- Total bookings and status counts cover all database records, independent of the active search.
- Page booking value sums only the loaded page and is clearly labeled. It is not collected revenue.
- Puja service cards summarize only the current page of bookings and include pagination.
- Export page downloads only the currently loaded page as CSV.
- No metric is calculated from hardcoded records or presented as a global total when only a page is available.

A dedicated aggregate endpoint can replace the count requests later if the application needs larger-scale analytics.

## Files and responsibilities

- `src/services/bookingApi.js`: the Axios instance, timeout, GET/POST/PUT functions, and readable error messages. HTTP details stay separate from visual components.
- `src/App.jsx`: query state, cancelable list loading, booking statistics, navigation, creation, and refresh after writes.
- `src/components/BookingTable.jsx`: renders the server's rows and delegates filter/sort/page changes through props.
- `src/components/Pagination.jsx`: uses the server's totals and shows at most five page-number buttons.
- `src/components/BookingDetailsPage.jsx`: fetches one record and handles persisted status updates, saving state, retry, and errors.
- `src/components/BookingDialogs.jsx`: the reusable creation form and booking details/status fields.
- `src/components/ApiState.jsx`: shared loading and request-error presentation.
- `src/components/ServicesPanel.jsx`: page-scoped service summaries from real records.
- `src/components/Header.jsx`: displays the current date in Asia/Kolkata rather than a fixed demo date.
- `src/constants.js`: allowed statuses and sort mappings. These are interface options, not booking data.
- `src/components/Sidebar.jsx`, `Modal.jsx`, `StatCard.jsx`, and `StatusBadge.jsx`: reusable navigation, accessible dialogs, and visuals.
- `src/utils.js`: currency/date display, readable ID references, and page CSV export.
- `vite.config.js`: React/Tailwind setup and the development API proxy.

## Verification

```powershell
npm run build
```

The integration was also tested through Chrome against Express and a uniquely named temporary MongoDB database. Coverage includes real list query parameters, combined search/status filtering, sorting, pagination, direct details links and reload, POST creation, persisted PUT status changes, invalid IDs, missing records, failed updates, network failures and retry, loading indicators, canceled stale searches, and mobile navigation. Test records were isolated from the application's database and removed afterward.

## Navigation

Bookings is the main screen and includes the statistics cards and management table. The duplicate Overview tab was removed. Puja services remains a separate grouped view of services on the loaded page. The default URL and older Overview hashes display Bookings.

## Puja selection

The creation form uses a required select with exactly four pujas: Ganesh Puja, Durga Puja, Arogya Prapti Puja, and Laxmi Puja. The options are in `src/constants.js`, matching the backend enum. Free-text puja names are not accepted.

Development samples can be inserted into MongoDB using `npm run seed` in `backend`. The frontend still fetches every booking through Axios; sample records are not embedded in the UI. The seed inserts 27 records on its first run, preserves existing records, and skips its own records on later runs.
