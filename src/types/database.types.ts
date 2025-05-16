// src/types/database.types.ts
// Database model interfaces

// User model
export interface User {
  id: number;
  username: string;
  email: string;
  password: string; // Should be hashed
  role: 'player' | 'coach' | 'admin'; // Corresponds to PostgreSQL user_role_enum
  createdAt: Date;
  updatedAt: Date;
  status?: 'active' | 'inactive' | 'suspended'; // Corresponds to PostgreSQL user_status_enum
}

// Player model
export interface Player {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  position: string;
  dateOfBirth?: Date;
  height?: number;
  weight?: number;
  sports?: string[]; // Added sports for player demo (keeping as string[] for sim simplicity, linked via player_games in DB)
  stats?: PlayerStats; // This might be a separate fetch in a real app
  createdAt: Date;
  updatedAt: Date;
  attendance?: number; // Added for coach dashboard simulation (derived, not stored directly)
  lastAttendance?: string; // Added for coach dashboard simulation (derived, not stored directly)
  batch?: string; // Added for coach dashboard simulation - This will be replaced by Batch linking (derived, not stored directly)
}

// Coach model
export interface Coach {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  specialization: string;
  experience: number;
  createdAt: Date;
  updatedAt: Date;
}

// Player statistics
export interface PlayerStats {
  id: number;
  playerId: number;
  gamesPlayed: number;
  goalsScored: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
}

// Game model
export interface Game {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}


// Training session
export interface TrainingSession {
  id: number;
  batchId: number; // Link to the Batch
  title: string; // Could be linked to Batch/Game name
  description: string;
  date: Date;
  duration: number; // in minutes
  location: string;
  createdAt: Date;
  updatedAt: Date;
  // coachId?: number; // Removed - coach is linked via Batch
}

// Batch model
export interface Batch {
  id: number;
  gameId: number; // Link to the game/sport ID
  name: string;
  schedule: string; // e.g., "Mon, Wed, Fri 9:00 AM"
  coachId?: number; // Optional link to a coach
  createdAt: Date;
  updatedAt: Date;
}

// Payment record
export interface Payment {
  id: number;
  playerId: number;
  date: Date;
  amount: number;
  description: string; // e.g., "Monthly Fee", "Registration Fee"
  createdAt: Date;
  updatedAt: Date;
}


// Attendance record
export interface Attendance {
  id: number;
  sessionId: number; // Link to TrainingSession
  playerId: number;
  status: 'present' | 'absent' | 'excused'; // Corresponds to PostgreSQL attendance_status_enum
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Simulated database structure (Frontend simulation - not used with backend API)
// This interface is primarily for the frontend's lib/db.service.ts mock data
// and is not directly tied to the backend database type after the API migration.
export interface SimulatedDatabase {
  users: User[];
  players: Player[];
  coaches: Coach[];
  player_stats: PlayerStats[];
  training_sessions: TrainingSession[];
  attendance: Attendance[];
  batches: Batch[];
  payments: Payment[];
  games: Game[];
}


// API response type
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

