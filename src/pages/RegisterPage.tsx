import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
    emergencyContact: "",
    address: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are the same",
        variant: "destructive"
      });
      return;
    }

    setStep(3);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully"
      });

      // In a real app, this would create a user account and handle authentication
      navigate("/dashboard");
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4" data-id="02cz1vwn2" data-path="src/pages/RegisterPage.tsx">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            {step === 1 ? "Choose your role to get started" :
            step === 2 ? "Fill in your basic information" :
            "Complete your profile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 &&
          <div className="space-y-4" data-id="yzvxvsrfq" data-path="src/pages/RegisterPage.tsx">
              <div className="grid grid-cols-2 gap-4" data-id="12e2bdqhy" data-path="src/pages/RegisterPage.tsx">
                <Button
                onClick={() => handleRoleSelect("player")}
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-2">

                  <div className="text-xl" data-id="5plupkhng" data-path="src/pages/RegisterPage.tsx">🏃‍♂️</div>
                  <span className="font-medium" data-id="tsoqkp27i" data-path="src/pages/RegisterPage.tsx">Player</span>
                </Button>
                <Button
                onClick={() => handleRoleSelect("coach")}
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-2">

                  <div className="text-xl" data-id="j0eiib83u" data-path="src/pages/RegisterPage.tsx">🧑‍🏫</div>
                  <span className="font-medium" data-id="3nm78xmgf" data-path="src/pages/RegisterPage.tsx">Coach</span>
                </Button>
              </div>
            </div>
          }

          {step === 2 &&
          <form onSubmit={handleStep1Submit} className="space-y-4" data-id="ag4cjw0fh" data-path="src/pages/RegisterPage.tsx">
              <div className="grid grid-cols-1 gap-4" data-id="ti3dleo2n" data-path="src/pages/RegisterPage.tsx">
                <div className="space-y-2" data-id="49idam4mm" data-path="src/pages/RegisterPage.tsx">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required />

                </div>
                <div className="space-y-2" data-id="dv696wcdr" data-path="src/pages/RegisterPage.tsx">
                  <Label htmlFor="email">Email</Label>
                  <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required />

                </div>
                <div className="space-y-2" data-id="2o8jykxwo" data-path="src/pages/RegisterPage.tsx">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required />

                </div>
                <div className="space-y-2" data-id="t5f0pms3w" data-path="src/pages/RegisterPage.tsx">
                  <Label htmlFor="password">Password</Label>
                  <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required />

                </div>
                <div className="space-y-2" data-id="xnc837sc9" data-path="src/pages/RegisterPage.tsx">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required />

                </div>
              </div>
              <div className="flex justify-between mt-4" data-id="x5epljk9h" data-path="src/pages/RegisterPage.tsx">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit">
                  Continue
                </Button>
              </div>
            </form>
          }

          {step === 3 &&
          <form onSubmit={handleFinalSubmit} className="space-y-4" data-id="1aae9t4kn" data-path="src/pages/RegisterPage.tsx">
              <div className="grid grid-cols-2 gap-4" data-id="xv3j7db7d" data-path="src/pages/RegisterPage.tsx">
                <div className="space-y-2" data-id="8uocdg7gr" data-path="src/pages/RegisterPage.tsx">
                  <Label htmlFor="age">Age</Label>
                  <Input
                  id="age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleInputChange}
                  required />

                </div>
                <div className="space-y-2" data-id="q325qrzv2" data-path="src/pages/RegisterPage.tsx">
                  <Label htmlFor="gender">Gender</Label>
                  <RadioGroup defaultValue="male" className="flex space-x-4">
                    <div className="flex items-center space-x-2" data-id="wzth5j9d0" data-path="src/pages/RegisterPage.tsx">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2" data-id="m7mqt00s0" data-path="src/pages/RegisterPage.tsx">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="space-y-2" data-id="73j2rp3s9" data-path="src/pages/RegisterPage.tsx">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                required />

              </div>
              <div className="space-y-2" data-id="vvmnze54r" data-path="src/pages/RegisterPage.tsx">
                <Label htmlFor="address">Address</Label>
                <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required />

              </div>
              {role === 'player' &&
            <div className="p-4 bg-gray-50 rounded-md" data-id="vq3anze6q" data-path="src/pages/RegisterPage.tsx">
                  <p className="text-sm text-gray-600 mb-2" data-id="sx1hhbatl" data-path="src/pages/RegisterPage.tsx">
                    You're registering as a <strong data-id="tmc8p55sy" data-path="src/pages/RegisterPage.tsx">Player</strong>. After registration, you'll be able to:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1" data-id="7cfjk7akr" data-path="src/pages/RegisterPage.tsx">
                    <li data-id="89cl0l320" data-path="src/pages/RegisterPage.tsx">Enroll in sports programs</li>
                    <li data-id="5mhq7yw64" data-path="src/pages/RegisterPage.tsx">View your training schedule</li>
                    <li data-id="v02djb265" data-path="src/pages/RegisterPage.tsx">Track your attendance and performance</li>
                  </ul>
                </div>
            }
              {role === 'coach' &&
            <div className="p-4 bg-gray-50 rounded-md" data-id="gjf7gg3od" data-path="src/pages/RegisterPage.tsx">
                  <p className="text-sm text-gray-600 mb-2" data-id="pyqn5dxfi" data-path="src/pages/RegisterPage.tsx">
                    You're registering as a <strong data-id="r2tnjdidf" data-path="src/pages/RegisterPage.tsx">Coach</strong>. After registration, you'll be able to:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1" data-id="vbuaq84rm" data-path="src/pages/RegisterPage.tsx">
                    <li data-id="b239ri1ks" data-path="src/pages/RegisterPage.tsx">View assigned players and batches</li>
                    <li data-id="38ekggh32" data-path="src/pages/RegisterPage.tsx">Mark attendance and add training notes</li>
                    <li data-id="413wk9one" data-path="src/pages/RegisterPage.tsx">Communicate with players and administrators</li>
                  </ul>
                </div>
            }
              <div className="flex justify-between mt-4" data-id="yqi7hx23d" data-path="src/pages/RegisterPage.tsx">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>
          }
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm" data-id="shk4ij3qc" data-path="src/pages/RegisterPage.tsx">
            Already have an account?{" "}
            <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
              Sign in
            </Button>
          </div>
          <Button variant="link" className="p-0" onClick={() => navigate("/")}>
            Back to home
          </Button>
        </CardFooter>
      </Card>
    </div>);

};

export default RegisterPage;