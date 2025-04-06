'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/redux/store'
import { checkAuth } from '@/redux/features/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  AlertCircle,
	UserCircle,
	Shield,
	Mail,
	Briefcase,
} from 'lucide-react'
import { Header } from '@/components/ui/header'
import { LoadingScreen } from './loading-screen'
import { useProtectedApi } from '@/lib/hooks/useProtectedApi'
import Image from 'next/image'
import logo from '@/public/images/deloitte-logo.svg'
import logoDark from '@/public/images/deloitte-logo-dark.svg'

interface EmployeeDetails {
	employee_id: string
	name: string
	email: string
	role: string
	manager_id: string
	is_blocked: boolean
  mood_stats: {
		average_score: number
		total_sessions: number
		last_5_scores: number[]
	}
  chat_summary: {
		chat_id: string
		last_message: string | null
		last_message_time: string | null
		unread_count: number
		total_messages: number
		chat_mode: string
		is_escalated: boolean
	}
	upcoming_meets: number
	upcoming_sessions: number
  company_data: {
    activity: Array<{
			Date: string
			Teams_Messages_Sent: number
			Emails_Sent: number
			Meetings_Attended: number
			Work_Hours: number
		}>
    leave: Array<{
			Leave_Type: string
			Leave_Days: number
			Leave_Start_Date: string
			Leave_End_Date: string
		}>
    onboarding: Array<{
			Joining_Date: string
			Onboarding_Feedback: string
			Mentor_Assigned: boolean
			Initial_Training_Completed: boolean
		}>
    performance: Array<{
			Review_Period: string
			Performance_Rating: number
			Manager_Feedback: string
			Promotion_Consideration: boolean
		}>
    rewards: Array<{
			Award_Type: string
			Award_Date: string
			Reward_Points: number
		}>
    vibemeter: Array<{
			Response_Date: string
			Vibe_Score: number
		}>
	}
}

interface Notification {
	id: string
	employee_id: string
	title: string
	description: string
	created_at: string
	status: string
}

