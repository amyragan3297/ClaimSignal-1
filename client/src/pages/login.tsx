import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Users, User, Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, register, setupTeam } = useAuth();
  const { toast } = useToast();

  const [teamUsername, setTeamUsername] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teamStatus, setTeamStatus] = useState<{ isSetup: boolean } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/team/status')
      .then(res => res.json())
      .then(data => {
        setTeamStatus(data);
        setStatusLoading(false);
      })
      .catch(() => setStatusLoading(false));
  }, []);

  const handleTeamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!teamStatus?.isSetup) {
      const result = await setupTeam(teamUsername, teamPassword);
      if (result.success) {
        toast({ title: "Team account created", description: "You can now share these credentials with your team." });
        window.location.href = '/adjusters';
      } else {
        toast({ title: "Setup failed", description: result.error, variant: "destructive" });
        setLoading(false);
      }
    } else {
      const result = await login('team', { username: teamUsername, password: teamPassword });
      if (result.success) {
        window.location.href = '/adjusters';
        return;
      } else {
        toast({ title: "Login failed", description: result.error || "Invalid credentials", variant: "destructive" });
        setLoading(false);
      }
    }
  };

  const handleIndividualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegistering) {
      const result = await register(email, password);
      if (result.success) {
        if (result.needsSubscription) {
          window.location.href = "/pricing";
        } else {
          window.location.href = "/adjusters";
        }
        return;
      } else {
        toast({ title: "Registration failed", description: result.error, variant: "destructive" });
        setLoading(false);
      }
    } else {
      const result = await login('individual', { email, password });
      if (result.success) {
        if (result.needsSubscription) {
          window.location.href = '/pricing';
        } else {
          window.location.href = '/adjusters';
        }
        return;
      } else {
        toast({ title: "Login failed", description: result.error || "Invalid credentials", variant: "destructive" });
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-white">ClaimSignal</h1>
          </div>
          <p className="text-slate-400">Adjuster Intelligence & Claim Analytics</p>
        </div>

        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="team" className="flex items-center gap-2" data-testid="tab-team">
              <Users className="h-4 w-4" />
              Team Login
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-2" data-testid="tab-individual">
              <User className="h-4 w-4" />
              Individual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {statusLoading ? "Loading..." : teamStatus?.isSetup ? "Team Login" : "Create Team Account"}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {teamStatus?.isSetup 
                    ? "Use your shared team credentials to access the dashboard."
                    : "Set up your team username and password. Share these with your team members."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form 
                  className="space-y-4"
                  onSubmit={handleTeamLogin}
                >
                  <div className="space-y-2">
                    <Label htmlFor="team-username" className="text-slate-300">Username</Label>
                    <Input
                      id="team-username"
                      name="username"
                      data-testid="input-team-username"
                      value={teamUsername}
                      onChange={(e) => setTeamUsername(e.target.value)}
                      placeholder="Enter team username"
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-password" className="text-slate-300">Password</Label>
                    <Input
                      id="team-password"
                      name="password"
                      data-testid="input-team-password"
                      type="password"
                      value={teamPassword}
                      onChange={(e) => setTeamPassword(e.target.value)}
                      placeholder="Enter team password"
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-600 hover:bg-amber-500"
                    disabled={loading}
                    data-testid="button-team-submit"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {teamStatus?.isSetup ? "Sign In" : "Create Team Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {isRegistering ? "Create Account" : "Individual Login"}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {isRegistering 
                    ? "Create your personal account. A subscription is required for access."
                    : "Sign in with your personal account."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleIndividualAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      data-testid="input-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <Input
                      id="password"
                      data-testid="input-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isRegistering ? "Create a password (6+ characters)" : "Enter your password"}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                      minLength={isRegistering ? 6 : undefined}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-500"
                    disabled={loading}
                    data-testid="button-individual-submit"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isRegistering ? "Create Account" : "Sign In"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white"
                    onClick={() => setIsRegistering(!isRegistering)}
                    data-testid="button-toggle-register"
                  >
                    {isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
