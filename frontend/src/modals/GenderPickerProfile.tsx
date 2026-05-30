import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MainColors, TextColors } from '@/constants'

type GenderPickerProfileType = {
  showGenderPicker: boolean;
  handleChangeProfileData: (field: string, data: string) => void;
  setShowGenderPicker: (picker: string, isShow: boolean) => void;
}

export const GenderPickerProfile: React.FC<GenderPickerProfileType> = ({showGenderPicker = false, handleChangeProfileData, setShowGenderPicker}) => {
  const handleGenderSelect = (gender: 'М' | 'Ж') => {
    handleChangeProfileData('gender', gender == 'М' ? 'Мужчина' : 'Женщина');
    setShowGenderPicker('GenderPicker', false);
  };

  return (
    <>
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderPicker('GenderPicker', false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderPicker('GenderPicker', false)}
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
});