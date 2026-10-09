
# DawaKhana

## Syncing the medicine catalog

The UI contains 288 demo medicines in `src/lib/medicines.ts`, while the
production catalog is read from the Supabase `medicines` table. To sync all
288 entries, set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and run:

```bash
npm run sync:medicines
```

The script matches existing rows by medicine name, updates those rows, and
inserts missing entries. It does not change existing stock quantities.
