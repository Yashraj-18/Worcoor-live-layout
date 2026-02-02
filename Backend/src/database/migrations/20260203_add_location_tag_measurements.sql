ALTER TABLE location_tags
  ALTER COLUMN capacity TYPE numeric(15, 3) USING capacity::numeric;

ALTER TABLE location_tags
  ADD COLUMN length numeric(10, 3),
  ADD COLUMN breadth numeric(10, 3),
  ADD COLUMN height numeric(10, 3),
  ADD COLUMN unit_of_measurement varchar(32);
