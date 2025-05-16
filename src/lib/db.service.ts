// src/lib/db.service.ts
import { dbConfig } from '@/lib/db.config'; // Corrected import path
import { ApiResponse, User, Player, Coach, PlayerStats, TrainingSession, Attendance, Batch, Payment } from '@/types/database.types'; // Import new types

// Define the structure of our simulated database in localStorage
interface SimulatedDatabase {
  users: User[];
  players: Player[];
  coaches: Coach[];
  player_stats: PlayerStats[];
  training_sessions: TrainingSession[];
  attendance: Attendance[];
  batches: Batch[]; // Added batches table
  payments: Payment[]; // Added payments table
}

const LOCAL_STORAGE_DB_KEY = 'sports_management_db';

// Initialize or load the simulated database
function loadDatabase(): SimulatedDatabase {
  const data = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
  if (data) {
    try {
      // Parse dates correctly
      const parsedData: SimulatedDatabase = JSON.parse(data);
      parsedData.users = parsedData.users.map(user => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      }));
      parsedData.players = parsedData.players.map(player => ({
        ...player,
        dateOfBirth: player.dateOfBirth ? new Date(player.dateOfBirth) : undefined,
        createdAt: new Date(player.createdAt),
        updatedAt: new Date(player.updatedAt),
      }));
      parsedData.coaches = parsedData.coaches.map(coach => ({
        ...coach,
        createdAt: new Date(coach.createdAt),
        updatedAt: new Date(coach.updatedAt),
      }));
      parsedData.player_stats = parsedData.player_stats.map(stats => ({
        ...stats,
        createdAt: new Date(stats.createdAt),
        updatedAt: new Date(stats.updatedAt),
      }));
      parsedData.training_sessions = parsedData.training_sessions.map(session => ({
        ...session,
        date: new Date(session.date),
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      }));
      parsedData.attendance = parsedData.attendance.map(att => ({
        ...att,
        createdAt: new Date(att.createdAt),
        updatedAt: new Date(att.updatedAt),
      }));
      // Parse dates for new tables
      parsedData.batches = parsedData.batches.map(batch => ({
        ...batch,
        createdAt: new Date(batch.createdAt),
        updatedAt: new Date(batch.updatedAt),
      }));
      parsedData.payments = parsedData.payments.map(payment => ({
        ...payment,
        date: new Date(payment.date),
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
      }));

      return parsedData;
    } catch (e) {
      console.error("Failed to parse database from localStorage, initializing new.", e);
      return initializeDatabase();
    }
  }
  return initializeDatabase();
}

