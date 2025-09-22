// App.tsx
import React, { useState, useEffect } from "react";
import { Alert, SafeAreaView } from "react-native";
import { synchronizationService } from "./services/SynchronizationService";
import LoginScreen from "./screens/LoginScreen";
import SuperAdminDashboard from "./screens/SuperAdminDashboard";
import AdminDashboard from "./screens/AdminDashboard";
import ManageParticipantScreen from "./screens/ManageParticipantScreen";
import RegisterParticipantScreen from "./screens/RegisterParticipantScreen";
import BulkImportScreen from "./screens/BulkImportScreen";
import ApproveParticipantsScreen from "./screens/ApproveParticipantsScreen";
import ViewParticipantsScreen from "./screens/ViewParticipantsScreen";
import ManageStaffScreen from "./screens/ManageStaffScreen";
import RegisterStaffScreen from "./screens/RegisterStaffScreen";
import ViewStaffScreen from "./screens/ViewStaffScreen";
import StaffDashboard from "./screens/StaffDashboard";
import ManageQuestionScreen from "./screens/ManageQuestionScreen";
import UploadQuestionsScreen from "./screens/UploadQuestionsScreen";
import ManageChecklistScreen from "./screens/ManageChecklistScreen";
import ChecklistViewScreen from "./screens/ChecklistViewScreen";
import ChecklistResultsScreen from "./screens/ChecklistResultsScreen";
import UploadChecklistScreen from "./screens/UploadChecklistScreen";
import ViewEditDeleteChecklistScreen from "./screens/ViewEditDeleteChecklistScreen";
import ChecklistSettingsScreen from "./screens/ChecklistSettingsScreen";
import PreTestScreen from "./screens/PreTestScreen";
import PostTestScreen from "./screens/PostTestScreen";
import TestInterfaceScreen from "./screens/TestInterfaceScreen";
import TestResultsScreen from "./screens/TestResultsScreen";
import QuestionPoolManagementScreen from "./screens/QuestionPoolManagementScreen";
import AccessControlManagementScreen from "./screens/AccessControlManagementScreen";
import ResultsAnalyticsScreen from "./screens/ResultsAnalyticsScreen";
import ImportResultsScreen from "./screens/ImportResultsScreen";
import BulkImportResultsScreen from "./screens/BulkImportResultsScreen";
import ResultViewScreen from "./screens/ResultViewScreen";
import ResultAnalysisScreen from "./screens/ResultAnalysisScreen";
import ResultSettingsScreen from "./screens/ResultSettingsScreen";
import CertificateManagementScreen from "./screens/CertificateManagementScreen";
import ComprehensiveResultsScreen from "./screens/ComprehensiveResultsScreen_NEW";
// FORCE UPDATE - NEW FILE IMPORTED
import CreateCourseScreen from "./screens/CreateCourseScreen";
import ViewCoursesScreen from "./screens/ViewCoursesScreen";
import EditCourseScreen from "./screens/EditCourseScreen";
import AttendanceMonitoringScreen from "./screens/AttendanceMonitoringScreen";
import AppRouter from "./screens/AppRouter";
import { ROUTES } from "./routes/routeMap";
import { SystemSettingsService } from "./services/SystemSettingsService";

interface UserData {
  id: string; // UUID from profiles table
  email: string;
  isSuperAdmin: boolean;
  userName: string;
  roles: 'admin' | 'staff' | 'user';
}

