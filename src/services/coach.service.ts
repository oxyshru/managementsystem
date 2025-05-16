// src/services/coach.service.ts
import dbService from '@/lib/db.service'; // Corrected import path
import { Coach, TrainingSession, Attendance, ApiResponse, Player, User } from '@/types/database.types';

class CoachService {
  /**
   * Get coach details by ID
   * @param id Coach ID
   * @returns Promise with coach data or error
   */
  async getCoachById(id: number): Promise<ApiResponse<Coach>> {
    return dbService.getById<Coach>('coaches', id);
  }

  /**
   * Get coach details by user ID
   * @param userId User ID
   * @returns Promise with coach data or error
   */
  async getCoachByUserId(userId: number): Promise<ApiResponse<Coach>> {
    const result = await dbService.getMany<Coach>('coaches', { userId });

    if (result.success && result.data && result.data.length > 0) {
      return {
        data: result.data[0],
        success: true
      };
    }

    return {
      error: 'Coach not found',
      success: false
    };
  }

  /**
   * Create a new coach profile
   * @param coachData Coach data (excluding id, createdAt, updatedAt)
   * @returns Promise with coach ID or error
   */
  async createCoach(coachData: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<{ id: number; }>> {
    return dbService.insert<Coach>('coaches', coachData);
  }

  /**
   * Update a coach profile
   * @param id Coach ID
   * @param coachData Coach data to update
   * @returns Promise with success status or error
   */
  async updateCoach(id: number, coachData: Partial<Coach>): Promise<ApiResponse<{ affectedRows: number; }>> {
    return dbService.update<Coach>('coaches', id, coachData);
  }

  /**
   * Get all coaches
   * @param limit Optional record limit
   * @param offset Optional offset for pagination
   * @returns Promise with coaches or error
   */
  async getAllCoaches(limit?: number, offset?: number): Promise<ApiResponse<Coach[]>> {
    return dbService.getMany<Coach>('coaches', undefined, limit, offset);
  }

  /**
   * Create a new training session
   * @param sessionData Training session data (excluding id, createdAt, updatedAt)
   * @returns Promise with session ID or error
   */
  async createTrainingSession(sessionData: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<{ id: number; }>> {
    return dbService.insert<TrainingSession>('training_sessions', sessionData);
  }

  /**
   * Get training sessions by coach ID
   * @param coachId Coach ID
   * @param limit Optional record limit
   * @param offset Optional offset for pagination
   * @returns Promise with training sessions or error
   */
  async getTrainingSessionsByCoach(coachId: number, limit?: number, offset?: number): Promise<ApiResponse<TrainingSession[]>> {
    return dbService.getMany<TrainingSession>('training_sessions', { coachId }, limit, offset);
  }

  /**
   * Update a training session
   * @param id Session ID
   * @param sessionData Session data to update
   * @returns Promise with success status or error
   */
  async updateTrainingSession(id: number, sessionData: Partial<TrainingSession>): Promise<ApiResponse<{ affectedRows: number; }>> {
    return dbService.update<TrainingSession>('training_sessions', id, sessionData);
  }

  /**
   * Delete a training session
   * @param id Session ID
   * @returns Promise with success status or error
   */
  async deleteTrainingSession(id: number): Promise<ApiResponse<{ affectedRows: number; }>> {
    return dbService.delete('training_sessions', id);
  }

  /**
   * Record attendance for a training session
   * @param attendanceData Attendance data (excluding id, createdAt, updatedAt)
   * @returns Promise with attendance ID or error
   */
  async recordAttendance(attendanceData: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<{ id: number; }>> {
    // In a real app, you'd check if attendance already exists for this session/player
    // For simplicity, this simulation just adds a new record.
    return dbService.insert<Attendance>('attendance', attendanceData);
  }

  /**
   * Get attendance for a training session
   * @param sessionId Session ID
   * @returns Promise with attendance records or error
   */
  async getSessionAttendance(sessionId: number): Promise<ApiResponse<Attendance[]>> {
    return dbService.getMany<Attendance>('attendance', { sessionId });
  }

  /**
   * Get players assigned to this coach's sessions.
   * NOTE: This is a simplification. In a real app, players are assigned to batches/teams, which link to sessions.
   * For this simulation, we'll find players who have attendance records for this coach's sessions.
   * @param coachId Coach ID
   * @returns Promise with player data or error
   */
  async getPlayersForCoach(coachId: number): Promise<ApiResponse<Player[]>> {
      try {
          const sessionsResult = await this.getTrainingSessionsByCoach(coachId);
          if (!sessionsResult.success || !sessionsResult.data) {
              return { data: [], success: true }; // No sessions, no players
          }

          const sessionIds = sessionsResult.data.map(session => session.id);

          // Get attendance records for these sessions
          const attendanceResult = await dbService.getMany<Attendance>('attendance'); // Get all attendance

          if (!attendanceResult.success || !attendanceResult.data) {
              return { data: [], success: true }; // No attendance records
          }

          // Filter attendance by session IDs relevant to this coach
          const relevantAttendance = attendanceResult.data.filter(att => sessionIds.includes(att.sessionId));

          // Get unique player IDs from relevant attendance
          const playerIds = Array.from(new Set(relevantAttendance.map(att => att.playerId)));

          if (playerIds.length === 0) {
              return { data: [], success: true }; // No players attended sessions
          }

          // Fetch player details for these IDs
          const allPlayersResult = await dbService.getMany<Player>('players'); // Get all players

          if (!allPlayersResult.success || !allPlayersResult.data) {
              return { error: allPlayersResult.error || 'Failed to fetch players', success: false };
          }

          const players = allPlayersResult.data.filter(player => playerIds.includes(player.id));

          // Augment player data with mock attendance percentage and last attendance status for the coach's sessions
          const playersWithStats = players.map(player => {
              const playerAttendance = relevantAttendance.filter(att => att.playerId === player.id);
              const totalSessions = sessionIds.length; // Simplified: assuming player could attend all coach's sessions
              const attendedSessions = playerAttendance.filter(att => att.status === 'present').length;
              const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

              // Find the most recent attendance status for this player in this coach's sessions
              const lastAttendanceRecord = relevantAttendance
                  .filter(att => att.playerId === player.id)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

              const lastAttendanceStatus = lastAttendanceRecord ?
                  (lastAttendanceRecord.status === 'present' ? 'Present' : 'Absent') :
                  'N/A'; // Or 'No Record'

              return {
                  ...player,
                  attendance: attendancePercentage,
                  lastAttendance: lastAttendanceStatus,
                  // Add mock batch info - again, simplified
                  batch: sessionsResult.data.find(session => session.coachId === coachId)?.title || 'Unknown Batch'
              };
          });


          return {
              data: playersWithStats as Player[], // Cast back to Player[] after augmenting
              success: true
          };

      } catch (error) {
          console.error('Simulated get players for coach error:', error);
          return {
              error: error instanceof Error ? error.message : 'Simulated failed to get players for coach',
              success: false
          };
      }
  }

   /**
   * Get performance notes for players under this coach.
   * NOTE: This is a simplification. Performance notes would typically be linked to players and sessions.
   * For this simulation, we'll just return all notes and filter them by coach ID.
   * @param coachId Coach ID
   * @returns Promise with performance notes or error
   */
   async getPerformanceNotesForCoach(coachId: number): Promise<ApiResponse<any[]>> {
       // In a real app, performance notes would have a coachId field or be linked via sessions.
       // For this simulation, let's just create mock notes and filter.
       const mockNotes = [
           { id: 1, playerId: 1, date: '2025-05-10', note: 'Significant improvement in backhand technique', coachId: 1, coachName: 'Alex Johnson' },
           { id: 2, playerId: 2, date: '2025-05-12', note: 'Good stamina during drills', coachId: 1, coachName: 'Alex Johnson' },
           { id: 3, playerId: 5, date: '2025-05-11', note: 'Needs to work on court positioning', coachId: 1, coachName: 'Alex Johnson' },
           { id: 4, playerId: 3, date: '2025-05-18', note: 'Strong performance in freestyle', coachId: 2, coachName: 'Sarah Williams' },
           { id: 5, playerId: 4, date: '2025-05-18', note: 'Improving dive technique', coachId: 2, coachName: 'Sarah Williams' },
       ];
       const notes = mockNotes.filter(note => note.coachId === coachId);
       return { data: notes, success: true };
   }
}

// Export a singleton instance
const coachService = new CoachService();
export default coachService;
