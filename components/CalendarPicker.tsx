import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;

const getResponsiveFontSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

interface CalendarPickerProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  title?: string;
  initialDate?: Date;
  minDate?: Date;
  maxDate?: Date;
}

export default function CalendarPicker({
  visible,
  onClose,
  onDateSelect,
  title = "Select Date",
  initialDate = new Date(),
  minDate,
  maxDate,
}: CalendarPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDisabled(date)) {
      setSelectedDate(date);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleConfirm = () => {
    onDateSelect(selectedDate.toISOString().split('T')[0]); // YYYY-MM-DD format
    onClose();
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          <View style={styles.calendarContainer}>
            {/* Month Navigation */}
            <View style={styles.monthHeader}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => navigateMonth('prev')}
              >
                <Ionicons name="chevron-back" size={16} color="#00d4ff" />
              </TouchableOpacity>
              
              <Text style={styles.monthText}>
                {currentMonth.toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Text>
              
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => navigateMonth('next')}
              >
                <Ionicons name="chevron-forward" size={16} color="#00d4ff" />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {(() => {
                const daysInMonth = getDaysInMonth(currentMonth);
                const firstDay = getFirstDayOfMonth(currentMonth);
                const days = [];

                // Add empty cells for days before the first day of the month
                for (let i = 0; i < firstDay; i++) {
                  days.push(
                    <View key={`empty-${i}`} style={styles.calendarDay} />
                  );
                }

                // Add days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isDayToday = isToday(date);
                  const isDaySelected = isSelected(date);
                  const isDayDisabled = isDisabled(date);

                  days.push(
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.calendarDay,
                        isDaySelected && styles.calendarDaySelected,
                        isDayToday && styles.calendarDayToday,
                        isDayDisabled && styles.calendarDayDisabled,
                      ]}
                      onPress={() => handleDateSelect(day)}
                      disabled={isDayDisabled}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isDaySelected && styles.calendarDayTextSelected,
                          isDayToday && styles.calendarDayTextToday,
                          isDayDisabled && styles.calendarDayTextDisabled,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return days;
              })()}
            </View>
          </View>

          {/* Selected Date Display */}
          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateText}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 20,
    marginHorizontal: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: 280,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginVertical: 2,
    minHeight: 28,
  },
  calendarDaySelected: {
    backgroundColor: '#00d4ff',
  },
  calendarDayToday: {
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  calendarDayDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  calendarDayText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '500',
    color: '#ffffff',
  },
  calendarDayTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#00ff88',
    fontWeight: '700',
  },
  calendarDayTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  selectedDateContainer: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#00d4ff',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#00d4ff',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#000000',
  },
});