// Create initial mock data
function initializeDatabase(): SimulatedDatabase {
  const now = new Date();
  const db: SimulatedDatabase = {
    users: [
      { id: 1, username: 'admin', email: 'admin@example.com', password: 'password123', role: 'admin', createdAt: now, updatedAt: now, status: 'active' }, // Added status
      { id: 2, username: 'coach1', email: 'coach@example.com', password: 'password123', role: 'coach', createdAt: now, updatedAt: now, status: 'active' }, // Added status
      { id: 3, username: 'player1', email: 'player@example.com', password: 'password123', role: 'player', createdAt: now, updatedAt: now, status: 'active' }, // Added status
      { id: 4, username: 'player2', email: 'player2@example.com', password: 'password123', role: 'player', createdAt: new Date(now.getTime() - 86400000 * 10), updatedAt: new Date(now.getTime() - 86400000 * 10), status: 'active' }, // Added status and older date for chart demo
      { id: 5, username: 'player3', email: 'player3@example.com', password: 'password123', role: 'player', createdAt: new Date(now.getTime() - 86400000 * 5), updatedAt: new Date(now.getTime() - 86400000 * 5), status: 'active' }, // Added status and older date
      { id: 6, username: 'coach2', email: 'coach2@example.com', password: 'password123', role: 'coach', createdAt: new Date(now.getTime() - 86400000 * 15), updatedAt: new Date(now.getTime() - 86400000 * 15), status: 'active' }, // Added status and older date
    ],
    players: [
      { id: 1, userId: 3, firstName: 'John', lastName: 'Smith', position: 'Forward', dateOfBirth: new Date('2002-05-15'), height: 180.5, weight: 75.2, createdAt: now, updatedAt: now, sports: ['Badminton'], attendance: 85, lastAttendance: 'Present', batch: 'Morning Batch' }, // Added mock data for dashboard
      { id: 2, userId: 4, firstName: 'Emily', lastName: 'Johnson', position: 'Midfielder', dateOfBirth: new Date('2003-11-20'), height: 165.0, weight: 58.0, createdAt: new Date(now.getTime() - 86400000 * 10), updatedAt: new Date(now.getTime() - 86400000 * 10), sports: ['Badminton'], attendance: 92, lastAttendance: 'Present', batch: 'Morning Batch' }, // Added mock data for dashboard
      { id: 3, userId: 5, firstName: 'Michael', lastName: 'Brown', position: 'Defender', dateOfBirth: new Date('2000-01-30'), height: 190.0, weight: 85.5, createdAt: new Date(now.getTime() - 86400000 * 5), updatedAt: new Date(now.getTime() - 86400000 * 5), sports: ['Swimming'], attendance: 78, lastAttendance: 'Absent', batch: 'Evening Batch' }, // Added mock data for dashboard
      { id: 4, userId: 6, firstName: 'Sarah', lastName: 'Davis', position: 'Goalkeeper', dateOfBirth: new Date('2004-07-07'), height: 170.0, weight: 62.0, createdAt: now, updatedAt: now, sports: ['Swimming'], attendance: 90, lastAttendance: 'Present', batch: 'Evening Batch' }, // Added mock data for dashboard
      { id: 5, userId: 7, firstName: 'James', lastName: 'Wilson', position: 'Forward', dateOfBirth: new Date('2001-03-22'), height: 185.0, weight: 78.0, createdAt: now, updatedAt: now, sports: ['Badminton'], attendance: 75, lastAttendance: 'Present', batch: 'Morning Batch' }, // Added mock data for dashboard
      { id: 6, userId: 8, firstName: 'Jessica', lastName: 'Martinez', position: 'Midfielder', dateOfBirth: new Date('2003-09-10'), height: 168.0, weight: 60.0, createdAt: now, updatedAt: now, sports: ['Badminton'], attendance: 82, lastAttendance: 'Absent', batch: 'Morning Batch' }, // Added mock data for dashboard
    ],
    coaches: [
      { id: 1, userId: 2, firstName: 'Alex', lastName: 'Johnson', specialization: 'Badminton', experience: 5, createdAt: now, updatedAt: now },
      { id: 2, userId: 6, firstName: 'Sarah', lastName: 'Williams', specialization: 'Swimming', experience: 8, createdAt: new Date(now.getTime() - 86400000 * 15), updatedAt: new Date(now.getTime() - 86400000 * 15) },
    ],
    player_stats: [
      { id: 1, playerId: 1, gamesPlayed: 15, goalsScored: 7, assists: 4, yellowCards: 2, redCards: 0, minutesPlayed: 1250, createdAt: now, updatedAt: now },
      { id: 2, playerId: 2, gamesPlayed: 18, goalsScored: 2, assists: 9, yellowCards: 1, redCards: 0, minutesPlayed: 1500, createdAt: now, updatedAt: now },
      { id: 3, playerId: 3, gamesPlayed: 20, goalsScored: 0, assists: 1, yellowCards: 5, redCards: 1, minutesPlayed: 1800, createdAt: now, updatedAt: now },
      { id: 4, playerId: 4, gamesPlayed: 10, goalsScored: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 900, createdAt: now, updatedAt: now },
      { id: 5, playerId: 5, gamesPlayed: 12, goalsScored: 10, assists: 3, yellowCards: 0, redCards: 0, minutesPlayed: 1000, createdAt: now, updatedAt: now },
      { id: 6, playerId: 6, gamesPlayed: 16, goalsScored: 3, assists: 7, yellowCards: 0, redCards: 0, minutesPlayed: 1300, createdAt: now, updatedAt: now },
    ],
    training_sessions: [
      { id: 1, coachId: 1, title: 'Badminton Footwork', description: 'Drills focusing on court movement', date: new Date('2025-05-17T09:00:00'), duration: 90, location: 'Court 1', createdAt: now, updatedAt: now, batchId: 1 }, // Linked to batch
      { id: 2, coachId: 1, title: 'Badminton Serve Practice', description: 'Improving serve accuracy and power', date: new Date('2025-05-19T09:00:00'), duration: 60, location: 'Court 1', createdAt: now, updatedAt: now, batchId: 1 }, // Linked to batch
      { id: 3, coachId: 2, title: 'Swimming Technique', description: 'Freestyle stroke correction', date: new Date('2025-05-18T16:00:00'), duration: 90, location: 'Pool Lane 2', createdAt: now, updatedAt: now, batchId: 2 }, // Linked to batch
    ],
    batches: [ // Mock batches
        { id: 1, gameId: 'Badminton', name: 'Morning Batch', schedule: 'Mon, Wed, Fri 9:00 AM', coachId: 1, createdAt: now, updatedAt: now },
        { id: 2, gameId: 'Swimming', name: 'Evening Batch', schedule: 'Tue, Thu 4:00 PM', coachId: 2, createdAt: now, updatedAt: now },
    ],
    payments: [ // Mock payments
        { id: 1, playerId: 1, date: new Date('2025-04-15'), amount: 150, description: 'Monthly Fee', createdAt: new Date('2025-04-15'), updatedAt: new Date('2025-04-15') },
        { id: 2, playerId: 1, date: new Date('2025-05-15'), amount: 150, description: 'Monthly Fee', createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },
        { id: 3, playerId: 2, date: new Date('2025-05-20'), amount: 150, description: 'Monthly Fee', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },
        { id: 4, playerId: 3, date: new Date('2025-04-01'), amount: 200, description: 'Registration Fee', createdAt: new Date('2025-04-01'), updatedAt: new Date('2025-04-01') },
        { id: 5, playerId: 3, date: new Date('2025-05-01'), amount: 150, description: 'Monthly Fee', createdAt: new Date('2025-05-01'), updatedAt: new Date('2025-05-01') },
    ],
  };
  saveDatabase(db);
  return db;
}

