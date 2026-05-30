import { ScrollView, Text, StyleSheet, View, TouchableOpacity, TextInput } from 'react-native'
import { useUser } from '@src/api/users'
import { LoadingContent } from '@src/components/LoadingContent'
import { FailedLoadContent } from '@src/components/FailedLoadContent'
import { SvgUri } from 'react-native-svg'
import { BASE_URL, MainColors, TextColors } from '@/constants'
import React from 'react'
import { Controller } from 'react-hook-form'
import { Tags } from '@src/components/Tags'

type ColleagueProfileTabType = {
  user_id: string | '';
}

const InfoRow = ({value, title}:{value: string, title: string}) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{title}</Text>
    <Text style={styles.infoRowIn}>value</Text>
  </View>
);

export const ColleagueProfileTab: React.FC<ColleagueProfileTabType> = ({user_id}) => {
  const {data, isLoading} = useUser(user_id);

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <ScrollView style={[styles.scrollView, styles.scrollViewContent]}>
      {isLoading ? <LoadingContent loadingText={"Загрузка информации об коллеге"} /> : data ? (
          <View>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <SvgUri uri={BASE_URL + data.avatarpath} />
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.nameText}>{data.first_name}</Text>
                <Text style={styles.nameText}>{data.middle_name}</Text>
                <Text style={styles.nameText}>{data?.last_name}</Text>
              </View>
            </View>
            <View style={styles.mainInfoContainer}>
              <View style={styles.infoRowMain}>
                <Text style={styles.labelMain}>Дата рождения:</Text>
                <Text style={styles.valueMain}>{formatDate(new Date(data?.birth_date))}</Text>
              </View>
              <View style={styles.infoRowMain}>
                <Text style={styles.labelMain}>Начало работы:</Text>
                <Text style={styles.valueMain}>{formatDate(new Date(data?.start_date))}</Text>
              </View>
              <View style={styles.infoRowMain}>
                <Text style={styles.labelMain}>Пол:</Text>
                <Text style={styles.valueMain}>{data?.gender == 'Мужчина' ? 'М' : 'Ж'}</Text>
              </View>
            </View>
            <View style={styles.lastVisitContainer}>
              <Text style={styles.lastVisitText}>Последнее посещение {new Date(data?.last_login).toLocaleString('ru-RU')?? '—'}</Text>
            </View>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Телефон</Text>
                <Text style={styles.infoRowIn}>{data?.phone_number}</Text>
              </View>
              <InfoRow value={data.email} title={"Email"}/>
              <InfoRow value={data.address} title={"Адрес проживания"}/>
              <InfoRow value={data.job_title} title={"Должность"}/>
              <Text style={styles.label}>Область знаний</Text>
              {/*TODO: Добавить в Tags поле для изменяемости*/}
              <Tags
                field={"skills"}
                tagsFromAPI={data?.skills}
                editable={false}
              />
            </View>
          </View>
        ) : <FailedLoadContent text={"К сожалению загрузить информацию не удалось"} />}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
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
  mainInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
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
    paddingVertical: 10,
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
  lastVisitContainer: {
    marginBottom: 16,
  },
  lastVisitText: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
    marginBottom: 4,
  },
  infoSection: {
    marginBottom: 24,
  },
});