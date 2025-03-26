"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { checkAuth } from "@/redux/features/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageSquare,
  Bell,
  Calendar,
  FileText,
  User,
  BarChart,
} from "lucide-react";
import { Header } from "@/components/ui/header";
import { LoadingScreen } from "./loading-screen";
import { useProtectedApi } from "@/lib/hooks/useProtectedApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface EmployeeDetails {
  employee_id: string;
  name: string;
  email: string;
  role: string;
  manager_id: string;
  is_blocked: boolean;
  mood_stats: {
    average_score: number;
    total_sessions: number;
    emotion_distribution: {
      "Sad Zone": number;
      "Leaning to Sad Zone": number;
      "Neutral Zone (OK)": number;
      "Leaning to Happy Zone": number;
      "Happy Zone": number;
    };
    last_5_scores: number[];
  };
  chat_summary: {
    chat_id: string;
    last_message: string;
    last_message_time: string;
    chat_mode: string;
    is_escalated: boolean;
    total_messages: number;
    unread_count: number;
  };
  company_data: {
    activity: any[];
    leave: Array<{
      Leave_Type: string;
      Leave_Days: number;
      Leave_Start_Date: string;
      Leave_End_Date: string;
    }>;
    onboarding: any[];
    performance: Array<{
      Review_Period: string;
      Performance_Rating: number;
      Manager_Feedback: string;
    }>;
    rewards: any[];
    vibemeter: Array<{
      Response_Date: string;
      Vibe_Score: number;
      Emotion_Zone: string;
    }>;
  };
  upcoming_meets: number;
  upcoming_sessions: number;
}

