import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MainColors, TextColors } from '@/constants'
import { Calendar, LocaleConfig } from 'react-native-calendars'

type DatePickerProfileType = {
  field: string;
  showDatePicker: boolean;
  currentDate: Date;
  handleDateChange: (normalizedDate: Date) => void;
  setShowDatePicker: (picker: string, isShow: boolean) => void;
  /** YYYY-MM-DD; по умолчанию 1940-01-01 */
  minDate?: string;
  /** YYYY-MM-DD; по умолчанию сегодня */
  maxDate?: string;
}

const YEARS = Array.from({ length: 84 }, (_, i) => new Date().getFullYear() - i);

export const DatePickerProfile:React.FC<DatePickerProfileType> = ({
  field = '',
  showDatePicker = false,
  handleDateChange,
  setShowDatePicker,
  currentDate,
  minDate = '1940-01-01',
  maxDate,
}) => {
  const toCalendarDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const maxDateStr = maxDate ?? toCalendarDate(new Date());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const handleConfirm = (date: string) => {
    const pickedDate = parseCalendarDate(date);
    handleDateChange(pickedDate);
    setShowDatePicker('Date Picker', false);
    setSelectedDate(pickedDate);
  };

  const parseCalendarDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(selectedDate.getTime());
    newDate.setMonth(monthIndex);
    setSelectedDate(newDate);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(selectedDate.getTime());
    newDate.setFullYear(year);
    setSelectedDate(newDate);
  };

  const handleMonthYearConfirm = () => {
    // Фиксируем выбранный месяц/год в selectedDate (день ставим 1 для избежания сдвигов)
    const normalizedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    setSelectedDate(normalizedDate);
    handleDateChange(normalizedDate);
    setShowMonthYearPicker(false);
  };

  if (!LocaleConfig.locales[LocaleConfig.defaultLocale]) {
    LocaleConfig.defaultLocale = '';
  }

  return (
    <>
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker('Date Picker', false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker('Date Picker', false)}
        >
          <View style={styles.calendarContainer}>
            <TouchableOpacity
              onPress={() => setShowMonthYearPicker(true)}
              style={styles.calendarHeader}
            >
              <Text style={styles.calendarTitle}>
                {selectedDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            <Calendar
              markedDates={{
                [toCalendarDate(selectedDate)]: {
                  selected: true,
                  selectedColor: '#222222',
                  selectedTextColor: 'yellow',
                }
              }}
              initialDate={toCalendarDate(selectedDate)}
              current={toCalendarDate(selectedDate)}
              minDate={minDate}
              maxDate={maxDateStr}
              onDayPress={(day) => handleConfirm(day.dateString)}
              monthFormat={'yyyy MMMM'}
              hideExtraDays={true}
              firstDay={1}
              theme={{
                backgroundColor: MainColors.white,
                calendarBackground: MainColors.white,
                textSectionTitleColor: TextColors.dire_wolf,
                selectedDayBackgroundColor: MainColors.pool_water,
                selectedDayTextColor: TextColors.ottoman_red,
                todayTextColor: MainColors.pool_water,
                dayTextColor: TextColors.dire_wolf,
                textDisabledColor: TextColors.dim_gray,
                arrowColor: TextColors.dire_wolf,
                monthTextColor: TextColors.dire_wolf,
                textDayFontFamily: 'Century-Regular',
                textMonthFontFamily: 'Century-Regular',
                textDayHeaderFontFamily: 'Century-Regular',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14,
                arrowStyle: {
                  padding: 10,
                }
              }}
            />
            <View style={styles.calendarFooter}>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showMonthYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthYearPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker('Date Picker', false)}
        >
          <View style={[styles.modalContent, { width: '90%' }]}>
            <Text style={styles.modalTitle}>Выберите месяц и год</Text>

            <View style={styles.monthYearContainer}>
              <View style={styles.monthsContainer}>
                <Text style={styles.pickerLabel}>Месяц</Text>
                <ScrollView style={styles.pickerScroll}>
                  {LocaleConfig.locales['ru'].monthNames.map((month: string, index: number) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        selectedDate.getMonth() === index && styles.pickerItemSelected
                      ]}
                      onPress={() => handleMonthSelect(index)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDate.getMonth() === index && styles.pickerItemTextSelected
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.yearsContainer}>
                <Text style={styles.pickerLabel}>Год</Text>
                <ScrollView style={styles.pickerScroll}>
                  {YEARS.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedDate.getFullYear() === year && styles.pickerItemSelected
                      ]}
                      onPress={() => handleYearSelect(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDate.getFullYear() === year && styles.pickerItemTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setShowDatePicker('Date Picker', false)}>
                <Text style={styles.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMonthYearConfirm}>
                <Text style={[styles.modalButtonText, { color: MainColors.pool_water }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: MainColors.white,
    borderRadius: 8,
    padding: 16,
    width: '80%',
  },
  modalTitle: {
    fontSize: 16,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: MainColors.white,
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: TextColors.dim_gray,
  },
  calendarButtonText: {
    fontSize: 16,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedDateText: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
  },
  calendarTitle: {
    fontSize: 18,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
  },
  monthYearContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthsContainer: {
    flex: 1,
    marginRight: 8,
  },
  yearsContainer: {
    flex: 1,
    marginLeft: 8,
  },
  pickerLabel: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
    marginBottom: 8,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  pickerItemSelected: {
    backgroundColor: MainColors.pool_water,
  },
  pickerItemText: {
    fontSize: 16,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
  },
  pickerItemTextSelected: {
    color: TextColors.snowbank,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: TextColors.dim_gray,
  },
  modalButtonText: {
    fontSize: 16,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});