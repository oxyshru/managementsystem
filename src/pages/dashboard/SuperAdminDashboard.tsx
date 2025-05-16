// src/pages/dashboard/SuperAdminDashboard.tsx
import { useState, useEffect, useMemo } from "react"; // Import useMemo
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import dbService from "@/lib/db.service"; // Corrected import path
import authService from "@/services/auth.service";
import playerService from "@/services/player.service"; // Import playerService for manual registration
import coachService from "@/services/coach.service"; // Import coachService to get coach names
import { User, Batch, Payment, Player, Coach, Game } from "@/types/database.types"; // Import new types
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"; // Import Chart components
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts'; // Import Recharts components
import { addMonths, format } from "date-fns"; // Import date-fns for chart data processing


const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [allUsers, setAllUsers] = useState<User[]>([]);// All users
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);// All players (for manual registration and charts)
  const [allCoaches, setAllCoaches] = useState<Coach[]>([]);// All coaches (for batch assignment)
  const [allBatches, setAllBatches] = useState<Batch[]>([]);// All batches
  const [allPayments, setAllPayments] = useState<Payment[]>([]);// All payments
  const [allGames, setAllGames] = useState<Game[]>([]);// All games (new)

  // UI states for dialogs and forms
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<User | null>(null);
  const [isAddBatchDialogOpen, setIsAddBatchDialogOpen] = useState(false);
  const [isEditBatchDialogOpen, setIsEditBatchDialogOpen] = useState(false);
  const [selectedBatchToEdit, setSelectedBatchToEdit] = useState<Batch | null>(null);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [isEditPaymentDialogOpen, setIsEditPaymentDialogOpen] = useState(false);
  const [selectedPaymentToEdit, setSelectedPaymentToEdit] = useState<Payment | null>(null);
  const [isManualRegisterDialogOpen, setIsManualRegisterDialogOpen] = useState(false);
  const [isAddGameDialogOpen, setIsAddGameDialogOpen] = useState(false); // New state for Add Game dialog
  const [newGameName, setNewGameName] = useState(''); // State for new game name input


  // Manual Registration Form State
  const [manualRegisterFormData, setManualRegisterFormData] = useState({
      username: '',
      email: '',
      password: '', // Note: In a real app, handle password securely (e.g., send reset link)
      firstName: '',
      lastName: '',
      sports: [] as string[], // Allow selecting multiple sports (keeping as string[] for sim simplicity)
  });
  const [manualRegisterRole, setManualRegisterRole] = useState<'player' | 'coach'>('player'); // Manual registration only for player/coach

  // Chart Filtering States
  const [selectedSportForRegistrationChart, setSelectedSportForRegistrationChart] = useState<string>('All');


  // Mock system settings (not stored in DB in this sim)
  const [systemSettings, setSystemSettings] = useState<any[]>([]); // Mock settings
  const [recentActivity, setRecentActivity] = useState<any[]>([]); // Mock activity


  // Mock data for system stats (derived from fetched data)
  const systemStats = {
    totalUsers: allUsers.length,
    totalCoaches: allCoaches.length,
    totalPlayers: allPlayers.length,
    totalBatches: allBatches.length,
    totalPayments: allPayments.reduce((sum, payment) => sum + payment.amount, 0),
    totalGames: allGames.length, // Added total games
    activeSessions: 28, // Mock
    newRegistrationsWeek: 8, // Mock
    systemUptime: "99.9%" // Mock
  };

  // Data processing for Charts
  const registrationChartData = useMemo(() => {
      const data: { date: string; count: number }[] = [];
      const registrations = selectedSportForRegistrationChart === 'All'
          ? allUsers.filter(u => u.role === 'player')
          : allPlayers.filter(p => Array.isArray(p.sports) && p.sports.includes(selectedSportForRegistrationChart)); // Ensure p.sports is an array

      const sortedRegistrations = registrations.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      if (sortedRegistrations.length === 0) {
          return [];
      }

      let currentDate = new Date(sortedRegistrations[0].createdAt.getFullYear(), sortedRegistrations[0].createdAt.getMonth(), 1);
      const endDate = new Date();
      endDate.setDate(1); // Start from the beginning of the current month

      while (currentDate <= endDate) {
          const monthKey = format(currentDate, 'yyyy-MM');
          const count = sortedRegistrations.filter(reg => format(reg.createdAt, 'yyyy-MM') === monthKey).length;
          data.push({ date: format(currentDate, 'MMM yyyy'), count });
          currentDate = addMonths(currentDate, 1);
      }

      return data;
  }, [allUsers, allPlayers, selectedSportForRegistrationChart]);


   const paymentChartData = useMemo(() => {
       const data: { date: string; amount: number }[] = [];
       const sortedPayments = allPayments.sort((a, b) => a.date.getTime() - b.date.getTime());

       if (sortedPayments.length === 0) {
           return [];
       }

       let currentDate = new Date(sortedPayments[0].date.getFullYear(), sortedPayments[0].date.getMonth(), 1);
       const endDate = new Date();
       endDate.setDate(1); // Start from the beginning of the current month

       while (currentDate <= endDate) {
           const monthKey = format(currentDate, 'yyyy-MM');
           const totalAmount = sortedPayments
               .filter(payment => format(payment.date, 'yyyy-MM') === monthKey)
               .reduce((sum, payment) => sum + payment.amount, 0);
           data.push({ date: format(currentDate, 'MMM yyyy'), amount: totalAmount });
           currentDate = addMonths(currentDate, 1);
       }

       return data;
   }, [allPayments]);


  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      setError(null);
      const currentUserResult = await authService.getCurrentUser();

      if (!currentUserResult.success || !currentUserResult.data || currentUserResult.data.role !== 'admin') {
        setError("Access Denied: You must be a Super Admin to view this page.");
        setLoading(false);
        // Optionally redirect if not admin
        // navigate('/');
        return;
      }

      setUser(currentUserResult.data);

      // Fetch all data
      const usersResult = await dbService.getMany<User>('users');
      const playersResult = await dbService.getMany<Player>('players');
      const coachesResult = await dbService.getMany<Coach>('coaches');
      const batchesResult = await dbService.getMany<Batch>('batches');
      const paymentsResult = await dbService.getMany<Payment>('payments');
      const gamesResult = await dbService.getMany<Game>('games'); // Fetch games


      if (usersResult.success && usersResult.data) {
        // Ensure all fetched users have a status property, defaulting to 'active' if missing
        const usersWithGuaranteedStatus = usersResult.data.map(u => ({
            ...u,
            status: u.status || 'active'
        }));
        setAllUsers(usersWithGuaranteedStatus);
      } else {
        setError(usersResult.error || "Failed to load users.");
      }

      if (playersResult.success && playersResult.data) {
          setAllPlayers(playersResult.data);
      } else {
          console.error("Failed to load players:", playersResult.error);
      }

      if (coachesResult.success && coachesResult.data) {
          setAllCoaches(coachesResult.data);
      } else {
          console.error("Failed to load coaches:", coachesResult.error);
      }

      if (batchesResult.success && batchesResult.data) {
          setAllBatches(batchesResult.data);
      } else {
          console.error("Failed to load batches:", batchesResult.error);
      }

      if (paymentsResult.success && paymentsResult.data) {
          setAllPayments(paymentsResult.data);
      } else {
          console.error("Failed to load payments:", paymentsResult.error);
      }

      if (gamesResult.success && gamesResult.data) { // Handle games result
           setAllGames(gamesResult.data);
       } else {
           console.error("Failed to load games:", gamesResult.error);
       }


      // Mock system settings - replace with actual fetching if implemented
      setSystemSettings([
          { id: 1, name: "Enable user registration", value: true, description: "Allow new users to register" },
          { id: 2, name: "Email notifications", value: true, description: "Send email notifications for system events" },
          { id: 3, name: "Two-factor authentication", value: false, description: "Require 2FA for admin accounts" },
          { id: 4, name: "Maintenance mode", value: false, description: "Put system in maintenance mode" },
          { id: 5, name: "Debug logging", value: false, description: "Enable verbose logging for debugging" },
      ]);

      // Mock recent activity - replace with actual fetching if implemented
      setRecentActivity([
          { id: 1, action: "User created", user: "Sarah Davis", timestamp: "2025-07-02 14:33", ip: "192.168.1.1" },
          { id: 2, action: "User login", user: "Alex Johnson", timestamp: "2025-07-03 09:15", ip: "192.168.1.45" },
          { id: 3, action: "Session scheduled", user: "Michael Brown", timestamp: "2025-07-02 16:22", ip: "192.168.1.87" },
          { id: 4, action: "User suspended", user: "David Lee", timestamp: "2025-06-28 11:05", ip: "192.168.1.112" },
          { id: 5, action: "System backup", user: "Super Admin", timestamp: "2025-07-03 01:00", ip: "192.168.1.1" },
      ]);


      setLoading(false);
    };

    loadAdminData();
  }, []); // Empty dependency array means this runs once on mount


  // --- User Management Handlers ---
  const handleSettingChange = (settingId: number, value: boolean) => {
    // Update local state for settings
    setSystemSettings(prevSettings =>
        prevSettings.map(setting =>
            setting.id === settingId ? { ...setting, value } : setting
        )
    );
    toast({
      title: "Setting updated (Simulated)",
      description: `Setting ${systemSettings.find((s) => s.id === settingId)?.name} is now ${value ? 'enabled' : 'disabled'}`
    });
  };

  const handleUserStatusChange = (userId: number, checked: boolean) => {
     // Simulate updating user status
     dbService.update<User>('users', userId, { status: checked ? 'active' : 'inactive' }).then(result => {
         if(result.success) {
             // Update local state and ensure status is present
             setAllUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, status: checked ? 'active' : 'inactive' } as User : u));
             const user = allUsers.find((u) => u.id === userId);
             toast({
                 title: "User status updated (Simulated)",
                 description: `${user?.username}'s account is now ${checked ? 'active' : 'inactive'}`
             });
         } else {
             toast({
                 title: "Update failed (Simulated)",
                 description: result.error || "Could not update user status.",
                 variant: "destructive"
             });
         }
     });
  };

  const handleAddUser = async (event: React.FormEvent) => {
     event.preventDefault();
     setIsAddUserDialogOpen(false);
     const form = event.target as HTMLFormElement;
     const formData = new FormData(form);
     const newUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
         username: formData.get('username') as string,
         email: formData.get('email') as string,
         password: 'password123', // Mock password for demo
         role: formData.get('role') as 'player' | 'coach' | 'admin',
         status: 'active', // Explicitly set default status when adding
     };

     // Simple validation
     if (!newUser.username || !newUser.email || !newUser.role) {
          toast({title: "Error", description: "Please fill all fields.", variant: "destructive"});
          return;
     }


     const result = await authService.register(newUser); // Use authService.register which handles profile creation

     if (result.success && result.data) {
         // Fetch all users and players again to update the lists
         const usersResult = await dbService.getMany<User>('users');
         if (usersResult.success && usersResult.data) {
             const usersWithGuaranteedStatus = usersResult.data.map(u => ({ ...u, status: u.status || 'active' }));
             setAllUsers(usersWithGuaranteedStatus);
         }
          const playersResult = await dbService.getMany<Player>('players');
          if (playersResult.success && playersResult.data) {
              setAllPlayers(playersResult.data);
          }
            const coachesResult = await dbService.getMany<Coach>('coaches');
            if (coachesResult.success && coachesResult.data) {
                setAllCoaches(coachesResult.data);
            }

         toast({
             title: "User added (Simulated)",
             description: `${result.data.username} has been successfully added to the system`
         });
     } else {
         toast({
             title: "Add user failed (Simulated)",
             description: result.error || "Could not add user.",
             variant: "destructive"
         });
     }
  };

  const handleEditUserClick = (user: User) => {
      setSelectedUserToEdit(user);
      setIsEditUserDialogOpen(true);
  }

  const handleUpdateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserToEdit) return;
    setIsEditUserDialogOpen(false);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const updatedUserData: Partial<User> = {
        username: formData.get('edit-username') as string,
        email: formData.get('edit-email') as string,
        role: formData.get('edit-role') as 'player' | 'coach' | 'admin',
        status: formData.get('edit-status') as 'active' | 'inactive' | 'suspended',
    };

     // Simple validation
     if (!updatedUserData.username || !updatedUserData.email || !updatedUserData.role || !updatedUserData.status) {
          toast({title: "Error", description: "Please fill all fields.", variant: "destructive"});
          return;
     }


    const result = await dbService.update<User>('users', selectedUserToEdit.id, updatedUserData);

    if (result.success) {
        // Update local state
        setAllUsers(prevUsers => prevUsers.map(u => u.id === selectedUserToEdit.id ? { ...u, ...updatedUserData } as User : u));
        toast({
            title: "User updated (Simulated)",
            description: `${updatedUserData.username}'s details have been successfully updated`
        });
    } else {
        toast({
            title: "Update failed (Simulated)",
            description: result.error || "Could not update user.",
            variant: "destructive"
        });
    }
    setSelectedUserToEdit(null);
  };

  const handleDeleteUser = async (userId: number) => {
     // Simulate deleting user
     const result = await dbService.delete('users', userId);

     if (result.success) {
         // Update local state
         setAllUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
          setAllPlayers(prevPlayers => prevPlayers.filter(p => p.userId !== userId)); // Also remove associated player profile
          setAllCoaches(prevCoaches => prevCoaches.filter(c => c.userId !== userId)); // Also remove associated coach profile
         toast({
             title: "User deleted (Simulated)",
             description: `User with ID ${userId} has been removed`
         });
     } else {
         toast({
             title: "Delete failed (Simulated)",
             description: result.error || "Could not delete user.",
             variant: "destructive"
         });
     }
  };

  // --- Manual Registration Handlers ---
  const handleManualRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setManualRegisterFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualRegisterSportChange = (sport: string, checked: boolean) => {
      setManualRegisterFormData(prev => {
          const sports = checked
              ? [...prev.sports, sport]
              : prev.sports.filter(s => s !== sport);
          return { ...prev, sports };
      });
  };

  const handleManualRegisterSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      setIsManualRegisterDialogOpen(false);

      const newUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
          username: manualRegisterFormData.email.split('@')[0] || manualRegisterFormData.firstName + manualRegisterFormData.lastName, // Simple username generation
          email: manualRegisterFormData.email,
          password: manualRegisterFormData.password,
          role: manualRegisterRole,
          status: 'active',
          // Pass additional player/coach data for authService.register to use
          firstName: manualRegisterFormData.firstName,
          lastName: manualRegisterFormData.lastName,
          sports: manualRegisterFormData.sports, // Only relevant for player (still strings)
          // Add other player/coach fields if needed in the form
      };

      // Simple validation
      if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
           toast({title: "Error", description: "Please fill required fields.", variant: "destructive"});
           return;
      }
       if (manualRegisterRole === 'player' && newUser.sports?.length === 0) {
           toast({title: "Error", description: "Please select at least one sport for the player.", variant: "destructive"});
           return;
       }


      const result = await authService.register(newUser);

      if (result.success && result.data) {
          // Refetch users, players, coaches to update lists and charts
          const usersResult = await dbService.getMany<User>('users');
          if (usersResult.success && usersResult.data) {
              const usersWithGuaranteedStatus = usersResult.data.map(u => ({ ...u, status: u.status || 'active' }));
              setAllUsers(usersWithGuaranteedStatus);
          }
           const playersResult = await dbService.getMany<Player>('players');
           if (playersResult.success && playersResult.data) {
               setAllPlayers(playersResult.data);
           }
            const coachesResult = await dbService.getMany<Coach>('coaches');
            if (coachesResult.success && coachesResult.data) {
                setAllCoaches(coachesResult.data);
            }

          toast({
              title: "Registration successful (Simulated)",
              description: `${result.data.username} has been registered as a ${manualRegisterRole}`
          });

          // Reset form
          setManualRegisterFormData({ username: '', email: '', password: '', firstName: '', lastName: '', sports: [] });
          setManualRegisterRole('player');

      } else {
          toast({
              title: "Registration failed (Simulated)",
              description: result.error || "Could not register user.",
              variant: "destructive"
          });
      }
  };


  // --- Games Management Handlers ---
  const handleAddGame = async (event: React.FormEvent) => {
      event.preventDefault();
      setIsAddGameDialogOpen(false);

      if (!newGameName.trim()) {
          toast({title: "Error", description: "Game name cannot be empty.", variant: "destructive"});
          return;
      }

      // Check if game name already exists (case-insensitive)
      const gameExists = allGames.some(game => game.name.toLowerCase() === newGameName.trim().toLowerCase());
      if (gameExists) {
          toast({title: "Error", description: `Game "${newGameName.trim()}" already exists.`, variant: "destructive"});
          return;
      }


      const newGame: Omit<Game, 'id' | 'createdAt' | 'updatedAt'> = {
          name: newGameName.trim(),
      };

      const result = await dbService.insert<Game>('games', newGame);

      if (result.success && result.data) {
          // Refetch games to update the list
          const gamesResult = await dbService.getMany<Game>('games');
          if (gamesResult.success && gamesResult.data) {
              setAllGames(gamesResult.data);
          }
          toast({
              title: "Game added (Simulated)",
              description: `"${newGame.name}" has been added to the available games.`
          });
          setNewGameName(''); // Clear input
      } else {
          toast({
              title: "Add game failed (Simulated)",
              description: result.error || "Could not add game.",
              variant: "destructive"
          });
      }
  };

  const handleDeleteGame = async (gameId: number) => {
       // Prevent deleting games that are linked to batches
       const batchesUsingGame = allBatches.filter(batch => batch.gameId === gameId);
       if (batchesUsingGame.length > 0) {
           const gameName = allGames.find(game => game.id === gameId)?.name || 'this game';
           toast({
               title: "Delete Failed",
               description: `Cannot delete "${gameName}" because it is linked to ${batchesUsingGame.length} batch(es). Please update or delete the batches first.`,
               variant: "destructive"
           });
           return;
       }

       // Simulate deleting game
       const result = await dbService.delete('games', gameId);

       if (result.success) {
           // Update local state
           setAllGames(prevGames => prevGames.filter(game => game.id !== gameId));
           toast({
               title: "Game deleted (Simulated)",
               description: `Game with ID ${gameId} has been removed`
           });
       } else {
           toast({
               title: "Delete failed (Simulated)",
               description: result.error || "Could not delete game.",
               variant: "destructive"
           });
       }
  };


  // --- Games & Batches Handlers ---
  const handleAddBatch = async (event: React.FormEvent) => {
      event.preventDefault();
      setIsAddBatchDialogOpen(false);
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);

      // Get coach value, handle the "unassigned-coach" case
      const coachValue = formData.get('coach') as string;
      const coachId = coachValue === 'unassigned-coach' ? undefined : parseInt(coachValue, 10);

       // Get game value and parse as number
       const gameIdValue = formData.get('game') as string;
       const gameId = parseInt(gameIdValue, 10);


      const newBatch: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'> = {
          gameId: gameId, // Use the parsed gameId
          name: formData.get('batchName') as string,
          schedule: formData.get('schedule') as string,
          coachId: coachId, // Use the parsed coachId
      };

      // Simple validation
      if (isNaN(newBatch.gameId) || !newBatch.name || !newBatch.schedule) {
          toast({title: "Error", description: "Please fill all required batch fields.", variant: "destructive"});
          return;
      }
       // Also validate coachId if it's not 'unassigned-coach'
       if (coachValue !== 'unassigned-coach' && isNaN(coachId as number)) {
            toast({title: "Error", description: "Invalid coach selected.", variant: "destructive"});
            return;
       }


      const result = await dbService.insert<Batch>('batches', newBatch);

      if (result.success && result.data) {
          // Refetch batches to update the list
          const batchesResult = await dbService.getMany<Batch>('batches');
          if (batchesResult.success && batchesResult.data) {
              setAllBatches(batchesResult.data);
          }
          toast({
              title: "Batch added (Simulated)",
              description: `${newBatch.name} batch has been added.`
          });
      } else {
          toast({
              title: "Add batch failed (Simulated)",
              description: result.error || "Could not add batch.",
              variant: "destructive"
          });
      }
  };

  const handleEditBatchClick = (batch: Batch) => {
      setSelectedBatchToEdit(batch);
      setIsEditBatchDialogOpen(true);
  }

  const handleUpdateBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBatchToEdit) return;
    setIsEditBatchDialogOpen(false);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    // Get coach value, handle the "unassigned-coach" case
    const coachValue = formData.get('edit-coach') as string;
    const coachId = coachValue === 'unassigned-coach' ? undefined : parseInt(coachValue, 10);

    // Get game value and parse as number
    const gameIdValue = formData.get('edit-game') as string;
    const gameId = parseInt(gameIdValue, 10);


    const updatedBatchData: Partial<Batch> = {
        gameId: gameId, // Use the parsed gameId
        name: formData.get('edit-batchName') as string,
        schedule: formData.get('edit-schedule') as string,
        coachId: coachId, // Use the parsed coachId
    };

     // Simple validation
     if (isNaN(updatedBatchData.gameId!) || !updatedBatchData.name || !updatedBatchData.schedule) {
          toast({title: "Error", description: "Please fill all required batch fields.", variant: "destructive"});
          return;
     }
      // Also validate coachId if it's not 'unassigned-coach'
      if (coachValue !== 'unassigned-coach' && isNaN(coachId as number)) {
           toast({title: "Error", description: "Invalid coach selected.", variant: "destructive"});
           return;
      }


    const result = await dbService.update<Batch>('batches', selectedBatchToEdit.id, updatedBatchData);

    if (result.success) {
        // Update local state
        setAllBatches(prevBatches => prevBatches.map(b => b.id === selectedBatchToEdit.id ? { ...b, ...updatedBatchData } as Batch : b));
        toast({
            title: "Batch updated (Simulated)",
            description: `${updatedBatchData.name}'s details have been successfully updated`
        });
    } else {
        toast({
            title: "Update failed (Simulated)",
            description: result.error || "Could not update batch.",
            variant: "destructive"
        });
    }
    setSelectedBatchToEdit(null);
  };

  const handleDeleteBatch = async (batchId: number) => {
     // Simulate deleting batch
     const result = await dbService.delete('batches', batchId);

     if (result.success) {
         // Update local state
         setAllBatches(prevBatches => prevBatches.filter(b => b.id !== batchId));
         toast({
             title: "Batch deleted (Simulated)",
             description: `Batch with ID ${batchId} has been removed`
         });
     } else {
         toast({
             title: "Delete failed (Simulated)",
             description: result.error || "Could not delete batch.",
             variant: "destructive"
         });
     }
  };

  // --- Payments Handlers ---
   const handleAddPayment = async (event: React.FormEvent) => {
       event.preventDefault();
       setIsAddPaymentDialogOpen(false);
       const form = event.target as HTMLFormElement;
       const formData = new FormData(form);
       const newPayment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
           playerId: parseInt(formData.get('player') as string, 10),
           date: new Date(formData.get('paymentDate') as string),
           amount: parseFloat(formData.get('amount') as string),
           description: formData.get('description') as string,
       };

       // Simple validation
       if (isNaN(newPayment.playerId) || !newPayment.date || isNaN(newPayment.amount) || !newPayment.description) {
           toast({title: "Error", description: "Please fill all required payment fields.", variant: "destructive"});
           return;
       }

       const result = await dbService.insert<Payment>('payments', newPayment);

       if (result.success && result.data) {
           // Refetch payments to update the list and chart
           const paymentsResult = await dbService.getMany<Payment>('payments');
           if (paymentsResult.success && paymentsResult.data) {
               setAllPayments(paymentsResult.data);
           }
           toast({
               title: "Payment added (Simulated)",
               description: `Payment of ₹${newPayment.amount.toFixed(2)} recorded.` // Updated currency symbol
           });
       } else {
           toast({
               title: "Add payment failed (Simulated)",
               description: result.error || "Could not add payment.",
               variant: "destructive"
           });
       }
   };

   const handleEditPaymentClick = (payment: Payment) => {
       setSelectedPaymentToEdit(payment);
       setIsEditPaymentDialogOpen(true);
   }

   const handleUpdatePayment = async (event: React.FormEvent) => {
       event.preventDefault();
       if (!selectedPaymentToEdit) return;
       setIsEditPaymentDialogOpen(false);

       const form = event.target as HTMLFormElement;
       const formData = new FormData(form);
       const updatedPaymentData: Partial<Payment> = {
           playerId: parseInt(formData.get('edit-player') as string, 10),
           date: new Date(formData.get('edit-paymentDate') as string),
           amount: parseFloat(formData.get('edit-amount') as string),
           description: formData.get('edit-description') as string,
       };

       // Simple validation
       if (isNaN(updatedPaymentData.playerId!) || !updatedPaymentData.date || isNaN(updatedPaymentData.amount!) || !updatedPaymentData.description) {
           toast({title: "Error", description: "Please fill all required payment fields.", variant: "destructive"});
           return;
       }


       const result = await dbService.update<Payment>('payments', selectedPaymentToEdit.id, updatedPaymentData);

       if (result.success) {
           // Update local state
           setAllPayments(prevPayments => prevPayments.map(p => p.id === selectedPaymentToEdit.id ? { ...p, ...updatedPaymentData } as Payment : p));
           toast({
               title: "Payment updated (Simulated)",
               description: `Payment details updated.`
           });
       } else {
           toast({
               title: "Update failed (Simulated)",
               description: result.error || "Could not update payment.",
               variant: "destructive"
           });
       }
       setSelectedPaymentToEdit(null);
   };

   const handleDeletePayment = async (paymentId: number) => {
      // Simulate deleting payment
      const result = await dbService.delete('payments', paymentId);

      if (result.success) {
          // Update local state
          setAllPayments(prevPayments => prevPayments.filter(p => p.id !== paymentId));
          toast({
              title: "Payment deleted (Simulated)",
              description: `Payment with ID ${paymentId} has been removed`
          });
      } else {
          toast({
              title: "Delete failed (Simulated)",
              description: result.error || "Could not delete payment.",
              variant: "destructive"
          });
      }
   };


  // --- System Actions ---
  const handleSendEmail = () => {
    toast({
      title: "Email sent (Simulated)",
      description: "Your message has been sent to the selected users"
    });
  };

  const handleBackup = () => {
    toast({
      title: "Backup started (Simulated)",
      description: "System backup has been initiated"
    });
  };

   const handleResetDb = async () => {
       if (window.confirm("Are you sure you want to reset the simulated database? This will delete all mock data except the initial admin, coach, and player.")) {
           await dbService.resetDatabase();
           // Reload all data after reset
           const usersResult = await dbService.getMany<User>('users');
            if (usersResult.success && usersResult.data) {
                const usersWithGuaranteedStatus = usersResult.data.map(u => ({ ...u, status: u.status || 'active' }));
                setAllUsers(usersWithGuaranteedStatus);
            }
            const playersResult = await dbService.getMany<Player>('players');
            if (playersResult.success && playersResult.data) {
                setAllPlayers(playersResult.data);
            }
             const coachesResult = await dbService.getMany<Coach>('coaches');
             if (coachesResult.success && coachesResult.data) {
                 setAllCoaches(coachesResult.data);
             }
            const batchesResult = await dbService.getMany<Batch>('batches');
            if (batchesResult.success && batchesResult.data) {
                setAllBatches(batchesResult.data);
            }
            const paymentsResult = await dbService.getMany<Payment>('payments');
            if (paymentsResult.success && paymentsResult.data) {
                setAllPayments(paymentsResult.data);
            }
             const gamesResult = await dbService.getMany<Game>('games'); // Fetch games
             if (gamesResult.success && gamesResult.data) {
                 setAllGames(gamesResult.data);
             }

           toast({
               title: "Database Reset (Simulated)",
               description: "The simulated database has been reset to its initial state."
           });
       }
   };


  const handleNotificationClick = () => {
    toast({
      title: "System notification (Mock)",
      description: "New user registrations require approval"
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Super Admin Dashboard...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  if (!user) {
       return <div className="min-h-screen flex items-center justify-center text-red-600">User profile not found.</div>;
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sports Campus Admin
          </h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handleNotificationClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
            </Button>
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
              <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Super Admin Dashboard</h2>
          <p className="text-gray-600">Manage your system, users, and configuration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8"> {/* Adjusted grid for Games stat */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Users (Sim)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{systemStats.totalUsers}</div>
              <p className="text-sm text-gray-600">
                {systemStats.newRegistrationsWeek} new this week (Mock)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Coaches (Sim)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{systemStats.totalCoaches}</div>
              <p className="text-sm text-gray-600">Active coaching staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Players (Sim)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{systemStats.totalPlayers}</div>
              <p className="text-sm text-gray-600">Registered players</p>
            </CardContent>
          </Card>

           <Card> {/* New Card for Total Games */}
             <CardHeader className="pb-2">
               <CardTitle>Total Games (Sim)</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold">{systemStats.totalGames}</div>
               <p className="text-sm text-gray-600">Available sports</p>
             </CardContent>
           </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>System Status (Sim)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-md font-bold text-green-600">
                <span className="inline-block h-2 w-2 rounded-full bg-green-600 mr-2"></span>
                Online
              </div>
              <p className="text-sm text-gray-600">
                {systemStats.systemUptime} uptime (Mock)
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="users">
              <TabsList className="mb-4">
                <TabsTrigger value="users">User Management (Sim)</TabsTrigger>
                <TabsTrigger value="games-batches">Games & Batches (Sim)</TabsTrigger>
                <TabsTrigger value="payments">Payments (Sim)</TabsTrigger>
                <TabsTrigger value="activity">Activity Log (Mock)</TabsTrigger>
                <TabsTrigger value="settings">System Settings (Sim)</TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>User Management (Sim)</CardTitle>
                        <CardDescription>Manage system users</CardDescription>
                      </div>
                      <div className="flex gap-2">
                          <Dialog open={isManualRegisterDialogOpen} onOpenChange={setIsManualRegisterDialogOpen}>
                              <DialogTrigger asChild>
                                  <Button variant="outline">Manual Register Student (Sim)</Button>
                              </DialogTrigger>
                              <DialogContent>
                                  <DialogHeader>
                                      <DialogTitle>Manual Register Student (Sim)</DialogTitle>
                                      <DialogDescription>Create a new player or coach account manually.</DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={handleManualRegisterSubmit}>
                                      <div className="space-y-4 py-4">
                                          <div className="space-y-2">
                                              <Label htmlFor="manual-role">Register As</Label>
                                              <Select value={manualRegisterRole} onValueChange={(value: 'player' | 'coach') => setManualRegisterRole(value)}>
                                                  <SelectTrigger id="manual-role">
                                                      <SelectValue placeholder="Select role" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                      <SelectItem value="player">Player</SelectItem>
                                                      <SelectItem value="coach">Coach</SelectItem>
                                                  </SelectContent>
                                              </Select>
                                          </div>
                                          <div className="space-y-2">
                                              <Label htmlFor="manual-firstName">First Name</Label>
                                              <Input id="manual-firstName" name="firstName" value={manualRegisterFormData.firstName} onChange={handleManualRegisterInputChange} required />
                                          </div>
                                          <div className="space-y-2">
                                              <Label htmlFor="manual-lastName">Last Name</Label>
                                              <Input id="manual-lastName" name="lastName" value={manualRegisterFormData.lastName} onChange={handleManualRegisterInputChange} required />
                                          </div>
                                          <div className="space-y-2">
                                              <Label htmlFor="manual-email">Email</Label>
                                              <Input id="manual-email" name="email" type="email" value={manualRegisterFormData.email} onChange={handleManualRegisterInputChange} required />
                                          </div>
                                          <div className="space-y-2">
                                              <Label htmlFor="manual-password">Password</Label>
                                              <Input id="manual-password" name="password" type="password" value={manualRegisterFormData.password} onChange={handleManualRegisterInputChange} required />
                                          </div>
                                           {manualRegisterRole === 'player' && (
                                              <div className="space-y-2">
                                                  <Label>Sports</Label>
                                                  <div className="grid grid-cols-2 gap-2">
                                                      {/* Use allGames for player sports selection */}
                                                      {allGames.map(game => (
                                                          <div key={game.id} className="flex items-center space-x-2">
                                                              <Checkbox
                                                                  id={`sport-${game.id}`}
                                                                  checked={manualRegisterFormData.sports.includes(game.name)} // Still compare against game name string
                                                                  onCheckedChange={(checked) => handleManualRegisterSportChange(game.name, checked as boolean)} // Pass game name string
                                                              />
                                                              <Label htmlFor={`sport-${game.id}`}>{game.name}</Label>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                           )}
                                           {/* Add more fields for player/coach profiles if needed */}
                                      </div>
                                      <DialogFooter>
                                          <Button type="button" variant="outline" onClick={() => setIsManualRegisterDialogOpen(false)}>Cancel</Button>
                                          <Button type="submit">Register User</Button>
                                      </DialogFooter>
                                  </form>
                              </DialogContent>
                          </Dialog>

                          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                            <DialogTrigger asChild>
                              <Button>Add User (Sim)</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New User (Sim)</DialogTitle>
                                <DialogDescription>Create a new user account</DialogDescription>
                              </DialogHeader>
                               <form onSubmit={handleAddUser}>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="username">Username</Label>
                                      <Input id="username" name="username" placeholder="johndoe" required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="email">Email</Label>
                                      <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                                    </div>
                                     {/* Password is mocked in authService.register */}
                                    {/* <div className="space-y-2">
                                       <Label htmlFor="password">Password</Label>
                                       <Input id="password" name="password" type="password" required />
                                    </div> */}
                                    <div className="space-y-2">
                                      <Label htmlFor="role">Role</Label>
                                      <select id="role" name="role" className="w-full p-2 border rounded-md" required>
                                        <option value="">Select a role</option>
                                        <option value="player">Player</option>
                                        <option value="coach">Coach</option>
                                         {/* Admin role is typically not created via frontend form */}
                                        {/* <option value="admin">Admin</option> */}
                                      </select>
                                    </div>
                                     {/* Add fields for player/coach profile data if needed for registration */}
                                     {/* <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" name="firstName" placeholder="John" />
                                    </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" name="lastName" placeholder="Doe" />
                                    </div> */}
                                  </div>
                                  <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit">Create User</Button>
                                  </DialogFooter>
                               </form>
                            </DialogContent>
                          </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <Input placeholder="Search users..." className="max-w-sm" />
                      <div className="flex gap-2">
                        <select className="p-2 border rounded-md text-sm">
                          <option value="">All Roles</option>
                          <option value="player">Player</option>
                          <option value="coach">Coach</option>
                          <option value="admin">Admin</option>
                        </select>
                        <select className="p-2 border rounded-md text-sm">
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                    {allUsers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox />
                            </TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Active (Sim)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allUsers.map((user) =>
                            <TableRow key={user.id}>
                              <TableCell>
                                <Checkbox />
                              </TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  user.role === "admin" ? "default" :
                                  user.role === "coach" ? "outline" : "secondary"
                                }>
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {/* Refined defensive check for user.status */}
                                <Badge variant={
                                  user.status === "active" ? "outline" :
                                  user.status === "inactive" ? "secondary" : "destructive"
                                }
                                className={
                                  user.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                                  user.status === "inactive" ? "bg-gray-50 text-gray-700 border-gray-200" :
                                  "bg-red-50 text-red-700 border-red-200"
                                }>
                                  {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(user.updatedAt).toLocaleDateString()}</TableCell> {/* Using updatedAt as mock lastActive */}
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Dialog open={isEditUserDialogOpen && selectedUserToEdit?.id === user.id} onOpenChange={setIsEditUserDialogOpen}>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => handleEditUserClick(user)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit User (Sim)</DialogTitle>
                                        <DialogDescription>Update user account details</DialogDescription>
                                      </DialogHeader>
                                       {selectedUserToEdit && (
                                         <form onSubmit={handleUpdateUser}>
                                            <div className="space-y-4 py-4">
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-username">Username</Label>
                                                <Input id="edit-username" name="edit-username" defaultValue={selectedUserToEdit.username} required />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-email">Email</Label>
                                                <Input id="edit-email" name="edit-email" type="email" defaultValue={selectedUserToEdit.email} required />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-role">Role</Label>
                                                <select id="edit-role" name="edit-role" className="w-full p-2 border rounded-md" defaultValue={selectedUserToEdit.role} required>
                                                  <option value="player">Player</option>
                                                  <option value="coach">Coach</option>
                                                   {/* Prevent changing to/from admin role via this form for demo simplicity */}
                                                   {selectedUserToEdit.role === 'admin' && <option value="admin">Admin</option>}
                                                </select>
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-status">Status</Label>
                                                <select id="edit-status" name="edit-status" className="w-full p-2 border rounded-md" defaultValue={selectedUserToEdit.status} required>
                                                  <option value="active">Active</option>
                                                  <option value="inactive">Inactive</option>
                                                  <option value="suspended">Suspended</option>
                                                </select>
                                              </div>
                                            </div>
                                            <DialogFooter>
                                              <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>Cancel</Button>
                                              <Button type="submit">Update User</Button>
                                            </DialogFooter>
                                        </form>
                                       )}
                                    </DialogContent>
                                  </Dialog>
                                   {/* Corrected condition: Prevent deleting admin users */}
                                  {user.role !== 'admin' && (
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteUser(user.id)}>

                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <polyline points="3 6 5 6 21 6"></polyline>
                                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                              <line x1="10" y1="11" x2="10" y2="17"></line>
                                              <line x1="14" y1="11" x2="14" y2="17"></line>
                                          </svg>
                                      </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                       <p className="text-center text-gray-500">No users found.</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      Showing {allUsers.length} of {systemStats.totalUsers} users
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" disabled>Previous</Button> {/* Pagination mocked */}
                      <Button variant="outline" size="sm" disabled>Next</Button> {/* Pagination mocked */}
                    </div>
                  </CardFooter>
                </Card>
                 {/* Registration Chart */}
                 <Card className="mt-6">
                     <CardHeader>
                         <CardTitle>Student Registrations Over Time (Sim)</CardTitle>
                         <CardDescription>Total number of player registrations per month.</CardDescription>
                     </CardHeader>
                     <CardContent>
                         <div className="flex justify-end mb-4">
                              {/* Use allGames for chart sport filter */}
                              <Select value={selectedSportForRegistrationChart} onValueChange={setSelectedSportForRegistrationChart}>
                                  <SelectTrigger className="w-[180px]">
                                      <SelectValue placeholder="Select Sport" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="All">All Sports</SelectItem>
                                       {allGames.map(game => (
                                           <SelectItem key={game.id} value={game.name}>{game.name}</SelectItem>
                                       ))}
                                  </SelectContent>
                              </Select>
                         </div>
                         {registrationChartData.length > 0 ? (
                             <ChartContainer config={{
                                 count: {
                                     label: "Registrations",
                                     color: "hsl(var(--chart-1))",
                                 },
                             }} className="min-h-[300px] w-full">
                                 <BarChart accessibilityLayer data={registrationChartData}>
                                     <CartesianGrid vertical={false} />
                                     <XAxis
                                         dataKey="date"
                                         tickLine={false}
                                         tickMargin={10}
                                         axisLine={false}
                                         tickFormatter={(value) => value.slice(0, 3)}
                                     />
                                     <YAxis
                                         tickLine={false}
                                         tickMargin={10}
                                         axisLine={false}
                                         tickFormatter={(value) => value.toLocaleString()}
                                     />
                                     <RechartsTooltip content={<ChartTooltipContent />} />
                                     <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                                 </BarChart>
                             </ChartContainer>
                         ) : (
                             <p className="text-center text-gray-500">No registration data available for the selected sport.</p>
                         )}
                     </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="games-batches">
                  <Card>
                      <CardHeader>
                          <div className="flex justify-between items-center">
                              <div>
                                  <CardTitle>Games & Batches (Sim)</CardTitle>
                                  <CardDescription>Manage sports games and training batches</CardDescription>
                              </div>
                              <div className="flex gap-2">
                                   {/* Add Game Dialog Trigger */}
                                   <Dialog open={isAddGameDialogOpen} onOpenChange={setIsAddGameDialogOpen}>
                                       <DialogTrigger asChild>
                                           <Button variant="outline">Add Game (Sim)</Button>
                                       </DialogTrigger>
                                       <DialogContent>
                                           <DialogHeader>
                                               <DialogTitle>Add New Game (Sim)</DialogTitle>
                                               <DialogDescription>Add a new sport/game to the system.</DialogDescription>
                                           </DialogHeader>
                                           <form onSubmit={handleAddGame}>
                                               <div className="space-y-4 py-4">
                                                   <div className="space-y-2">
                                                       <Label htmlFor="gameName">Game Name</Label>
                                                       <Input
                                                           id="gameName"
                                                           name="gameName"
                                                           placeholder="e.g., Volleyball"
                                                           value={newGameName}
                                                           onChange={(e) => setNewGameName(e.target.value)}
                                                           required
                                                       />
                                                   </div>
                                               </div>
                                               <DialogFooter>
                                                   <Button type="button" variant="outline" onClick={() => setIsAddGameDialogOpen(false)}>Cancel</Button>
                                                   <Button type="submit">Create Game</Button>
                                               </DialogFooter>
                                           </form>
                                       </DialogContent>
                                   </Dialog>

                                  <Dialog open={isAddBatchDialogOpen} onOpenChange={setIsAddBatchDialogOpen}>
                                      <DialogTrigger asChild>
                                          <Button>Add Batch (Sim)</Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                          <DialogHeader>
                                              <DialogTitle>Add New Batch (Sim)</DialogTitle>
                                              <DialogDescription>Create a new training batch.</DialogDescription>
                                          </DialogHeader>
                                          <form onSubmit={handleAddBatch}>
                                              <div className="space-y-4 py-4">
                                                  <div className="space-y-2">
                                                      <Label htmlFor="game">Game/Sport</Label>
                                                       {/* Use allGames for batch game selection */}
                                                       <Select name="game" required>
                                                           <SelectTrigger id="game">
                                                               <SelectValue placeholder="Select a game" />
                                                           </SelectTrigger>
                                                           <SelectContent>
                                                               {/* Ensure games are loaded before rendering */}
                                                               {allGames.length > 0 ? (
                                                                    allGames.map(game => (
                                                                        <SelectItem key={game.id} value={game.id.toString()}>{game.name}</SelectItem>
                                                                    ))
                                                               ) : (
                                                                    <SelectItem value="" disabled>No games available</SelectItem>
                                                               )}
                                                           </SelectContent>
                                                       </Select>
                                                  </div>
                                                  <div className="space-y-2">
                                                      <Label htmlFor="batchName">Batch Name</Label>
                                                      <Input id="batchName" name="batchName" placeholder="Morning Batch" required />
                                                  </div>
                                                  <div className="space-y-2">
                                                      <Label htmlFor="schedule">Schedule</Label>
                                                      <Input id="schedule" name="schedule" placeholder="Mon, Wed, Fri 9:00 AM" required />
                                                  </div>
                                                  <div className="space-y-2">
                                                      <Label htmlFor="coach">Assign Coach (Optional)</Label>
                                                       {/* Changed value="" to value="unassigned-coach" */}
                                                       <Select name="coach">
                                                           <SelectTrigger id="coach">
                                                               <SelectValue placeholder="Select a coach" />
                                                           </SelectTrigger>
                                                           <SelectContent>
                                                               <SelectItem value="unassigned-coach">None</SelectItem>
                                                               {allCoaches.map(coach => (
                                                                   <SelectItem key={coach.id} value={coach.id.toString()}>{coach.firstName} {coach.lastName} ({coach.specialization})</SelectItem>
                                                               ))}
                                                           </SelectContent>
                                                       </Select>
                                                  </div>
                                              </div>
                                              <DialogFooter>
                                                  <Button type="button" variant="outline" onClick={() => setIsAddBatchDialogOpen(false)}>Cancel</Button>
                                                  <Button type="submit">Create Batch</Button>
                                              </DialogFooter>
                                          </form>
                                      </DialogContent>
                                  </Dialog>
                              </div>
                          </div>
                      </CardHeader>
                      <CardContent>
                          {/* Games List Table */}
                          <h3 className="text-lg font-semibold mb-4">Available Games</h3>
                          {allGames.length > 0 ? (
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>ID</TableHead>
                                          <TableHead>Name</TableHead>
                                          <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {allGames.map(game => (
                                          <TableRow key={game.id}>
                                              <TableCell>{game.id}</TableCell>
                                              <TableCell>{game.name}</TableCell>
                                              <TableCell className="text-right">
                                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteGame(game.id)}>
                                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                          <polyline points="3 6 5 6 21 6"></polyline>
                                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                          <line x1="10" y1="11" x2="10" y2="17"></line>
                                                          <line x1="14" y1="11" x2="14" y2="17"></line>
                                                      </svg>
                                                  </Button>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          ) : (
                              <p className="text-center text-gray-500">No games found.</p>
                          )}

                          {/* Batches List Table */}
                          <h3 className="text-lg font-semibold mt-8 mb-4">Training Batches</h3>
                          {allBatches.length > 0 ? (
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Game</TableHead>
                                          <TableHead>Batch Name</TableHead>
                                          <TableHead>Schedule</TableHead>
                                          <TableHead>Coach (Sim)</TableHead>
                                          <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {allBatches.map(batch => {
                                          const assignedCoach = allCoaches.find(coach => coach.id === batch.coachId);
                                          const coachName = assignedCoach ? `${assignedCoach.firstName} ${assignedCoach.lastName}` : 'Unassigned';
                                           // Find game name by ID
                                           const gameName = allGames.find(game => game.id === batch.gameId)?.name || 'Unknown Game';
                                          return (
                                              <TableRow key={batch.id}>
                                                  <TableCell>{gameName}</TableCell> {/* Display game name */}
                                                  <TableCell>{batch.name}</TableCell>
                                                  <TableCell>{batch.schedule}</TableCell>
                                                  <TableCell>{coachName}</TableCell>
                                                  <TableCell className="text-right">
                                                      <div className="flex justify-end gap-2">
                                                          <Dialog open={isEditBatchDialogOpen && selectedBatchToEdit?.id === batch.id} onOpenChange={setIsEditBatchDialogOpen}>
                                                              <DialogTrigger asChild>
                                                                  <Button variant="ghost" size="icon" onClick={() => handleEditBatchClick(batch)}>
                                                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                      </svg>
                                                                  </Button>
                                                              </DialogTrigger>
                                                              <DialogContent>
                                                                  <DialogHeader>
                                                                      <DialogTitle>Edit Batch (Sim)</DialogTitle>
                                                                      <DialogDescription>Update batch details.</DialogDescription>
                                                                  </DialogHeader>
                                                                   {selectedBatchToEdit && (
                                                                       <form onSubmit={handleUpdateBatch}>
                                                                           <div className="space-y-4 py-4">
                                                                               <div className="space-y-2">
                                                                                   <Label htmlFor="edit-game">Game/Sport</Label>
                                                                                    {/* Use allGames for batch game selection */}
                                                                                    <Select name="edit-game" defaultValue={selectedBatchToEdit.gameId.toString()} required>
                                                                                        <SelectTrigger id="edit-game">
                                                                                            <SelectValue placeholder="Select a game" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            {allGames.length > 0 ? (
                                                                                                 allGames.map(game => (
                                                                                                     <SelectItem key={game.id} value={game.id.toString()}>{game.name}</SelectItem>
                                                                                                 ))
                                                                                            ) : (
                                                                                                 <SelectItem value="" disabled>No games available</SelectItem>
                                                                                            )}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                               </div>
                                                                               <div className="space-y-2">
                                                                                   <Label htmlFor="edit-batchName">Batch Name</Label>
                                                                                   <Input id="edit-batchName" name="edit-batchName" defaultValue={selectedBatchToEdit.name} required />
                                                                               </div>
                                                                               <div className="space-y-2">
                                                                                   <Label htmlFor="edit-schedule">Schedule</Label>
                                                                                   <Input id="edit-schedule" name="edit-schedule" defaultValue={selectedBatchToEdit.schedule} required />
                                                                               </div>
                                                                               <div className="space-y-2">
                                                                                   <Label htmlFor="edit-coach">Assign Coach (Optional)</Label>
                                                                                    {/* Changed value="" to value="unassigned-coach" */}
                                                                                    <Select name="edit-coach" defaultValue={selectedBatchToEdit.coachId?.toString() || "unassigned-coach"}>
                                                                                        <SelectTrigger id="edit-coach">
                                                                                            <SelectValue placeholder="Select a coach" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="unassigned-coach">None</SelectItem>
                                                                                            {allCoaches.map(coach => (
                                                                                                <SelectItem key={coach.id} value={coach.id.toString()}>{coach.firstName} {coach.lastName} ({coach.specialization})</SelectItem>
                                                                                            ))}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                               </div>
                                                                           </div>
                                                                           <DialogFooter>
                                                                               <Button type="button" variant="outline" onClick={() => setIsEditBatchDialogOpen(false)}>Cancel</Button>
                                                                               <Button type="submit">Update Batch</Button>
                                                                           </DialogFooter>
                                                                       </form>
                                                                   )}
                                                              </DialogContent>
                                                          </Dialog>
                                                          <Button variant="ghost" size="icon" onClick={() => handleDeleteBatch(batch.id)}>
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                  <polyline points="3 6 5 6 21 6"></polyline>
                                                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                                              </svg>
                                                          </Button>
                                                      </div>
                                                  </TableCell>
                                              </TableRow>
                                          );
                                      })}
                                  </TableBody>
                              </Table>
                          ) : (
                             <p className="text-center text-gray-500">No batches found.</p>
                          )}
                      </CardContent>
                  </Card>
                  {/* Payment Chart */}
                  <Card className="mt-6">
                      <CardHeader>
                          <CardTitle>Payment Trends (Sim)</CardTitle>
                          <CardDescription>Total payments received per month.</CardDescription>
                      </CardHeader>
                      <CardContent>
                           {paymentChartData.length > 0 ? (
                               <ChartContainer config={{
                                   amount: {
                                       label: "Amount (₹)", // Updated label
                                       color: "hsl(var(--chart-2))",
                                   },
                               }} className="min-h-[300px] w-full">
                                   <BarChart accessibilityLayer data={paymentChartData}>
                                       <CartesianGrid vertical={false} />
                                       <XAxis
                                           dataKey="date"
                                           tickLine={false}
                                           tickMargin={10}
                                           axisLine={false}
                                           tickFormatter={(value) => value.slice(0, 3)}
                                       />
                                       <YAxis
                                           tickLine={false}
                                           tickMargin={10}
                                           axisLine={false}
                                           tickFormatter={(value) => `₹${value.toLocaleString()}`} // Updated formatter
                                       />
                                       <RechartsTooltip content={<ChartTooltipContent />} />
                                       <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                                   </BarChart>
                               </ChartContainer>
                           ) : (
                               <p className="text-center text-gray-500">No payment data available.</p>
                           )}
                      </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="payments"> {/* New Payments Tab */}
                 <Card>
                     <CardHeader>
                         <div className="flex justify-between items-center">
                             <div>
                                 <CardTitle>Payments Management (Sim)</CardTitle>
                                 <CardDescription>Manage player payment records</CardDescription>
                             </div>
                             <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
                                 <DialogTrigger asChild>
                                     <Button>Add Payment (Sim)</Button>
                                 </DialogTrigger>
                                 <DialogContent>
                                     <DialogHeader>
                                         <DialogTitle>Add New Payment (Sim)</DialogTitle>
                                         <DialogDescription>Record a new payment for a player.</DialogDescription>
                                     </DialogHeader>
                                     <form onSubmit={handleAddPayment}>
                                         <div className="space-y-4 py-4">
                                             <div className="space-y-2">
                                                 <Label htmlFor="player">Player</Label>
                                                 <Select name="player" required>
                                                     <SelectTrigger id="player">
                                                         <SelectValue placeholder="Select a player" />
                                                     </SelectTrigger>
                                                     <SelectContent>
                                                         {allPlayers.length > 0 ? (
                                                              allPlayers.map(player => (
                                                                  <SelectItem key={player.id} value={player.id.toString()}>{player.firstName} {player.lastName}</SelectItem>
                                                              ))
                                                         ) : (
                                                              <SelectItem value="" disabled>No players available</SelectItem>
                                                         )}
                                                     </SelectContent>
                                                 </Select>
                                             </div>
                                             <div className="space-y-2">
                                                 <Label htmlFor="paymentDate">Date</Label>
                                                 <Input id="paymentDate" name="paymentDate" type="date" required />
                                             </div>
                                             <div className="space-y-2">
                                                 <Label htmlFor="amount">Amount (₹)</Label> {/* Updated label */}
                                                 <Input id="amount" name="amount" type="number" step="0.01" placeholder="e.g., 150.00" required />
                                             </div>
                                             <div className="space-y-2">
                                                 <Label htmlFor="description">Description</Label>
                                                 <Input id="description" name="description" placeholder="e.g., Monthly Fee" required />
                                             </div>
                                         </div>
                                         <DialogFooter>
                                             <Button type="button" variant="outline" onClick={() => setIsAddPaymentDialogOpen(false)}>Cancel</Button>
                                             <Button type="submit">Record Payment</Button>
                                         </DialogFooter>
                                     </form>
                                 </DialogContent>
                             </Dialog>
                         </div>
                     </CardHeader>
                     <CardContent>
                         {allPayments.length > 0 ? (
                             <Table>
                                 <TableHeader>
                                     <TableRow>
                                         <TableHead>Player</TableHead>
                                         <TableHead>Date</TableHead>
                                         <TableHead>Amount</TableHead>
                                         <TableHead>Description</TableHead>
                                         <TableHead className="text-right">Actions</TableHead>
                                     </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                     {allPayments.map(payment => {
                                          const player = allPlayers.find(p => p.id === payment.playerId);
                                          const playerName = player ? `${player.firstName} ${player.lastName}` : 'Unknown Player';
                                         return (
                                             <TableRow key={payment.id}>
                                                 <TableCell>{playerName}</TableCell>
                                                 <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                                 <TableCell>₹{payment.amount.toFixed(2)}</TableCell> {/* Updated currency symbol */}
                                                 <TableCell>{payment.description}</TableCell>
                                                 <TableCell className="text-right">
                                                     <div className="flex justify-end gap-2">
                                                         <Dialog open={isEditPaymentDialogOpen && selectedPaymentToEdit?.id === payment.id} onOpenChange={setIsEditPaymentDialogOpen}>
                                                             <DialogTrigger asChild>
                                                                 <Button variant="ghost" size="icon" onClick={() => handleEditPaymentClick(payment)}>
                                                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                         <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                         <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                     </svg>
                                                                 </Button>
                                                             </DialogTrigger>
                                                             <DialogContent>
                                                                 <DialogHeader>
                                                                     <DialogTitle>Edit Payment (Sim)</DialogTitle>
                                                                     <DialogDescription>Update payment details.</DialogDescription>
                                                                 </DialogHeader>
                                                                  {selectedPaymentToEdit && (
                                                                      <form onSubmit={handleUpdatePayment}>
                                                                          <div className="space-y-4 py-4">
                                                                               <div className="space-y-2">
                                                                                   <Label htmlFor="edit-player">Player</Label>
                                                                                   <Select name="edit-player" defaultValue={selectedPaymentToEdit.playerId.toString()} required>
                                                                                       <SelectTrigger id="edit-player">
                                                                                           <SelectValue placeholder="Select a player" />
                                                                                       </SelectTrigger>
                                                                                       <SelectContent>
                                                                                           {allPlayers.length > 0 ? (
                                                                                                allPlayers.map(player => (
                                                                                                    <SelectItem key={player.id} value={player.id.toString()}>{player.firstName} {player.lastName}</SelectItem>
                                                                                                ))
                                                                                           ) : (
                                                                                                <SelectItem value="" disabled>No players available</SelectItem>
                                                                                           )}
                                                                                       </SelectContent>
                                                                                   </Select>
                                                                               </div>
                                                                               <div className="space-y-2">
                                                                                   <Label htmlFor="edit-paymentDate">Date</Label>
                                                                                   <Input id="edit-paymentDate" name="edit-paymentDate" type="date" defaultValue={format(new Date(selectedPaymentToEdit.date), 'yyyy-MM-dd')} required /> {/* Format date for input */}
                                                                               </div>
                                                                               <div className="space-y-2">
                                                                                   <Label htmlFor="edit-amount">Amount (₹)</Label> {/* Updated label */}
                                                                                   <Input id="edit-amount" name="edit-amount" type="number" step="0.01" defaultValue={selectedPaymentToEdit.amount.toString()} required />
                                                                               </div>
                                                                               <div className="space-y-2">
                                                                                   <Label htmlFor="edit-description">Description</Label>
                                                                                   <Input id="edit-description" name="edit-description" defaultValue={selectedPaymentToEdit.description} required />
                                                                               </div>
                                                                          </div>
                                                                          <DialogFooter>
                                                                              <Button type="button" variant="outline" onClick={() => setIsEditPaymentDialogOpen(false)}>Cancel</Button>
                                                                              <Button type="submit">Update Payment</Button>
                                                                          </DialogFooter>
                                                                      </form>
                                                                  )}
                                                             </DialogContent>
                                                         </Dialog>
                                                         <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(payment.id)}>
                                                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                 <polyline points="3 6 5 6 21 6"></polyline>
                                                                 <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                 <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                 <line x1="14" y1="11" x2="14" y2="17"></line>
                                                             </svg>
                                                         </Button>
                                                     </div>
                                                 </TableCell>
                                             </TableRow>
                                         );
                                     })}
                                 </TableBody>
                             </Table>
                         ) : (
                            <p className="text-center text-gray-500">No payment records found.</p>
                         )}
                     </CardContent>
                 </Card>
              </TabsContent>


              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Log (Mock)</CardTitle>
                    <CardDescription>Recent system activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>IP Address (Mock)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentActivity.map((activity) =>
                            <TableRow key={activity.id}>
                              <TableCell>
                                <Badge variant="outline">
                                  {activity.action}
                                </Badge>
                              </TableCell>
                              <TableCell>{activity.user}</TableCell>
                              <TableCell>{activity.timestamp}</TableCell>
                              <TableCell>{activity.ip}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                       <p className="text-center text-gray-500">No recent activity found (mock).</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button variant="outline">Export Log (Mock)</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings (Sim)</CardTitle>
                    <CardDescription>Configure application settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {systemSettings.length > 0 ? (
                        systemSettings.map((setting) =>
                          <div key={setting.id} className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{setting.name}</h3>
                                <p className="text-sm text-gray-600">{setting.description}</p>
                              </div>
                              <Switch
                                checked={setting.value}
                                onCheckedChange={(checked) => handleSettingChange(setting.id, checked)} />

                            </div>
                        )
                      ) : (
                         <p className="text-center text-gray-500">No system settings found (mock).</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => toast({title: "Settings Reset (Sim)", description: "Settings reset to default."})}>Reset Defaults (Sim)</Button>
                    <Button onClick={() => toast({title: "Settings Saved (Sim)", description: "Settings changes saved."})}>Save Changes (Sim)</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions (Sim)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        System Backup (Sim)
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Backup System Data (Sim)</DialogTitle>
                        <DialogDescription>Create a backup of all system data</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Backup Options</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="users" defaultChecked />
                              <Label htmlFor="users">User data</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="sessions" defaultChecked />
                              <Label htmlFor="sessions">Training sessions</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="settings" defaultChecked />
                              <Label htmlFor="settings">System settings</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleBackup}>Start Backup (Sim)</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                   <Button variant="outline" className="w-full justify-start" onClick={handleResetDb}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.75L3 8"/>
                        <path d="M3 3v5h5"/>
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.75L21 16"/>
                        <path d="M21 21v-5h-5"/>
                     </svg>
                     Reset Database (Sim)
                   </Button>


                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Mass Email (Sim)
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Email to Users (Sim)</DialogTitle>
                        <DialogDescription>Send an email to selected user groups</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Recipient Group</Label>
                          <select className="w-full p-2 border rounded-md">
                            <option value="all">All Users</option>
                            <option value="players">All Players</option>
                            <option value="coaches">All Coaches</option>
                            <option value="admins">Administrators</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input id="subject" placeholder="Email subject line" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea id="message" placeholder="Enter your message here" className="min-h-[120px]" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSendEmail}>Send Email (Sim)</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full justify-start" onClick={() => toast({title: "Maintenance Mode (Sim)", description: "Maintenance mode toggled."})}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    Toggle Maintenance Mode (Sim)
                  </Button>

                  <Button variant="outline" className="w-full justify-start" onClick={() => toast({title: "Health Check (Sim)", description: "System health check completed. All systems nominal."})}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    System Health Check (Sim)
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Notifications (Mock)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="font-medium">New user registration</div>
                    <div className="text-sm text-gray-600">A new coach has registered and needs approval</div>
                    <div className="text-xs text-gray-500">2 hours ago</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">System update</div>
                    <div className="text-sm text-gray-600">A new version is available for installation</div>
                    <div className="text-xs text-gray-500">1 day ago</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Database backup</div>
                    <div className="text-sm text-gray-600">Weekly backup completed successfully</div>
                    <div className="text-xs text-gray-500">3 days ago</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="w-full justify-center">View All Notifications (Mock)</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-8 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© {new Date().getFullYear()} Sports Campus Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default SuperAdminDashboard;

