// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import authService from "@/services/auth.service"; // Import authService

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Use the actual simulated authService.login
    const result = await authService.login(email, password);

    setIsLoading(false); // Set loading to false after the async operation

    if (result.success) {
      toast({
        title: "Login successful",
        description: "Welcome back to Sports Campus Management System"
      });
      // authService.login already handles setting localStorage items
      navigate("/dashboard"); // Redirect to dashboard on success
    } else {
      toast({
        title: "Login failed",
        description: result.error || "An unexpected error occurred.", // Display the error message from authService
        variant: "destructive"
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call for OTP
    setTimeout(() => {
      toast({
        title: "OTP sent (Simulated)",
        description: `A verification code has been sent to ${phone}`
      });
      setOtpSent(true);
      setIsLoading(false);
    }, 1500);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call for OTP verification
    setTimeout(() => {
      toast({
        title: "Login successful (Simulated)",
        description: "Welcome back to Sports Campus Management System"
      });

      // In a real app, you would store auth token and user info
      // For demo, let's simulate setting a token and role
      localStorage.setItem('authToken', 'mock-phone-token');
      // You might need logic here to determine the role based on the phone number/OTP verification
      // For simplicity, let's just set a default role for the demo
      localStorage.setItem('userRole', 'player'); // Default role for phone login demo

      navigate("/dashboard");
      setIsLoading(false);
    }, 1500);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    // Simulate Google authentication
    setTimeout(() => {
      toast({
        title: "Google login successful (Simulated)",
        description: "Welcome back to Sports Campus Management System"
      });

      // In a real app, this would handle OAuth flow and set auth token/user info
      // For demo, let's simulate setting a token and role
      localStorage.setItem('authToken', 'mock-google-token');
      localStorage.setItem('userRole', 'player'); // Default role for Google login demo

      navigate("/dashboard");
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4" data-id="6sm21sh74" data-path="src/pages/LoginPage.tsx">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Choose your preferred login method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4 mt-4" data-id="6tzjf1ihy" data-path="src/pages/LoginPage.tsx">
                <div className="space-y-2" data-id="gajh1xaja" data-path="src/pages/LoginPage.tsx">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required />

                </div>
                <div className="space-y-2" data-id="yx79170fd" data-path="src/pages/LoginPage.tsx">
                  <div className="flex items-center justify-between" data-id="f170nmcyv" data-path="src/pages/LoginPage.tsx">
                    <Label htmlFor="password">Password</Label>
                    <Button variant="link" className="px-0" size="sm">
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required />

                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              {!otpSent ?
              <form onSubmit={handleSendOtp} className="space-y-4 mt-4" data-id="afy63s55f" data-path="src/pages/LoginPage.tsx">
                  <div className="space-y-2" data-id="zzf64mreo" data-path="src/pages/LoginPage.tsx">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required />

                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending OTP..." : "Send OTP (Sim)"}
                  </Button>
                </form> :

              <form onSubmit={handlePhoneLogin} className="space-y-4 mt-4" data-id="woh25pgwr" data-path="src/pages/LoginPage.tsx">
                  <div className="space-y-2" data-id="hk1fr5xxt" data-path="src/pages/LoginPage.tsx">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required />

                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Verify & Sign in (Sim)"}
                  </Button>
                  <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setOtpSent(false)}>

                    Change phone number
                  </Button>
                </form>
              }
            </TabsContent>

            <TabsContent value="google">
              <div className="space-y-4 mt-4" data-id="mik1nkz4f" data-path="src/pages/LoginPage.tsx">
                <Button
                  type="button"
                  className="w-full"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}>

                  {isLoading ? "Connecting..." : "Continue with Google (Sim)"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm" data-id="mvlms2d3w" data-path="src/pages/LoginPage.tsx">
            Don't have an account?{" "}
            <Button variant="link" className="p-0" onClick={() => navigate("/register")}>
              Sign up
            </Button>
          </div>
          <Button variant="link" className="p-0" onClick={() => navigate("/")}>
            Back to home
          </Button>
        </CardFooter>
      </Card>
    </div>);

};

export default LoginPage;
