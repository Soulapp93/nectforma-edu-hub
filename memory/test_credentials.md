# Comptes Demo Nectforma

> Mot de passe commun : `NectDemo2026!`
> Etablissement : **Nectforma Demo** (Organisme de formation)

| Role | Email | Nom | Mot de passe |
|------|-------|-----|-------------|
| AdminPrincipal | admin.principal@nectforma-demo.com | Sophie Martin | NectDemo2026! |
| AdminPrincipal (SuperAdmin Demo) | superadmin@nectforma-demo.com | Demo SuperAdmin | SuperAdmin2026! |
| Admin | admin@nectforma-demo.com | Pierre Durand | NectDemo2026! |
| Formateur | formateur@nectforma-demo.com | Jean Lefebvre | NectDemo2026! |
| Etudiant 1 | etudiant1@nectforma-demo.com | Alice Dubois | NectDemo2026! |
| Etudiant 2 | etudiant2@nectforma-demo.com | Lucas Bernard | NectDemo2026! |
| Etudiant 3 | etudiant3@nectforma-demo.com | Emma Petit | NectDemo2026! |
| Tuteur | tuteur@nectforma-demo.com | Marc Moreau | NectDemo2026! |

## Supabase
- URL: https://dlitdjbmqpsdmhrbluak.supabase.co
- Project ID: dlitdjbmqpsdmhrbluak
- Management Token: sbp_76141a11b440875080f6e7456de75ea3a65fb3b5

## Zoom (Server-to-Server OAuth)
- Account ID: O7Mu21nrQRm4RL22PLWcdg
- Client ID: GomL_S5rSF6rFf2PFauHg
- Client Secret: gPURxks7C9fM2cfd5Dk3G7ZdWo1AdAr9
- Establishment ID (demo): e889e84b-9f11-4b29-bedf-c677dce636f9

## Brevo (Email)
- Secret name in Supabase: BREVO_API_KEY
- Edge Function: send-email-brevo

## Notes techniques
- Edge Function `zoom-meeting` : verify_jwt = false (ES256 JWT compat)
- Edge Function `send-email-brevo` : verify_jwt = false
- Edge Function `send-message` : verify_jwt = false
- Anon key JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXRkamJtcXBzZG1ocmJsdWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTUzODcsImV4cCI6MjA5MDc5MTM4N30.XJ5i1H_jM9rdXOHGvlVa3JkjqDjDrW5Md094uXdCdfo
