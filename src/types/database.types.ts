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
    sports?: string[];
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

// Performance Notes
export interface PerformanceNote { // Add export keyword
    id: number;
    player_id: number; // Use snake_case to match DB schema
    coach_id?: number; // Use snake_case to match DB schema
    date: Date; // This is the type for the actual DB model/fetched data
    note: string;
    created_at: Date; // Use snake_case to match DB schema
    updated_at: Date; // Use snake_case to match DB schema
}

// Define a separate type for seed data if it uses different formats (like string dates)
// This type should reflect the *structure of the data being seeded*, not the final DB type.
// The TS2739 error suggests the seed data structure in api/admin/reset-db.ts
// is missing created_at and updated_at, but the PerformanceNoteSeed type
// defined here *doesn't* include them due to Omit. Let's adjust the seed type
// to match the *actual* structure being used in the seed data if necessary,
// or adjust the seed data structure.
// Based on the error, the seed data objects look like: { player_id: number; date: string; note: string; coach_id: number; }
// The PerformanceNoteSeed type should match this if that's what's being assigned.
// However, the SQL seed data *does* include created_at and updated_at.
// Let's assume the seed data structure in api/admin/reset-db.ts *should* include
// created_at and updated_at (as strings or Dates) to match the DB schema.
// If the seed data structure in api/admin/reset-db.ts is correct as shown in the error,
// then the PerformanceNoteSeed type needs to *not* omit created_at/updated_at,
// which contradicts the purpose of a "seed" type that might not have these initially.
// Let's revert PerformanceNoteSeed to match the DB schema for now and see if the error changes.
// This seems more likely to align with the SQL seed data.

// Reverted PerformanceNoteSeed to match the DB schema structure for seeding
// (assuming the seed data in api/admin/reset-db.ts will provide these fields)
export interface PerformanceNoteSeed { // Add export keyword
    player_id: number;
    coach_id?: number;
    date: string; // Allow string for seeding purposes
    note: string;
    // Assuming seed data *will* provide these, even if the error message implies otherwise
    created_at?: string; // Allow string for seeding
    updated_at?: string; // Allow string for seeding
}


// API response type
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

