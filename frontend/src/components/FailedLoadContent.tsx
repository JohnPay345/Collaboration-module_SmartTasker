import { View, Text, StyleSheet } from 'react-native'
import { ReactElement } from 'react'
import { MainColors } from '@/constants'

type FailedLoadContentType = {
  text: string;
}

export const FailedLoadContent:React.FC<FailedLoadContentType> = ({text = ""}) => {
  return (
    <View style={styles.failedContainer}>
      <Text style={styles.failedText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  failedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedText: {
    marginTop: 10,
    color: MainColors.pool_water,
    fontSize: 14,
    fontFamily: 'Century-Regular',
  }
});