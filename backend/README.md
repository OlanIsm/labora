# Supabase setup

1. Create a Supabase project.
2. Run [schema.sql](schema.sql) once in the SQL editor to create assignment/result tables and their access policies.
3. Copy `frontend/.env.example` to `frontend/.env.local` and provide the project URL and public anon key.
4. Restart the frontend. Use a confirmed school account for shared assignments and results; demo accounts remain local.

Authentication is hosted by Supabase. There is no separate Node backend service. Table access belongs to the corresponding frontend feature repository; see [ARCHITECTURE.md](../ARCHITECTURE.md).
