-- gears 테이블에 created_at 컬럼 추가 (정렬을 위해 필수)
alter table gears add column created_at timestamp with time zone default timezone('utc'::text, now()) not null;
