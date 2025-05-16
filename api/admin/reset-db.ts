// api/admin/reset-db.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { generateMockToken } from '../utils/authMiddleware'; // Corrected import path
import { User } from '@/types/database.types'; // Import User type


// Initial seed data (matches the frontend's localStorage data structure for simplicity)
const initialSeedData: {
    users: Omit<User, 'createdAt' | 'updatedAt'>[];
    players: Omit<any, 'createdAt' | 'updatedAt'>[]; // Use any for simplified mock data
    coaches: Omit<any, 'createdAt' | 'updatedAt'>[]; // Use any for simplified mock data
    games: Omit<any, 'createdAt' | 'updatedAt'>[]; // Use any for simplified mock data
    batches: Omit<any, 'createdAt' | 'updatedAt'>[]; // Use any for simplified mock data
    payments: Omit<any, 'createdAt' | 'updatedAt'>[]; // Use any for simplified mock data
    performance_notes: Omit<any, 'createdAt' | 'updatedAt'>[]; // Use any for simplified mock data
} = {
    users: [
        { id: 1, username: 'admin', email: 'admin@example.com', password: 'password123', role: 'admin', status: 'active' },
        { id: 2, username: 'coach1', email: 'coach@example.com', password: 'password123', role: 'coach', status: 'active' },
        { id: 3, username: 'player1', email: 'player@example.com', password: 'password123', role: 'player', status: 'active' },
        { id: 4, username: 'player2', email: 'player2@example.com', password: 'password123', role: 'player', status: 'active' },
        { id: 5, username: 'player3', email: 'player3@example.com', password: 'password123', role: 'player', status: 'active' },
        { id: 6, username: 'coach2', email: 'coach2@example.com', password: 'password123', role: 'coach', status: 'active' },
    ],
    players: [
        { id: 1, userId: 3, firstName: 'John', lastName: 'Smith', position: 'Forward', dateOfBirth: '2002-05-15', height: 180.5, weight: 75.2, sports: 'Badminton', attendance: 85, lastAttendance: 'Present', batch: 'Morning Batch' },
        { id: 2, userId: 4, firstName: 'Emily', lastName: 'Johnson', position: 'Midfielder', dateOfBirth: '2003-11-20', height: 165.0, weight: 58.0, sports: 'Badminton', attendance: 92, lastAttendance: 'Present', batch: 'Morning Batch' },
        { id: 3, userId: 5, firstName: 'Michael', lastName: 'Brown', position: 'Defender', dateOfBirth: '2000-01-30', height: 190.0, weight: 85.5, sports: 'Swimming', attendance: 78, lastAttendance: 'Absent', batch: 'Evening Batch' },
        { id: 4, userId: 6, firstName: 'Sarah', lastName: 'Davis', position: 'Goalkeeper', dateOfBirth: '2004-07-07', height: 170.0, weight: 62.0, sports: 'Swimming', attendance: 90, lastAttendance: 'Present', batch: 'Evening Batch' },
        { id: 5, userId: 7, firstName: 'James', lastName: 'Wilson', position: 'Forward', dateOfBirth: '2001-03-22', height: 185.0, weight: 78.0, sports: 'Badminton', attendance: 75, lastAttendance: 'Present', batch: 'Morning Batch' },
        { id: 6, userId: 8, firstName: 'Jessica', lastName: 'Martinez', position: 'Midfielder', dateOfBirth: '2003-09-10', height: 168.0, weight: 60.0, sports: 'Badminton', attendance: 82, lastAttendance: 'Absent', batch: 'Morning Batch' },
    ],
    coaches: [
        { id: 1, userId: 2, firstName: 'Alex', lastName: 'Johnson', specialization: 'Badminton', experience: 5 },
        { id: 2, userId: 6, firstName: 'Sarah', lastName: 'Williams', specialization: 'Swimming', experience: 8 },
    ],
    games: [
        { id: 1, name: 'Badminton' },
        { id: 2, name: 'Swimming' },
        { id: 3, name: 'Football' },
        { id: 4, name: 'Basketball' },
        { id: 5, name: 'Tennis' },
    ],
    batches: [
        { id: 1, gameId: 1, name: 'Morning Batch', schedule: 'Mon, Wed, Fri 9:00 AM', coachId: 1 },
        { id: 2, gameId: 2, name: 'Evening Batch', schedule: 'Tue, Thu 4:00 PM', coachId: 2 },
    ],
    payments: [
        { id: 1, playerId: 1, date: '2025-04-15', amount: 150.00, description: 'Monthly Fee' },
        { id: 2, playerId: 1, date: '2025-05-15', amount: 150.00, description: 'Monthly Fee' },
        { id: 3, playerId: 2, date: '2025-05-20', amount: 150.00, description: 'Monthly Fee' },
        { id: 4, playerId: 3, date: '2025-04-01', amount: 200.00, description: 'Registration Fee' },
        { id: 5, playerId: 3, date: '2025-05-01', amount: 150.00, description: 'Monthly Fee' },
    ],
    performance_notes: [
        { id: 1, playerId: 1, date: '2025-05-10', note: 'Significant improvement in backhand technique', coachId: 1 },
        { id: 2, playerId: 2, date: '2025-05-12', note: 'Good stamina during drills', coachId: 1 },
        { id: 3, playerId: 5, date: '2025-05-11', note: 'Needs to work on court positioning', coachId: 1 },
        { id: 4, playerId: 3, date: '2025-05-18', note: 'Strong performance in freestyle', coachId: 2 },
        { id: 5, playerId: 4, date: '2025-05-18', note: 'Improving dive technique', coachId: 2 },
    ],
    // Attendance and Player_Games would need more complex seeding
    attendance: [], // Skipping detailed attendance seeding for simplicity
};


