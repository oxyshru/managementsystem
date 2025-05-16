// src/pages/dashboard/CoachDashboard.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import coachService from "@/services/coach.service";
import authService from "@/services/auth.service";
import playerService from "@/services/player.service"; // To get player names for notes
import { Coach, Player, TrainingSession, User } from "@/types/database.types";

const CoachDashboard = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [coachProfile, setCoachProfile] = useState<Coach | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedPlayerForNote, setSelectedPlayerForNote] = useState<string | null>(null);
  const [performanceNote, setPerformanceNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [coachPlayers, setCoachPlayers] = useState<Player[]>([]);
  const [coachSessions, setCoachSessions] = useState<TrainingSession[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]); // Simplified structure for demo
  const [performanceNotesList, setPerformanceNotesList] = useState<any[]>([]); // Simplified structure for demo

  useEffect(() => {
    const loadCoachData = async () => {
      setLoading(true);
      setError(null);
      const currentUserResult = await authService.getCurrentUser();

      if (!currentUserResult.success || !currentUserResult.data) {
        setError(currentUserResult.error || "Failed to load user data.");
        setLoading(false);
        return;
      }

      setUser(currentUserResult.data);

      const coachProfileResult = await coachService.getCoachByUserId(currentUserResult.data.id);

      if (!coachProfileResult.success || !coachProfileResult.data) {
        setError(coachProfileResult.error || "Failed to load coach profile.");
        setLoading(false);
        return;
      }

      setCoachProfile(coachProfileResult.data);

      // Fetch related data using the coach's profile ID
      const playersResult = await coachService.getPlayersForCoach(coachProfileResult.data.id);
      if (playersResult.success && playersResult.data) {
        setCoachPlayers(playersResult.data);
        // Initialize today's attendance mock data based on players
        setTodayAttendance(playersResult.data.map(player => ({
            id: player.id,
            name: `${player.firstName} ${player.lastName}`,
            checked: (player as any).lastAttendance === 'Present' // Mock based on last status
        })));
      }

      const sessionsResult = await coachService.getTrainingSessionsByCoach(coachProfileResult.data.id);
      if (sessionsResult.success && sessionsResult.data) {
        setCoachSessions(sessionsResult.data);
      }

      // Fetch performance notes for this coach
      const notesResult = await coachService.getPerformanceNotesForCoach(coachProfileResult.data.id);
      if (notesResult.success && notesResult.data) {
          // Augment notes with player names for display
          const notesWithPlayerNames = await Promise.all(notesResult.data.map(async note => {
              const playerResult = await playerService.getPlayerById(note.playerId);
              return {
                  ...note,
                  playerName: playerResult.success && playerResult.data ? `${playerResult.data.firstName} ${playerResult.data.lastName}` : 'Unknown Player'
              };
          }));
        setPerformanceNotesList(notesWithPlayerNames);
      }


      setLoading(false);
    };

    loadCoachData();
  }, []); // Empty dependency array means this runs once on mount

  const handleAttendanceChange = (playerId: number, checked: boolean) => {
    // Update local state for attendance
    setTodayAttendance(prevAttendance =>
        prevAttendance.map(att =>
            att.id === playerId ? { ...att, checked } : att
        )
    );

    // Simulate recording attendance (this would be more complex in a real app)
    // For demo, just show a toast
    const playerName = todayAttendance.find(p => p.id === playerId)?.name || 'Player';
    toast({
      title: "Attendance updated (Simulated)",
      description: `${playerName}'s attendance marked as ${checked ? 'present' : 'absent'}`
    });
  };

  const handleSaveAttendance = () => {
      // In a real app, you would collect the attendance data from state
      // and send it to the backend to update the 'attendance' table.
      // For this simulation, just show a toast.
      console.log("Simulated Save Attendance:", todayAttendance);
      toast({
          title: "Attendance Saved (Simulated)",
          description: "Today's attendance has been recorded."
      });
  };


  const handleAddNote = async () => {
    if (!selectedPlayerForNote || !performanceNote.trim()) {
      toast({
        title: "Error",
        description: "Please select a player and enter a note",
        variant: "destructive"
      });
      return;
    }

    // Find the selected player's ID
    const playerToAddNote = coachPlayers.find(p => `${p.firstName} ${p.lastName}` === selectedPlayerForNote);
    if (!playerToAddNote || !coachProfile) {
        toast({
            title: "Error",
            description: "Selected player or coach profile not found.",
            variant: "destructive"
        });
        return;
    }

    // Simulate adding a performance note
    // In a real app, this would insert into a 'performance_notes' table
    const newNote = {
        id: performanceNotesList.length + 1, // Mock ID
        playerId: playerToAddNote.id,
        date: new Date().toISOString().split('T')[0], // Current date
        note: performanceNote.trim(),
        coachId: coachProfile.id,
        coachName: `${coachProfile.firstName} ${coachProfile.lastName}`,
        playerName: selectedPlayerForNote
    };

    setPerformanceNotesList(prevNotes => [...prevNotes, newNote]);

    toast({
      title: "Note added (Simulated)",
      description: `Performance note added for ${selectedPlayerForNote}`
    });

    setPerformanceNote("");
    setSelectedPlayerForNote(null);
  };

  const handleNotificationClick = () => {
    toast({
      title: "New notification (Mock)",
      description: "Admin has modified your evening batch schedule"
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Coach Dashboard...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  if (!user || !coachProfile) {
       return <div className="min-h-screen flex items-center justify-center text-red-600">User or Coach profile not found.</div>;
  }


  return (
    <div className="min-h-screen bg-gray-50" data-id="clzntyw6x" data-path="src/pages/dashboard/CoachDashboard.tsx">
      <header className="bg-white shadow" data-id="q2bf40bwm" data-path="src/pages/dashboard/CoachDashboard.tsx">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center" data-id="d8ftz38tu" data-path="src/pages/dashboard/CoachDashboard.tsx">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-id="vogxv2cc0" data-path="src/pages/dashboard/CoachDashboard.tsx">
            Sports Campus
          </h1>
          <div className="flex items-center space-x-4" data-id="xiovpuick" data-path="src/pages/dashboard/CoachDashboard.tsx">
            <Button variant="ghost" size="icon" onClick={handleNotificationClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" data-id="flelhyjd2" data-path="src/pages/dashboard/CoachDashboard.tsx">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" data-id="ftsi2gmya" data-path="src/pages/dashboard/CoachDashboard.tsx"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" data-id="v8zqdtgo9" data-path="src/pages/dashboard/CoachDashboard.tsx"></path>
              </svg>
            </Button>
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${coachProfile.firstName}-${coachProfile.lastName}`} />
              <AvatarFallback>{coachProfile.firstName[0]}{coachProfile.lastName[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8" data-id="i8dgvl7x4" data-path="src/pages/dashboard/CoachDashboard.tsx">
        <div className="mb-8" data-id="fk5jfiyfq" data-path="src/pages/dashboard/CoachDashboard.tsx">
          <h2 className="text-2xl font-bold mb-2" data-id="je6ug0fio" data-path="src/pages/dashboard/CoachDashboard.tsx">Welcome, Coach {coachProfile.firstName} {coachProfile.lastName}!</h2>
          <p className="text-gray-600" data-id="id75deige" data-path="src/pages/dashboard/CoachDashboard.tsx">Manage your {coachProfile.specialization} training sessions and players</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-id="i4lvfzkoc" data-path="src/pages/dashboard/CoachDashboard.tsx">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>My Batches (Sim)</CardTitle>
              <CardDescription>Currently assigned batches</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mock batches - replace with actual fetching if implemented */}
              <div className="space-y-4" data-id="j9dnfulqm" data-path="src/pages/dashboard/CoachDashboard.tsx">
                {coachSessions.length > 0 ? (
                    coachSessions.map((session) =>
                    <div key={session.id} className="border p-3 rounded-md" data-id="wgo2v2hci" data-path="src/pages/dashboard/CoachDashboard.tsx">
                        <div className="font-medium" data-id="avt4qv48e" data-path="src/pages/dashboard/CoachDashboard.tsx">{session.title}</div>
                        <div className="text-sm text-gray-600" data-id="zl7zgrxwb" data-path="src/pages/dashboard/CoachDashboard.tsx">{new Date(session.date).toLocaleString()}</div>
                        <div className="flex justify-between items-center mt-2" data-id="t9oz37r3k" data-path="src/pages/dashboard/CoachDashboard.tsx">
                          <span className="text-sm" data-id="6ndm3vqek" data-path="src/pages/dashboard/CoachDashboard.tsx">{session.duration} minutes</span>
                          {/* Player count for this session would need another query */}
                           <Badge>{coachPlayers.length} players (sim)</Badge>
                        </div>
                      </div>
                    )
                ) : (
                    <p className="text-center text-gray-500">No sessions assigned yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Today's Schedule (Sim)</CardTitle>
              <CardDescription>Your upcoming sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2" data-id="v40x77aqi" data-path="src/pages/dashboard/CoachDashboard.tsx">
                 {/* Filter sessions for today */}
                 {coachSessions.filter(session => new Date(session.date).toDateString() === new Date().toDateString()).slice(0, 2).map((session) =>
                    <div key={session.id} className="border-b pb-2 last:border-0" data-id="kdi526ezh" data-path="src/pages/dashboard/CoachDashboard.tsx">
                        <div className="font-medium" data-id="dxzf78ckg" data-path="src/pages/dashboard/CoachDashboard.tsx">{session.title}</div>
                        <div className="text-sm text-gray-600" data-id="c10jvpega" data-path="src/pages/dashboard/CoachDashboard.tsx">{new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-sm" data-id="cjy5pp7i8" data-path="src/pages/dashboard/CoachDashboard.tsx">{coachPlayers.length} players (sim)</div>
                      </div>
                 )}
                 {coachSessions.filter(session => new Date(session.date).toDateString() === new Date().toDateString()).length === 0 && (
                     <p className="text-center text-gray-500">No sessions scheduled for today.</p>
                 )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Quick Stats (Sim)</CardTitle>
              <CardDescription>Player information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-id="aalrkt126" data-path="src/pages/dashboard/CoachDashboard.tsx">
                <div className="flex justify-between" data-id="2mz58c5b7" data-path="src/pages/dashboard/CoachDashboard.tsx">
                  <span data-id="amyjsnf53" data-path="src/pages/dashboard/CoachDashboard.tsx">Total Players (Sim):</span>
                  <span className="font-medium" data-id="karsqwz8y" data-path="src/pages/dashboard/CoachDashboard.tsx">{coachPlayers.length}</span>
                </div>
                <div className="flex justify-between" data-id="0kc8wn95u" data-path="src/pages/dashboard/CoachDashboard.tsx">
                  <span data-id="agmyikc96" data-path="src/pages/dashboard/CoachDashboard.tsx">Average Attendance (Sim):</span>
                  {/* Simplified average attendance */}
                  <span className="font-medium" data-id="n2vg3en3s" data-path="src/pages/dashboard/CoachDashboard.tsx">
                    {coachPlayers.length > 0 ? Math.round(coachPlayers.reduce((acc, player) => acc + (player.attendance || 0), 0) / coachPlayers.length) : 0}%
                  </span>
                </div>
                <div className="flex justify-between" data-id="3s9krwe0i" data-path="src/pages/dashboard/CoachDashboard.tsx">
                  <span data-id="x31vntnvy" data-path="src/pages/dashboard/CoachDashboard.tsx">Today's Batches:</span>
                  <span className="font-medium" data-id="czvbfn571" data-path="src/pages/dashboard/CoachDashboard.tsx">{coachSessions.filter(session => new Date(session.date).toDateString() === new Date().toDateString()).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-id="6bzb5zs1n" data-path="src/pages/dashboard/CoachDashboard.tsx">
          <div className="lg:col-span-2" data-id="ci9b6s1r9" data-path="src/pages/dashboard/CoachDashboard.tsx">
            <Tabs defaultValue="attendance">
              <TabsList className="mb-4">
                <TabsTrigger value="attendance">Today's Attendance (Sim)</TabsTrigger>
                <TabsTrigger value="players">My Players (Sim)</TabsTrigger>
                <TabsTrigger value="performance">Performance Notes (Sim)</TabsTrigger>
              </TabsList>

              <TabsContent value="attendance">
                <Card>
                  <CardHeader>
                    <CardTitle>Mark Attendance (Sim)</CardTitle>
                    <CardDescription>Morning Batch - {new Date().toLocaleDateString()}</CardDescription> {/* Mock batch/date */}
                  </CardHeader>
                  <CardContent>
                    {todayAttendance.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">Present</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {todayAttendance.map((player) =>
                            <TableRow key={player.id}>
                              <TableCell>{player.name}</TableCell>
                              <TableCell className="text-right">
                                <Checkbox
                                  checked={player.checked}
                                  onCheckedChange={(checked) =>
                                    handleAttendanceChange(player.id, checked as boolean)
                                  } />

                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                       <p className="text-center text-gray-500">No players assigned to today's sessions (sim).</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSaveAttendance}>Save Attendance (Sim)</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="players">
                <Card>
                  <CardHeader>
                    <CardTitle>Player List (Sim)</CardTitle>
                    <CardDescription>All assigned players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {coachPlayers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Batch (Sim)</TableHead>
                            <TableHead>Attendance % (Sim)</TableHead>
                            <TableHead>Last Status (Sim)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coachPlayers.map((player) =>
                            <TableRow key={player.id}>
                              <TableCell>{player.firstName} {player.lastName}</TableCell>
                              <TableCell>{player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : 'N/A'}</TableCell>
                              <TableCell>{(player as any).batch}</TableCell> {/* Use augmented batch */}
                              <TableCell>{(player as any).attendance}%</TableCell> {/* Use augmented attendance */}
                              <TableCell>
                                <Badge
                                  variant={(player as any).lastAttendance === "Present" ? "outline" : "secondary"}
                                  className={(player as any).lastAttendance === "Present" ?
                                    "bg-green-50 text-green-700 border-green-200" :
                                    "bg-red-50 text-red-700 border-red-200"}>

                                  {(player as any).lastAttendance}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                       <p className="text-center text-gray-500">No players found for this coach (sim).</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Performance Note (Sim)</CardTitle>
                    <CardDescription>Record player progress and feedback</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div data-id="uzlvg4ej8" data-path="src/pages/dashboard/CoachDashboard.tsx">
                      <label className="block text-sm font-medium mb-1" data-id="tnxn3ijke" data-path="src/pages/dashboard/CoachDashboard.tsx">Select Player</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={selectedPlayerForNote || ""}
                        onChange={(e) => setSelectedPlayerForNote(e.target.value)} data-id="g1jlcy4sr" data-path="src/pages/dashboard/CoachDashboard.tsx">

                        <option value="" data-id="6g5w6u5do" data-path="src/pages/dashboard/CoachDashboard.tsx">Select a player</option>
                        {coachPlayers.map((player) =>
                          <option key={player.id} value={`${player.firstName} ${player.lastName}`} data-id="7y9kx9jcn" data-path="src/pages/dashboard/CoachDashboard.tsx">
                            {player.firstName} {player.lastName}
                          </option>
                        )}
                      </select>
                    </div>
                    <div data-id="zybzqw7x4" data-path="src/pages/dashboard/CoachDashboard.tsx">
                      <label className="block text-sm font-medium mb-1" data-id="nb1b4bx5j" data-path="src/pages/dashboard/CoachDashboard.tsx">Performance Note</label>
                      <Textarea
                        placeholder="Enter your observations and feedback here..."
                        className="resize-none"
                        value={performanceNote}
                        onChange={(e) => setPerformanceNote(e.target.value)} />

                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleAddNote}>Add Note (Sim)</Button>
                  </CardFooter>
                </Card>
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Recent Performance Notes (Sim)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {performanceNotesList.length > 0 ? (
                                performanceNotesList.map((note) => (
                                    <div key={note.id} className="border-b pb-4 last:border-0">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium">{note.date}</span>
                                            <span className="text-sm text-gray-600">{note.playerName}</span>
                                        </div>
                                        <p className="text-gray-800">{note.note}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500">No performance notes recorded yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div data-id="5a0ruxxuc" data-path="src/pages/dashboard/CoachDashboard.tsx">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Your schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border" />

              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions (Sim)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-id="5fiubyowu" data-path="src/pages/dashboard/CoachDashboard.tsx">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" data-id="m85oqibyt" data-path="src/pages/dashboard/CoachDashboard.tsx"></path>
                        <circle cx="9" cy="7" r="4" data-id="ht34g6nco" data-path="src/pages/dashboard/CoachDashboard.tsx"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" data-id="p2lhez9cq" data-path="src/pages/dashboard/CoachDashboard.tsx"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" data-id="gvr9x1nkc" data-path="src/pages/dashboard/CoachDashboard.tsx"></path>
                      </svg>
                      View Player Details (Sim)
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Player Details (Sim)</DialogTitle>
                      <DialogDescription>View complete information about a player</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4" data-id="tz2vcgfrl" data-path="src/pages/dashboard/CoachDashboard.tsx">
                      <div className="space-y-2" data-id="23yjrbtx6" data-path="src/pages/dashboard/CoachDashboard.tsx">
                        <label className="text-sm font-medium" data-id="gcxplndvd" data-path="src/pages/dashboard/CoachDashboard.tsx">Select Player</label>
                        <select className="w-full p-2 border rounded-md" data-id="wtjit3bxd" data-path="src/pages/dashboard/CoachDashboard.tsx">
                          <option value="" data-id="pn7mbgy9f" data-path="src/pages/dashboard/CoachDashboard.tsx">Select a player</option>
                          {coachPlayers.map((player) =>
                            <option key={player.id} value={player.id} data-id="bdhkdet20" data-path="src/pages/dashboard/CoachDashboard.tsx">
                              {player.firstName} {player.lastName}
                            </option>
                          )}
                        </select>
                      </div>
                       {/* Display selected player details here in a real app */}
                    </div>
                    <DialogFooter>
                      <Button>View Details (Sim)</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-id="4vt1c1nua" data-path="src/pages/dashboard/CoachDashboard.tsx">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" data-id="tva2hvsjt" data-path="src/pages/dashboard/CoachDashboard.tsx"></rect>
                        <line x1="16" y1="2" x2="16" y2="6" data-id="c1mcd2vyb" data-path="src/pages/dashboard/CoachDashboard.tsx"></line>
                        <line x1="8" y1="2" x2="8" y2="6" data-id="4g3uk1alj" data-path="src/pages/dashboard/CoachDashboard.tsx"></line>
                        <line x1="3" y1="10" x2="21" y2="10" data-id="vwn44ujxm" data-path="src/pages/dashboard/CoachDashboard.tsx"></line>
                      </svg>
                      Schedule Change Request (Sim)
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Schedule Change (Sim)</DialogTitle>
                      <DialogDescription>Submit a request to change your training schedule</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4" data-id="7r8fx8els" data-path="src/pages/dashboard/CoachDashboard.tsx">
                      <div className="space-y-2" data-id="e19t42ubb" data-path="src/pages/dashboard/CoachDashboard.tsx">
                        <label className="text-sm font-medium" data-id="g11nihd0l" data-path="src/pages/dashboard/CoachDashboard.tsx">Select Batch</label>
                        <select className="w-full p-2 border rounded-md" data-id="o069xk9jx" data-path="src/pages/dashboard/CoachDashboard.tsx">
                          <option value="" data-id="6v5i95ybb" data-path="src/pages/dashboard/CoachDashboard.tsx">Select a batch</option>
                           {coachSessions.map((session) =>
                           <option key={session.id} value={session.id} data-id="bdhkdet20" data-path="src/pages/dashboard/CoachDashboard.tsx">
                               {session.title} - {new Date(session.date).toLocaleString()}
                             </option>
                           )}
                        </select>
                      </div>
                      <div className="space-y-2" data-id="3f0du9h50" data-path="src/pages/dashboard/CoachDashboard.tsx">
                        <label className="text-sm font-medium" data-id="xrbjun8ul" data-path="src/pages/dashboard/CoachDashboard.tsx">Requested Date</label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2" data-id="wnt9pwddf" data-path="src/pages/dashboard/CoachDashboard.tsx">
                        <label className="text-sm font-medium" data-id="fd508as1h" data-path="src/pages/dashboard/CoachDashboard.tsx">Reason</label>
                        <Textarea placeholder="Explain why you need to change the schedule" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => toast({title: "Request Submitted (Sim)", description: "Your schedule change request has been sent."})}>Submit Request (Sim)</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full justify-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-id="l1al65ywz" data-path="src/pages/dashboard/CoachDashboard.tsx">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" data-id="y4y06vn2u" data-path="src/pages/dashboard/CoachDashboard.tsx"></path>
                    <polyline points="14 2 14 8 20 8" data-id="zk7mn6bai" data-path="src/pages/dashboard/CoachDashboard.tsx"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13" data-id="m8owi8acr" data-path="src/pages/dashboard/CoachDashboard.tsx"></line>
                    <line x1="16" y1="17" x2="8" y2="17" data-id="c0q6ruh1f" data-path="src/pages/dashboard/CoachDashboard.tsx"></line>
                    <polyline points="10 9 9 9 8 9" data-id="5w5ywm3or" data-path="src/pages/dashboard/CoachDashboard.tsx"></polyline>
                  </svg>
                  Generate Reports (Sim)
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

export default CoachDashboard;
