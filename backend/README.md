# Puja Booking backend

A JavaScript Express API with Mongoose and a small MVC structure. No new runtime dependencies were needed for the booking APIs.

## Run

Requires Node.js 22+ and MongoDB running locally or on Atlas.

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Copy the example only if you do not already have `.env`. Set `MONGODB_URI` in `.env` to your MongoDB URI. The default example uses `mongodb://127.0.0.1:27017/puja_booking`. Keep `.env` private; it is ignored by Git.

`npm run dev` watches JavaScript files. Restart manually after changing `.env`. `npm start` runs without watch mode. The HTTP server starts only after MongoDB connects.

## Files and responsibilities

```text
src/
  config/db.js
  controllers/bookingController.js
  middleware/errorHandler.js
  middleware/validateBooking.js
  models/Booking.js
  routes/bookingRoutes.js
  app.js
  server.js
test/booking.test.js
postman/Puja-Booking.postman_collection.json
```

- `models/Booking.js` defines the stored fields, required values, status enum, and timestamps. Mongoose provides a second layer of validation when writing records. Phone numbers are strings so `+` and leading zeroes are preserved.
- `middleware/validateBooking.js` validates JSON bodies, ObjectIds, and query parameters before any database operation. It rejects unknown fields and prevents clients from submitting database operators. Only create fields and the status update field are accepted.
- `controllers/bookingController.js` creates, reads, searches, counts, and updates bookings. Search text is escaped before building a case-insensitive regex so characters such as `.*` are treated literally. Sorting uses an allowed field plus `_id` to keep ties deterministic. The list and count queries run together; totals can change between them if other users write concurrently.
- `routes/bookingRoutes.js` maps each URL and HTTP method to validation and a controller.
- `middleware/errorHandler.js` returns consistent JSON for validation, malformed JSON, missing routes, and unexpected errors. Server errors are logged without exposing their details to clients.
- `app.js` connects JSON parsing, routes, and error handling. Express 5 forwards rejected async controller promises to the error middleware, so extra wrappers are unnecessary.
- `server.js` loads `.env`, connects to MongoDB, then starts HTTP. `config/db.js` validates configuration and applies a five-second database connection timeout.

## Booking fields

| Field | Rules |
| --- | --- |
| `devotee.name` | Required string, 1–100 characters after trimming |
| `devotee.phone` | Required string, 7–15 digits with optional leading `+`; no spaces or dashes |
| `devotee.email` | Optional valid email, at most 254 characters; stored lowercase |
| `devotee.address` | Optional string, 1–500 characters after trimming |
| `pujaName` | Required: Ganesh Puja, Durga Puja, Arogya Prapti Puja, or Laxmi Puja |
| `date` | Required real calendar date in `YYYY-MM-DD` format |
| `amount` | Required JSON number, finite and at least 0 |
| `status` | Optional on creation; exactly `Pending`, `Confirmed`, `In Progress`, or `Completed` |

New bookings default to `Pending`. Status values are case-sensitive. Any of the four statuses can be changed to any other; no additional transition restrictions are imposed. `Cancelled` is not supported.

Optional fields should be omitted rather than sent as empty strings or null. Past dates are accepted because no rule prohibits entering historical bookings. Dates are stored as MongoDB Date values at UTC midnight; API responses serialize them as ISO timestamps. Treat the first ten characters as the booking's calendar date. `_id`, `createdAt`, and `updatedAt` are generated automatically.

## Response format

Success responses contain `success`, `message`, and `data`. Lists also include `pagination`:

```json
{
  "success": true,
  "message": "Bookings fetched successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Errors use the same base keys:

```json
{
  "success": false,
  "message": "Booking not found",
  "data": null
}
```

HTTP codes: `200` for reads and status updates, `201` for creation, `400` for invalid input, `404` for missing records/routes, `413` for an oversized JSON body, and `500` for unexpected server errors. An empty list or a page beyond the last page returns `200` with `data: []`.

## Test in Postman

Start the backend first. Import `postman/Puja-Booking.postman_collection.json` into Postman, or create requests manually using the examples below.

The collection has `baseUrl` set to `http://localhost:5000`. Run **Create booking** first; its test script saves the returned ID as the collection variable `bookingId`. If testing manually, copy `data._id` from the POST response into a `bookingId` variable.

For POST and PUT, choose **Body → raw → JSON**. Postman adds `Content-Type: application/json`.

### 1. Create a booking

**POST** `{{baseUrl}}/api/bookings`

