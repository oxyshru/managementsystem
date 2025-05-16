// src/types/database.types.ts
// Database model interfaces

// ... other interfaces

// Performance Notes
export interface PerformanceNote { // Add export keyword
    id: number;
    player_id: number; // Use snake_case to match DB schema
    coach_id?: number; // Use snake_case to match DB schema
    date: Date;
    note: string;
    created_at: Date; // Use snake_case to match DB schema
    updated_at: Date; // Use snake_case to match DB schema
}

// ... other interfaces and the SimulatedDatabase interface

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
  performance_notes: PerformanceNote[]; // Add PerformanceNote here too
}


// API response type
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
