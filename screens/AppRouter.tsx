import React from "react";
import LoginScreen from "./LoginScreen";
import SuperAdminDashboard from "./SuperAdminDashboard";
import AdminDashboard from "./AdminDashboard";
import SimpleDashboard from "./SimpleDashboard";
import ManageParticipantScreen from "./ManageParticipantScreen";
import RegisterParticipantScreen from "./RegisterParticipantScreen";
import BulkImportScreen from "./BulkImportScreen";
import ApproveParticipantsScreen from "./ApproveParticipantsScreen";
import ViewParticipantsScreen from "./ViewParticipantsScreen";
import SimpleViewParticipantsScreen from "./SimpleViewParticipantsScreen";
import ManageStaffScreen from "./ManageStaffScreen";
import RegisterStaffScreen from "./RegisterStaffScreen";
import ViewStaffScreen from "./ViewStaffScreen";
import StaffDashboard from "./StaffDashboard";
import ManageQuestionScreen from "./ManageQuestionScreen";
import UploadQuestionsScreen from "./UploadQuestionsScreen";
import ManageChecklistScreen from "./ManageChecklistScreen";
import ChecklistViewScreen from "./ChecklistViewScreen";
import ChecklistResultsScreen from "./ChecklistResultsScreen";
import UploadChecklistScreen from "./UploadChecklistScreen";
import ViewEditDeleteChecklistScreen from "./ViewEditDeleteChecklistScreen";
import ChecklistSettingsScreen from "./ChecklistSettingsScreen";
import PreTestScreen from "./PreTestScreen";
import PostTestScreen from "./PostTestScreen";
import TestInterfaceScreen from "./TestInterfaceScreen";
import TestResultsScreen from "./TestResultsScreen";
import QuestionPoolManagementScreen from "./QuestionPoolManagementScreen";
import AccessControlManagementScreen from "./AccessControlManagementScreen";
import ResultsAnalyticsScreen from "./ResultsAnalyticsScreen";
import ImportResultsScreen from "./ImportResultsScreen";
import BulkImportResultsScreen from "./BulkImportResultsScreen";
import ResultViewScreen from "./ResultViewScreen";
import ResultAnalysisScreen from "./ResultAnalysisScreen";
import ResultSettingsScreen from "./ResultSettingsScreen";
import CertificateManagementScreen from "./CertificateManagementScreen";
import ComprehensiveResultsScreen from "./ComprehensiveResultsScreen";
import SimpleComprehensiveResultsScreen from "./SimpleComprehensiveResultsScreen";
import CreateCourseScreen from "./CreateCourseScreen";
import ViewCoursesScreen from "./ViewCoursesScreen";
import EditCourseScreen from "./EditCourseScreen";
import AttendanceMonitoringScreen from "./AttendanceMonitoringScreen";

export type Screen = 'login' | 'dashboard' | 'manageParticipant' | 'registerParticipant' | 'bulkImport' | 'approveParticipants' | 'viewParticipants' | 'manageStaff' | 'registerStaff' | 'viewStaff' | 'staffDashboard' | 'manageQuestions' | 'uploadQuestions' | 'manageChecklist' | 'checklistView' | 'checklistResults' | 'uploadChecklist' | 'viewEditDeleteChecklist' | 'checklistSettings' | 'preTest' | 'postTest' | 'testSettings' | 'testInterface' | 'testResults' | 'questionPoolManagement' | 'accessControlManagement' | 'resultsAnalytics' | 'importResults' | 'bulkImportResults' | 'resultView' | 'resultAnalysis' | 'resultSettings' | 'certificateManagement' | 'comprehensiveResults' | 'createCourse' | 'viewCourses' | 'editCourse' | 'attendanceMonitoring';

interface UserData {
	id: string;
	email: string;
	isSuperAdmin: boolean;
	userName: string;
	roles: 'admin' | 'staff' | 'user';
}

