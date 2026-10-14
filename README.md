# LeadPass lead-share demo

Local clickable demo: drivers pass a Thane pickup lead and record an offline commission. Admin inspects leads, messages, and settlement rows. The app never holds money.

## Run

```bash
npm install
npm test
npm run dev
```

The dev server binds to `0.0.0.0` and `PORT` (default 3000).

- Driver phone: http://localhost:3000/drive
- Admin desk: http://localhost:3000/admin

SQLite is created at `data/leadpass.db` on first load and is gitignored. Seeded drivers include Ramesh and Suresh.

Switch drivers in the phone header. There is no OTP.
