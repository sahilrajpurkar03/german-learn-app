-- Manually confirm a test user's email (only needed while "Confirm email" is enabled in Supabase Auth settings).
update auth.users set email_confirmed_at = now() where email = 'raj.test.sprechen@mailinator.com' and email_confirmed_at is null;
