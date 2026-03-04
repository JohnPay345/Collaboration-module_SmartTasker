import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Modal, Platform, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { EvilIcons, Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { MainColors, TextColors, BASE_URL } from '@/constants';
import { Agenda, Calendar, LocaleConfig } from 'react-native-calendars';
import { Button } from '@react-navigation/elements';
import { HeaderEditor } from '@src/components/HeaderEditor';

interface ProfileData {
  firstName: string;
  lastName: string;
  patronymic: string;
  birthDate: string;
  startDate: string;
  gender: 'М' | 'Ж';
  lastVisit: string;
  phone: string;
  email: string;
  address: string;
  position: string;
  skills: string;
}

// Временные данные для демонстрации
const mockProfileData: ProfileData = {
  firstName: 'Винокурин',
  lastName: 'Геннадий',
  patronymic: 'Павлович',
  birthDate: '01.01.2000',
  startDate: '01.01.2020',
  gender: 'М',
  lastVisit: '01.01.2020, 21:89',
  phone: '+7 (987) 132-90-21',
  email: 'test@mail.ru',
  address: 'Россия, Республика Башкортостан, г.Уфа, ул.Калинина',
  position: 'Администратор системы',
  skills: 'Администрирование ОС; Сетевые технологии; Облачные технологии',
};

const YEARS = Array.from({ length: 84 }, (_, i) => new Date().getFullYear() - i);

LocaleConfig.locales['ru'] = {
  monthNames: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь'
  ],
  monthNamesShort: ['Янв.', 'Февр.', 'Март', 'Апр.', 'Май', 'Июнь', 'Июль', 'Авг.', 'Сент.', 'Окт.', 'Нояб.', 'Дек.'],
  dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  today: "Сегодня",
};
LocaleConfig.defaultLocale = 'ru';

