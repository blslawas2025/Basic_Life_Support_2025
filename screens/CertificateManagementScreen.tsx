import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../services/supabase';
import { CertificateService } from '../services/CertificateService';
import { PDFCertificateService } from '../services/PDFCertificateService';
import { CertificateData } from '../services/CertificateData';

const { width: screenWidth } = Dimensions.get('window');

const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (screenWidth < 400) return small;
  if (screenWidth < 600) return medium;
  return large;
};

const getResponsiveFontSize = (small: number, medium: number, large: number) => {
  if (screenWidth < 400) return small;
  if (screenWidth < 600) return medium;
  return large;
};

interface CertificateManagementScreenProps {
  onBack: () => void;
}

interface Certificate {
  id: string;
  participantName: string;
  participantEmail: string;
  icNumber?: string;
  jobPosition?: string;
  testType: 'pre_test' | 'post_test';
  score: number;
  totalQuestions: number;
  grade: string;
  issuedAt: string;
  status: 'pending' | 'issued' | 'revoked';
  downloadCount: number;
  lastDownloaded?: string;
  certificateUrl?: string;
}

export default function CertificateManagementScreen({ onBack }: CertificateManagementScreenProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'issued' | 'revoked'>('all');
  const [activeTab, setActiveTab] = useState<'pre_test' | 'post_test'>('pre_test');
  const [approvingCertificates, setApprovingCertificates] = useState<Set<string>>(new Set());
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadCertificates();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  };

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading certificates from Supabase...');
      
      // Fetch completed test submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('test_submissions')
        .select(`
          id,
          user_id,
          user_name,
          user_email,
          ic_number,
          job_position_name,
          test_type,
          score,
          total_questions,
          correct_answers,
          time_taken_seconds,
          submitted_at,
          is_completed,
          results_released,
          results_released_at
        `)
        .eq('is_completed', true)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        throw new Error('Failed to fetch test submissions');
      }

      console.log(`📊 Found ${submissions?.length || 0} completed submissions`);

      // Convert submissions to certificate format
      const certificates: Certificate[] = (submissions || []).map(submission => {
        const percentage = (submission.score / submission.total_questions) * 100;
        const grade = getGradeFromScore(percentage);
        const status = submission.results_released ? 'issued' : 'pending';
        
        return {
          id: submission.id,
          participantName: submission.user_name || 'Unknown User',
          participantEmail: submission.user_email || 'No email',
          icNumber: submission.ic_number || undefined,
          jobPosition: submission.job_position_name || undefined,
          testType: submission.test_type,
          score: submission.score,
          totalQuestions: submission.total_questions,
          grade: grade,
          issuedAt: submission.results_released_at || submission.submitted_at,
          status: status as 'pending' | 'issued' | 'revoked',
          downloadCount: 0, // Will be tracked separately
          lastDownloaded: submission.results_released_at,
        };
      });

      console.log(`📜 Generated ${certificates.length} certificates`);
      setCertificates(certificates);
    } catch (error) {
      console.error('Error loading certificates:', error);
      Alert.alert('Error', 'Failed to load certificates');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate grade from score percentage
  const getGradeFromScore = (percentage: number): string => {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'C-';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  // Issue certificate (release results to participant)
  const issueCertificate = async (certificateId: string) => {
    try {
      console.log(`📜 Issuing certificate ${certificateId}...`);
      
      const { error } = await supabase
        .from('test_submissions')
        .update({
          results_released: true,
          results_released_at: new Date().toISOString()
        })
        .eq('id', certificateId);

      if (error) {
        console.error('Error issuing certificate:', error);
        Alert.alert('Error', 'Failed to issue certificate');
        return;
      }

      console.log('✅ Certificate issued successfully');
      
      // Refresh the certificates list
      await loadCertificates();
      
      Alert.alert('Success', 'Certificate issued successfully');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      Alert.alert('Error', 'Failed to issue certificate');
    }
  };

  // Revoke certificate (hide results from participant)
  const revokeCertificate = async (certificateId: string) => {
    try {
      console.log(`📜 Revoking certificate ${certificateId}...`);
      
      const { error } = await supabase
        .from('test_submissions')
        .update({
          results_released: false,
          results_released_at: null
        })
        .eq('id', certificateId);

      if (error) {
        console.error('Error revoking certificate:', error);
        Alert.alert('Error', 'Failed to revoke certificate');
        return;
      }

      console.log('✅ Certificate revoked successfully');
      
      // Refresh the certificates list
      await loadCertificates();
      
      Alert.alert('Success', 'Certificate revoked successfully');
    } catch (error) {
      console.error('Error revoking certificate:', error);
      Alert.alert('Error', 'Failed to revoke certificate');
    }
  };

  const approveCertificate = async (certificateId: string) => {
    try {
      console.log(`✅ Approving certificate ${certificateId}...`);
      
      // Add to approving set
      setApprovingCertificates(prev => new Set(prev).add(certificateId));
      
      const { error } = await supabase
        .from('test_submissions')
        .update({
          results_released: true,
          results_released_at: new Date().toISOString()
        })
        .eq('id', certificateId);

      if (error) {
        console.error('Error approving certificate:', error);
        Alert.alert('Error', 'Failed to approve certificate');
        return;
      }

      console.log('✅ Certificate approved successfully');
      
      // Refresh the certificates list
      await loadCertificates();
      
      Alert.alert('Success', 'Certificate approved! Participant will receive their score.');
    } catch (error) {
      console.error('Error approving certificate:', error);
      Alert.alert('Error', 'Failed to approve certificate');
    } finally {
      // Remove from approving set
      setApprovingCertificates(prev => {
        const newSet = new Set(prev);
        newSet.delete(certificateId);
        return newSet;
      });
    }
  };

  // Bulk issue certificates
  const bulkIssueCertificates = async (certificateIds: string[]) => {
    try {
      console.log(`📜 Bulk issuing ${certificateIds.length} certificates...`);
      
      const { error } = await supabase
        .from('test_submissions')
        .update({
          results_released: true,
          results_released_at: new Date().toISOString()
        })
        .in('id', certificateIds);

      if (error) {
        console.error('Error bulk issuing certificates:', error);
        Alert.alert('Error', 'Failed to issue certificates');
        return;
      }

      console.log('✅ Certificates issued successfully');
      
      // Refresh the certificates list
      await loadCertificates();
      
      Alert.alert('Success', `${certificateIds.length} certificates issued successfully`);
    } catch (error) {
      console.error('Error bulk issuing certificates:', error);
      Alert.alert('Error', 'Failed to issue certificates');
    }
  };

  // Bulk approve certificates
  const bulkApproveCertificates = async (certificateIds: string[]) => {
    try {
      console.log(`✅ Bulk approving ${certificateIds.length} certificates...`);
      
      const { error } = await supabase
        .from('test_submissions')
        .update({
          results_released: true,
          results_released_at: new Date().toISOString()
        })
        .in('id', certificateIds);

      if (error) {
        console.error('Error bulk approving certificates:', error);
        Alert.alert('Error', 'Failed to approve certificates');
        return;
      }

      console.log('✅ Certificates approved successfully');
      
      // Refresh the certificates list
      await loadCertificates();
      
      Alert.alert('Success', `${certificateIds.length} certificates approved! Participants will receive their scores.`);
    } catch (error) {
      console.error('Error bulk approving certificates:', error);
      Alert.alert('Error', 'Failed to approve certificates');
    }
  };

  const getFilteredCertificates = () => {
    let filtered = certificates;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cert => 
        cert.participantName.toLowerCase().includes(query) ||
        cert.participantEmail.toLowerCase().includes(query) ||
        cert.grade.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(cert => cert.status === filterStatus);
    }

    // Filter by active tab (pre_test or post_test)
    filtered = filtered.filter(cert => cert.testType === activeTab);

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'revoked': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'revoked': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
      case 'A-':
        return '#22c55e'; // Green
      case 'B+':
      case 'B':
      case 'B-':
        return '#3b82f6'; // Blue
      case 'C+':
      case 'C':
      case 'C-':
        return '#f59e0b'; // Orange
      case 'D+':
      case 'D':
      case 'D-':
        return '#ef4444'; // Red
      case 'E':
        return '#ef4444'; // Red
      case 'F':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleIssueCertificate = (certificateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Issue Certificate',
      'Are you sure you want to release this certificate to the participant?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Issue', onPress: () => issueCertificate(certificateId) },
      ]
    );
  };

  const handleRevokeCertificate = (certificateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Revoke Certificate',
      'Are you sure you want to revoke this certificate? The participant will no longer have access to it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke', onPress: () => revokeCertificate(certificateId) },
      ]
    );
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      console.log('🔍 Download button clicked for certificate:', certificateId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const certificate = certificates.find(cert => cert.id === certificateId);
      if (!certificate) {
        console.log('❌ Certificate not found');
        Alert.alert('Error', 'Certificate not found');
        return;
      }

      console.log(`📄 Generating PDF certificate for ${certificate.participantName}...`);
      console.log('🔍 Certificate data:', certificate);
      
      // Show loading alert
      Alert.alert('Generating Certificate', 'Please wait while we generate your PDF certificate...');
      
      // Create certificate data for PDF
      const certificateData: CertificateData = {
        participantName: certificate.participantName,
        participantEmail: certificate.participantEmail,
        icNumber: certificate.icNumber,
        jobPosition: certificate.jobPosition,
        testType: certificate.testType,
        score: certificate.score,
        totalQuestions: certificate.totalQuestions,
        grade: certificate.grade,
        percentage: Math.round((certificate.score / certificate.totalQuestions) * 100),
        issuedAt: certificate.issuedAt,
        certificateId: certificate.id
      };
      
      // Generate and download certificate as PDF
      const filename = `Certificate_${certificate.participantName.replace(/\s+/g, '_')}_${certificate.testType}.pdf`;
      
      try {
        PDFCertificateService.downloadCertificate(certificateData, filename);
        
        // Update download count
        setCertificates(prev => prev.map(cert => 
          cert.id === certificateId 
            ? { 
                ...cert, 
                downloadCount: cert.downloadCount + 1,
                lastDownloaded: new Date().toISOString()
              }
            : cert
        ));
        
        // Success message
        Alert.alert(
          'Certificate Generated Successfully!', 
          `Professional certificate for ${certificate.participantName} has been generated!\n\nA new window should have opened with your certificate. You can:\n• Print it as PDF using Ctrl+P\n• Save it as PDF using your browser's print dialog\n• Right-click and "Save as" to download the HTML file`,
          [
            { 
              text: 'Copy Certificate Text', 
              onPress: async () => {
                try {
                  const certificateText = PDFCertificateService.getSimpleCertificateAsText(certificateData);
                  if (navigator.clipboard) {
                    await navigator.clipboard.writeText(certificateText);
                    Alert.alert('Success', 'Certificate text copied to clipboard!');
                  } else {
                    Alert.alert('Info', 'Clipboard not available. Please copy manually.');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to copy to clipboard.');
                }
              }
            },
            { text: 'OK', style: 'default' }
          ]
        );
      } catch (error) {
        console.error('Certificate generation error:', error);
        
        // Fallback: Show certificate content in alert
        const certificateText = PDFCertificateService.getSimpleCertificateAsText(certificateData);
        Alert.alert(
          'Certificate Generated', 
          `Certificate for ${certificate.participantName}:\n\n${certificateText}`,
          [
            { 
              text: 'Copy Text', 
              onPress: async () => {
                try {
                  if (navigator.clipboard) {
                    await navigator.clipboard.writeText(certificateText);
                    Alert.alert('Success', 'Certificate text copied to clipboard!');
                  } else {
                    Alert.alert('Info', 'Clipboard not available. Please copy manually from the previous alert.');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to copy to clipboard.');
                }
              }
            },
            { text: 'OK', style: 'default' }
          ]
        );
      }
      
      console.log('✅ Certificate generated and downloaded successfully');
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      Alert.alert('Error', 'Failed to generate certificate. Please try again.');
    }
  };

  const handleBulkAction = (action: 'approve' | 'issue' | 'revoke' | 'download') => {
    if (selectedCertificates.length === 0) {
      Alert.alert('No Selection', 'Please select certificates first');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    switch (action) {
      case 'approve':
        Alert.alert(
          'Bulk Approve',
          `Are you sure you want to approve ${selectedCertificates.length} certificates? Participants will receive their scores.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Approve', onPress: () => {
              bulkApproveCertificates(selectedCertificates);
              setSelectedCertificates([]);
              setShowBulkActions(false);
            }},
          ]
        );
        break;
      case 'issue':
        Alert.alert(
          'Bulk Issue',
          `Are you sure you want to issue ${selectedCertificates.length} certificates?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Issue', onPress: () => {
              bulkIssueCertificates(selectedCertificates);
              setSelectedCertificates([]);
              setShowBulkActions(false);
            }},
          ]
        );
        break;
      case 'revoke':
        Alert.alert(
          'Bulk Revoke',
          `Are you sure you want to revoke ${selectedCertificates.length} certificates?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Revoke', onPress: async () => {
              try {
                const { error } = await supabase
                  .from('test_submissions')
                  .update({
                    results_released: false,
                    results_released_at: null
                  })
                  .in('id', selectedCertificates);

                if (error) {
                  console.error('Error bulk revoking certificates:', error);
                  Alert.alert('Error', 'Failed to revoke certificates');
                  return;
                }

                await loadCertificates();
                setSelectedCertificates([]);
                setShowBulkActions(false);
                Alert.alert('Success', `${selectedCertificates.length} certificates revoked successfully`);
              } catch (error) {
                console.error('Error bulk revoking certificates:', error);
                Alert.alert('Error', 'Failed to revoke certificates');
              }
            }},
          ]
        );
        break;
      case 'download':
        // Download each selected certificate
        selectedCertificates.forEach(certificateId => {
          handleDownloadCertificate(certificateId);
        });
        setSelectedCertificates([]);
        setShowBulkActions(false);
        break;
    }
  };

  const toggleCertificateSelection = (certificateId: string) => {
    setSelectedCertificates(prev => 
      prev.includes(certificateId)
        ? prev.filter(id => id !== certificateId)
        : [...prev, certificateId]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading certificates...</Text>
      </View>
    );
  }

  const filteredCertificates = getFilteredCertificates();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      <LinearGradient colors={['#1e40af', '#3b82f6']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Certificate Management</Text>
            <Text style={styles.headerSubtitle}>View and manage participant certificates</Text>
          </View>
          
          <TouchableOpacity
            style={styles.bulkButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowBulkActions(!showBulkActions);
            }}
          >
            <Ionicons name="list" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Search and Filters */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search certificates..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>
          
          {/* Test Type Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'pre_test' && styles.tabButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('pre_test');
              }}
            >
              <Ionicons name="school" size={18} color={activeTab === 'pre_test' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.tabButtonText, activeTab === 'pre_test' && styles.tabButtonTextActive]}>
                Pre-Test Certificates
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'post_test' && styles.tabButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('post_test');
              }}
            >
              <Ionicons name="trophy" size={18} color={activeTab === 'post_test' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.tabButtonText, activeTab === 'post_test' && styles.tabButtonTextActive]}>
                Post-Test Certificates
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
                  onPress={() => setFilterStatus('all')}
                >
                  <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
                  onPress={() => setFilterStatus('pending')}
                >
                  <Text style={[styles.filterButtonText, filterStatus === 'pending' && styles.filterButtonTextActive]}>
                    Pending ({certificates.filter(c => c.testType === activeTab && c.status === 'pending').length})
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.filterButton, filterStatus === 'issued' && styles.filterButtonActive]}
                  onPress={() => setFilterStatus('issued')}
                >
                  <Text style={[styles.filterButtonText, filterStatus === 'issued' && styles.filterButtonTextActive]}>
                    Issued ({certificates.filter(c => c.testType === activeTab && c.status === 'issued').length})
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.filterButton, filterStatus === 'revoked' && styles.filterButtonActive]}
                  onPress={() => setFilterStatus('revoked')}
                >
                  <Text style={[styles.filterButtonText, filterStatus === 'revoked' && styles.filterButtonTextActive]}>
                    Revoked ({certificates.filter(c => c.testType === activeTab && c.status === 'revoked').length})
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Animated.View>

        {/* Bulk Actions */}
        {showBulkActions && (
          <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.sectionTitle}>⚡ Bulk Actions</Text>
            
            <View style={styles.bulkActionsContainer}>
              <TouchableOpacity
                style={[styles.bulkActionButton, { backgroundColor: '#10b981' }]}
                onPress={() => handleBulkAction('approve')}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.bulkActionText}>Approve Selected</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.bulkActionButton, { backgroundColor: '#22c55e' }]}
                onPress={() => handleBulkAction('issue')}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.bulkActionText}>Issue Selected</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.bulkActionButton, { backgroundColor: '#ef4444' }]}
                onPress={() => handleBulkAction('revoke')}
              >
                <Ionicons name="close-circle" size={20} color="#ffffff" />
                <Text style={styles.bulkActionText}>Revoke Selected</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.bulkActionButton, { backgroundColor: '#3b82f6' }]}
                onPress={() => handleBulkAction('download')}
              >
                <Ionicons name="download" size={20} color="#ffffff" />
                <Text style={styles.bulkActionText}>Download Selected</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Certificates List */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>
            📜 Certificates ({filteredCertificates.length})
          </Text>
          
          <FlatList
            data={filteredCertificates}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.certificateCard}>
                <View style={styles.certificateHeader}>
                  <View style={styles.certificateInfo}>
                    <Text style={styles.participantName}>{item.participantName}</Text>
                    <Text style={styles.participantEmail}>{item.participantEmail}</Text>
                    
                    {/* IC Number and Job Position */}
                    <View style={styles.participantDetails}>
                      {item.icNumber && (
                        <View style={styles.detailItem}>
                          <Ionicons name="card" size={14} color="#6b7280" />
                          <Text style={styles.detailText}>IC: {item.icNumber}</Text>
                        </View>
                      )}
                      {item.jobPosition && (
                        <View style={styles.detailItem}>
                          <Ionicons name="briefcase" size={14} color="#6b7280" />
                          <Text style={styles.detailText}>{item.jobPosition}</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.testType}>
                      {item.testType === 'pre_test' ? 'Pre-Test' : 'Post-Test'}
                    </Text>
                  </View>
                  
                  <View style={styles.certificateBadges}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                      <Ionicons name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(item.grade) + '20' }]}>
                      <Text style={[styles.gradeText, { color: getGradeColor(item.grade) }]}>
                        {item.grade}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.certificateStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="trophy" size={16} color="#6b7280" />
                    <Text style={styles.statLabel}>Score</Text>
                    <Text style={styles.statValue}>{item.score}/{item.totalQuestions}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="download" size={16} color="#6b7280" />
                    <Text style={styles.statLabel}>Downloads</Text>
                    <Text style={styles.statValue}>{item.downloadCount}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="calendar" size={16} color="#6b7280" />
                    <Text style={styles.statLabel}>Issued</Text>
                    <Text style={styles.statValue}>{formatDate(item.issuedAt)}</Text>
                  </View>
                </View>
                
                <View style={styles.certificateActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                    onPress={() => {
                      setSelectedCertificate(item);
                      setShowCertificateModal(true);
                    }}
                  >
                    <Ionicons name="eye" size={16} color="#ffffff" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  
                  {item.status === 'pending' && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton, 
                        { 
                          backgroundColor: approvingCertificates.has(item.id) ? '#9ca3af' : '#10b981',
                          opacity: approvingCertificates.has(item.id) ? 0.7 : 1
                        }
                      ]}
                      onPress={() => approveCertificate(item.id)}
                      disabled={approvingCertificates.has(item.id)}
                    >
                      {approvingCertificates.has(item.id) ? (
                        <Ionicons name="hourglass" size={16} color="#ffffff" />
                      ) : (
                        <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                      )}
                      <Text style={styles.actionButtonText}>
                        {approvingCertificates.has(item.id) ? 'Approving...' : 'Approve'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {item.status === 'issued' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                        onPress={() => approveCertificate(item.id)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                        <Text style={styles.actionButtonText}>Approve</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                        onPress={() => handleDownloadCertificate(item.id)}
                      >
                        <Ionicons name="download" size={16} color="#ffffff" />
                        <Text style={styles.actionButtonText}>Download</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                        onPress={() => handleRevokeCertificate(item.id)}
                      >
                        <Ionicons name="close-circle" size={16} color="#ffffff" />
                        <Text style={styles.actionButtonText}>Revoke</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {item.status === 'revoked' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                      onPress={() => approveCertificate(item.id)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        </Animated.View>
      </ScrollView>

      {/* Certificate Detail Modal */}
      <Modal
        visible={showCertificateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCertificateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.certificateModalContent}>
            <View style={styles.certificateModalHeader}>
              <Text style={styles.certificateModalTitle}>Certificate of Completion</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCertificateModal(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {selectedCertificate && (
              <ScrollView style={styles.certificateScrollView} showsVerticalScrollIndicator={false}>
                {/* Modern Certificate Design */}
                <View style={styles.certificateContainer}>
                  <View style={styles.modernCertificate}>
                    {/* Certificate Header with Gradient */}
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.certificateHeaderGradient}
                    >
                      <View style={styles.certificateHeaderContent}>
                        <View style={styles.certificateIconContainer}>
                          <Ionicons name="medal" size={40} color="#ffffff" />
                        </View>
                        <Text style={styles.modernCertificateTitle}>CERTIFICATE OF ACHIEVEMENT</Text>
                        <Text style={styles.modernCertificateSubtitle}>Basic Life Support Training Program</Text>
                        <View style={styles.certificateDivider} />
                      </View>
                    </LinearGradient>
                    
                    {/* Certificate Body */}
                    <View style={styles.certificateBody}>
                      <Text style={styles.certificateAwardText}>
                        This is to certify that
                      </Text>
                      
                      <Text style={styles.modernParticipantName}>
                        {selectedCertificate.participantName}
                      </Text>
                      
                      {/* IC Number and Job Position */}
                      <View style={styles.participantDetailsModal}>
                        {selectedCertificate.icNumber && (
                          <Text style={styles.participantDetailText}>
                            IC: {selectedCertificate.icNumber}
                          </Text>
                        )}
                        {selectedCertificate.jobPosition && (
                          <Text style={styles.participantDetailText}>
                            {selectedCertificate.jobPosition}
                          </Text>
                        )}
                      </View>
                      
                      <Text style={styles.certificateAwardText}>
                        has successfully completed the {selectedCertificate.testType.replace('_', ' ').toUpperCase()}
                      </Text>
                      
                      <Text style={styles.certificateAwardText}>
                        with outstanding performance
                      </Text>
                      
                      {/* Score Display */}
                      <View style={styles.modernScoreContainer}>
                        <View style={styles.scoreBox}>
                          <Text style={styles.scoreLabel}>SCORE</Text>
                          <Text style={styles.modernScoreText}>
                            {selectedCertificate.score}/{selectedCertificate.totalQuestions}
                          </Text>
                          <Text style={styles.modernPercentageText}>
                            {Math.round((selectedCertificate.score / selectedCertificate.totalQuestions) * 100)}%
                          </Text>
                        </View>
                        
                        <View style={styles.gradeBox}>
                          <Text style={styles.gradeLabel}>GRADE</Text>
                          <Text style={[styles.modernGradeText, { color: getGradeColor(selectedCertificate.grade) }]}>
                            {selectedCertificate.grade}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.certificateAwardText}>
                        and is hereby awarded this certificate of completion.
                      </Text>
                    </View>
                    
                    {/* Certificate Footer */}
                    <View style={styles.modernCertificateFooter}>
                      <View style={styles.footerRow}>
                        <View style={styles.footerItem}>
                          <Ionicons name="calendar" size={16} color="#6b7280" />
                          <Text style={styles.footerLabel}>Completion Date</Text>
                          <Text style={styles.footerValue}>
                            {new Date(selectedCertificate.issuedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>
                        
                        <View style={styles.footerItem}>
                          <Ionicons name="finger-print" size={16} color="#6b7280" />
                          <Text style={styles.footerLabel}>Certificate ID</Text>
                          <Text style={styles.footerValue}>
                            {selectedCertificate.id.substring(0, 8).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.footerRow}>
                        <View style={styles.footerItem}>
                          <Ionicons name="mail" size={16} color="#6b7280" />
                          <Text style={styles.footerLabel}>Email</Text>
                          <Text style={styles.footerValue}>
                            {selectedCertificate.participantEmail}
                          </Text>
                        </View>
                        
                        <View style={styles.footerItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
                          <Text style={styles.footerLabel}>Status</Text>
                          <Text style={[styles.footerValue, { 
                            color: selectedCertificate.status === 'issued' ? '#22c55e' : 
                                   selectedCertificate.status === 'pending' ? '#f59e0b' : '#ef4444'
                          }]}>
                            {selectedCertificate.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Decorative Elements */}
                    <View style={styles.certificateDecorations}>
                      <View style={styles.decorationLeft} />
                      <View style={styles.decorationRight} />
                    </View>
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View style={styles.certificateActions}>
                  <TouchableOpacity
                    style={styles.certificateActionButton}
                    onPress={() => handleDownloadCertificate(selectedCertificate.id)}
                  >
                    <Ionicons name="download" size={20} color="#ffffff" />
                    <Text style={styles.certificateActionText}>Download PDF</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.certificateActionButton, { backgroundColor: '#6b7280' }]}
                    onPress={() => setShowCertificateModal(false)}
                  >
                    <Ionicons name="close" size={20} color="#ffffff" />
                    <Text style={styles.certificateActionText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#6b7280',
  },
  header: {
    paddingTop: getResponsiveSize(40, 50, 60),
    paddingBottom: getResponsiveSize(16, 20, 24),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: getResponsiveSize(16, 20, 24),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  bulkButton: {
    padding: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(16, 20, 24),
  },
  section: {
    marginTop: getResponsiveSize(16, 20, 24),
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(12, 16, 20),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    paddingVertical: getResponsiveSize(8, 10, 12),
    marginBottom: getResponsiveSize(12, 16, 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: getResponsiveSize(8, 10, 12),
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#1f2937',
  },
  filtersContainer: {
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  filterButtons: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  filterButton: {
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    paddingVertical: getResponsiveSize(6, 8, 10),
    borderRadius: getResponsiveSize(6, 8, 10),
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  bulkActionsContainer: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    borderRadius: getResponsiveSize(8, 10, 12),
    gap: getResponsiveSize(6, 8, 10),
  },
  bulkActionText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
  },
  certificateCard: {
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(20, 24, 28),
    marginBottom: getResponsiveSize(16, 20, 24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  certificateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  certificateInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  participantEmail: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#6b7280',
    marginBottom: 4,
  },
  testType: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#9ca3af',
  },
  certificateBadges: {
    flexDirection: 'row',
    gap: getResponsiveSize(6, 8, 10),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(6, 8, 10),
    paddingVertical: getResponsiveSize(2, 4, 6),
    borderRadius: getResponsiveSize(4, 6, 8),
    gap: getResponsiveSize(2, 4, 6),
  },
  statusText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
  },
  gradeBadge: {
    paddingHorizontal: getResponsiveSize(6, 8, 10),
    paddingVertical: getResponsiveSize(2, 4, 6),
    borderRadius: getResponsiveSize(4, 6, 8),
  },
  gradeText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
  },
  certificateStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: getResponsiveSize(16, 20, 24),
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: getResponsiveSize(8, 12, 16),
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: getResponsiveSize(4, 6, 8),
  },
  statLabel: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#1f2937',
  },
  certificateActions: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(6, 8, 10),
    borderRadius: getResponsiveSize(6, 8, 10),
    gap: getResponsiveSize(4, 6, 8),
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  certificateModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: getResponsiveSize(20, 24, 28),
    borderTopRightRadius: getResponsiveSize(20, 24, 28),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSize(20, 24, 28),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: getResponsiveSize(4, 6, 8),
  },
  modalContent: {
    padding: getResponsiveSize(20, 24, 28),
  },
  detailSection: {
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  detailTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  detailText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#6b7280',
    marginBottom: getResponsiveSize(4, 6, 8),
  },


  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: getResponsiveSize(12, 16, 20),
    padding: getResponsiveSize(4, 6, 8),
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(12, 16, 20),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    borderRadius: getResponsiveSize(8, 12, 16),
    gap: getResponsiveSize(8, 10, 12),
  },
  tabButtonActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },

  // Modern Certificate Styles
  modernCertificate: {
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(20, 24, 28),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    minHeight: getResponsiveSize(500, 600, 700),
  },
  certificateHeaderGradient: {
    padding: getResponsiveSize(24, 32, 40),
    alignItems: 'center',
  },
  certificateHeaderContent: {
    alignItems: 'center',
    width: '100%',
  },
  certificateIconContainer: {
    width: getResponsiveSize(80, 100, 120),
    height: getResponsiveSize(80, 100, 120),
    borderRadius: getResponsiveSize(40, 50, 60),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  modernCertificateTitle: {
    fontSize: getResponsiveFontSize(24, 28, 32),
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: getResponsiveSize(8, 12, 16),
  },
  modernCertificateSubtitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  certificateDivider: {
    width: getResponsiveSize(60, 80, 100),
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  certificateBody: {
    padding: getResponsiveSize(32, 40, 48),
    alignItems: 'center',
  },
  certificateAwardText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#374151',
    textAlign: 'center',
    lineHeight: getResponsiveSize(24, 28, 32),
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  modernParticipantName: {
    fontSize: getResponsiveFontSize(28, 32, 36),
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginVertical: getResponsiveSize(20, 24, 28),
    letterSpacing: 1,
  },
  modernScoreContainer: {
    flexDirection: 'row',
    gap: getResponsiveSize(20, 24, 28),
    marginVertical: getResponsiveSize(24, 32, 40),
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(20, 24, 28),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  gradeBox: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(20, 24, 28),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  scoreLabel: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: getResponsiveSize(8, 12, 16),
  },
  gradeLabel: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '700',
    color: '#0ea5e9',
    letterSpacing: 1,
    marginBottom: getResponsiveSize(8, 12, 16),
  },
  modernScoreText: {
    fontSize: getResponsiveFontSize(32, 40, 48),
    fontWeight: '900',
    color: '#1f2937',
    textAlign: 'center',
  },
  modernPercentageText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: getResponsiveSize(4, 6, 8),
  },
  modernGradeText: {
    fontSize: getResponsiveFontSize(36, 44, 52),
    fontWeight: '900',
    color: '#0ea5e9',
    textAlign: 'center',
  },
  modernCertificateFooter: {
    backgroundColor: '#f8fafc',
    padding: getResponsiveSize(24, 32, 40),
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(8, 12, 16),
  },
  certificateDecorations: {
    position: 'absolute',
    top: getResponsiveSize(20, 24, 28),
    left: getResponsiveSize(20, 24, 28),
    right: getResponsiveSize(20, 24, 28),
    height: getResponsiveSize(40, 50, 60),
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  decorationLeft: {
    width: getResponsiveSize(30, 40, 50),
    height: getResponsiveSize(30, 40, 50),
    borderRadius: getResponsiveSize(15, 20, 25),
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  decorationRight: {
    width: getResponsiveSize(30, 40, 50),
    height: getResponsiveSize(30, 40, 50),
    borderRadius: getResponsiveSize(15, 20, 25),
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },

  // Certificate List Layout Styles
  participantDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSize(8, 12, 16),
    marginVertical: getResponsiveSize(4, 6, 8),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(4, 6, 8),
    backgroundColor: '#f3f4f6',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(6, 8, 10),
  },
  participantDetailsModal: {
    alignItems: 'center',
    marginVertical: getResponsiveSize(8, 12, 16),
    gap: getResponsiveSize(4, 6, 8),
  },
  participantDetailText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Modern Certificate Modal Styles
  certificateModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(12, 16, 20),
    margin: getResponsiveSize(20, 24, 28),
    maxHeight: '90%',
    flex: 1,
  },
  certificateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSize(20, 24, 28),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  certificateModalTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#1f2937',
  },
  certificateScrollView: {
    flex: 1,
  },
  certificateContainer: {
    padding: getResponsiveSize(20, 24, 28),
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  footerValue: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  certificateActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    borderRadius: getResponsiveSize(8, 12, 16),
    paddingVertical: getResponsiveSize(12, 16, 20),
    gap: getResponsiveSize(8, 12, 16),
  },
  certificateActionText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
});
