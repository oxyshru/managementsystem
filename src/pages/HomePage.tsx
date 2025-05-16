import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import DatabaseConnectionTest from "@/components/DatabaseConnectionTest";

export default function HomePage() {
  return (
    <div className="container mx-auto p-4" data-id="nggd2hai1" data-path="src/pages/HomePage.tsx">
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8" data-id="lvam8d5nd" data-path="src/pages/HomePage.tsx">
        <div className="text-center space-y-4" data-id="lesv8cl3p" data-path="src/pages/HomePage.tsx">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-500 to-purple-700 bg-clip-text text-transparent" data-id="ou1isc31p" data-path="src/pages/HomePage.tsx">
            Sports Team Management
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl" data-id="fmutlke77" data-path="src/pages/HomePage.tsx">
            A complete platform for players and coaches to manage teams, track performance, and schedule training sessions.
          </p>
          <div className="flex gap-4 justify-center pt-4" data-id="79cz80e9o" data-path="src/pages/HomePage.tsx">
            <Button asChild size="lg">
              <Link to="/register">Get Started</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="features" className="w-full max-w-4xl">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="db">Database</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="features" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-id="vrrofdv33" data-path="src/pages/HomePage.tsx">
              <Card>
                <CardHeader>
                  <CardTitle>Player Management</CardTitle>
                  <CardDescription>Track player statistics and progress</CardDescription>
                </CardHeader>
                <CardContent>
                  Monitor individual player performance, track statistics, and visualize improvement over time.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Coach Dashboard</CardTitle>
                  <CardDescription>Manage teams and training</CardDescription>
                </CardHeader>
                <CardContent>
                  Schedule training sessions, record attendance, and provide personalized feedback to players.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                  <CardDescription>Data-driven insights</CardDescription>
                </CardHeader>
                <CardContent>
                  Analyze team and individual statistics to make informed decisions and improve performance.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Super Admin</CardTitle>
                  <CardDescription>Complete control</CardDescription>
                </CardHeader>
                <CardContent>
                  Manage all users, configure system settings, and monitor platform performance from a single dashboard.
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="db" className="space-y-4 mt-6">
            <Card className="border-none shadow-none">
              <CardHeader>
                <CardTitle>MySQL Database Connection</CardTitle>
                <CardDescription>
                  Test your connection to the MySQL database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DatabaseConnectionTest />
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-6">
                <p className="text-sm text-center text-gray-500 max-w-md" data-id="ly2aipghw" data-path="src/pages/HomePage.tsx">
                  The application uses a MySQL database to store user profiles, player statistics, training sessions, and attendance records.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="about" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>About the Platform</CardTitle>
                <CardDescription>
                  Built with modern technologies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p data-id="iz8h3mltq" data-path="src/pages/HomePage.tsx">
                  This sports team management platform is built with React, TypeScript, and Tailwind CSS for the frontend, with a MySQL database backend.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-id="b0swvuct6" data-path="src/pages/HomePage.tsx">
                  <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" data-id="qyu974x6p" data-path="src/pages/HomePage.tsx">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold" data-id="mczdjw0tu" data-path="src/pages/HomePage.tsx">React</span>
                    <span className="text-xs text-gray-500" data-id="n6dfxhx1q" data-path="src/pages/HomePage.tsx">Frontend</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" data-id="5ww80bbb4" data-path="src/pages/HomePage.tsx">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold" data-id="hbecfj5h2" data-path="src/pages/HomePage.tsx">TypeScript</span>
                    <span className="text-xs text-gray-500" data-id="6tccp8lch" data-path="src/pages/HomePage.tsx">Type Safety</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" data-id="50n7xp07q" data-path="src/pages/HomePage.tsx">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold" data-id="ktnkhwyy3" data-path="src/pages/HomePage.tsx">MySQL</span>
                    <span className="text-xs text-gray-500" data-id="9smwuisx7" data-path="src/pages/HomePage.tsx">Database</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" data-id="lrqqoeqm1" data-path="src/pages/HomePage.tsx">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold" data-id="11w978wmf" data-path="src/pages/HomePage.tsx">ShadcnUI</span>
                    <span className="text-xs text-gray-500" data-id="97jpy65um" data-path="src/pages/HomePage.tsx">Components</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>);

}