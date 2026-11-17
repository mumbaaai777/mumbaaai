-- Boarding platforms for Dadar and Andheri (high-confidence rows only), researched 2026-11-17.
-- Borivali NOT included (no reliable source). Dadar numbering in force since 9 Dec 2023; re-check after next renumbering (FPJ, Apr 2026).
-- Matching is "leg towards contains row.towards", so each direction gets one row per terminal name the apps use.
begin;
delete from public.station_platforms where station in ('Dadar','Andheri');
insert into public.station_platforms (station, line, towards, platform, note) values
  ('Dadar','western','Churchgate','2','WR slow locals towards Churchgate'),
  ('Dadar','western','Borivali','1','WR slow locals northbound'),
  ('Dadar','western','Virar','1','WR slow locals northbound'),
  ('Dadar','western','Dahanu','1','WR slow locals northbound'),
  ('Dadar','central','CSMT','9','CR slow locals towards CSMT (renumbered Dec 2023)'),
  ('Dadar','central','Kalyan','8','CR slow locals towards Thane/Kalyan'),
  ('Dadar','central','Karjat','8','CR slow locals towards Thane/Kalyan'),
  ('Dadar','central','Kasara','8','CR slow locals towards Thane/Kalyan'),
  ('Andheri','western','Churchgate','5','Slow locals towards Churchgate; Andheri-starting slow locals leave from 4'),
  ('Andheri','western','Borivali','3','Slow locals northbound; Andheri-starting slow locals leave from 4'),
  ('Andheri','western','Virar','3','Slow locals northbound'),
  ('Andheri','western','Dahanu','3','Slow locals northbound'),
  ('Andheri','harbour','CSMT','2','Harbour towards CSMT (PF1 is towards Goregaon)'),
  ('Andheri','harbour','Panvel','2','Harbour towards Panvel (PF1 is towards Goregaon)');
commit;
notify pgrst, 'reload schema';
