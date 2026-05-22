- Next.js App Router
- JavaScript / JSX
- Supabase Auth
- Supabase PostgreSQL Database
- Liveblocks realtime collaboration and storage
- Tailwind CSS + shadcn-style components
- perfect-freehand
- Zustand

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=optional_for_liveblocks_auth_better_server_checks
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run the clean schema in Supabase SQL Editor:

```sql
-- supabase/schema.sql
```

If you do not want to drop existing tables, use:

```sql
-- supabase/migration_non_destructive.sql
```

Start the project:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Added full whiteboard feature set

This refined version keeps the same Miro-style UI direction and adds the project feature set:

- Highlighter tool using smooth Liveblocks path layers
- Image upload tool
- Ctrl + V pasted image support
- Supabase Storage upload to `board-images`
- Object-to-object connector arrows
- Clear board for all collaborators
- PNG and PDF export
- Share panel from the board header
- Email invite records through Supabase
- Guest link view/edit settings
- Liveblocks authorization for owners, members, invited users, and guest links

Before running this version, run `supabase/schema.sql` in Supabase SQL Editor. It includes the full database schema and the Storage policies for `board-images`.
