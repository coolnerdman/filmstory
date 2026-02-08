-- gears 테이블에 렌즈 전용 컬럼 추가
alter table gears add column focal_length integer; -- 화각 (mm)
alter table gears add column aperture numeric;     -- 조리개 (f값, 소수점 가능)