// Helper to execute multiple SQL statements
async function executeSqlStatements(connection: any, sql: string): Promise<void> {
    const statements = sql.split(';').filter(statement => statement.trim() !== '');
    for (const statement of statements) {
        await connection.execute(statement);
    }
}


// SQL to drop and recreate tables (matches utils/db.schema.sql structure)
const resetSql = `
-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS performance_notes;
DROP TABLE IF EXISTS session_attendance;
DROP TABLE IF EXISTS training_sessions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS player_stats;
DROP TABLE IF EXISTS player_games;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS coaches;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;

-- Recreate tables (copy-paste from utils/db.schema.sql, excluding comments and sample data)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('player', 'coach', 'admin') NOT NULL DEFAULT 'player',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE games (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE players (
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

CREATE TABLE player_games (
  player_id INT NOT NULL,
  game_id INT NOT NULL,
  PRIMARY KEY (player_id, game_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE coaches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  specialization VARCHAR(100),
  experience INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE player_stats (
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

CREATE TABLE batches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  game_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  schedule VARCHAR(255),
  coach_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);

CREATE TABLE training_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id INT NOT NULL,
  title VARCHAR(100),
  description TEXT,
  date DATETIME NOT NULL,
  duration INT NOT NULL,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

CREATE TABLE session_attendance (
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

CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE performance_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT NOT NULL,
    coach_id INT,
    date DATE NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
);
`;