// Save the simulated database to localStorage
function saveDatabase(db: SimulatedDatabase): void {
  localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(db));
}

let simulatedDb = loadDatabase();

/**
 * Database service to handle simulated database operations using localStorage
 */
class DbService {
  /**
   * Execute a simulated database query
   * @param table Table name
   * @param operation Operation type (get, insert, update, delete)
   * @param payload Data payload for the operation
   * @returns Promise with results or error
   */
  async executeOperation<T>(
    table: keyof SimulatedDatabase,
    operation: 'getById' | 'getMany' | 'insert' | 'update' | 'delete',
    payload?: any
  ): Promise<ApiResponse<T>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      let resultData: any = undefined;
      let success = true;
      let error: string | undefined = undefined;

      simulatedDb = loadDatabase(); // Load latest state from localStorage

      switch (operation) {
        case 'getById': {
          const id = payload as number;
          const records = simulatedDb[table] as { id: number }[];
          resultData = records.find(record => record.id === id);
          if (!resultData) {
            success = false;
            error = `${table.slice(0, -1)} with id ${id} not found`;
          }
          break;
        }
        case 'getMany': {
          const { conditions, limit, offset } = payload || {};
          let records = simulatedDb[table] as any[];

          // Apply conditions
          if (conditions) {
            records = records.filter(record => {
              for (const key in conditions) {
                if (record[key] !== conditions[key]) {
                  return false;
                }
              }
              return true;
            });
          }

          // Apply limit and offset
          if (offset !== undefined) {
            records = records.slice(offset);
          }
          if (limit !== undefined) {
            records = records.slice(0, limit);
          }

          resultData = records;
          break;
        }
        case 'insert': {
          const data = payload as Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
          const records = simulatedDb[table] as (Omit<T, 'id'> & { id: number })[];
          const newId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
          const now = new Date();
          const newRecord = { ...data, id: newId, createdAt: now, updatedAt: now } as any; // Add id and timestamps
          records.push(newRecord);
          resultData = { id: newId };
          break;
        }
        case 'update': {
          const { id, data } = payload as { id: number; data: Partial<T> };
          const records = simulatedDb[table] as { id: number }[];
          const index = records.findIndex(record => record.id === id);
          if (index !== -1) {
            const now = new Date();
            records[index] = { ...records[index], ...data, updatedAt: now }; // Update record and timestamp
            resultData = { affectedRows: 1 };
          } else {
            success = false;
            error = `${table.slice(0, -1)} with id ${id} not found`;
            resultData = { affectedRows: 0 };
          }
          break;
        }
        case 'delete': {
          const id = payload as number;
          const records = simulatedDb[table] as { id: number }[];
          const initialLength = records.length;
          simulatedDb[table] = records.filter(record => record.id !== id) as any;
          resultData = { affectedRows: initialLength - simulatedDb[table].length };
          if (resultData.affectedRows === 0) {
            success = false;
            error = `${table.slice(0, -1)} with id ${id} not found`;
          }
          break;
        }
      }

