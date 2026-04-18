-- 1. Profiles Table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- set up row level security
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- 2. Playlists Table
create table playlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  cover_url text,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table playlists enable row level security;
create policy "Public playlists are viewable by everyone." on playlists for select using (is_public = true);
create policy "Users can view all their playlists." on playlists for select using (auth.uid() = user_id);
create policy "Users can insert their playlists." on playlists for insert with check (auth.uid() = user_id);
create policy "Users can update their playlists." on playlists for update using (auth.uid() = user_id);
create policy "Users can delete their playlists." on playlists for delete using (auth.uid() = user_id);

-- 3. Playlist Songs Table
create table playlist_songs (
  id uuid default uuid_generate_v4() primary key,
  playlist_id uuid references playlists(id) on delete cascade not null,
  song_id text not null, -- YT video ID
  title text not null,
  artist text,
  thumbnail_url text,
  duration_sec integer,
  added_at timestamp with time zone default timezone('utc'::text, now())
);

alter table playlist_songs enable row level security;
create policy "Public playlist songs are viewable by everyone" on playlist_songs for select using (
  exists (select 1 from playlists where playlists.id = playlist_songs.playlist_id and (playlists.is_public = true or playlists.user_id = auth.uid()))
);
create policy "Users can modify their playlist songs." on playlist_songs for all using (
  exists (select 1 from playlists where playlists.id = playlist_songs.playlist_id and playlists.user_id = auth.uid())
);

-- 4. Friends Table
create table friends (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  friend_id uuid references profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'blocked')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique (user_id, friend_id)
);

alter table friends enable row level security;
create policy "Users can view their friendships." on friends for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can insert friendships." on friends for insert with check (auth.uid() = user_id);
create policy "Users can update their friendships." on friends for update using (auth.uid() = user_id or auth.uid() = friend_id);

-- 5. Rooms Table
create table rooms (
  id uuid default uuid_generate_v4() primary key,
  host_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table rooms enable row level security;
create policy "Public rooms are viewable by everyone." on rooms for select using (is_public = true);
create policy "Host can update room." on rooms for update using (auth.uid() = host_id);
create policy "Host can delete room." on rooms for delete using (auth.uid() = host_id);
create policy "Any user can create a room." on rooms for insert with check (auth.uid() = host_id);

-- 6. Room State Table
create table room_state (
  room_id uuid references rooms(id) on delete cascade primary key,
  current_song_id text,
  is_playing boolean default false,
  current_time float default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table room_state enable row level security;
create policy "Anyone can select room state." on room_state for select using (true);
create policy "Host can insert/update room state." on room_state for all using (
  exists (select 1 from rooms where rooms.id = room_state.room_id and rooms.host_id = auth.uid())
);

-- 7. Messages Table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table messages enable row level security;
create policy "Anyone can view messages in a room." on messages for select using (true);
create policy "Users can insert messages." on messages for insert with check (auth.uid() = user_id);

-- 8. Liked Songs Table
create table liked_songs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  song_id text not null,
  title text not null,
  artist text,
  thumbnail_url text,
  duration_sec integer,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique (user_id, song_id)
);

alter table liked_songs enable row level security;
create policy "Users can view their liked songs." on liked_songs for select using (auth.uid() = user_id);
create policy "Users can insert liked songs." on liked_songs for insert with check (auth.uid() = user_id);
create policy "Users can delete liked songs." on liked_songs for delete using (auth.uid() = user_id);

-- 9. Recently Played Table
create table recently_played (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  song_id text not null,
  title text not null,
  artist text,
  thumbnail_url text,
  duration_sec integer,
  played_at timestamp with time zone default timezone('utc'::text, now()),
  unique (user_id, song_id)
);

alter table recently_played enable row level security;
create policy "Users can view their recently played." on recently_played for select using (auth.uid() = user_id);
create policy "Users can insert recently played." on recently_played for insert with check (auth.uid() = user_id);
create policy "Users can update recently played." on recently_played for update using (auth.uid() = user_id);

-- Enable Realtime for specific tables
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table room_state, messages;
