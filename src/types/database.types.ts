// src/types/database.types.ts
// Database model interfaces

// User model
export interface User {
  id: number;
  username: string;
  email: string;
  password: string; // Should be hashed
  role: 'player' | 'coach' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  status?: 'active' | 'inactive' | 'suspended'; // Added status for admin demo
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
  sports?: string[]; // Added sports for player demo (keeping as string[] for sim simplicity)
  stats?: PlayerStats; // This might be a separate fetch in a real app
  createdAt: Date;
  updatedAt: Date;
  attendance?: number; // Added for coach dashboard simulation
  lastAttendance?: string; // Added for coach dashboard simulation
  batch?: string; // Added for coach dashboard simulation - This will be replaced by Batch linking
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
  coachId: number;
  title: string; // Could be linked to Batch/Game name
  description: string;
  date: Date;
  duration: number; // in minutes
  location: string;
  createdAt: Date;
  updatedAt: Date;
  batchId?: number; // Added to link sessions to batches
}

// Batch model
export interface Batch {
  id: number;
  gameId: number; // Link to the game/sport ID (Changed from string)
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
  status: 'present' | 'absent' | 'excused';
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Simulated database structure
export interface SimulatedDatabase {
  users: User[];
  players: Player[];
  coaches: Coach[];
  player_stats: PlayerStats[];
  training_sessions: TrainingSession[];
  attendance: Attendance[];
  batches: Batch[]; // Added batches table
  payments: Payment[]; // Added payments table
  games: Game[]; // Added games table
}


// API response type
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