type Screen = 'login' | 'dashboard' | 'manageParticipant' | 'registerParticipant' | 'bulkImport' | 'approveParticipants' | 'viewParticipants' | 'manageStaff' | 'registerStaff' | 'viewStaff' | 'staffDashboard' | 'manageQuestions' | 'uploadQuestions' | 'manageChecklist' | 'checklistView' | 'checklistResults' | 'uploadChecklist' | 'viewEditDeleteChecklist' | 'checklistSettings' | 'preTest' | 'postTest' | 'testSettings' | 'testInterface' | 'testResults' | 'questionPoolManagement' | 'accessControlManagement' | 'resultsAnalytics' | 'importResults' | 'bulkImportResults' | 'resultView' | 'resultAnalysis' | 'resultSettings' | 'certificateManagement' | 'comprehensiveResults' | 'createCourse' | 'viewCourses' | 'editCourse' | 'attendanceMonitoring';
// Add systemSettings route to local Screen type union
type ScreenWithSettings = Screen | 'systemSettings';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenWithSettings>(ROUTES.login as ScreenWithSettings);
  const [testResults, setTestResults] = useState<any>(null);
  const [currentTestType, setCurrentTestType] = useState<'pre' | 'post'>('pre');
  const [currentChecklistType, setCurrentChecklistType] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [allowedActions, setAllowedActions] = useState<string[] | undefined>(undefined);

  // Initialize synchronization service
  useEffect(() => {
    const initializeSync = async () => {
      try {
        console.log('🚀 Initializing synchronization service...');
        await synchronizationService.startListening();
        console.log('✅ Synchronization service started successfully');
      } catch (error) {
        console.error('❌ Failed to initialize synchronization service:', error);
      }
    };

    initializeSync();

    // Cleanup on unmount
    return () => {
      synchronizationService.stopListening();
    };
  }, []);

  const handleLogin = async (loginData: UserData) => {
    setUserData(loginData);
    setIsLoggedIn(true);
    // Route based on role and system settings
    try {
      const settings = await SystemSettingsService.getSettings();
      // Compute allowed actions for this role
      if (loginData.roles === 'staff') {
        setAllowedActions(settings.allowedActionsByRole.staff);
      } else if (loginData.roles === 'user') {
        setAllowedActions(settings.allowedActionsByRole.user);
      } else {
        setAllowedActions(undefined);
      }
      if (loginData.roles === 'admin' || loginData.isSuperAdmin) {
        setCurrentScreen(ROUTES.dashboard as ScreenWithSettings);
      } else if (loginData.roles === 'staff') {
        const dest = settings.landingByRole.staff;
        setCurrentScreen((ROUTES as any)[dest] as ScreenWithSettings);
      } else {
        const dest = settings.landingByRole.user;
        setCurrentScreen((ROUTES as any)[dest] as ScreenWithSettings);
      }
    } catch (e) {
      setCurrentScreen(ROUTES.dashboard as ScreenWithSettings);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    setCurrentScreen(ROUTES.login as Screen);
  };

  const handleNavigateToManageParticipant = () => {
    setCurrentScreen(ROUTES.manageParticipant as Screen);
  };

  const handleBackToDashboard = () => {
    setCurrentScreen(ROUTES.dashboard as Screen);
  };

  const handleBackToDashboardFromChecklist = () => {
    setCurrentScreen(ROUTES.dashboard as Screen);
  };

  const handleNavigateToRegisterParticipant = () => {
    setCurrentScreen(ROUTES.registerParticipant as Screen);
  };

  const handleBackToManageParticipant = () => {
    setCurrentScreen(ROUTES.manageParticipant as Screen);
  };

  const handleNavigateToBulkImport = () => {
    setCurrentScreen(ROUTES.bulkImport as Screen);
  };

  const handleNavigateToApproveParticipants = () => {
    setCurrentScreen(ROUTES.approveParticipants as Screen);
  };

  const handleNavigateToViewParticipants = () => {
    setCurrentScreen(ROUTES.viewParticipants as Screen);
  };

  const handleNavigateToManageStaff = () => {
    setCurrentScreen(ROUTES.manageStaff as Screen);
  };

  const handleNavigateToRegisterStaff = () => {
    setCurrentScreen(ROUTES.registerStaff as Screen);
  };

  const handleNavigateToViewStaff = () => {
    setCurrentScreen(ROUTES.viewStaff as Screen);
  };

  const handleBackToManageStaff = () => {
    setCurrentScreen(ROUTES.manageStaff as Screen);
  };

  const handleNavigateToStaffDashboard = () => {
    setCurrentScreen(ROUTES.staffDashboard as Screen);
  };

  const handleBackToStaffDashboard = () => {
    setCurrentScreen(ROUTES.staffDashboard as Screen);
  };

  const handleNavigateToManageQuestions = () => {
    setCurrentScreen(ROUTES.manageQuestions as Screen);
  };

  const handleNavigateToUploadQuestions = () => {
    setCurrentScreen(ROUTES.uploadQuestions as Screen);
  };

  const handleNavigateToManageChecklist = () => {
    setCurrentScreen(ROUTES.manageChecklist as Screen);
  };

  const handleNavigateToViewEditDeleteChecklist = () => {
    setCurrentScreen(ROUTES.viewEditDeleteChecklist as Screen);
  };

  const handleNavigateToChecklistSettings = () => {
    setCurrentScreen(ROUTES.checklistSettings as Screen);
  };

  const handleNavigateToChecklistView = (checklistType: string) => {
    console.log('handleNavigateToChecklistView called with:', checklistType);
    console.log('Current screen before:', currentScreen);
    setCurrentChecklistType(checklistType);
    setCurrentScreen(ROUTES.checklistView as Screen);
    console.log('Current screen after:', 'checklistView');
  };

  const handleNavigateToChecklistResults = () => {
    console.log('handleNavigateToChecklistResults called');
    setCurrentScreen(ROUTES.checklistResults as Screen);
  };

  const handleNavigateToPreTest = () => {
    console.log('handleNavigateToPreTest called');
    console.log('Current screen before:', currentScreen);
    setCurrentScreen(ROUTES.preTest as Screen);
    console.log('Current screen after:', 'preTest');
  };

  const handleNavigateToPostTest = () => {
    console.log('handleNavigateToPostTest called');
    console.log('Current screen before:', currentScreen);
    setCurrentScreen(ROUTES.postTest as Screen);
    console.log('Current screen after:', 'postTest');
  };

  // Begin a test by setting type and navigating to the test interface
  const handleNavigateToTestInterface = (testType: 'pre' | 'post') => {
    console.log('handleNavigateToTestInterface called with:', testType);
    setCurrentTestType(testType);
    setCurrentScreen(ROUTES.testInterface as Screen);
  };

  const handleNavigateToTestSettings = () => {
    console.log('handleNavigateToTestSettings called');
    console.log('Current screen before:', currentScreen);
    setCurrentScreen(ROUTES.testSettings as Screen);
    console.log('Current screen after:', 'testSettings');
  };

  const handleShowTestResults = (results: any) => {
    setTestResults(results);
    setCurrentScreen(ROUTES.testResults as Screen);
  };

  const handleBackFromResults = () => {
    setTestResults(null);
    setCurrentScreen('manageQuestions');
  };

  const handleNavigateToQuestionPools = () => {
    console.log('handleNavigateToQuestionPools called');
    setCurrentScreen(ROUTES.questionPoolManagement as Screen);
  };

  const handleNavigateToAccessControl = () => {
    console.log('handleNavigateToAccessControl called');
    setCurrentScreen(ROUTES.accessControlManagement as Screen);
  };

  const handleNavigateToResults = () => {
    console.log('handleNavigateToResults called');
    setCurrentScreen(ROUTES.resultsAnalytics as Screen);
  };

  const handleNavigateToImportResults = () => {
    console.log('handleNavigateToImportResults called');
    setCurrentScreen(ROUTES.importResults as Screen);
  };

  const handleNavigateToBulkImportResults = () => {
    console.log('handleNavigateToBulkImportResults called');
    setCurrentScreen(ROUTES.bulkImportResults as Screen);
  };

  const handleNavigateToResultView = () => {
    console.log('handleNavigateToResultView called');
    setCurrentScreen(ROUTES.resultView as Screen);
  };

  const handleNavigateToResultAnalysis = () => {
    console.log('handleNavigateToResultAnalysis called');
    setCurrentScreen(ROUTES.resultAnalysis as Screen);
  };

  const handleNavigateToResultSettings = () => {
    console.log('handleNavigateToResultSettings called');
    setCurrentScreen(ROUTES.resultSettings as Screen);
  };

  const handleNavigateToCertificateManagement = () => {
    console.log('handleNavigateToCertificateManagement called');
    setCurrentScreen(ROUTES.certificateManagement as Screen);
  };

  const handleNavigateToComprehensiveResults = () => {
    console.log('handleNavigateToComprehensiveResults called');
    setCurrentScreen(ROUTES.comprehensiveResults as Screen);
  };

  const handleNavigateToCreateCourse = () => {
    console.log('handleNavigateToCreateCourse called');
    setCurrentScreen(ROUTES.createCourse as Screen);
  };

  const handleNavigateToAttendanceMonitoring = () => {
    console.log('handleNavigateToAttendanceMonitoring called');
    setCurrentScreen(ROUTES.attendanceMonitoring as Screen);
  };

  const handleNavigateToViewCourses = () => {
    console.log('handleNavigateToViewCourses called');
    setCurrentScreen(ROUTES.viewCourses as Screen);
  };

  const handleEditCourse = (course: any) => {
    console.log('handleEditCourse called with course:', course);
    setSelectedCourse(course);
    setCurrentScreen(ROUTES.editCourse as Screen);
  };

  const handleBackFromEditCourse = () => {
    setSelectedCourse(null);
    setCurrentScreen(ROUTES.viewCourses as Screen);
  };

  const handleCourseUpdated = () => {
    console.log('Course updated successfully');
    // The ViewCoursesScreen will refresh automatically when we go back
  };

  const handleBackToManageChecklist = () => {
    setCurrentScreen('manageChecklist');
  };

  const handleNavigateToSystemSettings = () => {
    setCurrentScreen(ROUTES.systemSettings as ScreenWithSettings);
  };

  // Render via AppRouter to keep file short and maintainable (logic unchanged)
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
    <AppRouter
      currentScreen={currentScreen}
      isLoggedIn={isLoggedIn}
      userData={userData}
      testResults={testResults}
      currentTestType={currentTestType}
      currentChecklistType={currentChecklistType}
      selectedCourse={selectedCourse}
      allowedActions={allowedActions}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onBackToDashboard={handleBackToDashboard}
      onBackToDashboardFromChecklist={handleBackToDashboardFromChecklist}
      onNavigateToManageParticipant={handleNavigateToManageParticipant}
      onNavigateToRegisterParticipant={handleNavigateToRegisterParticipant}
      onNavigateToBulkImport={handleNavigateToBulkImport}
      onNavigateToViewParticipants={handleNavigateToViewParticipants}
      onNavigateToApproveParticipants={handleNavigateToApproveParticipants}
      onNavigateToManageStaff={handleNavigateToManageStaff}
      onNavigateToRegisterStaff={handleNavigateToRegisterStaff}
      onNavigateToViewStaff={handleNavigateToViewStaff}
      onNavigateToStaffDashboard={handleNavigateToStaffDashboard}
      onBackToManageParticipant={handleBackToManageParticipant}
      onBackToManageStaff={handleBackToManageStaff}
      onNavigateToManageQuestions={handleNavigateToManageQuestions}
      onNavigateToUploadQuestions={handleNavigateToUploadQuestions}
      onNavigateToPreTest={handleNavigateToPreTest}
      onNavigateToPostTest={handleNavigateToPostTest}
      onNavigateToTestSettings={handleNavigateToTestSettings}
      onNavigateToTestInterface={handleNavigateToTestInterface}
      onShowTestResults={handleShowTestResults}
      onBackFromResults={handleBackFromResults}
      onNavigateToQuestionPools={handleNavigateToQuestionPools}
      onNavigateToAccessControl={handleNavigateToAccessControl}
      onNavigateToResults={handleNavigateToResults}
      onNavigateToImportResults={handleNavigateToImportResults}
      onNavigateToBulkImportResults={handleNavigateToBulkImportResults}
      onNavigateToResultView={handleNavigateToResultView}
      onNavigateToResultAnalysis={handleNavigateToResultAnalysis}
      onNavigateToResultSettings={handleNavigateToResultSettings}
      onNavigateToCertificateManagement={handleNavigateToCertificateManagement}
      onNavigateToComprehensiveResults={handleNavigateToComprehensiveResults}
      onNavigateToManageChecklist={handleNavigateToManageChecklist}
      onBackToManageChecklist={handleBackToManageChecklist}
      onNavigateToViewEditDeleteChecklist={handleNavigateToViewEditDeleteChecklist}
      onNavigateToChecklistSettings={handleNavigateToChecklistSettings}
      onNavigateToChecklistView={handleNavigateToChecklistView}
      onNavigateToChecklistResults={handleNavigateToChecklistResults}
      onNavigateToCreateCourse={handleNavigateToCreateCourse}
      onNavigateToAttendanceMonitoring={handleNavigateToAttendanceMonitoring}
      onNavigateToViewCourses={handleNavigateToViewCourses}
      onEditCourse={handleEditCourse}
      onBackFromEditCourse={handleBackFromEditCourse}
      onNavigateToSystemSettings={handleNavigateToSystemSettings}
    />
    </SafeAreaView>
  );
}
