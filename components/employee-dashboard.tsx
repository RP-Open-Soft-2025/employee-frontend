"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { checkAuth } from "@/redux/features/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  Award,
  Activity,
} from "lucide-react";
import { Header } from "@/components/ui/header";
import { LoadingScreen } from "./loading-screen";
import { useProtectedApi } from "@/lib/hooks/useProtectedApi";

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
    last_5_scores: number[];
  };
  chat_summary: {
    chat_id: string;
    last_message: string | null;
    last_message_time: string | null;
    unread_count: number;
    total_messages: number;
    chat_mode: string;
    is_escalated: boolean;
  };
  upcoming_meets: number;
  upcoming_sessions: number;
  company_data: {
    activity: Array<{
      Date: string;
      Teams_Messages_Sent: number;
      Emails_Sent: number;
      Meetings_Attended: number;
      Work_Hours: number;
    }>;
    leave: Array<{
      Leave_Type: string;
      Leave_Days: number;
      Leave_Start_Date: string;
      Leave_End_Date: string;
    }>;
    onboarding: Array<{
      Joining_Date: string;
      Onboarding_Feedback: string;
      Mentor_Assigned: boolean;
      Initial_Training_Completed: boolean;
    }>;
    performance: Array<{
      Review_Period: string;
      Performance_Rating: number;
      Manager_Feedback: string;
      Promotion_Consideration: boolean;
    }>;
    rewards: Array<{
      Award_Type: string;
      Award_Date: string;
      Reward_Points: number;
    }>;
    vibemeter: Array<{
      Response_Date: string;
      Vibe_Score: number;
    }>;
  };
}

interface Notification {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
}