export function EmployeeDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const [notifications, setNotifications] = useState(3);
  const [employeeDetails, setEmployeeDetails] =
    useState<EmployeeDetails | null>(null);
  // Add client-side only indicator to prevent hydration mismatch
  const [isClientSide, setIsClientSide] = useState(false);

  const employeeId = user?.employee_id;
  const userRole = user?.userRole;
  const accessToken = user?.accessToken;
  const refreshToken = user?.refreshToken;

  const { fetchProtected } = useProtectedApi();

  const fetchEmployeeDetails = async () => {
    try {
      const result = await fetchProtected("/employee/profile");
      console.log("Employee details:", result);
      setEmployeeDetails(result);
      // Process the result here
    } catch (e) {
      console.error("Failed to fetch employee details:", e);
      // Handle error here
    }
  };

  const fetchEmployeeScheduledMeets = async () => {
    try {
      const result = await fetchProtected("/employee/scheduled-meets");
      console.log("Employee scheduled meets:", result);
      // Process the result here
    } catch (e) {
      console.error("Failed to fetch employee meets:", e);
      // Handle error here
    }
  };

  const fetchEmployeeScheduledSessions = async () => {
    try {
      const result = await fetchProtected("/employee/scheduled-sessions");
      console.log("Employee scheduled sessions:", result);
      // Process the result here
    } catch (e) {
      console.error("Failed to fetch employee scheduled sessions:", e);
    }
  };

  const fetchEmployeeChats = async () => {
    try {
      const result = await fetchProtected("/employee/chats");
      console.log("Employee chats:", result);
      // Process the result here
    } catch (e) {
      console.error("Failed to fetch employee chats:", e);
    }
  };

  const fetchEmployeeChatMessages = async (chatId: string) => {
    try {
      const result = await fetchProtected(`/employee/chats/${chatId}/messages`);
      console.log("Employee chat messages:", result);
      // Process the result here
    } catch (e) {
      console.error("Failed to fetch employee chat messages:", e);
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
    fetchEmployeeScheduledMeets();
    fetchEmployeeScheduledSessions();
    fetchEmployeeChatMessages("CHATE54BE3");
    fetchEmployeeChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // This will only run on the client and after hydration
    setIsClientSide(true);

    dispatch(checkAuth());
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [dispatch, isAuthenticated, router]);

  // If not authenticated or still on server, show a placeholder with matching structure
  if (!isClientSide || !isAuthenticated) {
    return <LoadingScreen />;
  }

  // Normal render for client-side with authentication
  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6">
      <Header notifications={notifications}>
        <h1 className="text-2xl sm:text-3xl font-bold hidden md:block">
          Welcome, {employeeDetails?.employee_id}
        </h1>
        <p className="text-muted-foreground hidden md:block">
          Your employee dashboard
        </p>
        <h1 className="text-xl sm:text-2xl font-bold md:hidden">Dashboard</h1>
      </Header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-4">
        {/* Left Column */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {/* Employee Profile Card */}
          <Card className="h-full">
            <CardHeader className="pb-2 space-y-1">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <User className="size-4 sm:size-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:gap-3">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Employee ID
                  </p>
                  <p className="text-sm sm:text-base font-medium">
                    {employeeDetails?.employee_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Email
                  </p>
                  <p className="text-sm sm:text-base font-medium break-all">
                    {employeeDetails?.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Role
                  </p>
                  <p className="text-sm sm:text-base font-medium capitalize">
                    {employeeDetails?.role}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Manager ID
                  </p>
                  <p className="text-sm sm:text-base font-medium">
                    {employeeDetails?.manager_id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Information Card */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Calendar className="size-5 mr-2" />
                Leave Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {employeeDetails?.company_data?.leave?.map((leave, index) => (
                  <div
                    key={`${leave.Leave_Type}-${leave.Leave_Start_Date}`}
                    className="border-b pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{leave.Leave_Type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(
                            leave.Leave_Start_Date
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(leave.Leave_End_Date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {leave.Leave_Days} days
                      </span>
                    </div>
                  </div>
                ))}
                {(!employeeDetails?.company_data?.leave ||
                  employeeDetails.company_data.leave.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No leave records found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <BarChart className="size-5 mr-2" />
                Performance & Vibe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {employeeDetails?.company_data?.performance?.[0] && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Latest Performance Review
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">
                          {
                            employeeDetails.company_data.performance[0]
                              .Review_Period
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Rating:{" "}
                          {
                            employeeDetails.company_data.performance[0]
                              .Performance_Rating
                          }
                          /5
                        </p>
                      </div>
                      <p className="text-sm italic">
                        &ldquo;
                        {
                          employeeDetails.company_data.performance[0]
                            .Manager_Feedback
                        }
                        &rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {employeeDetails?.company_data?.vibemeter?.[0] && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Latest Vibe Check
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">
                          {
                            employeeDetails.company_data.vibemeter[0]
                              .Emotion_Zone
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Score:{" "}
                          {employeeDetails.company_data.vibemeter[0].Vibe_Score}
                          /5 •{" "}
                          {new Date(
                            employeeDetails.company_data.vibemeter[0].Response_Date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="grid grid-cols-1 gap-4">
          {/* Mood Stats Card */}
          <Card className="h-full">
            <CardHeader className="pb-2 space-y-1">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <BarChart className="size-4 sm:size-5 mr-2" />
                Mood Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Average Score
                    </p>
                    <p className="text-xl sm:text-2xl font-medium">
                      {employeeDetails?.mood_stats.average_score}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Total Sessions
                    </p>
                    <p className="text-xl sm:text-2xl font-medium">
                      {employeeDetails?.mood_stats.total_sessions}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Emotion Distribution
                  </p>
                  <div className="grid gap-2">
                    {employeeDetails?.mood_stats.emotion_distribution &&
                      Object.entries(
                        employeeDetails.mood_stats.emotion_distribution
                      ).map(([emotion, count]) => (
                        <div key={emotion} className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">{emotion}</span>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${
                                  (count /
                                    Object.values(
                                      employeeDetails.mood_stats
                                        .emotion_distribution
                                    ).reduce((a, b) => a + b, 0)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Summary Card */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <MessageSquare className="size-5 mr-2" />
                Recent Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {employeeDetails?.chat_summary && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <MessageSquare className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {employeeDetails.chat_summary.chat_mode === "bot"
                              ? "AI Assistant"
                              : "HR Chat"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              employeeDetails.chat_summary.last_message_time
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {employeeDetails.chat_summary.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {employeeDetails.chat_summary.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {employeeDetails.chat_summary.last_message}
                    </p>
                    {employeeDetails.chat_summary.is_escalated && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <Bell className="size-4" />
                        Escalated to HR
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push("/chat")}
              >
                Open Chat
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Quick Actions Card - Full Width Bottom */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2 space-y-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <FileText className="size-4 sm:size-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Common tasks and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-3 sm:py-4"
              >
                <FileText className="size-5 sm:size-6 mb-1 sm:mb-2" />
                <span className="text-sm sm:text-base">Documents</span>
                {(employeeDetails?.company_data?.activity?.length ?? 0) > 0 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {employeeDetails?.company_data?.activity?.length} updates
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-3 sm:py-4"
              >
                <Calendar className="size-5 sm:size-6 mb-1 sm:mb-2" />
                <span className="text-sm sm:text-base">Schedule</span>
                {(employeeDetails?.upcoming_meets ?? 0) > 0 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {employeeDetails?.upcoming_meets} upcoming
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-3 sm:py-4 w-full"
              >
                <Bell className="size-5 sm:size-6 mb-1 sm:mb-2" />
                <span className="text-sm sm:text-base">Sessions</span>
                {(employeeDetails?.upcoming_sessions ?? 0) > 0 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {employeeDetails?.upcoming_sessions} scheduled
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-3 sm:py-4"
                onClick={() => router.push("/chat")}
              >
                <MessageSquare className="size-5 sm:size-6 mb-1 sm:mb-2" />
                <span className="text-sm sm:text-base">Chat</span>
                {(employeeDetails?.chat_summary?.unread_count ?? 0) > 0 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {employeeDetails?.chat_summary?.unread_count} unread
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
