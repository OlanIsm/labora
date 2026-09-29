# Labora backend

Supabase provides authentication and shared assignment/result storage. Run [`schema.sql`](schema.sql) in a Supabase project's SQL editor, then copy `frontend/.env.example` to `frontend/.env.local` and fill in the URL and anon key.

Row-level policies restrict teacher assignments to their owner and students in the named class. For a local demo without Supabase, the frontend stores data in the browser.