// SQL to insert seed data (simplified - assumes IDs match initialSeedData)
// In a real app, you'd get generated IDs after inserts.
const seedSql = `
INSERT INTO users (id, username, email, password, role, status) VALUES
(1, 'admin', 'admin@example.com', 'password123', 'admin', 'active'),
(2, 'coach1', 'coach@example.com', 'password123', 'coach', 'active'),
(3, 'player1', 'player@example.com', 'password123', 'player', 'active'),
(4, 'player2', 'player2@example.com', 'password123', 'player', 'active'),
(5, 'player3', 'player3@example.com', 'password123', 'player', 'active'),
(6, 'coach2', 'coach2@example.com', 'password123', 'coach', 'active');

INSERT INTO games (id, name) VALUES
(1, 'Badminton'),
(2, 'Swimming'),
(3, 'Football'),
(4, 'Basketball'),
(5, 'Tennis');

INSERT INTO players (id, user_id, first_name, last_name, position, date_of_birth, height, weight) VALUES
(1, 3, 'John', 'Smith', 'Forward', '2002-05-15', 180.5, 75.2),
(2, 4, 'Emily', 'Johnson', 'Midfielder', '2003-11-20', 165.0, 58.0),
(3, 5, 'Michael', 'Brown', 'Defender', '2000-01-30', 190.0, 85.5),
(4, 6, 'Sarah', 'Davis', 'Goalkeeper', '2004-07-07', 170.0, 62.0);
-- Note: Players 5 and 6 from frontend mock are not seeded here to keep it simple.

INSERT INTO coaches (id, user_id, first_name, last_name, specialization, experience) VALUES
(1, 2, 'Alex', 'Johnson', 'Badminton', 5),
(2, 6, 'Sarah', 'Williams', 'Swimming', 8);

INSERT INTO batches (id, game_id, name, schedule, coach_id) VALUES
(1, 1, 'Morning Batch', 'Mon, Wed, Fri 9:00 AM', 1),
(2, 2, 'Evening Batch', 'Tue, Thu 4:00 PM', 2);

INSERT INTO training_sessions (id, batch_id, title, description, date, duration, location) VALUES
(1, 1, 'Badminton Footwork', 'Drills focusing on court movement', '2025-05-17 09:00:00', 90, 'Court 1'),
(2, 1, 'Badminton Serve Practice', 'Improving serve accuracy and power', '2025-05-19 09:00:00', 60, 'Court 1'),
(3, 2, 'Swimming Technique', 'Freestyle stroke correction', '2025-05-18 16:00:00', 90, 'Pool Lane 2');

INSERT INTO payments (id, player_id, date, amount, description) VALUES
(1, 1, '2025-04-15', 150.00, 'Monthly Fee'),
(2, 1, '2025-05-15', 150.00, 'Monthly Fee'),
(3, 2, '2025-05-20', 150.00, 'Monthly Fee'),
(4, 3, '2025-04-01', 200.00, 'Registration Fee'),
(5, 3, '2025-05-01', 150.00, 'Monthly Fee');

INSERT INTO performance_notes (id, player_id, coach_id, date, note) VALUES
(1, 1, 1, '2025-05-10', 'Significant improvement in backhand technique'),
(2, 2, 1, '2025-05-12', 'Good stamina during drills'),
(3, 5, 1, '2025-05-11', 'Needs to work on court positioning'),
(4, 3, 2, '2025-05-18', 'Strong performance in freestyle'),
(5, 4, 2, '2025-05-18', 'Improving dive technique');

-- Link players to games (example based on frontend mock)
INSERT INTO player_games (player_id, game_id) VALUES
(1, 1), -- John Smith (player 1) -> Badminton (game 1)
(2, 1), -- Emily Johnson (player 2) -> Badminton (game 1)
(3, 2), -- Michael Brown (player 3) -> Swimming (game 2)
(4, 2); -- Sarah Davis (player 4) -> Swimming (game 2)

-- Add some mock attendance records (simplified)
INSERT INTO session_attendance (session_id, player_id, status, created_at, updated_at) VALUES
(1, 1, 'present', '2025-05-17 09:30:00', '2025-05-17 09:30:00'),
(1, 2, 'present', '2025-05-17 09:31:00', '2025-05-17 09:31:00'),
(3, 3, 'present', '2025-05-18 16:10:00', '2025-05-18 16:10:00');

`;


// This endpoint should be protected and only accessible by the Super Admin
export default authMiddleware(async (req, res) => {
    if (req.method !== 'POST') {
        sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        return;
    }

    // Check if the authenticated user is an admin
    if (req.user?.role !== 'admin') {
        sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
        return;
    }


    let connection;
    try {
        connection = await getConnection();

        // Start a transaction
        await connection.beginTransaction();

        // Execute the reset SQL
        await executeSqlStatements(connection, resetSql);

        // Execute the seed SQL
        await executeSqlStatements(connection, seedSql);

        // Commit the transaction
        await connection.commit();

        sendApiResponse(res, true, undefined, 'Database reset and seeded successfully', 200);

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback transaction on error
        }
        console.error('Database reset failed:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to reset database', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin']); // Ensure only users with the 'admin' role can access this endpoint
