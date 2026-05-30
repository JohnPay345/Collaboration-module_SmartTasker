import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { BASE_URL, MainColors, TextColors } from '@/constants';
import { LocaleConfig } from 'react-native-calendars';
import { HeaderEditor } from '@src/components/HeaderEditor';
import { useCurrentUserId } from '@src/hooks/useCurrentUserId';
import { useUser, type User } from '@src/api/users';
import { DatePickerProfile } from '@src/modals/DatePickerProfile'
import { GenderPickerProfile } from '@src/modals/GenderPickerProfile'
import { UsersFormData, usersSchema } from '@src/schemas/users.schema'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Tags } from '@src/components/Tags'
import { LoadingContent } from '@src/components/LoadingContent'
import { SvgUri } from 'react-native-svg'

const emptyProfileData: UsersFormData = {
  first_name: '',
  middle_name: '',
  last_name: '',
  birth_date: new Date('01.01.2000'),
  start_date: new Date('01.01.2020'),
  gender: 'Мужчина',
  lastVisit: new Date(),
  phone_number: '',
  email: '',
  address: '',
  job_title: '',
  last_login: new Date().toLocaleString(),
  skills: '',
};

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

const InfoRowMain = ({control, field, title, onPress}:{control: any, field: string, title: string, onPress: () => void}) => (
  <Controller
    name={field}
    control={control}
    render={({field: {onChange, onBlur, value}}) => (
      <View style={styles.infoRowMain}>
        <Text style={styles.labelMain}>{title}</Text>
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.valueMain}>{value.toLocaleDateString("ru-RU")}</Text>
        </TouchableOpacity>
      </View>
    )}
  />
);

const InfoRow = ({control, field, title}:{control: any, field: string, title: string}) => (
  <Controller
    name={field}
    control={control}
    render={({field: {onChange, onBlur, value}}) => (
      <View style={styles.infoRow}>
        <Text style={styles.label}>{title}</Text>
        <TextInput
          style={styles.infoRowIn}
          onChangeText={onChange}
          value={value}
        />
      </View>
    )}
  />
);

