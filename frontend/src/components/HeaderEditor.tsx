import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EvilIcons, Ionicons } from '@expo/vector-icons';
import { TextColors, MainColors } from '@/constants';

interface HeaderEditorProps {
  title?: string;
  onBack: () => void;
  onSave?: (data: any) => void;
}

export const HeaderEditor = ({ title, onBack, onSave }: HeaderEditorProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerButton}>
        <TouchableOpacity onPress={onBack}>
          <EvilIcons name="close" size={40} color={TextColors.dim_gray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {onSave ? (
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onSave}>
            <Ionicons name="checkmark" size={35} color={MainColors.pool_water} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TextColors.dim_gray,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Century-Regular',
    color: TextColors.dire_wolf,
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});