interface AppRouterProps {
	currentScreen: Screen;
	isLoggedIn: boolean;
	userData: UserData | null;
	testResults: any;
	currentTestType: 'pre' | 'post';
	currentChecklistType: string;
	selectedCourse: any;
	// Handlers
	onLogin: (loginData: UserData) => void;
	onLogout: () => void;
	onBackToDashboard: () => void;
	onBackToDashboardFromChecklist: () => void;
	onNavigateToManageParticipant: () => void;
	onNavigateToRegisterParticipant: () => void;
	onNavigateToBulkImport: () => void;
	onNavigateToViewParticipants: () => void;
	onNavigateToApproveParticipants: () => void;
	onNavigateToManageStaff: () => void;
	onNavigateToRegisterStaff: () => void;
	onNavigateToViewStaff: () => void;
	onNavigateToStaffDashboard: () => void;
	onBackToManageParticipant: () => void;
	onBackToManageStaff: () => void;
	onNavigateToManageQuestions: () => void;
	onNavigateToUploadQuestions: () => void;
	onNavigateToPreTest: () => void;
	onNavigateToPostTest: () => void;
	onNavigateToTestSettings: () => void;
	onShowTestResults: (results: any) => void;
	onBackFromResults: () => void;
	onNavigateToQuestionPools: () => void;
	onNavigateToAccessControl: () => void;
	onNavigateToResults: () => void;
	onNavigateToImportResults: () => void;
	onNavigateToBulkImportResults: () => void;
	onNavigateToResultView: () => void;
	onNavigateToResultAnalysis: () => void;
	onNavigateToResultSettings: () => void;
	onNavigateToCertificateManagement: () => void;
	onNavigateToComprehensiveResults: () => void;
	onNavigateToManageChecklist: () => void;
	onBackToManageChecklist: () => void;
	onNavigateToViewEditDeleteChecklist: () => void;
	onNavigateToChecklistSettings: () => void;
	onNavigateToChecklistView: (checklistType: string) => void;
	onNavigateToChecklistResults: () => void;
	onNavigateToCreateCourse: () => void;
	onNavigateToAttendanceMonitoring: () => void;
	onNavigateToViewCourses: () => void;
	onEditCourse: (course: any) => void;
	onBackFromEditCourse: () => void;
}

