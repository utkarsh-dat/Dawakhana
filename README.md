
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
## Website monitoring alerts

The `GET /api/health` endpoint can be monitored by UptimeRobot, Better Uptime, or another external uptime service. Configure that service to call `POST /api/monitoring/alert` with the `x-monitoring-secret` header when the site goes down or recovers.

Set `MONITORING_WEBHOOK_SECRET`, `MONITOR_ALERT_PHONE`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` as server-side deployment secrets. A down event sends an SMS and voice call; a recovery event sends an SMS. External monitoring remains necessary because an application endpoint cannot run while the whole site is unavailable.
