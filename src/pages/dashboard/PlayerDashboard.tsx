// src/pages/dashboard/PlayerDashboard.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Removed Dialog, Input, Textarea imports as they are not needed for Player Quick Actions
// import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";


import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import playerService from "@/services/player.service";
import authService from "@/services/auth.service";
// Removed Attendance import as it's not used in state or logic
import { Player, PlayerStats, TrainingSession, User, Coach } from '@/types/database.types'; // Import Coach type
import coachService from "@/services/coach.service"; // Import coachService to get coach names

const PlayerDashboard = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [playerProfile, setPlayerProfile] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<TrainingSession[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]); // Mock payments
  const [performanceNotes, setPerformanceNotes] = useState<any[]>([]); // Mock notes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCoaches, setAllCoaches] = useState<Coach[]>([]); // State to store all coaches

  // State for the calendar
  const [date, setDate] = useState<Date | undefined>(new Date());


  useEffect(() => {
    const loadPlayerData = async () => {
      setLoading(true);
      setError(null);
      const currentUserResult = await authService.getCurrentUser();

      if (!currentUserResult.success || !currentUserResult.data) {
        setError(currentUserResult.error || "Failed to load user data.");
        setLoading(false);
        return;
      }

      setUser(currentUserResult.data);

      const playerProfileResult = await playerService.getPlayerByUserId(currentUserResult.data.id);

      if (!playerProfileResult.success || !playerProfileResult.data) {
        setError(playerProfileResult.error || "Failed to load player profile.");
        setLoading(false);
        return;
      }

      setPlayerProfile(playerProfileResult.data);

      // Fetch all coaches
      const coachesResult = await coachService.getAllCoaches();
      if (coachesResult.success && coachesResult.data) {
          setAllCoaches(coachesResult.data);
      } else {
          console.error("Failed to load coaches:", coachesResult.error);
          // Continue loading dashboard even if coaches fail, but maybe show an alert
      }


      // Fetch related data using the player's profile ID
      const playerStatsResult = await playerService.getPlayerStats(playerProfileResult.data.id);
      if (playerStatsResult.success && playerStatsResult.data) {
        setPlayerStats(playerStatsResult.data);
      } else {
         // Initialize default stats if none found (adjust ID generation if needed)
         setPlayerStats({
            id: 0, // Mock ID - In a real app, this might be generated or handled differently
            playerId: playerProfileResult.data.id,
            gamesPlayed: 0,
            goalsScored: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            minutesPlayed: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
         });
      }


      const sessionsResult = await playerService.getPlayerTrainingSessions(playerProfileResult.data.id);
      if (sessionsResult.success && sessionsResult.data) {
          // For simulation, let's filter sessions by coach specialization if player has sports
          // We now have allCoaches available in state, use that instead of refetching
          let filteredSessions = sessionsResult.data;

          // Only filter if coaches were successfully loaded AND player has sports listed
          if (coachesResult.success && coachesResult.data && playerProfileResult.data.sports && playerProfileResult.data.sports.length > 0) {
               const relevantCoachIds = coachesResult.data
                   .filter(coach => playerProfileResult.data.sports?.includes(coach.specialization))
                   .map(coach => coach.id);

               // Filter sessions to include only those coached by relevant coaches
               filteredSessions = sessionsResult.data.filter(session => relevantCoachIds.includes(session.coachId));
          }


         // Augment sessions with coach names for display
         const sessionsWithCoachNames = filteredSessions.map(session => {
             const coach = allCoaches.find(c => c.id === session.coachId);
             return {
                 ...session,
                 coachName: coach ? `${coach.firstName} ${coach.lastName}` : 'Unknown Coach'
             };
         });
        setUpcomingSessions(sessionsWithCoachNames);
      }


      // Mock recent payments - replace with actual fetching if implemented in dbService
      setRecentPayments([
          { id: 1, date: "Jun 15, 2023", amount: "₹150", plan: "Badminton Monthly" }, // Updated currency symbol
          { id: 2, date: "May 15, 2023", amount: "₹150", plan: "Badminton Monthly" }, // Updated currency symbol
          { id: 3, date: "Apr 15, 2023", amount: "₹150", plan: "Badminton Monthly" }, // Updated currency symbol
      ]);

      // Mock performance notes - replace with actual fetching if implemented in dbService
      const mockNotes = [
           // Note: In a real app, these would be fetched based on player ID
           // These mock notes are just examples, filtered below
           { id: 1, playerId: 1, date: '2025-05-10', note: 'Significant improvement in backhand technique', coachId: 1 }, // Example note for player 1
           { id: 2, playerId: playerProfileResult.data.id, date: '2025-05-12', note: 'Good stamina during drills', coachId: 1 }, // Example note for the current player
           { id: 3, playerId: 5, date: '2025-05-11', note: 'Needs to work on court positioning', coachId: 1 }, // Example note for player 5
           { id: 4, playerId: playerProfileResult.data.id, date: '2025-05-18', note: 'Strong performance in freestyle', coachId: 2 }, // Another example note for the current player
           { id: 5, playerId: 4, date: '2025-05-18', note: 'Improving dive technique', coachId: 2 }, // Example note for player 4
       ];
       // Filter mock notes by the current player's ID and augment with coach name
       const playerNotes = mockNotes.filter(note => note.playerId === playerProfileResult.data.id).map(note => {
           const coach = allCoaches.find(c => c.id === note.coachId);
           return {
               ...note,
               coachName: coach ? `${coach.firstName} ${coach.lastName}` : 'Unknown Coach'
           };
       });
       // Corrected setter call
       setPerformanceNotes(playerNotes);


      setLoading(false);
    };

    loadPlayerData();
  }, [allCoaches]); // Added allCoaches to dependency array so session/note augmentation re-runs if coaches load later


  const handleNotificationClick = () => {
    toast({
      title: "Fee reminder (Mock)",
      description: "Your next payment of ₹150 is due on July 15, 2023" // Updated currency symbol
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Player Dashboard...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  if (!user || !playerProfile) {
       // This case should ideally be caught by the error handling above,
       // but kept as a fallback.
       return <div className="min-h-screen flex items-center justify-center text-red-600">User or Player profile not found.</div>;
  }


  return (
    <div className="min-h-screen bg-gray-50" data-id="i8zm34qhm" data-path="src/pages/dashboard/PlayerDashboard.tsx">
      <header className="bg-white shadow" data-id="1z6p3x2f3" data-path="src/pages/dashboard/PlayerDashboard.tsx">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center" data-id="j6fctlfea" data-path="src/pages/dashboard/PlayerDashboard.tsx">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-id="j62t48ihh" data-path="src/pages/dashboard/PlayerDashboard.tsx">
            Sports Campus
          </h1>
          <div className="flex items-center space-x-4" data-id="trkiic2dr" data-path="src/pages/dashboard/PlayerDashboard.tsx">
            <Button variant="ghost" size="icon" onClick={handleNotificationClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" data-id="9goymc3u8" data-path="src/pages/dashboard/PlayerDashboard.tsx">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" data-id="a8fh42s5r" data-path="src/pages/dashboard/PlayerDashboard.tsx"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" data-id="g40zxr512" data-path="src/pages/dashboard/PlayerDashboard.tsx"></path>
              </svg>
            </Button>
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${playerProfile.firstName}-${playerProfile.lastName}`} />
              <AvatarFallback>{playerProfile.firstName[0]}{playerProfile.lastName[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8" data-id="i8dgvl7x4" data-path="src/pages/dashboard/PlayerDashboard.tsx">
        <div className="mb-8" data-id="emd0w2h98" data-path="src/pages/dashboard/PlayerDashboard.tsx">
          <h2 className="text-2xl font-bold mb-2" data-id="f6swyj9r2" data-path="src/pages/dashboard/PlayerDashboard.tsx">Welcome, {playerProfile.firstName} {playerProfile.lastName}!</h2>
          <p className="text-gray-600" data-id="vecef7y0b" data-path="src/pages/dashboard/PlayerDashboard.tsx">Here's an overview of your sports activities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-id="292p3viyd" data-path="src/pages/dashboard/PlayerDashboard.tsx">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>My Sports (Sim)</CardTitle>
              <CardDescription>Currently enrolled sports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2" data-id="4ktasu04x" data-path="src/pages/dashboard/PlayerDashboard.tsx">
                {/* Mock sports based on coach specialization in the simulated DB */}
                {playerProfile.sports && playerProfile.sports.length > 0 ? (
                    playerProfile.sports.map((sport, index) => {
                        // Find the coach for this sport from the fetched coaches state
                        const coach = allCoaches.find(c => c.specialization === sport);
                        const coachName = coach ? `${coach.firstName} ${coach.lastName}` : 'Coach TBD';
                        return (
                            <div key={index} className="flex items-center justify-between">
                                <span data-id="8431efn4f" data-path="src/pages/dashboard/PlayerDashboard.tsx">{sport}</span>
                                <Badge>{coachName}</Badge> {/* Render the resolved coach name */}
                            </div>
                        );
                    })
                ) : (
                     <p className="text-sm text-gray-500">No sports enrolled yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Attendance (Sim)</CardTitle>
              <CardDescription>Your participation rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Use simulated attendance from playerProfile */}
              <Progress value={playerProfile.attendance || 0} className="h-2" />
              <p className="text-sm text-gray-600" data-id="pk6a7o8j6" data-path="src/pages/dashboard/PlayerDashboard.tsx">
                You've attended {playerProfile.attendance || 0}% of your sessions (simulated)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Fee Status (Mock)</CardTitle>
              <CardDescription>Payment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Mock Fee Status - replace with actual fetching if implemented */}
              <div className="flex justify-between" data-id="mmbjr0xxm" data-path="src/pages/dashboard/PlayerDashboard.tsx">
                <span className="text-sm text-gray-600" data-id="v1kscono3" data-path="src/pages/dashboard/PlayerDashboard.tsx">Status:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Paid {/* Mock status */}
                </Badge>
              </div>
              <div className="flex justify-between" data-id="wus6mh3l4" data-path="src/pages/dashboard/PlayerDashboard.tsx">
                <span className="text-sm text-gray-600" data-id="ts7fgdace" data-path="src/pages/dashboard/PlayerDashboard.tsx">Next Due:</span>
                <span data-id="0f3db1sqf" data-path="src/pages/dashboard/PlayerDashboard.tsx">Jul 15, 2025</span> {/* Mock date */}
              </div>
              <div className="flex justify-between" data-id="wpegopuwd" data-path="src/pages/dashboard/PlayerDashboard.tsx">
                <span className="text-sm text-gray-600" data-id="cuh1cjysl" data-path="src/pages/dashboard/PlayerDashboard.tsx">Total Paid:</span>
                <span data-id="zig4t0fa1" data-path="src/pages/dashboard/PlayerDashboard.tsx">₹450</span> {/* Updated currency symbol */}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-id="xaon7k2ua" data-path="src/pages/dashboard/PlayerDashboard.tsx">
          <div className="lg:col-span-2" data-id="j6vhl8psw" data-path="src/pages/dashboard/PlayerDashboard.tsx">
            <Tabs defaultValue="schedule">
              <TabsList className="mb-4">
                <TabsTrigger value="schedule">Schedule (Sim)</TabsTrigger>
                <TabsTrigger value="payments">Payments (Mock)</TabsTrigger>
                <TabsTrigger value="performance">Performance (Sim)</TabsTrigger>
              </TabsList>

              <TabsContent value="schedule">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Sessions (Sim)</CardTitle>
                    <CardDescription>Your training schedule</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingSessions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sport</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Coach</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upcomingSessions.map((session) =>
                            <TableRow key={session.id}>
                              <TableCell>{session.title}</TableCell> {/* Using title as sport for this sim */}
                              <TableCell>{new Date(session.date).toLocaleString()}</TableCell>
                              <TableCell>{(session as any).coachName}</TableCell> {/* Use augmented coachName */}
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                       <p className="text-center text-gray-500">No upcoming sessions found.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History (Mock)</CardTitle>
                    <CardDescription>Recent transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentPayments.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Plan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentPayments.map((payment) =>
                            <TableRow key={payment.id}>
                              <TableCell>{payment.date}</TableCell>
                              <TableCell>{payment.amount}</TableCell> {/* Amount string includes currency */}
                              <TableCell>{payment.plan}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                       <p className="text-center text-gray-500">No payment history found.</p>
                    )}
                    <div className="mt-4 flex justify-end" data-id="fsfd3o40m" data-path="src/pages/dashboard/PlayerDashboard.tsx">
                      <Button variant="outline" size="sm">
                        View all transactions (Mock)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Notes (Sim)</CardTitle>
                    <CardDescription>Feedback from your coaches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4" data-id="se6qzz9tc" data-path="src/pages/dashboard/PlayerDashboard.tsx">
                      {performanceNotes.length > 0 ? (
                        performanceNotes.map((note) =>
                          <div key={note.id} className="border-b pb-4 last:border-0" data-id="oui8qdxzp" data-path="src/components/ui/card.tsx">
                              <div className="flex justify-between mb-1" data-id="m6jz8z3sy" data-path="src/components/ui/card.tsx">
                                <span className="font-medium" data-id="z9rtfj6o8" data-path="src/components/ui/card.tsx">{note.date}</span>
                                <span className="text-sm text-gray-600" data-id="fq1bljxaq" data-path="src/components/ui/card.tsx">{note.coachName}</span>
                              </div>
                              <p className="text-gray-800" data-id="hryw1memi" data-path="src/components/ui/card.tsx">{note.note}</p>
                            </div>
                        )
                      ) : (
                         <p className="text-center text-gray-500">No performance notes available.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div data-id="5a0ruxxuc" data-path="src/pages/dashboard/PlayerDashboard.tsx">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Your schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date} // Use the state variable
                  onSelect={setDate} // Use the state setter
                  className="rounded-md border" />

              </CardContent>
            </Card>

            {/* Removed the Coach-specific "Quick Actions" card */}
            {/*
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions (Sim)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 ... (Dialogs for View Player Details, Schedule Change Request) ...
              </CardContent>
            </Card>
            */}

             {/* Optional: Add Player-specific quick actions here if needed */}
             <Card className="mt-6">
                <CardHeader>
                   <CardTitle>Quick Actions (Sim)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <Button variant="outline" className="w-full justify-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m10.5 19.5-4-4-1.5 1.5"></path><path d="M8 17h.01"></path></svg>
                      View My Stats Details (Sim)
                   </Button>
                   <Button variant="outline" className="w-full justify-start">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M17 3a2.85 2.85 0 0 0-4 0L7 9l4 4L17 9l4-4a2.85 2.85 0 0 0-4 0Z"></path><path d="m7 9-3 3v5a2 2 0 0 0 2 2h4l5-5L7 9Z"></path></svg>
                       Update Profile (Sim)
                   </Button>
                    <Button variant="outline" className="w-full justify-start">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M22 16.92v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3"></path><path d="m6 11 6 6 6-6"></path><path d="M12 17V3"></path></svg>
                       Download Attendance Report (Sim)
                   </Button>
                </CardContent>
             </Card>


          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-8 bg-white" data-id="th977ap0i" data-path="src/pages/dashboard/CoachDashboard.tsx">
        <div className="container mx-auto px-4 text-center text-gray-500" data-id="zbgyjqbvb" data-path="src/pages/dashboard/CoachDashboard.tsx">
          <p data-id="0pwfp3uup" data-path="src/pages/dashboard/CoachDashboard.tsx">© {new Date().getFullYear()} Sports Campus Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>);

};

// Corrected export statement
export default PlayerDashboard;
