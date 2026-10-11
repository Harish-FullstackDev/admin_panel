-- HCM: email template for admin-generated password reset links.
-- Run once in Dashboard > SQL Editor on project unjirnxwvtgifdaieijl.

begin;

insert into public.email_templates (code, name, stage, recipient, subject, body) values
  ('password_reset_link', 'Password reset link', 'Access', 'Internal user',
   'Reset your Ascendus HCM password',
   'Hi {{name}},\n\n{{admin_name}} has sent you a link to set a new password for the Ascendus HCM portal.\nSet your password here (single use, expires soon): {{reset_link}}\n\nIf you did not expect this, contact your administrator.')
on conflict (code) do nothing;

commit;