export function EmployeeDashboard() {
	const router = useRouter()
	const dispatch = useDispatch()
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
	)
	const [notifications, setNotifications] = useState<Notification[]>([])
  const [employeeDetails, setEmployeeDetails] =
		useState<EmployeeDetails | null>(null)
  // Add client-side only indicator to prevent hydration mismatch
	const [isClientSide, setIsClientSide] = useState(false)
	const [loading, setLoading] = useState(true)

	const { fetchProtected } = useProtectedApi()

  // Add ping effect for active chats
  useEffect(() => {
    // biome-ignore lint/style/useConst: We need let here as the variable is assigned later
		let pingInterval: NodeJS.Timeout | undefined

    // Function to handle ping
    const handlePing = async () => {
      try {
				console.log('Making ping request')
				const response = await fetchProtected('/employee/ping', {
					method: 'GET',
				})
				console.log('Ping response:', response)

        // sort the notifications by created_at date
        const sortedNotifications = response.notifications.sort(
          (a: Notification, b: Notification) => {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
						)
          }
				)

				setNotifications(sortedNotifications)
      } catch (error) {
				console.error('Failed to ping employee endpoint:', error)
      }
		}

    // Call ping immediately
		handlePing()

    // Set up interval for subsequent pings
		pingInterval = setInterval(handlePing, 30000) // 30 seconds

    // Cleanup interval on unmount
    return () => {
      if (pingInterval) {
        // console.log("Cleaning up ping interval");
				clearInterval(pingInterval)
      }
		}

    // eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const result = await fetchProtected(
        `/employee/notification/${notificationId}/read`,
        {
					method: 'PATCH',
        }
			)

      // update the notifications state
      setNotifications(
				notifications.map(notification =>
          notification.id === notificationId
						? { ...notification, status: 'read' }
            : notification
        )
			)

			console.log('Notification marked as read:', result)
    } catch (e) {
			console.error('Failed to mark notification as read:', e)
    }
	}

  const markAllNotificationsAsRead = async () => {
    try {
      const result = await fetchProtected(
				'/employee/notification/mark_all_as_read',
        {
					method: 'PATCH',
        }
			)

      // Update all notifications to read status
      setNotifications(
				notifications.map(notification => ({
          ...notification,
					status: 'read',
        }))
			)

			console.log('All notifications marked as read:', result)
    } catch (e) {
			console.error('Failed to mark all notifications as read:', e)
    }
	}

  const fetchEmployeeDetails = async () => {
    try {
			const result = await fetchProtected('/employee/profile')
			console.log('Employee details:', result)
			setEmployeeDetails(result)
      // Process the result here
    } catch (e) {
			console.error('Failed to fetch employee details:', e)
      // Handle error here
    }
	}

  const fetchEmployeeScheduledMeets = async () => {
    try {
			const result = await fetchProtected('/employee/scheduled-meets')
			console.log('Employee scheduled meets:', result)
      // Process the result here
    } catch (e) {
			console.error('Failed to fetch employee meets:', e)
      // Handle error here
    }
	}

  const fetchEmployeeScheduledSessions = async () => {
    try {
			const result = await fetchProtected('/employee/scheduled-sessions')
			console.log('Employee scheduled sessions:', result)
      // Process the result here
    } catch (e) {
			console.error('Failed to fetch employee scheduled sessions:', e)
    }
	}

  const fetchEmployeeChats = async () => {
    try {
			const result = await fetchProtected('/employee/chats')
			console.log('Employee chats:', result)
      // Process the result here
    } catch (e) {
			console.error('Failed to fetch employee chats:', e)
    }
	}

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchEmployeeDetails(),
        fetchEmployeeScheduledMeets(),
        fetchEmployeeScheduledSessions(),
        fetchEmployeeChats(),
			])
			setLoading(false)
		}

		fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

  useEffect(() => {
    // This will only run on the client and after hydration
		setIsClientSide(true)

		dispatch(checkAuth())
    if (!isAuthenticated) {
			router.push('/login')
    }
	}, [dispatch, isAuthenticated, router])

  // If not authenticated or still on server, show a placeholder with matching structure
  if (loading || !isClientSide || !isAuthenticated) {
		return <LoadingScreen />
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
							Welcome back,{' '}
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

			<Card className="mt-4 p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900">
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
						<h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
							<UserCircle className="size-5 text-gray-700 dark:text-gray-300" />
							Employee Information
						</h4>
                </div>

					<div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
						<div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200">
							<p className="mb-2 text-lg leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
								<User className="size-3.5" />
                    Employee ID
                  </p>
							<p className="text-sm font-medium text-gray-800 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {employeeDetails?.employee_id}
                  </p>
                </div>

						<div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200">
							<p className="mb-2 text-lg leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
								<User className="size-3.5" />
								Name
							</p>
							<p className="text-sm font-medium text-gray-800 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
								{employeeDetails?.name}
							</p>
						</div>

						<div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200">
							<p className="mb-2 text-lg leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
								<Mail className="size-3.5" />
                    Email
                  </p>
							<p className="text-sm font-medium text-gray-800 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {employeeDetails?.email}
                  </p>
                </div>

						<div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200">
							<p className="mb-2 text-lg leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
								<Briefcase className="size-3.5" />
                    Role
                  </p>
							<p className="text-sm font-medium text-gray-800 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors capitalize">
                    {employeeDetails?.role}
                  </p>
                </div>

						<div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-200">
							<p className="mb-2 text-lg leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
								<Shield className="size-3.5" />
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
          </Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-4">
				{/* Left Column */}
				<div className="grid grid-cols-1 gap-3 sm:gap-4">
					{/* Enhanced Leave Information Card */}
					<Card className="h-full p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900">
						<div className="flex flex-col gap-6">
							<div>
								<h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-4 flex items-center">
                <Calendar className="size-5 mr-2" />
                Leave Information
								</h4>

								{/* Leave Summary */}
								{employeeDetails?.company_data?.leave &&
									employeeDetails.company_data.leave.length > 0 && (
										<div className="mb-6">
											<div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
												<p className="text-sm text-gray-500 dark:text-gray-400">
													Total Leave Days
												</p>
												<p className="mt-1 text-base font-medium text-gray-800 dark:text-white/90">
													{
														employeeDetails.company_data.leave[
															employeeDetails.company_data.leave.length - 1
														].Leave_Days
													}{' '}
													days
                      </p>
                    </div>
                  </div>
                )}
                
								{/* Leave Records */}
								<div>
									<h5 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
										Leave Records
									</h5>
									<div className="space-y-2 h-[140px] overflow-y-auto pr-1 custom-scrollbar">
										{employeeDetails?.company_data?.leave?.map(
											(leave, index) => {
												// Get appropriate color based on leave type
												const getLeaveTypeColor = (type: string) => {
													const lowerType = type.toLowerCase()
													if (lowerType.includes('sick')) {
														return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
													} else if (
														lowerType.includes('annual') ||
														lowerType.includes('vacation')
													) {
														return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
													} else if (lowerType.includes('casual')) {
														return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
													} else if (lowerType.includes('unpaid')) {
														return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
													}
													return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
												}

												return (
													<div
														key={`leave-${leave.Leave_Type}-${leave.Leave_Start_Date}`}
                      className="flex justify-between items-center py-2 px-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-center">
															{leave.Leave_Type.toLowerCase().includes(
																'sick'
															) ? (
                          <div className="mr-3 p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">
                            <AlertCircle className="size-4" />
                          </div>
															) : leave.Leave_Type.toLowerCase().includes(
																	'vacation'
															  ) ||
															  leave.Leave_Type.toLowerCase().includes(
																	'annual'
															  ) ? (
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
																	<span
																		className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(leave.Leave_Type)}`}
																	>
																		{leave.Leave_Type}
																	</span>
																</p>
																<p className="text-xs text-gray-500 dark:text-gray-400">
																	{new Date(
																		leave.Leave_Start_Date
																	).toLocaleDateString()}{' '}
																	-{' '}
																	{new Date(
																		leave.Leave_End_Date
																	).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      </div>
												)
											}
										)}
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

								{employeeDetails?.company_data?.performance &&
									employeeDetails.company_data.performance.length > 0 && (
                  <div>
											<div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
												<div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
													<p className="text-sm text-gray-500 dark:text-gray-400 2xl:text-sm xl:text-xs lg:text-xs md:text-xs">
														Latest Rating
													</p>
													<div className="mt-2 flex items-end">
														<p className="text-3xl font-bold text-gray-800 dark:text-white 2xl:text-2xl xl:text-xl lg:text-base md:text-lg">
															{employeeDetails.company_data.performance[0].Performance_Rating.toFixed(
																1
															)}
														</p>
														<p className="ml-1 mb-1 text-sm text-gray-500 dark:text-gray-400 2xl:text-xs xl:text-xs lg:text-xs md:text-xs">
															/5.0
														</p>
                        </div>
													<p className="mt-1 text-xs text-gray-500 dark:text-gray-400 2xl:text-xs xl:text-[10px] lg:text-[9px] md:text-[10px]">
														{
															employeeDetails.company_data.performance[0]
																.Review_Period
														}
													</p>
                      </div>
                      
												<div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
													<p className="text-sm text-gray-500 dark:text-gray-400 2xl:text-sm xl:text-xs lg:text-xs md:text-xs">
														Average Rating
													</p>
													<div className="mt-2 flex items-end">
														<p className="text-3xl font-bold text-gray-800 dark:text-white 2xl:text-2xl xl:text-xl lg:text-base md:text-lg">
															{(
																employeeDetails.company_data.performance.reduce(
																	(sum, perf) => sum + perf.Performance_Rating,
																	0
																) /
																employeeDetails.company_data.performance.length
															).toFixed(1)}
														</p>
														<p className="ml-1 mb-1 text-sm text-gray-500 dark:text-gray-400 2xl:text-xs xl:text-xs lg:text-xs md:text-xs">
															/5.0
														</p>
                            </div>
													<div className="mt-1 flex">
														{[1, 2, 3, 4, 5].map(star => (
															<svg
																key={star}
																className={`size-4 2xl:size-3.5 xl:size-3 lg:size-2 md:size-2.5 ${
																	star <=
																	Math.round(
																		employeeDetails.company_data.performance[0]
																			.Performance_Rating
																	)
																		? 'text-yellow-400'
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
													<p
														className={`mt-2 text-base font-semibold 2xl:text-sm xl:text-xs lg:text-[10px] md:text-xs truncate ${
															employeeDetails.company_data.performance[0].Manager_Feedback.toUpperCase().includes(
																'EXCEEDS'
															)
																? 'text-green-600 dark:text-green-400'
																: employeeDetails.company_data.performance[0].Manager_Feedback.toUpperCase().includes(
																			'MEETS'
																	  )
																	? 'text-blue-600 dark:text-blue-400'
																	: 'text-amber-600 dark:text-amber-400'
														}`}
													>
														{
															employeeDetails.company_data.performance[0]
																.Manager_Feedback
														}
													</p>
													<div className="mt-2">
														<span
															className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-semibold 2xl:text-[10px] xl:text-[9px] lg:text-[8px] md:text-[8px] ${
																employeeDetails.company_data.performance[0]
																	.Promotion_Consideration
																	? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
																	: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
															}`}
														>
															{employeeDetails.company_data.performance[0]
																.Promotion_Consideration
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
													{employeeDetails.company_data.performance.map(
														(performance, index) => (
															<div
																key={`perf-${performance.Review_Period}`}
																className="relative flex flex-col items-center flex-1"
															>
																<div className="relative w-full">
																	<div
																		className={`w-full rounded-t-sm ${
																			performance.Manager_Feedback.includes(
																				'EXCEEDS'
																			)
																				? 'bg-green-500 dark:bg-green-600'
																				: performance.Manager_Feedback.includes(
																							'MEETS'
																					  )
																					? 'bg-blue-500 dark:bg-blue-600'
																					: 'bg-amber-500 dark:bg-amber-600'
																		}`}
																		style={{
																			height: `${performance.Performance_Rating * 20}px`,
																		}}
																	/>
																	<div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700 dark:text-gray-300 2xl:text-[10px] xl:text-[10px] lg:text-[8px] md:text-[8px]">
																		{performance.Performance_Rating.toFixed(1)}
                        </div>
																</div>
																<span className="mt-2 text-xs text-gray-500 dark:text-gray-400 2xl:text-[10px] xl:text-[10px] lg:text-[8px] md:text-[8px]">
																	{performance.Review_Period}
																</span>
															</div>
														)
													)}
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

								{employeeDetails?.company_data?.activity &&
								employeeDetails.company_data.activity.length > 0 ? (
									<>
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
													{employeeDetails?.company_data?.activity?.map(
														(activity, index) => (
															<tr key={`activity-row-${activity.Date}`}>
																<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white/90">
																	{new Date(activity.Date).toLocaleDateString(
																		'en-GB'
																	)}
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
														)
													)}
												</tbody>
											</table>
                            </div>

										<div className="mt-6">
											<h5 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
												Activity Overview
											</h5>
											<div className="flex h-10 items-end space-x-2">
												{employeeDetails?.company_data?.activity?.map(
													(activity, index) => (
														<div
															key={`activity-chart-${activity.Date}`}
															className="relative flex flex-col items-center"
														>
															<div
																className="w-8 bg-blue-500 dark:bg-blue-600 rounded-t-sm"
																style={{
																	height: `${activity.Teams_Messages_Sent / 2}px`,
																}}
															/>
															<span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
																{new Date(activity.Date).getDate()}
															</span>
                            </div>
													)
												)}
                          </div>
										</div>
									</>
								) : (
									<div className="flex flex-col items-center justify-center py-6 text-center">
										<div className="p-4 bg-muted/30 dark:bg-muted/10 rounded-full mb-3">
											<Activity className="size-10 text-muted-foreground" />
										</div>
										<p className="text-sm text-muted-foreground">
											No activity data available
										</p>
                            </div>
								)}
                            </div>
                          </div>
					</Card>
				</div>

				{/* Right Column */}
				<div className="grid grid-cols-1 gap-4">
					{/* Onboarding Card */}
					<Card className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-900">
                          <div>
							<h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
								Onboarding & Integration
							</h4>

							{employeeDetails?.company_data?.onboarding &&
							employeeDetails.company_data.onboarding.length > 0 ? (
								(() => {
									// Find the onboarding entry with the latest joining date
									const latestOnboarding = [
										...employeeDetails.company_data.onboarding,
									].sort(
										(a, b) =>
											new Date(b.Joining_Date).getTime() -
											new Date(a.Joining_Date).getTime()
									)[0]

									return (
										<div key={`onboarding-${latestOnboarding.Joining_Date}`}>
											<div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
												<div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
													<p className="text-sm text-gray-500 dark:text-gray-400">
														Joining Date
													</p>
													<p className="mt-1 text-base font-medium text-gray-800 dark:text-white/90">
														{new Date(
															latestOnboarding.Joining_Date
														).toLocaleDateString('en-GB')}
													</p>
													<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
														{Math.ceil(
															Math.abs(
																new Date().getTime() -
																	new Date(
																		latestOnboarding.Joining_Date
																	).getTime()
															) /
																(1000 * 60 * 60 * 24)
														)}{' '}
														days ago
													</p>
                            </div>

												<div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
													<p className="text-sm text-gray-500 dark:text-gray-400">
														Onboarding Feedback
													</p>
													<div className="mt-2 flex items-center">
														<div
															className={`h-3 w-3 rounded-full ${
																latestOnboarding.Onboarding_Feedback.toUpperCase().includes('EXCELLENT')
																	? 'bg-green-500 dark:bg-green-600'
																	: latestOnboarding.Onboarding_Feedback.toUpperCase().includes('GOOD')
																		? 'bg-blue-500 dark:bg-blue-600'
																		: latestOnboarding.Onboarding_Feedback.toUpperCase().includes('AVERAGE')
																			? 'bg-yellow-500 dark:bg-yellow-600'
																			: 'bg-red-500 dark:bg-red-600'
															}`}
                              ></div>
														<p className="ml-2 text-base font-medium text-gray-800 dark:text-white/90">
															{latestOnboarding.Onboarding_Feedback}
														</p>
                            </div>
                          </div>
											</div>

                          <div>
												<h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
													Onboarding Status
												</h5>
												<div className="space-y-2">
													<div className="flex items-center">
														<div
															className={`flex h-6 w-6 items-center justify-center rounded-full border ${
																latestOnboarding.Mentor_Assigned
																	? 'border-green-500 bg-green-100 dark:border-green-500 dark:bg-green-900/30'
																	: 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
															}`}
														>
															{latestOnboarding.Mentor_Assigned && (
																<svg
																	className="h-4 w-4 text-green-500 dark:text-green-400"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M5 13l4 4L19 7"
																	/>
																</svg>
															)}
														</div>
														<p
															className={`ml-3 text-sm ${
																latestOnboarding.Mentor_Assigned
																	? 'text-gray-800 dark:text-white/90'
																	: 'text-gray-500 dark:text-gray-400'
															}`}
														>
															Mentor Assigned
														</p>
                            </div>

													<div className="flex items-center">
														<div
															className={`flex h-6 w-6 items-center justify-center rounded-full border ${
																latestOnboarding.Initial_Training_Completed
																	? 'border-green-500 bg-green-100 dark:border-green-500 dark:bg-green-900/30'
																	: 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
															}`}
														>
															{latestOnboarding.Initial_Training_Completed && (
																<svg
																	className="h-4 w-4 text-green-500 dark:text-green-400"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M5 13l4 4L19 7"
																	/>
																</svg>
															)}
                            </div>
														<p
															className={`ml-3 text-sm ${
																latestOnboarding.Initial_Training_Completed
																	? 'text-gray-800 dark:text-white/90'
																	: 'text-gray-500 dark:text-gray-400'
															}`}
														>
															Initial Training Completed
														</p>
                          </div>
                        </div>
                      </div>
                    </div>
									)
								})()
							) : (
								<div className="flex flex-col items-center justify-center py-6 text-center">
									<div className="p-4 bg-muted/30 dark:bg-muted/10 rounded-full mb-3">
										<User className="size-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
										No onboarding data available
                  </p>
								</div>
                )}
              </div>
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
									{employeeDetails?.company_data?.rewards &&
										employeeDetails.company_data.rewards.length > 0 && (
											<div className="mt-2 sm:mt-0">
												<span className="text-xs text-gray-500 dark:text-gray-400">
													Total Reward Points:
												</span>
												<span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
													{employeeDetails.company_data.rewards.reduce(
														(total, r) => total + r.Reward_Points,
														0
													)}
                      </span>
                    </div>
										)}
                </div>

								{employeeDetails?.company_data?.rewards &&
								employeeDetails.company_data.rewards.length > 0 ? (
									<>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
											{employeeDetails.company_data.rewards.map(
												(reward, index) => (
													<div
														key={`reward-${reward.Award_Type}-${reward.Award_Date}`}
														className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
													>
														<div className="mb-3 flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
															{/* Using a fallback icon display since we don't have actual icons */}
															<div className="size-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
																{reward.Award_Type.charAt(0)}
															</div>
														</div>

														{/* Also fix the star icon */}
														<svg
															className="size-4 text-yellow-400"
															fill="currentColor"
															viewBox="0 0 20 20"
														>
															<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
														</svg>
														<span className="ml-1 text-xs font-medium text-gray-800 dark:text-white/90">
															{reward.Reward_Points} pts
                                </span>
													</div>
												)
											)}
                                </div>

										<div className="mt-6">
											<h5 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
												Rewards Progress
											</h5>
											<div className="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-700">
												<div
													className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                                  style={{
														width: `${(() => {
															const currentPoints =
																employeeDetails.company_data.rewards.reduce(
																	(total, r) => total + r.Reward_Points,
																	0
																)
															const goalPoints =
																Math.ceil(currentPoints / 500) * 500
															return (currentPoints / goalPoints) * 100
														})()}%`,
                                  }}
                                />
                              </div>
											<div className="mt-2 flex justify-between">
												<span className="text-xs text-gray-500 dark:text-gray-400">
													Current:{' '}
													{employeeDetails.company_data.rewards.reduce(
														(total, r) => total + r.Reward_Points,
														0
													)}
												</span>
												<span className="text-xs text-gray-500 dark:text-gray-400">
													Goal:{' '}
													{Math.ceil(
														employeeDetails.company_data.rewards.reduce(
															(total, r) => total + r.Reward_Points,
															0
														) / 500
													) * 500}
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
												const score =
													employeeDetails.company_data.vibemeter[0].Vibe_Score
												const normalizedScore = score > 5 ? score / 2 : score

												const getColorForScore = () => {
													if (normalizedScore >= 4.5) return 'bg-emerald-500'
													if (normalizedScore >= 3.5) return 'bg-blue-500'
													if (normalizedScore >= 2.5) return 'bg-amber-500'
													if (normalizedScore >= 1.5) return 'bg-orange-500'
													return 'bg-red-500'
												}

												const getTextColorForScore = () => {
													if (normalizedScore >= 4.5) return 'text-emerald-600 dark:text-emerald-400'
													if (normalizedScore >= 3.5) return 'text-blue-600 dark:text-blue-400'
													if (normalizedScore >= 2.5) return 'text-amber-600 dark:text-amber-400'
													if (normalizedScore >= 1.5) return 'text-orange-600 dark:text-orange-400'
													return 'text-red-600 dark:text-red-400'
												}

												const getLabelForScore = () => {
													if (normalizedScore >= 4.5) return 'Excellent'
													if (normalizedScore >= 3.5) return 'Good'
													if (normalizedScore >= 2.5) return 'Satisfactory'
													if (normalizedScore >= 1.5) return 'Needs Improvement'
													return 'Critical'
												}

												return (
													<>
														<div
															className={`rounded-full ${getColorForScore()} size-32 flex items-center justify-center shadow-lg`}
														>
															<span className="text-white text-4xl font-bold">
																{normalizedScore.toFixed(1)}
                          </span>
                        </div>

														<h3
															className={`text-2xl font-bold mt-4 ${getTextColorForScore()}`}
														>
															{getLabelForScore()}
														</h3>
													</>
												)
											})()}
                      </div>

										<div className="mt-6 flex flex-col items-center w-full max-w-md">
											<div className="flex items-center justify-between w-full mb-2 p-1">
												<span className="text-xs text-red-500 font-medium">
													Critical
												</span>
												<span className="text-xs text-emerald-500 font-medium">
													Excellent
												</span>
                    </div>

											{/* Colorful bar with gradient background */}
											<div className="w-full h-4 rounded-full mb-4 relative bg-gradient-to-r from-red-500 via-orange-500 via-amber-500 via-blue-500 to-emerald-500">
												{/* Score marker/indicator */}
												<div
													className="absolute bottom-full mb-1"
													style={{
														left: `calc(${(employeeDetails.company_data.vibemeter[0].Vibe_Score - 1) * 25 - (employeeDetails.company_data.vibemeter[0].Vibe_Score-3)/2}% - 8px)`,
														transition: 'left 0.3s ease-in-out',
													}}
												>
													<div className="size-0 border-x-[8px] border-t-[8px] border-transparent border-t-gray-800 dark:border-t-white mx-auto" />
                      </div>
                      </div>

											{/* Score points with colored indicators */}
											<div className="flex justify-between w-full px-0 relative">
												{[1, 2, 3, 4, 5].map(value => {
													const score =
														employeeDetails.company_data.vibemeter[0].Vibe_Score
													const normalizedScore = score

													const getColorForPoint = (point: number) => {
														switch (point) {
															case 1:
																return 'bg-red-500 dark:bg-red-600'
															case 2:
																return 'bg-orange-500 dark:bg-orange-600'
															case 3:
																return 'bg-amber-500 dark:bg-amber-600'
															case 4:
																return 'bg-green-500 dark:bg-green-600'
															case 5:
																return 'bg-emerald-500 dark:bg-emerald-600'
															default:
																return 'bg-gray-400 dark:bg-gray-600'
														}
													}

													const getTextColorForPoint = (point: number) => {
														switch (point) {
															case 1:
																return 'text-red-600 dark:text-red-400'
															case 2:
																return 'text-orange-600 dark:text-orange-400'
															case 3:
																return 'text-amber-600 dark:text-amber-400'
															case 4:
																return 'text-green-600 dark:text-green-400'
															case 5:
																return 'text-emerald-600 dark:text-emerald-400'
															default:
																return 'text-gray-600 dark:text-gray-400'
														}
													}

													return (
														<div
															key={value}
															className="flex flex-col items-center"
														>
															<div
																className={`size-4 rounded-full mb-1 ${getColorForPoint(
																	value
																)}`}
															/>
															<div
																className={`text-xs font-medium ${getTextColorForPoint(value)}`}
															>
																{value}
                      </div>
														</div>
													)
												})}
                    </div>
                  </div>
                  
										<div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg w-full max-w-md">
											<div className="flex justify-between mb-2">
												<p className="text-sm font-medium text-gray-700 dark:text-gray-300">
													Current Score
												</p>
												<p
													className={`text-sm font-semibold ${(() => {
														const score =
															employeeDetails.company_data.vibemeter[0]
																.Vibe_Score
														const normalizedScore =
															score > 5 ? score / 2 : score

														if (normalizedScore >= 4.5)
															return 'text-emerald-600 dark:text-emerald-400'
														if (normalizedScore >= 3.5) return 'text-blue-600 dark:text-blue-400'
														if (normalizedScore >= 2.5) return 'text-amber-600 dark:text-amber-400'
														if (normalizedScore >= 1.5) return 'text-orange-600 dark:text-orange-400'
														return 'text-red-600 dark:text-red-400'
													})()}`}
												>
													{(employeeDetails.company_data.vibemeter[0]
														.Vibe_Score > 5
														? employeeDetails.company_data.vibemeter[0]
																.Vibe_Score / 2
														: employeeDetails.company_data.vibemeter[0]
																.Vibe_Score
													).toFixed(1)}
													/5
												</p>
                      </div>

											<div className="flex justify-between">
												<p className="text-sm font-medium text-gray-700 dark:text-gray-300">
													Last Update
												</p>
												<p className="text-sm text-gray-600 dark:text-gray-400">
													{new Date(
														employeeDetails.company_data.vibemeter[0].Response_Date
													).toLocaleDateString('en-GB', {
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

								{!employeeDetails?.company_data?.vibemeter?.[0] && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="p-4 bg-muted/30 dark:bg-muted/10 rounded-full mb-3">
											<BarChart className="size-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
											No vibe data available yet
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
							{employeeDetails?.chat_summary ? (
                <div
                  className="grid gap-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-black/10 transition-colors border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md dark:shadow-zinc-900 backdrop-blur-sm"
                  onClick={() =>
                    router.push(
                      `/session?id=${employeeDetails.chat_summary.chat_id}`
                    )
                  }
									role="button"
									tabIndex={0}
									onKeyDown={e => {
										if (e.key === 'Enter' || e.key === ' ') {
											router.push(
												`/session?id=${employeeDetails.chat_summary.chat_id}`
											)
										}
									}}
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
														: 'No recent messages'}
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
											'No messages yet'}
                  </p>
                    </div>
							) : (
								<div className="flex flex-col items-center justify-center py-6 text-center">
									<div className="p-4 bg-muted/30 dark:bg-muted/10 rounded-full mb-3">
										<MessageSquare className="size-10 text-muted-foreground" />
									</div>
									<p className="text-sm text-muted-foreground">
										No chat sessions available
									</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
								variant="primary"
                size="sm"
                className="w-full"
								onClick={() => router.push('/session')}
              >
                View Sessions
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
	)
}