```json
{
  "devotee": {
    "name": "Asha Sharma",
    "phone": "+919876543210",
    "email": "asha@example.com",
    "address": "Varanasi"
  },
  "pujaName": "Ganesh Puja",
  "date": "2026-12-15",
  "amount": 1500
}
```

Expected: `201`, `success: true`, and `data.status: "Pending"`. Copy `data._id`. You can also explicitly include one of the four supported statuses.

### 2. List all bookings

**GET** `{{baseUrl}}/api/bookings`

Expected: `200`, an array in `data`, and pagination metadata. Default ordering is newest creation first, with page 1 and 10 records per page.

For search, status, sorting, and pagination, use the **Params** tab:

| Key | Example | Allowed values / behavior |
| --- | --- | --- |
| `search` | `asha` | 1–100 characters; literal, case-insensitive partial match on name, phone, email, or puja name |
| `status` | `Confirmed` | One exact supported status |
| `sortBy` | `amount` | `createdAt`, `date`, `amount`, `status`, `pujaName`, `devotee.name` |
| `order` | `asc` | `asc` or `desc`; default `desc` |
| `page` | `1` | Positive integer; default `1` |
| `limit` | `10` | Integer from 1 to 100; default `10` |

Combined example:

```text
{{baseUrl}}/api/bookings?search=asha&status=Confirmed&sortBy=amount&order=asc&page=1&limit=10
```

Search and status filters must both match. Create several records with different amounts to verify ascending order and use `limit=1&page=2` to verify pagination. For `In Progress`, enter the value normally in Params; Postman encodes the space. Status sorting is alphabetical, not workflow order.

### 3. Get one booking

**GET** `{{baseUrl}}/api/bookings/{{bookingId}}`

Expected: `200` and the matching booking in `data`.

### 4. Update status

**PUT** `{{baseUrl}}/api/bookings/{{bookingId}}/status`

```json
{
  "status": "In Progress"
}
```

Expected: `200` with `data.status: "In Progress"`. Repeat with `Pending`, `Confirmed`, and `Completed`. Fetch the booking again to confirm persistence. This endpoint accepts only `status`; other fields produce `400`.

### 5. Check error handling

- GET `/api/bookings/bad-id`: expect `400` for invalid ObjectId format.
- GET `/api/bookings/000000000000000000000000`: expect `404` if that ID does not exist. Repeat with PUT and a valid status body.
- POST with a missing name, invalid phone/email, negative or string amount, unknown field, or `date: "2026-02-30"`: expect `400`.
- PUT with `status: "Cancelled"`, `status: "confirmed"`, a missing status, or extra fields: expect `400`.
- GET with `page=0`, `limit=101`, `sortBy=unknown`, or `order=up`: expect `400`.
- Send malformed JSON such as `{`: expect `400` with `Invalid JSON body`.
- GET with a search that matches nothing: expect `200` and an empty list.

`GET /api/health` is a basic HTTP check and uses the same response envelope. It does not check ongoing database readiness.

## Automated tests

```powershell
npm test
```

The tests use Node's built-in test runner and your local MongoDB at `127.0.0.1:27017`. Set `TEST_MONGODB_URI` if using another MongoDB server. Each run creates a unique `puja_booking_test_...` database, overrides the connection's database name, and removes only that database afterward. Existing application records are untouched. The MongoDB user needs permission to create and drop that test database.

Tests cover persisted creation and status updates, all four statuses, search/filter/sort/pagination, literal regex characters, invalid data and IDs, missing records, error responses, and model validation. No test library is installed.

## Allowed pujas and sample bookings

`pujaName` is restricted to `Ganesh Puja`, `Durga Puja`, `Arogya Prapti Puja`, and `Laxmi Puja`. `pujaNames` in `src/models/Booking.js` defines the Mongoose enum. Request validation uses the same list and returns 400 for unsupported names. Names are case-sensitive after trimming. The frontend select uses the matching list in `frontend/src/constants.js`.

To add the 27 development sample bookings to the database configured in `backend/.env`:

```powershell
cd backend
npm run seed
```

`scripts/seedBookings.js` creates samples across the four pujas and four booking statuses, with varied dates, amounts, names, and cities. Contact details use sample email addresses. Fixed sample IDs make repeated runs skip existing samples without overwriting changes. No existing bookings are deleted or renamed. These are MongoDB records loaded through the normal API, not a frontend fallback.

Restart the backend after changing its schema if it is running with `npm start`. Watch mode (`npm run dev`) normally restarts automatically. Changing the Mongoose enum validates future writes; it does not automatically migrate old records.