export const ProfileScreen = () => {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeField, setActiveField] = useState<'birth_date' | 'start_date'>('birth_date');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [profileData, setProfileData] = useState(emptyProfileData);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const userId = useCurrentUserId();
  const { data: user, isLoading } = useUser(userId ?? '');

  const { handleSubmit, formState: {errors, defaultValues}, control, setValue, reset } = useForm<UsersFormData>({
    resolver: zodResolver(usersSchema),
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      birth_date: new Date("01.01.2000"),
      start_date: new Date("01.01.2020"),
      gender: 'Мужчина',
      address: '',
      job_title: '',
      avatarpath: '',
      last_login: new Date().toLocaleString('ru-RU'),
      skills: ''
    }
  });

  useEffect(() => {
    if(user) {
      reset({
        first_name: user.first_name ?? '',
        middle_name: user.middle_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        phone_number: user.phone_number ?? '',
        birth_date: user.birth_date ? new Date(user.birth_date) : new Date("01.01.2000"),
        start_date: user.start_date ? new Date(user.start_date) : new Date("01.01.2020"),
        gender: user.gender ?? "Мужчина",
        address: user.address ?? '',
        job_title: user.job_title ?? '',
        avatarpath: user?.avatarpath ?? '',
        last_login: user.last_login ? new Date(user.last_login).toLocaleString('ru-RU') : new Date().toLocaleString('ru-RU'),
        skills: user.skills ? user.skills.toString() : '',
      });
    }
  }, [user, setValue]);

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    router.back();
  };

  const setValueTags = (field: string, postTags: string) => {
    setValue(field as 'skills', postTags);
  }

  const handleDateChange = (normalizedDate:Date) => {
    setValue(activeField, normalizedDate);
  }

  const handleChangeProfileData = (field: string, data: string) => {
    setValue(field, data);
  }

  const parseDisplayDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('.').map(Number);
    if (!day || !month || !year) return new Date();
    return new Date(year, month - 1, day);
  };

  const changeShowPicker = (picker: string, isShow: boolean)=> {
    if(picker == 'DatePicker') {
      setShowDatePicker(isShow);
    } else if(picker == 'GenderPicker') {
      setShowGenderPicker(isShow);
    }
  }

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <View style={styles.container}>
      <HeaderEditor
        title={'Профиль'}
        onBack={handleBack}
        onSave={handleSave}
      />

      {isLoading ? (
        <LoadingContent loadingText={'Загрузка профиля...'} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Controller
                name={"avatarpath"}
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <SvgUri style={styles.avatarImage}
                          uri={BASE_URL + user.avatarpath} />
                )}
              />
            </View>
            <View style={styles.nameContainer}>
              <Controller
                name={"first_name"}
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <TextInput
                    style={styles.nameText}
                    value={value}
                    placeholder='Фамилия'
                    placeholderTextColor={TextColors.lunar_base}
                    onChangeText={onChange}
                  />
                )}
              />
              <Controller
                name={"middle_name"}
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <TextInput
                    style={styles.nameText}
                    value={value}
                    placeholder='Имя'
                    placeholderTextColor={TextColors.lunar_base}
                    onChangeText={onChange}
                  />
                )}
              />
              <Controller
                name={"last_name"}
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <TextInput
                    style={styles.nameText}
                    value={value}
                    placeholder='Отчество'
                    placeholderTextColor={TextColors.lunar_base}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.mainInfoContainer}>
            <View style={styles.infoRowMain}>
              <Text style={styles.labelMain}>Дата рождения:</Text>
              <Controller
                name={"birth_date"}
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <TouchableOpacity onPress={() => {
                    setActiveField('birth_date');
                    setCurrentDate(value);
                    setShowDatePicker(true);
                  }}>
                    <Text style={styles.valueMain}>{formatDate(value)}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={styles.infoRowMain}>
              <Text style={styles.labelMain}>Начало работы:</Text>
              <Controller
                name={"start_date"}
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <TouchableOpacity onPress={() => {
                    setActiveField('start_date');
                    setCurrentDate(value);
                    setShowDatePicker(true);
                  }}>
                    <Text style={styles.valueMain}>{formatDate(value)}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={styles.infoRowMain}>
              <Text style={styles.labelMain}>Пол:</Text>
              <Controller
                name={'gender'}
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <TouchableOpacity onPress={() => setShowGenderPicker(true)}>
                    <Text style={styles.valueMain}>{value == 'Мужчина' ? 'М' : 'Ж'}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
          <View style={styles.lastVisitContainer}>
            <Controller
              name={'last_login'}
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                <Text style={styles.lastVisitText}>Последнее посещение {value ?? '—'}</Text>
              )}
            />
          </View>
          <View style={styles.infoSection}>
            <Controller
              name={"phone_number"}
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Телефон</Text>
                  <TextInput
                    style={styles.infoRowIn}
                    keyboardType={"numeric"}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
            />
            <InfoRow control={control} field={"email"} title={"Email"}/>
            <InfoRow control={control} field={"address"} title={"Адрес проживания"}/>
            <InfoRow control={control} field={"job_title"} title={"Должность"}/>
            <Text style={styles.label}>Область знаний</Text>
            <Controller
              name={'skills'}
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                <Tags
                  field={"skills"}
                  setValue={setValueTags}
                  tagsFromAPI={value.split(',')}
                />
              )}
            />
            <TouchableOpacity style={styles.statisticsButton}>
              <Text style={styles.statisticsText}>Статистика работы</Text>
              <MaterialIcons name="keyboard-arrow-right" size={35} color={TextColors.dire_wolf}/>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push(`/(password)/resetpass`)} style={styles.changePasswordButton}>
            <Text style={styles.changePasswordText}>Изменить пароль</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <DatePickerProfile
        field={activeField}
        showDatePicker={showDatePicker}
        currentDate={currentDate}
        handleDateChange={handleDateChange}
        setShowDatePicker={changeShowPicker}
      />

      <GenderPickerProfile
        showGenderPicker={showGenderPicker}
        handleChangeProfileData={handleChangeProfileData}
        setShowGenderPicker={changeShowPicker}
      />
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
  avatarImage: {
    width: 120,
    height: 120,
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
  infoRowIn: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: MainColors.snowbank,
    backgroundColor: MainColors.snowbank,
    paddingHorizontal: 10,
    fontFamily: 'Century-Regular'
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
});