export function EmployeeDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employeeDetails, setEmployeeDetails] =
    useState<EmployeeDetails | null>(null);
  // Add client-side only indicator to prevent hydration mismatch
  const [isClientSide, setIsClientSide] = useState(false);
  const [loading, setLoading] = useState(true);

  const employeeId = user?.employee_id;
  const userRole = user?.userRole;
  const accessToken = user?.accessToken;
  const refreshToken = user?.refreshToken;

  const { fetchProtected } = useProtectedApi();

  // Add ping effect for active chats
  useEffect(() => {
    // biome-ignore lint/style/useConst: We need let here as the variable is assigned later
    let pingInterval: NodeJS.Timeout | undefined;

    // Function to handle ping
    const handlePing = async () => {
      try {
        console.log("Making ping request");
        const response = await fetchProtected("/employee/ping", {
          method: "GET",
        });
        console.log("Ping response:", response);

        // sort the notifications by created_at date
        const sortedNotifications = response.notifications.sort(
          (a: Notification, b: Notification) => {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          }
        );

        setNotifications(sortedNotifications);
      } catch (error) {
        console.error("Failed to ping employee endpoint:", error);
      }
    };

    // Call ping immediately
    handlePing();

    // Set up interval for subsequent pings
    pingInterval = setInterval(handlePing, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      if (pingInterval) {
        // console.log("Cleaning up ping interval");
        clearInterval(pingInterval);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const result = await fetchProtected(`/employee/notification/${notificationId}/read`, {
        method: "PATCH",
      });

      // update the notifications state
      setNotifications(notifications.map(notification => 
        notification.id === notificationId ? { ...notification, status: "read" } : notification
      ));

      console.log("Notification marked as read:", result);
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

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

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchEmployeeDetails(),
        fetchEmployeeScheduledMeets(),
        fetchEmployeeScheduledSessions(),
        fetchEmployeeChats(),
      ]);
      setLoading(false);
    };

    fetchData();
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
  if (loading || !isClientSide || !isAuthenticated) {
    return <LoadingScreen />;
  }

  // Normal render for client-side with authentication
  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6">
      <Header notifications={notifications} onNotificationClick={markNotificationAsRead}>
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
                    Name
                  </p>
                  <p className="text-sm sm:text-base font-medium">
                    {employeeDetails?.name}
                  </p>
                </div>
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
                {employeeDetails?.is_blocked && (
                  <div className="text-sm text-red-500 dark:text-red-400">
                    Account is blocked
                  </div>
                )}
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
                      <span className="text-sm bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-2 py-1 rounded">
                        Total leave{leave.Leave_Days !== 1 ? 's' : ''}: {leave.Leave_Days} day{leave.Leave_Days !== 1 ? 's' : ''}
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
                Performance
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
              </div>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Activity className="size-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {employeeDetails?.company_data?.activity?.map((activity) => (
                  <div
                    key={`activity-${activity.Date}`}
                    className="border-b pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {new Date(activity.Date).toLocaleDateString()}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Teams Messages
                            </p>
                            <p className="text-sm">
                              {activity.Teams_Messages_Sent}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Emails Sent
                            </p>
                            <p className="text-sm">{activity.Emails_Sent}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Meetings
                            </p>
                            <p className="text-sm">
                              {activity.Meetings_Attended}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Work Hours
                            </p>
                            <p className="text-sm">{activity.Work_Hours}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!employeeDetails?.company_data?.activity ||
                  employeeDetails.company_data.activity.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="grid grid-cols-1 gap-4">
          {/* Mood & Vibe Card */}
          <Card className="h-full">
            <CardHeader className="pb-2 space-y-1">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <BarChart className="size-4 sm:size-5 mr-2" />
                Mood & Vibe Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Average Mood Score
                    </p>
                    <p className="text-xl sm:text-2xl font-medium">
                      {employeeDetails?.mood_stats?.average_score || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Total Sessions
                    </p>
                    <p className="text-xl sm:text-2xl font-medium">
                      {employeeDetails?.mood_stats?.total_sessions || 0}
                    </p>
                  </div>
                </div>

                {employeeDetails?.mood_stats?.last_5_scores &&
                  employeeDetails.mood_stats.last_5_scores.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Last 5 Mood Scores
                      </p>
                      <div className="grid gap-2">
                        {employeeDetails.mood_stats.last_5_scores.map(
                          (score, scoreIndex) => (
                            <div
                              key={`mood-score-${scoreIndex}-${score}`}
                              className="flex flex-col"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm">
                                  Score {scoreIndex + 1}
                                </span>
                                <span className="text-sm font-medium">
                                  {score}/5
                                </span>
                              </div>
                              <div className="w-full bg-muted/50 dark:bg-muted/30 rounded-full h-2">
                                <div
                                  className="bg-primary/80 dark:bg-primary/90 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${(score / 5) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {employeeDetails?.company_data?.vibemeter?.[0] && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Latest Vibe Check
                    </p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(
                            employeeDetails.company_data.vibemeter[0].Response_Date
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Score:{" "}
                          {employeeDetails.company_data.vibemeter[0].Vibe_Score}
                          /5
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <FileText className="size-5 mr-2" />
                Onboarding Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {employeeDetails?.company_data?.onboarding?.map(
                  (onboarding) => (
                    <div
                      key={`onboarding-${onboarding.Joining_Date}`}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Joining Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(
                            onboarding.Joining_Date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Feedback</p>
                        <p className="text-sm text-muted-foreground">
                          {onboarding.Onboarding_Feedback}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Mentor Assigned</p>
                        <p className="text-sm text-muted-foreground">
                          {onboarding.Mentor_Assigned ? "Yes" : "No"}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Initial Training</p>
                        <p className="text-sm text-muted-foreground">
                          {onboarding.Initial_Training_Completed
                            ? "Completed"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rewards Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Award className="size-5 mr-2" />
                Rewards & Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {employeeDetails?.company_data?.rewards?.map((reward) => (
                  <div
                    key={`reward-${reward.Award_Date}-${reward.Award_Type}`}
                    className="border-b pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{reward.Award_Type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reward.Award_Date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-2 py-1 rounded">
                        {reward.Reward_Points} points
                      </span>
                    </div>
                  </div>
                ))}
                {(!employeeDetails?.company_data?.rewards ||
                  employeeDetails.company_data.rewards.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No rewards yet
                  </p>
                )}
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
                            {employeeDetails.chat_summary.last_message_time
                              ? new Date(
                                  employeeDetails.chat_summary.last_message_time
                                ).toLocaleString()
                              : "No recent messages"}
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
                      {employeeDetails.chat_summary.last_message ||
                        "No messages yet"}
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
      </div>
    </div>
  );
}