export const ProfileScreen = () => {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [activeField, setActiveField] = useState<'birthDate' | 'startDate' | null>(null);
  const [profileData, setProfileData] = useState(mockProfileData);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    router.back();
  };

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleDateSelect = (field: 'birthDate' | 'startDate') => {
    setActiveField(field);
    setShowDatePicker(true);
    const [day, month, year] = profileData[field].split('.').map(Number);
    setSelectedDate(new Date(year, month - 1, day));
  };

  const handleConfirm = (date: string) => {
    const selectedDate = new Date(date);
    if (activeField) {
      setProfileData(prev => ({
        ...prev,
        [activeField]: formatDate(selectedDate)
      }));
      setSelectedDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const handleCancel = () => {
    setShowDatePicker(false);
  };

  const getInitialDate = () => {
    if (!activeField) return new Date();
    const [day, month, year] = profileData[activeField].split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  const handleGenderSelect = (gender: 'М' | 'Ж') => {
    setProfileData(prev => ({
      ...prev,
      gender
    }));
    setShowGenderPicker(false);
  };

  const handleMonthYearPress = () => {
    setShowMonthYearPicker(true);
    setTempDate(selectedDate);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(monthIndex);
    setTempDate(newDate);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(year);
    setTempDate(newDate);
  };

  const handleMonthYearConfirm = () => {
    setSelectedDate(new Date(tempDate));
    setShowMonthYearPicker(false);
  };

  const handleMonthYearCancel = () => {
    setShowMonthYearPicker(false);
  };

  const InfoRowMain = ({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) => (
    <View style={styles.infoRowMain}>
      <Text style={styles.labelMain}>{label}</Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.valueMain}>{value}</Text>
      </TouchableOpacity>
    </View>
  );

  const InfoRow = ({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.value]}
        onPress={onPress}
      >
        <Text style={styles.valueText}>{value}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderEditor
        title={'Профиль'}
        onBack={handleBack}
        onSave={handleSave}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {mockProfileData.firstName[0]}{mockProfileData.lastName[0]}
            </Text>
          </View>
          <View style={styles.nameContainer}>
            <TextInput style={styles.nameText} value={mockProfileData.firstName}
              placeholder='Имя' placeholderTextColor={TextColors.lunar_base} />
            <TextInput style={styles.nameText} value={mockProfileData.lastName}
              placeholder='Фамилия' placeholderTextColor={TextColors.lunar_base} />
            <TextInput style={styles.nameText} value={mockProfileData.patronymic}
              placeholder='Отчество' placeholderTextColor={TextColors.lunar_base} />
          </View>
        </View>

        <View style={styles.mainInfoContainer}>
          <InfoRowMain
            label="Дата рождения:"
            value={profileData.birthDate}
            onPress={() => handleDateSelect('birthDate')}
          />
          <InfoRowMain
            label="Начало работы:"
            value={profileData.startDate}
            onPress={() => handleDateSelect('startDate')}
          />
          <InfoRowMain
            label="Пол:"
            value={profileData.gender}
            onPress={() => setShowGenderPicker(true)}
          />
        </View>
        <View style={styles.lastVisitContainer}>
          <Text style={styles.lastVisitText}>Последнее посещение {mockProfileData.lastVisit}</Text>
        </View>
        <View style={styles.infoSection}>
          <InfoRow label="Телефон" value={mockProfileData.phone} />
          <InfoRow label="Email" value={mockProfileData.email} />
          <InfoRow label="Адрес проживания" value={mockProfileData.address} />
          <InfoRow label="Должность" value={mockProfileData.position} />
          <InfoRow label="Области знаний" value={mockProfileData.skills} />
          <TouchableOpacity style={styles.statisticsButton}>
            <Text style={styles.statisticsText}>Статистика работы</Text>
            <MaterialIcons name="keyboard-arrow-right" size={35} color={TextColors.dire_wolf} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.changePasswordButton}>
          <Text style={styles.changePasswordText}>Изменить пароль</Text>
        </TouchableOpacity>

        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={handleCancel}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCancel}
          >
            <View style={styles.calendarContainer}>
              <TouchableOpacity
                onPress={handleMonthYearPress}
                style={styles.calendarHeader}
              >
                <Text style={styles.calendarTitle}>
                  {selectedDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              <Calendar
                markedDates={{
                  [selectedDate.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: '#222222',
                    selectedTextColor: 'yellow',
                  }
                }}
                current={selectedDate.toISOString()}
                minDate="1940-01-01"
                maxDate={new Date().toISOString()}
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
          onRequestClose={handleMonthYearCancel}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleMonthYearCancel}
          >
            <View style={[styles.modalContent, { width: '90%' }]}>
              <Text style={styles.modalTitle}>Выберите месяц и год</Text>

              <View style={styles.monthYearContainer}>
                <View style={styles.monthsContainer}>
                  <Text style={styles.pickerLabel}>Месяц</Text>
                  <ScrollView style={styles.pickerScroll}>
                    {LocaleConfig.locales['ru'].monthNames.map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.pickerItem,
                          tempDate.getMonth() === index && styles.pickerItemSelected
                        ]}
                        onPress={() => handleMonthSelect(index)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          tempDate.getMonth() === index && styles.pickerItemTextSelected
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
                          tempDate.getFullYear() === year && styles.pickerItemSelected
                        ]}
                        onPress={() => handleYearSelect(year)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          tempDate.getFullYear() === year && styles.pickerItemTextSelected
                        ]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={handleMonthYearCancel}>
                  <Text style={styles.modalButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleMonthYearConfirm}>
                  <Text style={[styles.modalButtonText, { color: MainColors.pool_water }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showGenderPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGenderPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowGenderPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Выберите пол:</Text>
              <TouchableOpacity
                style={[styles.modalOption, { borderBottomWidth: 1, borderBottomColor: TextColors.dim_gray }]}
                onPress={() => handleGenderSelect('М')}
              >
                <Text style={styles.modalOptionText}>Мужской</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleGenderSelect('Ж')}
              >
                <Text style={styles.modalOptionText}>Женский</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
    backgroundColor: MainColors.white,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: MainColors.pixel_white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 48,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 16,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRowMain: {
    marginBottom: 16,
    alignItems: 'center',
  },
  infoRow: {
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
    marginBottom: 4,
  },
  labelMain: {
    fontSize: 12,
    color: TextColors.lunar_base,
    fontFamily: 'Century-Regular',
    marginBottom: 4,
  },
  valueMain: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
  },
  value: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
    backgroundColor: MainColors.snowbank,
    padding: 12,
    borderRadius: 8,
  },
  statisticsButton: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: TextColors.dim_gray,
  },
  statisticsText: {
    color: TextColors.dire_wolf,
    fontSize: 14,
    fontFamily: 'Century-Regular',
    padding: 12,
  },
  changePasswordButton: {
    width: 150,
    marginBottom: 16,
  },
  changePasswordText: {
    textAlign: 'center',
    color: MainColors.pool_water,
    fontSize: 14,
    fontFamily: 'Century-Regular',
    borderWidth: 1,
    borderColor: MainColors.pool_water,
    borderRadius: 8,
    padding: 12,
  },
  lastVisitContainer: {
    marginBottom: 16,
  },
  mainInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
  },
  lastVisitText: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
    marginBottom: 4,
  },
  selectableValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
  },
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