import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { BASE_URL, MainColors, TextColors } from '@/constants'
import { router } from 'expo-router'
import { SvgUri } from 'react-native-svg'

interface User {
  user_id: string;
  first_name: string;
  middle_name: string;
  last_name?: string | null;
  job_title: string;
  avatarPath: string;
}

export const ColleaguesItem: React.FC<User> = ({user_id, first_name,
middle_name, last_name, job_title, avatarPath}) => {
  return (
    <TouchableOpacity style={styles.container}
      onPress={() => router.push(`/(follows)/${user_id}`)}>
      <View style={styles.content}>
        <SvgUri style={styles.content_image}
          uri={BASE_URL + avatarPath} />
        <View>
          <View style={styles.content_name}>
            <Text style={styles.content_text}>{first_name}</Text>
            <Text style={styles.content_text}>{middle_name}</Text>
            <Text style={styles.content_text}>{last_name ?? ''}</Text>
          </View>
          <View style={styles.content_job}>
            <Text style={styles.content_text}>
              {job_title}
            </Text>
          </View>
        </View>
      </View>
      {/*<Text>{BASE_URL + avatarPath}</Text>*/}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: MainColors.white,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: TextColors.dim_gray,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  content_image: {
    width: 56,
    height: 56,
    marginRight: 10
  },
  content_name: {
    flexDirection: 'row',
  },
  content_text: {
    fontFamily: 'Century-Regular',
    fontSize: 14,
    marginRight: 12
  },
  content_job: {
  },
});