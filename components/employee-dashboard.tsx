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
  Send,
  Star,
  StarHalf,
  Clock,
  Check,
  AlertCircle,
  UserCircle,
  Shield,
  CreditCard,
  Mail,
  Briefcase,
} from "lucide-react";
import { Header } from "@/components/ui/header";
import { LoadingScreen } from "./loading-screen";
import { useProtectedApi } from "@/lib/hooks/useProtectedApi";
import Image from "next/image";
import logo from "@/public/images/deloitte-logo.svg";
import logoDark from "@/public/images/deloitte-logo-dark.svg";

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
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employeeDetails, setEmployeeDetails] =
    useState<EmployeeDetails | null>(null);
  // Add client-side only indicator to prevent hydration mismatch
  const [isClientSide, setIsClientSide] = useState(false);
  const [loading, setLoading] = useState(true);

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
      const result = await fetchProtected(
        `/employee/notification/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      // update the notifications state
      setNotifications(
        notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: "read" }
            : notification
        )
      );

      console.log("Notification marked as read:", result);
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const result = await fetchProtected(
        "/employee/notification/mark_all_as_read",
        {
          method: "PATCH",
        }
      );

      // Update all notifications to read status
      setNotifications(
        notifications.map((notification) => ({
          ...notification,
          status: "read",
        }))
      );

      console.log("All notifications marked as read:", result);
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
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
      <Header
        notifications={notifications}
        onNotificationClick={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
      >
        <Image src={logo} alt="Logo" className="h-8 w-auto dark:hidden" />
        <Image
          src={logoDark}
          alt="Logo"
          className="h-8 w-auto hidden dark:block"
        />
      </Header>

      <Card className="bg-white dark:bg-gray-900 p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg">
        <CardContent>
          <div className="flex flex-col items-center text-center space-y-2 pt-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back,{" "}
              <span className="text-primary dark:text-primary-foreground text-nowrap">
                {employeeDetails?.name}
              </span>
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-muted-foreground max-w-screen-toast-mobile">
              Your employee dashboard
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-4">
        {/* Left Column */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {/* Enhanced Employee Profile Card */}
          <Card className="h-full p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="w-full">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    Employee Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                  <div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200">
                    <p className="mb-2 text-lg leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-2xl" />
                      Full Name
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {employeeDetails?.name}
                    </p>
                  </div>

                  <div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200">
                    <p className="mb-2 text-lg leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      Employee ID
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {employeeDetails?.employee_id}
                    </p>
                  </div>

                  <div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200">
                    <p className="mb-2 text-lg leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-all">
                      {employeeDetails?.email}
                    </p>
                  </div>

                  <div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200">
                    <p className="mb-2 text-lg leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      Role
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors capitalize">
                      {employeeDetails?.role}
                    </p>
                  </div>

                  <div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200">
                    <p className="mb-2 text-lg leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Manager ID
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {employeeDetails?.manager_id}
                    </p>
                  </div>

                  {employeeDetails?.is_blocked && (
                    <div className="group p-3 rounded-lg bg-red-50 dark:bg-red-900/20 transition-colors duration-200">
                      <p className="mb-2 text-lg leading-normal text-red-500 dark:text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Account Status
                      </p>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        Account is blocked
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Leave Information Card */}
          <Card className="h-full p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900">
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-4 flex items-center">
                  <Calendar className="size-5 mr-2" />
                  Leave Information
                </h4>

                {/* Leave Summary */}
                {employeeDetails?.company_data?.leave && employeeDetails.company_data.leave.length > 0 && (
                  <div className="mb-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Leave Days
                      </p>
                      <p className="mt-1 text-base font-medium text-gray-800 dark:text-white/90">
                        {employeeDetails.company_data.leave.reduce((total, leave) => total + leave.Leave_Days, 0)} days
                      </p>
                    </div>
                  </div>
                )}

                {/* Leave Records */}
                <div>
                  <h5 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Leave Records
                  </h5>
                  <div className="space-y-2">
                    {employeeDetails?.company_data?.leave?.map((leave, index) => {
                      // Get appropriate color based on leave type
                      const getLeaveTypeColor = (type: string) => {
                        const lowerType = type.toLowerCase();
                        if (lowerType.includes('sick')) {
                          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                        } else if (lowerType.includes('annual') || lowerType.includes('vacation')) {
                          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
                        } else if (lowerType.includes('casual')) {
                          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                        } else if (lowerType.includes('unpaid')) {
                          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                        }
                        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
                      };

                      return (
                        <div
                          key={`leave-${index}`}
                          className="flex justify-between items-center py-2 px-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                        >
                          <div className="flex items-center">
                            {leave.Leave_Type.toLowerCase().includes('sick') ? (
                              <div className="mr-3 p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">
                                <AlertCircle className="size-4" />
                              </div>
                            ) : leave.Leave_Type.toLowerCase().includes('vacation') || leave.Leave_Type.toLowerCase().includes('annual') ? (
                              <div className="mr-3 p-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                                <Calendar className="size-4" />
                              </div>
                            ) : (
                              <div className="mr-3 p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                                <Clock className="size-4" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(leave.Leave_Type)}`}>
                                  {leave.Leave_Type}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(leave.Leave_Start_Date).toLocaleDateString()} - {new Date(leave.Leave_End_Date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-full">
                            <span className="text-sm font-medium">{leave.Leave_Days} days</span>
                          </div>
                        </div>
                      );
                    })}
                    {(!employeeDetails?.company_data?.leave ||
                      employeeDetails.company_data.leave.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No leave records found
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Performance Card */}
          <Card className="h-full p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4 2xl:text-lg xl:text-base lg:text-sm md:text-sm flex items-center">
                  <BarChart className="size-5 mr-2" />
                  Performance Overview
                </h4>

                {employeeDetails?.company_data?.performance && employeeDetails.company_data.performance.length > 0 && (
                  <div>
                    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 2xl:text-sm xl:text-xs lg:text-xs md:text-xs">
                          Latest Rating
                        </p>
                        <div className="mt-2 flex items-end">
                          <p className="text-3xl font-bold text-gray-800 dark:text-white 2xl:text-2xl xl:text-xl lg:text-base md:text-lg">
                            {employeeDetails.company_data.performance[0].Performance_Rating.toFixed(1)}
                          </p>
                          <p className="ml-1 mb-1 text-sm text-gray-500 dark:text-gray-400 2xl:text-xs xl:text-xs lg:text-xs md:text-xs">
                            /5.0
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 2xl:text-xs xl:text-[10px] lg:text-[9px] md:text-[10px]">
                          {employeeDetails.company_data.performance[0].Review_Period}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 2xl:text-sm xl:text-xs lg:text-xs md:text-xs">
                          Average Rating
                        </p>
                        <div className="mt-2 flex items-end">
                          <p className="text-3xl font-bold text-gray-800 dark:text-white 2xl:text-2xl xl:text-xl lg:text-base md:text-lg">
                            {(employeeDetails.company_data.performance.reduce((sum, perf) => sum + perf.Performance_Rating, 0) / employeeDetails.company_data.performance.length).toFixed(1)}
                          </p>
                          <p className="ml-1 mb-1 text-sm text-gray-500 dark:text-gray-400 2xl:text-xs xl:text-xs lg:text-xs md:text-xs">
                            /5.0
                          </p>
                        </div>
                        <div className="mt-1 flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`h-4 w-4 2xl:h-3.5 2xl:w-3.5 xl:h-3 xl:w-3 lg:h-2 lg:w-2 md:h-2.5 md:w-2.5 ${
                                star <= Math.round(employeeDetails.company_data.performance[0].Performance_Rating) 
                                  ? 'text-yellow-500' 
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-800 sm:col-span-2 lg:col-span-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400 2xl:text-sm xl:text-xs lg:text-xs md:text-xs">
                          Manager Feedback
                        </p>
                        <p className={`mt-2 text-base font-semibold 2xl:text-sm xl:text-xs lg:text-[10px] md:text-xs truncate ${
                          employeeDetails.company_data.performance[0].Manager_Feedback.includes('EXCEEDS') 
                            ? 'text-green-600 dark:text-green-500' 
                            : employeeDetails.company_data.performance[0].Manager_Feedback.includes('MEETS') 
                              ? 'text-blue-600 dark:text-blue-500' 
                              : 'text-amber-600 dark:text-amber-500'
                        }`}>
                          {employeeDetails.company_data.performance[0].Manager_Feedback}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-semibold 2xl:text-[10px] xl:text-[9px] lg:text-[8px] md:text-[8px] ${
                            employeeDetails.company_data.performance[0].Promotion_Consideration 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {employeeDetails.company_data.performance[0].Promotion_Consideration
                              ? 'Promotion Considered'
                              : 'No Promotion'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h5 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300 2xl:text-sm xl:text-xs lg:text-xs md:text-xs">
                        Performance History
                      </h5>
                      <div className="mt-4 flex items-end space-x-2 h-32">
                        {employeeDetails.company_data.performance.map((performance, index) => (
                          <div
                            key={index}
                            className="relative flex flex-col items-center flex-1"
                          >
                            <div className="relative w-full">
                              <div
                                className={`w-full rounded-t-sm ${
                                  performance.Manager_Feedback.includes('EXCEEDS')
                                    ? 'bg-green-500 dark:bg-green-600'
                                    : performance.Manager_Feedback.includes('MEETS')
                                      ? 'bg-blue-500 dark:bg-blue-600'
                                      : 'bg-amber-500 dark:bg-amber-600'
                                }`}
                                style={{
                                  height: `${performance.Performance_Rating * 20}px`,
                                }}
                              ></div>
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700 dark:text-gray-300 2xl:text-[10px] xl:text-[10px] lg:text-[8px] md:text-[8px]">
                                {performance.Performance_Rating.toFixed(1)}
                              </div>
                            </div>
                            <span className="mt-2 text-xs text-gray-500 dark:text-gray-400 2xl:text-[10px] xl:text-[10px] lg:text-[8px] md:text-[8px]">
                              {performance.Review_Period}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Enhanced Activity Card */}
          <Card className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900">
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6 flex items-center">
                  <Activity className="size-5 mr-2" />
                  Recent Activity
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Teams Messages
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Emails Sent
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Meetings Attended
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Work Hours
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                      {employeeDetails?.company_data?.activity?.map((activity, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white/90">
                            {new Date(activity.Date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white/90">
                            {activity.Teams_Messages_Sent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white/90">
                            {activity.Emails_Sent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white/90">
                            {activity.Meetings_Attended}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white/90">
                            {activity.Work_Hours}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <h5 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Activity Overview
                  </h5>
                  <div className="flex h-10 items-end space-x-2">
                    {employeeDetails?.company_data?.activity?.map((activity, index) => (
                      <div
                        key={index}
                        className="relative flex flex-col items-center"
                      >
                        <div
                          className="w-8 bg-blue-500 dark:bg-blue-600 rounded-t-sm"
                          style={{ height: `${activity.Teams_Messages_Sent / 2}px` }}
                        ></div>
                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.Date).getDate()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="grid grid-cols-1 gap-4">
          {/* Enhanced Mood & Vibe Card */}
          <Card className="h-full p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900">
            <div className="flex flex-col">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6 flex items-center">
                <BarChart className="size-5 mr-2" />
                Mood & Vibe Statistics
              </h4>

              <div className="grid gap-4">
                {employeeDetails?.company_data?.vibemeter?.[0] && (
                  <div className="flex flex-col items-center justify-center p-6">
                    <div className="mb-6 text-center">
                      {/* Determine color based on score */}
                      {(() => {
                        const score = employeeDetails.company_data.vibemeter[0].Vibe_Score;
                        const normalizedScore = score > 5 ? score / 2 : score;
                        
                        const getColorForScore = () => {
                          if (normalizedScore >= 4.5) return 'bg-emerald-500';
                          if (normalizedScore >= 3.5) return 'bg-blue-500';
                          if (normalizedScore >= 2.5) return 'bg-amber-500';
                          if (normalizedScore >= 1.5) return 'bg-orange-500';
                          return 'bg-red-500';
                        };
                        
                        const getTextColorForScore = () => {
                          if (normalizedScore >= 4.5) return 'text-emerald-500';
                          if (normalizedScore >= 3.5) return 'text-blue-500';
                          if (normalizedScore >= 2.5) return 'text-amber-500';
                          if (normalizedScore >= 1.5) return 'text-orange-500';
                          return 'text-red-500';
                        };
                        
                        const getLabelForScore = () => {
                          if (normalizedScore >= 4.5) return 'Excellent';
                          if (normalizedScore >= 3.5) return 'Good';
                          if (normalizedScore >= 2.5) return 'Satisfactory';
                          if (normalizedScore >= 1.5) return 'Needs Improvement';
                          return 'Critical';
                        };
                        
                        return (
                          <>
                            <div className={`rounded-full ${getColorForScore()} w-32 h-32 flex items-center justify-center shadow-lg`}>
                              <span className="text-white text-4xl font-bold">{normalizedScore.toFixed(1)}</span>
                            </div>
                            
                            <h3 className={`text-2xl font-bold mt-4 ${getTextColorForScore()}`}>
                              {getLabelForScore()}
                            </h3>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="mt-6 flex flex-col items-center w-full max-w-md">
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-xs text-red-500 font-medium">Critical</span>
                        <span className="text-xs text-emerald-500 font-medium">Excellent</span>
                      </div>
                      
                      {/* Colorful bar with gradient background */}
                      <div className="w-full h-4 rounded-full mb-4 relative bg-gradient-to-r from-red-500 via-orange-500 via-amber-500 via-blue-500 to-emerald-500">
                        {/* Score marker/indicator */}
                        <div 
                          className="absolute bottom-full mb-1"
                          style={{ 
                            left: `calc(${(employeeDetails.company_data.vibemeter[0].Vibe_Score / 5) * 100}% - 8px)`,
                            transition: 'left 0.3s ease-in-out'
                          }}
                        >
                          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-transparent border-t-gray-800 dark:border-t-white mx-auto"></div>
                        </div>
                      </div>
                      
                      {/* Score points with colored indicators */}
                      <div className="flex justify-between w-full px-2 relative">
                        {[1, 2, 3, 4, 5].map((value) => {
                          const score = employeeDetails.company_data.vibemeter[0].Vibe_Score;
                          const normalizedScore = score > 5 ? score / 2 : score;
                          
                          const getColorForPoint = (point: number) => {
                            switch(point) {
                              case 1: return 'bg-red-500';
                              case 2: return 'bg-orange-500';
                              case 3: return 'bg-amber-500';
                              case 4: return 'bg-blue-500';
                              case 5: return 'bg-emerald-500';
                              default: return 'bg-gray-400';
                            }
                          };
                          
                          const getTextColorForPoint = (point: number) => {
                            switch(point) {
                              case 1: return 'text-red-500';
                              case 2: return 'text-orange-500';
                              case 3: return 'text-amber-500';
                              case 4: return 'text-blue-500';
                              case 5: return 'text-emerald-500';
                              default: return 'text-gray-400';
                            }
                          };
                          
                          return (
                            <div key={value} className="flex flex-col items-center">
                              <div 
                                className={`w-4 h-4 rounded-full mb-1 ${
                                  normalizedScore >= value - 0.5 ? getColorForPoint(value) : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              ></div>
                              <div className={`text-xs font-medium ${normalizedScore >= value - 0.5 ? getTextColorForPoint(value) : 'text-gray-500 dark:text-gray-400'}`}>
                                {value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg w-full max-w-md">
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Current Score
                        </p>
                        <p className={`text-sm font-semibold ${(() => {
                          const score = employeeDetails.company_data.vibemeter[0].Vibe_Score;
                          const normalizedScore = score > 5 ? score / 2 : score;
                          
                          if (normalizedScore >= 4.5) return 'text-emerald-500';
                          if (normalizedScore >= 3.5) return 'text-blue-500';
                          if (normalizedScore >= 2.5) return 'text-amber-500';
                          if (normalizedScore >= 1.5) return 'text-orange-500';
                          return 'text-red-500';
                        })()}`}>
                          {(employeeDetails.company_data.vibemeter[0].Vibe_Score > 5 
                            ? employeeDetails.company_data.vibemeter[0].Vibe_Score / 2 
                            : employeeDetails.company_data.vibemeter[0].Vibe_Score).toFixed(1)}/5
                        </p>
                      </div>
                      
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Last Update
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(employeeDetails.company_data.vibemeter[0].Response_Date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Keep the original mood stats display */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex flex-col items-center">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Average Mood Score
                    </p>
                    <div className="relative w-24 h-24">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Background circle */}
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="45" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="8" 
                          opacity="0.1" 
                        />
                        {/* Foreground circle - calculated based on score/5 */}
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="45" 
                          fill="none" 
                          stroke="url(#moodGradient)" 
                          strokeWidth="8" 
                          strokeDasharray={`${2 * Math.PI * 45 * (employeeDetails?.mood_stats?.average_score || 0) / 5} ${2 * Math.PI * 45}`} 
                          strokeDashoffset={2 * Math.PI * 45 * 0.25} 
                          strokeLinecap="round" 
                          className="transition-all duration-1000 ease-in-out" 
                        />
                        {/* Add gradient definition */}
                        <defs>
                          <linearGradient id="moodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#10B981" />
                          </linearGradient>
                        </defs>
                        <text 
                          x="50" 
                          y="50" 
                          textAnchor="middle" 
                          fontSize="18" 
                          fontWeight="bold"
                          fill="currentColor"
                          dominantBaseline="middle"
                        >
                          {employeeDetails?.mood_stats?.average_score || 0}/5
                        </text>
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Total Sessions
                    </p>
                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 rounded-full p-6 flex items-center justify-center shadow-inner">
                      <span className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                        {employeeDetails?.mood_stats?.total_sessions || 0}
                      </span>
                    </div>
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
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={`star-${star}`} className="transition-all duration-300 hover:scale-110">
                                      {star <= score ? (
                                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                                      ) : star - 0.5 <= score ? (
                                        <StarHalf className="size-4 text-yellow-500 fill-yellow-500" />
                                      ) : (
                                        <Star className="size-4 text-zinc-300" />
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="w-full bg-muted/50 dark:bg-muted/30 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
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
              </div>
            </div>
          </Card>

          {/* Onboarding Card */}
          <Card className="h-full p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900">
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

          {/* Enhanced Rewards Card */}
          <Card className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between lg:mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center">
                    <Award className="size-5 mr-2" />
                    Rewards & Recognition
                  </h4>
                  {employeeDetails?.company_data?.rewards && employeeDetails.company_data.rewards.length > 0 && (
                    <div className="mt-2 sm:mt-0">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Total Reward Points:
                      </span>
                      <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                        {employeeDetails.company_data.rewards.reduce((total, r) => total + r.Reward_Points, 0)}
                      </span>
                    </div>
                  )}
                </div>

                {employeeDetails?.company_data?.rewards && employeeDetails.company_data.rewards.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {employeeDetails.company_data.rewards.map((reward, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                        >
                          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                            {/* Using a fallback icon display since we don't have actual icons */}
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                              {reward.Award_Type.charAt(0)}
                            </div>
                          </div>
                          <h5 className="mb-1 text-center text-sm font-medium text-gray-800 dark:text-white/90">
                            {reward.Award_Type}
                          </h5>
                          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                            {new Date(reward.Award_Date).toLocaleDateString('en-GB')}
                          </p>
                          <div className="mt-2 flex items-center justify-center">
                            <svg
                              className="h-4 w-4 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="ml-1 text-xs font-medium text-gray-800 dark:text-white/90">
                              {reward.Reward_Points} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <h5 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Rewards Progress
                      </h5>
                      <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${(employeeDetails.company_data.rewards.reduce((total, r) => total + r.Reward_Points, 0) / 2000) * 100}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Current: {employeeDetails.company_data.rewards.reduce((total, r) => total + r.Reward_Points, 0)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Goal: 2000
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="p-4 bg-muted/30 dark:bg-muted/10 rounded-full mb-3">
                      <Award className="size-10 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No rewards yet. Keep up the good work!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Chat Summary Card */}
          <Card className="h-full p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center">
                <MessageSquare className="size-5 mr-2" />
                Recent Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employeeDetails?.chat_summary && (
                <div
                  className="grid gap-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-black/10 transition-colors border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md dark:shadow-zinc-900 backdrop-blur-sm"
                  onClick={() =>
                    router.push(
                      `/session?id=${employeeDetails.chat_summary.chat_id}`
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <Send className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {employeeDetails.chat_summary.chat_id}
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
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => router.push("/session")}
              >
                View Sessions
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