export default function AppRouter(props: AppRouterProps) {
	const { currentScreen, isLoggedIn, userData, testResults, currentTestType, currentChecklistType, selectedCourse } = props;

	if (currentScreen === 'login') {
		return <LoginScreen onLogin={props.onLogin} />;
	}

	if (currentScreen === 'manageParticipant' && userData) {
		return (
			<ManageParticipantScreen 
				onBack={props.onBackToDashboard}
				onNavigateToRegisterParticipant={props.onNavigateToRegisterParticipant}
				onNavigateToBulkImport={props.onNavigateToBulkImport}
				onNavigateToViewParticipants={props.onNavigateToViewParticipants}
			/>
		);
	}

	if (currentScreen === 'registerParticipant' && userData) {
		return <RegisterParticipantScreen onBack={props.onBackToManageParticipant} />;
	}

	if (currentScreen === 'bulkImport' && userData) {
		return <BulkImportScreen onBack={props.onBackToManageParticipant} />;
	}

	if (currentScreen === 'approveParticipants' && userData) {
		return <ApproveParticipantsScreen onBack={props.onBackToDashboard} />;
	}

	if (currentScreen === 'viewParticipants' && userData) {
		return <SimpleViewParticipantsScreen onBack={props.onBackToManageParticipant} />;
	}

	if (currentScreen === 'manageStaff' && userData) {
		return (
			<ManageStaffScreen 
				onBack={props.onBackToDashboard}
				onNavigateToRegisterStaff={props.onNavigateToRegisterStaff}
				onNavigateToViewStaff={props.onNavigateToViewStaff}
				onNavigateToStaffDashboard={props.onNavigateToStaffDashboard}
			/>
		);
	}

	if (currentScreen === 'registerStaff' && userData) {
		return <RegisterStaffScreen onBack={props.onBackToManageStaff} />;
	}

	if (currentScreen === 'viewStaff' && userData) {
		return <ViewStaffScreen onBack={props.onBackToManageStaff} />;
	}

	if (currentScreen === 'staffDashboard' && userData) {
		return (
			<StaffDashboard 
				userName={userData.userName}
				onLogout={props.onLogout}
				onNavigateToRegisterStaff={props.onNavigateToRegisterStaff}
				onNavigateToViewStaff={props.onNavigateToViewStaff}
			/>
		);
	}

	if (currentScreen === 'manageQuestions' && userData) {
		return (
			<ManageQuestionScreen 
				onBack={props.onBackToDashboard}
				onNavigateToUploadQuestions={props.onNavigateToUploadQuestions}
				onNavigateToPreTest={props.onNavigateToPreTest}
				onNavigateToPostTest={props.onNavigateToPostTest}
				onNavigateToTestSettings={props.onNavigateToTestSettings}
				onNavigateToQuestionPools={props.onNavigateToQuestionPools}
				onNavigateToAccessControl={props.onNavigateToAccessControl}
				onNavigateToResults={props.onNavigateToResults}
			/>
		);
	}

	if (currentScreen === 'uploadQuestions' && userData) {
		return <UploadQuestionsScreen onBack={props.onNavigateToManageQuestions} />;
	}

	if (currentScreen === 'manageChecklist' && userData) {
		return (
			<ManageChecklistScreen 
				onBack={props.onBackToDashboardFromChecklist}
				onNavigateToViewEditDelete={props.onNavigateToViewEditDeleteChecklist}
				onNavigateToChecklistSettings={props.onNavigateToChecklistSettings}
				onNavigateToChecklistView={props.onNavigateToChecklistView}
				onNavigateToChecklistResults={props.onNavigateToChecklistResults}
			/>
		);
	}

	if (currentScreen === 'checklistView' && currentChecklistType) {
		return (
			<ChecklistViewScreen 
				onBack={() => props.onNavigateToManageChecklist()}
				checklistType={currentChecklistType}
				onRefresh={() => {}}
			/>
		);
	}

	if (currentScreen === 'checklistResults' && userData) {
		return <ChecklistResultsScreen onBack={() => props.onNavigateToManageChecklist()} />;
	}

	if (currentScreen === 'uploadChecklist' && userData) {
		return <UploadChecklistScreen onBack={props.onBackToManageChecklist} />;
	}

	if (currentScreen === 'viewEditDeleteChecklist' && userData) {
		return <ViewEditDeleteChecklistScreen onBack={props.onBackToManageChecklist} />;
	}

	if (currentScreen === 'checklistSettings' && userData) {
		return <ChecklistSettingsScreen onBack={props.onBackToManageChecklist} />;
	}

	if (currentScreen === 'dashboard' && isLoggedIn && userData) {
		return (
			<SimpleDashboard
				userName={userData.userName}
				onLogout={props.onLogout}
				onNavigateToManageParticipant={props.onNavigateToManageParticipant}
				onNavigateToApproveParticipants={props.onNavigateToApproveParticipants}
				onNavigateToManageStaff={props.onNavigateToManageStaff}
				onNavigateToStaffDashboard={props.onNavigateToStaffDashboard}
				onNavigateToManageQuestions={props.onNavigateToManageQuestions}
				onNavigateToManageChecklist={props.onNavigateToManageChecklist}
				onNavigateToComprehensiveResults={props.onNavigateToComprehensiveResults}
				onNavigateToCreateCourse={props.onNavigateToCreateCourse}
				onNavigateToAttendanceMonitoring={props.onNavigateToAttendanceMonitoring}
			/>
		);
	}

	if (currentScreen === 'testSettings' && isLoggedIn && userData) {
		return <ChecklistSettingsScreen onBack={() => props.onNavigateToManageQuestions()} />;
	}

	if (currentScreen === 'preTest' && isLoggedIn && userData) {
		return (
			<PreTestScreen 
				onBack={() => props.onNavigateToManageQuestions()}
				userName={userData.userName}
				onStartTest={() => {}}
			/>
		);
	}

	if (currentScreen === 'postTest' && isLoggedIn && userData) {
		return (
			<PostTestScreen 
				onBack={() => props.onNavigateToManageQuestions()}
				userName={userData.userName}
				onStartTest={() => {}}
			/>
		);
	}

	if (currentScreen === 'testInterface' && isLoggedIn && userData) {
		return (
			<TestInterfaceScreen 
				onBack={() => (currentTestType === 'pre' ? props.onNavigateToPreTest() : props.onNavigateToPostTest())}
				onShowResults={props.onShowTestResults}
				onNavigateToPools={() => props.onNavigateToQuestionPools()}
				testType={currentTestType}
				userName={userData.userName}
				userId={userData.id}
				courseSessionId={undefined}
				isSuperAdmin={userData.isSuperAdmin}
			/>
		);
	}

	if (currentScreen === 'testResults' && isLoggedIn && userData && testResults) {
		return <TestResultsScreen onBack={props.onBackFromResults} testResults={testResults} />;
	}

	if (currentScreen === 'questionPoolManagement' && isLoggedIn && userData) {
		return <QuestionPoolManagementScreen onBack={() => props.onNavigateToManageQuestions()} />;
	}

	if (currentScreen === 'accessControlManagement' && isLoggedIn && userData) {
		return (
			<AccessControlManagementScreen 
				onBack={() => props.onNavigateToManageQuestions()}
				userRole={userData.roles}
				isSuperAdmin={userData.isSuperAdmin}
			/>
		);
	}

	if (currentScreen === 'resultsAnalytics' && isLoggedIn && userData) {
		return (
			<ResultsAnalyticsScreen 
				onBack={() => props.onNavigateToManageQuestions()}
				onNavigateToImportResults={props.onNavigateToImportResults}
				onNavigateToBulkImportResults={props.onNavigateToBulkImportResults}
				onNavigateToResultView={props.onNavigateToResultView}
				onNavigateToResultAnalysis={props.onNavigateToResultAnalysis}
				onNavigateToResultSettings={props.onNavigateToResultSettings}
				onNavigateToCertificateManagement={props.onNavigateToCertificateManagement}
			/>
		);
	}

	if (currentScreen === 'importResults' && isLoggedIn && userData) {
		return <ImportResultsScreen onBack={() => props.onNavigateToResults()} />;
	}

	if (currentScreen === 'bulkImportResults' && isLoggedIn && userData) {
		return <BulkImportResultsScreen onBack={() => props.onNavigateToResults()} />;
	}

	if (currentScreen === 'resultView' && isLoggedIn && userData) {
		return <ResultViewScreen onBack={() => props.onNavigateToResults()} />;
	}

	if (currentScreen === 'resultAnalysis' && isLoggedIn && userData) {
		return <ResultAnalysisScreen onBack={() => props.onNavigateToResults()} />;
	}

	if (currentScreen === 'resultSettings' && isLoggedIn && userData) {
		return <ResultSettingsScreen onBack={() => props.onNavigateToResults()} />;
	}

	if (currentScreen === 'certificateManagement' && isLoggedIn && userData) {
		return <CertificateManagementScreen onBack={() => props.onNavigateToResults()} />;
	}

	if (currentScreen === 'comprehensiveResults' && isLoggedIn && userData) {
		return <SimpleComprehensiveResultsScreen onBack={props.onBackToDashboard} />;
	}

	if (currentScreen === 'createCourse' && isLoggedIn && userData) {
		return <CreateCourseScreen onBack={props.onBackToDashboard} onViewCourses={props.onNavigateToViewCourses} />;
	}

	if (currentScreen === 'viewCourses' && isLoggedIn && userData) {
		return <ViewCoursesScreen onBack={props.onBackToDashboard} onEditCourse={props.onEditCourse} />;
	}

	if (currentScreen === 'editCourse' && selectedCourse && isLoggedIn && userData) {
		return <EditCourseScreen course={selectedCourse} onBack={props.onBackFromEditCourse} onCourseUpdated={() => {}} />;
	}

	if (currentScreen === 'attendanceMonitoring' && isLoggedIn && userData) {
		return <AttendanceMonitoringScreen onBack={props.onBackToDashboard} />;
	}

	return <LoginScreen onLogin={props.onLogin} />;
}

