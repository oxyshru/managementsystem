// src/services/player.service.ts
import dbService from '@/lib/db.service'; // Corrected import path
import { Player, PlayerStats, ApiResponse, TrainingSession, Attendance, User } from '@/types/database.types';

class PlayerService {
  /**
   * Get player details by ID
   * @param id Player ID
   * @returns Promise with player data or error
   */
  async getPlayerById(id: number): Promise<ApiResponse<Player>> {
    return dbService.getById<Player>('players', id);
  }

  /**
   * Get player details by user ID
   * @param userId User ID
   * @returns Promise with player data or error
   */
  async getPlayerByUserId(userId: number): Promise<ApiResponse<Player>> {
    const result = await dbService.getMany<Player>('players', { userId });

    if (result.success && result.data && result.data.length > 0) {
      return {
        data: result.data[0],
        success: true
      };
    }

    return {
      error: 'Player not found',
      success: false
    };
  }

  /**
   * Create a new player profile
   * @param playerData Player data (excluding id, createdAt, updatedAt)
   * @returns Promise with player ID or error
   */
  async createPlayer(playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<ApiResponse<{ id: number; }>> {
    return dbService.insert<Player>('players', playerData);
  }

  /**
   * Update a player profile
   * @param id Player ID
   * @param playerData Player data to update
   * @returns Promise with success status or error
   */
  async updatePlayer(id: number, playerData: Partial<Player>): Promise<ApiResponse<{ affectedRows: number; }>> {
    return dbService.update<Player>('players', id, playerData);
  }

  /**
   * Get player statistics by player ID
   * @param playerId Player ID
   * @returns Promise with player stats or error
   */
  async getPlayerStats(playerId: number): Promise<ApiResponse<PlayerStats>> {
    const result = await dbService.getMany<PlayerStats>('player_stats', { playerId });

    if (result.success && result.data && result.data.length > 0) {
      return {
        data: result.data[0],
        success: true
      };
    }

    return {
      error: 'Player stats not found',
      success: false
    };
  }

  /**
   * Update player statistics
   * @param playerId Player ID
   * @param statsData Stats data to update
   * @returns Promise with success status or error
   */
  async updatePlayerStats(playerId: number, statsData: Partial<PlayerStats>): Promise<ApiResponse<{ affectedRows: number; }>> {
    const statsResult = await this.getPlayerStats(playerId);

    if (statsResult.success && statsResult.data) {
      // Update existing stats
      return dbService.update<PlayerStats>('player_stats', statsResult.data.id, statsData);
    } else {
      // Create new stats record
      return dbService.insert<PlayerStats>('player_stats', {
        playerId,
        gamesPlayed: statsData.gamesPlayed || 0,
        goalsScored: statsData.goalsScored || 0,
        assists: statsData.assists || 0,
        yellowCards: statsData.yellowCards || 0,
        redCards: statsData.redCards || 0,
        minutesPlayed: statsData.minutesPlayed || 0,
      } as Omit<PlayerStats, 'id' | 'createdAt' | 'updatedAt'>);
    }
  }

  /**
   * Get all players
   * @param limit Optional record limit
   * @param offset Optional offset for pagination
   * @returns Promise with players or error
   */
  async getAllPlayers(limit?: number, offset?: number): Promise<ApiResponse<Player[]>> {
    return dbService.getMany<Player>('players', undefined, limit, offset);
  }

  /**
   * Get training sessions for a player based on their associated batches/coaches.
   * NOTE: This requires more complex logic than simple table lookups in a real app.
   * For this simulation, we'll find sessions for coaches whose specialization matches the player's sports.
   * @param playerId Player ID
   * @returns Promise with training sessions or error
   */
  async getPlayerTrainingSessions(playerId: number): Promise<ApiResponse<TrainingSession[]>> {
       try {
           const playerResult = await this.getPlayerById(playerId);
           if (!playerResult.success || !playerResult.data || !playerResult.data.sports || playerResult.data.sports.length === 0) {
               return { data: [], success: true }; // Player not found or no sports
           }

           const playerSports = playerResult.data.sports;

           // Find coaches specializing in the player's sports
           const coachesResult = await dbService.getMany<Coach>('coaches');
           if (!coachesResult.success || !coachesResult.data) {
               return { data: [], success: true }; // No coaches found
           }

           const relevantCoachIds = coachesResult.data
               .filter(coach => playerSports.includes(coach.specialization))
               .map(coach => coach.id);

           if (relevantCoachIds.length === 0) {
               return { data: [], success: true }; // No relevant coaches found
           }

           // Get all training sessions and filter by relevant coach IDs
           const sessionsResult = await dbService.getMany<TrainingSession>('training_sessions');
           if (!sessionsResult.success || !sessionsResult.data) {
               return { data: [], success: true }; // No sessions found
           }

           const filteredSessions = sessionsResult.data.filter(session => relevantCoachIds.includes(session.coachId));

           return {
               data: filteredSessions,
               success: true
           };

       } catch (error) {
           console.error('Simulated get player training sessions error:', error);
           return {
               error: error instanceof Error ? error.message : 'Simulated failed to get player training sessions',
               success: false
           };
       }
  }

  /**
   * Get attendance records for a player.
   * @param playerId Player ID
   * @returns Promise with attendance records or error
   */
  async getPlayerAttendance(playerId: number): Promise<ApiResponse<Attendance[]>> {
      return dbService.getMany<Attendance>('attendance', { playerId });
  }
}

// Export a singleton instance
const playerService = new PlayerService();
export default playerService;
