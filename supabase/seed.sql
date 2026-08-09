-- ============================================================================
-- FoundryAI — development seed
--
-- Reference data ONLY.
--
-- No business, compliance, funding, or knowledge data is seeded. The
-- Constitution's *Truth Before Fluency* applies to development and demo
-- environments as much as to production: a seeded "Business Licence
-- requirement" is indistinguishable from a real one to anyone looking at the
-- screen, including us during a demo.
--
-- Demo businesses are created through the application, so they exercise the
-- same validation, RLS and lifecycle rules a founder would.
-- ============================================================================

insert into public.countries (code, name, currency_code, is_active) values
  ('BS', 'The Bahamas',         'BSD', true),
  ('JM', 'Jamaica',             'JMD', false),
  ('BB', 'Barbados',            'BBD', false),
  ('TT', 'Trinidad and Tobago', 'TTD', false),
  ('GY', 'Guyana',              'GYD', false),
  ('BZ', 'Belize',              'BZD', false)
on conflict (code) do update
  set name = excluded.name,
      currency_code = excluded.currency_code;
