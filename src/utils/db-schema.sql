-- Database schema for MySQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- Store hashed passwords, NOT plain text
  role ENUM('player', 'coach', 'admin') NOT NULL DEFAULT 'player',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active', -- Added status
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Games table (New table for sports)
CREATE TABLE IF NOT EXISTS games (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  position VARCHAR(50),
  date_of_birth DATE,
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Player_Games table (Many-to-Many relationship between Players and Games)
CREATE TABLE IF NOT EXISTS player_games (
  player_id INT NOT NULL,
  game_id INT NOT NULL,
  PRIMARY KEY (player_id, game_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);


-- Coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  specialization VARCHAR(100), -- Consider linking this to the 'games' table if specialization is always a game
  experience INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Player statistics table
CREATE TABLE IF NOT EXISTS player_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  games_played INT DEFAULT 0,
  goals_scored INT DEFAULT 0,
  assists INT DEFAULT 0,
  yellow_cards INT DEFAULT 0,
  red_cards INT DEFAULT 0,
  minutes_played INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Batches table (New table for training groups)
CREATE TABLE IF NOT EXISTS batches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  game_id INT NOT NULL, -- Link to the game/sport ID
  name VARCHAR(100) NOT NULL,
  schedule VARCHAR(255), -- e.g., "Mon, Wed, Fri 9:00 AM"
  coach_id INT, -- Optional link to a coach
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL -- SET NULL if coach is deleted
);

-- Training sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id INT NOT NULL, -- Link to the Batch
  title VARCHAR(100), -- Can be derived from batch name or specific session focus
  description TEXT,
  date DATETIME NOT NULL,
  duration INT NOT NULL, -- in minutes
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- Session_Attendance table (Many-to-Many between Training Sessions and Players)
CREATE TABLE IF NOT EXISTS session_attendance (
  session_id INT NOT NULL,
  player_id INT NOT NULL,
  status ENUM('present', 'absent', 'excused') NOT NULL DEFAULT 'absent',
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, player_id),
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);


-- Payment record
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255), -- e.g., "Monthly Fee", "Registration Fee"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);


-- Performance Notes (New table for coach notes on players)
CREATE TABLE IF NOT EXISTS performance_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT NOT NULL,
    coach_id INT, -- Link to the coach who made the note (Optional)
    date DATE NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);


-- Sample seed data (You would generate proper hashed passwords)
/*
INSERT INTO users (username, email, password, role, status)
VALUES ('admin', 'admin@example.com', 'hashed_password_here', 'admin', 'active');

INSERT INTO users (username, email, password, role, status)
VALUES ('coach1', 'coach@example.com', 'hashed_password_here', 'coach', 'active');

INSERT INTO coaches (user_id, first_name, last_name, specialization, experience)
VALUES (LAST_INSERT_ID(), 'Alex', 'Johnson', 'Badminton', 5); -- Link to the user created above

INSERT INTO users (username, email, password, role, status)
VALUES ('player1', 'player@example.com', 'hashed_password_here', 'player', 'active');

INSERT INTO players (user_id, first_name, last_name, position, date_of_birth, height, weight)
VALUES (LAST_INSERT_ID(), 'John', 'Smith', 'Forward', '2002-05-15', 180.5, 75.2); -- Link to the user created above

INSERT INTO games (name) VALUES ('Badminton'), ('Swimming'), ('Football'), ('Basketball'), ('Tennis');

-- Link player1 to Badminton
INSERT INTO player_games (player_id, game_id) VALUES (1, 1); -- Assuming player1.id is 1 and Badminton.id is 1

INSERT INTO batches (game_id, name, schedule, coach_id)
VALUES (1, 'Morning Batch', 'Mon, Wed, Fri 9:00 AM', 1); -- Link to Badminton game and coach1

INSERT INTO training_sessions (batch_id, title, description, date, duration, location)
VALUES (1, 'Badminton Footwork', 'Drills focusing on court movement', '2025-05-17 09:00:00', 90, 'Court 1'); -- Link to Morning Batch

INSERT INTO session_attendance (session_id, player_id, status)
VALUES (1, 1, 'present'); -- Link to the session and player1

INSERT INTO payments (player_id, date, amount, description)
VALUES (1, '2025-05-15', 150.00, 'Monthly Fee');

INSERT INTO performance_notes (player_id, coach_id, date, note)
VALUES (1, 1, '2025-05-16', 'Showed good agility during footwork drills.');
*/
