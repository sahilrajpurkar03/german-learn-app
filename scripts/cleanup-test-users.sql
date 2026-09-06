-- Remove test accounts created during manual verification (cascades to profiles/sessions/progress).
delete from auth.users where email in (
  'raj.test.sprechen@mailinator.com',
  'raj.test.sprechen2@mailinator.com',
  'raj.test.sprechen3@mailinator.com'
);
