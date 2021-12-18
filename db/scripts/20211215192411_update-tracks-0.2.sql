INSERT INTO tracks 
(owner, 
bucket, 
cid, 
play_count, 
plays_remaining, 
msats_per_play, 
created_at, 
updated_at)
select
'owner',
'bucket',
cid,
play_count,
plays_remaining,
msats_per_play,
created_at,
updated_at
from tracks_0_1;