-- Database schema for PostgreSQL

-- Drop tables in reverse order of dependencies to avoid foreign key issues
DROP TABLE IF EXISTS performance_notes CASCADE;
DROP TABLE IF EXISTS session_attendance CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS player_games CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create custom ENUM types for PostgreSQL
CREATE TYPE user_role_enum AS ENUM('player', 'coach', 'admin');
CREATE TYPE user_status_enum AS ENUM('active', 'inactive', 'suspended');
CREATE TYPE attendance_status_enum AS ENUM('present', 'absent', 'excused');

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY, -- AUTO_INCREMENT becomes SERIAL
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- Store hashed passwords, NOT plain text
  role user_role_enum NOT NULL DEFAULT 'player', -- Using custom ENUM type
  status user_status_enum NOT NULL DEFAULT 'active', -- Using custom ENUM type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Application will update this manually
);

-- Games table
CREATE TABLE games (
  id SERIAL PRIMARY KEY, -- AUTO_INCREMENT becomes SERIAL
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Application will update this manually
);

-- Players table
CREATE TABLE players (
  id SERIAL PRIMARY KEY, -- AUTO_INCREMENT becomes SERIAL
  user_id INTEGER NOT NULL UNIQUE, -- Use INTEGER for foreign key
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  position VARCHAR(50),
  date_of_birth DATE,
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Application will update this manually
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Player_Games table (Many-to-Many relationship between Players and Games)
CREATE TABLE player_games (
  player_id INTEGER NOT NULL, -- Use INTEGER for foreign key
  game_id INTEGER NOT NULL, -- Use INTEGER for foreign key
  PRIMARY KEY (player_id, game_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Coaches table
CREATE TABLE coaches (
  id SERIAL PRIMARY KEY, -- AUTO_INCREMENT becomes SERIAL
  user_id INTEGER NOT NULL UNIQUE, -- Use INTEGER for foreign key
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  specialization VARCHAR(100), -- Consider linking this to the 'games' table if specialization is always a game
  experience INTEGER, -- Use INTEGER
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Application will update this manually
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Player statistics table
CREATE TABLE player_stats (
  id SERIAL PRIMARY KEY, -- AUTO_INCREMENT becomes SERIAL
  player_id INTEGER NOT NULL UNIQUE, -- Use INTEGER for foreign key, assuming one stats record per player
  games_played INTEGER DEFAULT 0, -- Use INTEGER
  goals_scored INTEGER DEFAULT 0, -- Use INTEGER
  assists INTEGER DEFAULT 0, -- Use INTEGER
  yellow_cards INTEGER DEFAULT 0, -- Use INTEGER
  red_cards INTEGER DEFAULT 0, -- Use INTEGER
  minutes_played INTEGER DEFAULT 0, -- Use INTEGER
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Application will update this manually
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Batches table
CREATE TABLE batches (
  id SERIAL PRIMARY KEY, -- AUTO_INCREMENT becomes SERIAL
  game_id INTEGER NOT NULL, -- Link to the game/sport ID, Use INTEGER
  name VARCHAR(100) NOT NULL,
  schedule VARCHAR(255), -- e.g., "Mon, Wed, Fri 9:00 AM"
  coach_id INTEGER, -- Optional link to a coach, Use INTEGER
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Application will update this manually
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL -- SET NULL if coach is deleted
);

-- Training sessions table
CREATE TABLE training_sessions (
  id SERIAL PRIMARY KEY, -- AUTO_INCREMENT becomes SERIAL
  batch_id INTEGER NOT NULL, -- Link to the Batch, Use INTEGER
  title VARCHAR(100), -- Can be derived from batch name or specific session focus
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes, Use INTEGER
  location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Application will update this manually
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- Session_Attendance table (Many-to-Many between Training Sessions and Players)
CREATE TABLE session_attendance (
  session_id INTEGER NOT NULL, -- Use INTEGER for foreign key
  player_id INTEGER NOT NULL, -- Use INTEGER for foreign key
  status attendance_status_enum NOT NULL DEFAULT 'absent', -- Using custom ENUM type
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Application will update this manually
  PRIMARY KEY (session_id, player_id),
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Payment record
CREATE TABLE payments (
  id SERIAL PRIMARY KEY, -- AUTO_INCREMENT becomes SERIAL
  player_id INTEGER NOT NULL, -- Use INTEGER for foreign key
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255), -- e.g., "Monthly Fee", "Registration Fee"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Application will update this manually
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Performance Notes
CREATE TABLE performance_notes (
    id SERIAL PRIMARY KEY, -- AUTO_INCREMENT becomes SERIAL
    player_id INTEGER NOT NULL, -- Use INTEGER for foreign key
    coach_id INTEGER, -- Link to the coach who made the note (Optional), Use INTEGER
    date DATE NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Application will update this manually
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);

-- Sample seed data (You would generate proper hashed passwords)
/*
-- Insert users and get their IDs
INSERT INTO users (username, email, password, role, status)
VALUES ('admin', 'admin@example.com', 'hashed_password_here', 'admin', 'active') RETURNING id;

INSERT INTO users (username, email, password, role, status)
VALUES ('coach1', 'coach@example.com', 'hashed_password_here', 'coach', 'active') RETURNING id;

-- Insert coach profile linking to the user ID
INSERT INTO coaches (user_id, first_name, last_name, specialization, experience)
VALUES (<coach1_user_id>, 'Alex', 'Johnson', 'Badminton', 5) RETURNING id; -- Replace <coach1_user_id>

INSERT INTO users (username, email, password, role, status)
VALUES ('player1', 'player@example.com', 'hashed_password_here', 'player', 'active') RETURNING id;

-- Insert player profile linking to the user ID
INSERT INTO players (user_id, first_name, last_name, position, date_of_birth, height, weight)
VALUES (<player1_user_id>, 'John', 'Smith', 'Forward', '2002-05-15', 180.5, 75.2) RETURNING id; -- Replace <player1_user_id>

-- Insert games
INSERT INTO games (name) VALUES ('Badminton'), ('Swimming'), ('Football'), ('Basketball'), ('Tennis') RETURNING id;

-- Link player1 to Badminton
INSERT INTO player_games (player_id, game_id) VALUES (<player1_id>, <badminton_game_id>); -- Replace with actual IDs

-- Insert batches linking to game and coach
INSERT INTO batches (game_id, name, schedule, coach_id)
VALUES (<badminton_game_id>, 'Morning Batch', 'Mon, Wed, Fri 9:00 AM', <coach1_id>) RETURNING id; -- Replace with actual IDs

-- Insert training session linking to batch
INSERT INTO training_sessions (batch_id, title, description, date, duration, location)
VALUES (<morning_batch_id>, 'Badminton Footwork', 'Drills focusing on court movement', '2025-05-17 09:00:00+00', 90, 'Court 1') RETURNING id; -- Replace with actual ID, use timezone

-- Insert attendance linking to session and player
INSERT INTO session_attendance (session_id, player_id, status)
VALUES (<session1_id>, <player1_id>, 'present'); -- Replace with actual IDs

-- Insert payment linking to player
INSERT INTO payments (player_id, date, amount, description)
VALUES (<player1_id>, '2025-05-15', 150.00, 'Monthly Fee'); -- Replace with actual ID

-- Insert performance note linking to player and coach
INSERT INTO performance_notes (player_id, coach_id, date, note)
VALUES (<player1_id>, <coach1_id>, '2025-05-16', 'Showed good agility during footwork drills.'); -- Replace with actual IDs
*/