      saveDatabase(simulatedDb); // Save state to localStorage

      return {
        data: resultData as T,
        success: success,
        error: error
      };
    } catch (e) {
      console.error(`Simulated database operation failed for table ${table}, operation ${operation}:`, e);
      return {
        error: e instanceof Error ? e.message : 'Unknown simulated database error',
        success: false
      };
    }
  }

  /**
   * Get a single record from a table by ID
   * @param table Table name
   * @param id Record ID
   * @returns Promise with the record or error
   */
  async getById<T>(table: keyof SimulatedDatabase, id: number): Promise<ApiResponse<T>> {
    return this.executeOperation<T>(table, 'getById', id);
  }

  /**
   * Get multiple records from a table
   * @param table Table name
   * @param conditions Optional WHERE conditions
   * @param limit Optional record limit
   * @param offset Optional offset for pagination
   * @returns Promise with records or error
   */
  async getMany<T>(
    table: keyof SimulatedDatabase,
    conditions?: Record<string, any>,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<T[]>> {
    return this.executeOperation<T[]>(table, 'getMany', { conditions, limit, offset });
  }

  /**
   * Insert a new record
   * @param table Table name
   * @param data Record data
   * @returns Promise with the inserted record ID or error
   */
  async insert<T>(table: keyof SimulatedDatabase, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<{ id: number; }>> {
     // Need to cast to a type that allows adding id, createdAt, updatedAt
    return this.executeOperation<{ id: number }>(table, 'insert', data);
  }

  /**
   * Update an existing record
   * @param table Table name
   * @param id Record ID
   * @param data Record data to update
   * @returns Promise with success status or error
   */
  async update<T>(table: keyof SimulatedDatabase, id: number, data: Partial<T>): Promise<ApiResponse<{ affectedRows: number; }>> {
    return this.executeOperation<{ affectedRows: number }>(table, 'update', { id, data });
  }

  /**
   * Delete a record
   * @param table Table name
   * @param id Record ID
   * @returns Promise with success status or error
   */
  async delete(table: keyof SimulatedDatabase, id: number): Promise<ApiResponse<{ affectedRows: number; }>> {
    return this.executeOperation<{ affectedRows: number }>(table, 'delete', id);
  }

  /**
   * Test the database connection (simulated)
   * @returns Promise with connection status
   */
  async testConnection(): Promise<ApiResponse<{ connected: boolean; }>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Always simulate a successful connection for the frontend demo
    return {
      data: { connected: true },
      success: true
    };
  }

  // Helper to reset the simulated database (for testing/demo)
  async resetDatabase(): Promise<void> {
     await new Promise(resolve => setTimeout(resolve, 500));
     simulatedDb = initializeDatabase();
     console.log("Simulated database reset.");
  }
}

// Export a singleton instance
const dbService = new DbService();
export default dbService;
