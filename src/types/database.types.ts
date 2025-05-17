// src/types/database.types.ts
// Database model interfaces

// User roles
export type UserRole = 'player' | 'coach' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

// User interface
export interface User { // Add export keyword
    id: number;
    username: string;
    email: string;
    password?: string; // Password should ideally not be fetched, but included for login/registration types
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}

// Player interface
export interface Player { // Add export keyword
    id: number;
    userId: number;
    firstName: string;
    lastName: string;
    position?: string;
    dateOfBirth?: Date;
    height?: number;
    weight?: number;
    createdAt: Date;
    updatedAt: Date;
    // Added for frontend mock data in dashboard, not necessarily in DB schema
    sports?: string[]; // Assuming this is an array of game names
    attendance?: number; // Percentage
    lastAttendance?: 'Present' | 'Absent' | 'N/A';
    batch?: string; // Batch name
}

// Coach interface
export interface Coach { // Add export keyword
    id: number;
    userId: number;
    firstName: string;
    lastName: string;
    specialization?: string;
    experience?: number; // Years of experience
    createdAt: Date;
    updatedAt: Date;
}

// Game interface
export interface Game { // Add export keyword
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

// Batch interface
export interface Batch { // Add export keyword
    id: number;
    gameId: number; // Foreign key to games table
    name: string;
    schedule?: string; // e.g., "Mon, Wed, Fri 9:00 AM"
    coachId?: number; // Foreign key to coaches table (optional)
    createdAt: Date;
    updatedAt: Date;
}

// Training Session interface
export interface TrainingSession { // Add export keyword
    id: number;
    batchId: number; // Foreign key to batches table
    title?: string;
    description?: string;
    date: Date;
    duration: number; // in minutes
    location?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Attendance status
export type AttendanceStatus = 'present' | 'absent' | 'excused';

// Attendance interface
export interface Attendance { // Add export keyword
    id: number;
    sessionId: number; // Foreign key to training_sessions table
    playerId: number; // Foreign key to players table
    status: AttendanceStatus;
    comments?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Payment interface
export interface Payment { // Add export keyword
    id: number;
    playerId: number; // Foreign key to players table
    date: Date;
    amount: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Player Stats interface - UPDATED TO CAMELCASE
export interface PlayerStats { // Add export keyword
    id: number;
    playerId: number; // Changed from player_id
    gamesPlayed: number; // Changed from games_played
    goalsScored: number; // Changed from goals_scored
    assists: number;
    yellowCards: number; // Changed from yellow_cards
    redCards: number; // Changed from red_cards
    minutesPlayed: number; // Changed from minutes_played
    createdAt: Date; // Changed from created_at
    updatedAt: Date; // Changed from updated_at
}

// Performance Notes - UPDATED TO CAMELCASE
export interface PerformanceNote { // Add export keyword
    id: number;
    playerId: number; // Changed from player_id
    coachId?: number; // Changed from coach_id
    date: Date; // This is the type for the actual DB model/fetched data
    note: string;
    createdAt: Date; // Changed from created_at
    updatedAt: Date; // Changed from updated_at
}

// --- Seed Data Interfaces (to match the structure of the initialSeedData object literals) ---
// These are specifically for the api/admin/reset-db.ts file.
// They use snake_case for database column names and include 'id' where the seed data provides explicit IDs.

export interface UserSeed { // Add export keyword
    username: string;
    email: string;
    password?: string;
    role: UserRole;
    status: UserStatus;
    // Seed data doesn't include created_at/updated_at initially for users
}

export interface PlayerSeed { // Add export keyword
    userId: number;
    firstName: string;
    lastName: string;
    position?: string;
    dateOfBirth?: string; // Allow string for date in seed data
    height?: number;
    weight?: number;
    sports?: string[]; // Assuming this is an array of game names in seed data
    // Seed data doesn't include id, createdAt, updatedAt, stats, attendance, lastAttendance, batch
}

export interface CoachSeed { // Add export keyword
    userId: number;
    firstName: string;
    lastName: string;
    specialization?: string;
    experience?: number;
    // Seed data doesn't include id, createdAt, updatedAt
}

export interface GameSeed { // Add export keyword
    name: string;
    // Seed data doesn't include id, createdAt, updatedAt
}

export interface BatchSeed { // Add export keyword
    id: number; // Seed data includes mock IDs for batches
    gameId: number;
    name: string;
    schedule?: string;
    coachId?: number;
    // Seed data doesn't include createdAt, updatedAt
}

export interface TrainingSessionSeed { // Add export keyword
    id: number; // Seed data includes mock IDs for training sessions
    batchId: number;
    title?: string;
    description?: string;
    date: string; // Allow string for date in seed data
    duration: number;
    location?: string;
    // Seed data doesn't include createdAt, updatedAt
}

export interface AttendanceSeed { // Add export keyword
    session_id: number; // Use snake_case to match seed data object literals
    player_id: number; // Use snake_case to match seed data object literals
    status: AttendanceStatus;
    comments?: string;
    created_at?: string; // Allow string for date in seed data
    updated_at?: string; // Allow string for date in seed data
    // Seed data doesn't include id
}

export interface PaymentSeed { // Add export keyword
    id: number; // Seed data includes mock IDs for payments
    player_id: number; // Use snake_case to match seed data object literals
    date: string; // Allow string for date in seed data
    amount: number;
    description?: string;
    // Seed data doesn't include createdAt, updatedAt
}

export interface PerformanceNoteSeed { // Add export keyword
    id: number; // Seed data includes mock IDs for performance notes
    player_id: number; // Use snake_case to match seed data object literals
    coach_id?: number; // Use snake_case to match seed data object literals
    date: string; // Allow string for date in seed data
    note: string;
    created_at?: string; // Allow string for date in seed data
    updated_at?: string; // Allow string for date in seed data
}

export interface PlayerGameSeed { // Add export keyword
    player_id: number; // Use snake_case to match seed data object literals
    game_id: number; // Use snake_case to match seed data object literals
}


// Simulated database structure (Frontend simulation - not used with backend API)
// This interface is primarily for the frontend's lib/db.service.ts mock data
// and is not directly tied to the backend database type after the API migration.
export interface SimulatedDatabase { // Add export keyword
  users: User[];
  players: Player[];
  coaches: Coach[];
  player_stats: PlayerStats[]; // Use camelCase interface here
  training_sessions: TrainingSession[];
  attendance: Attendance[];
  batches: Batch[];
  payments: Payment[];
  games: Game[];
  // Use the actual PerformanceNote type here for consistency with frontend usage
  performance_notes: PerformanceNote[]; // Use camelCase interface here
}


// API response type
export interface ApiResponse<T> { // Add export keyword
  data?: T;
  error?: string;
  success: boolean;
}

