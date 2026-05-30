import React, { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { TextColors } from '@/constants'

type TagsType = {
  title?: string;
  field: string;
  setValue?: (field: string, postTags: string) => void;
  tagsFromAPI: string[] | undefined;
  editable?: boolean;
  renderEditorHint?: (name: string) => null | ReactNode;
}

export const Tags: React.FC<TagsType> = ({ title, field, setValue, tagsFromAPI, editable = true, renderEditorHint }) => {
  const [currentTag, setCurrentTag] = useState('');
  const [tagsList, setTagsList] = useState(tagsFromAPI ?? []);

  useEffect(() => {
    if (tagsFromAPI) {
      setTagsList(tagsFromAPI.filter((t) => t.trim() !== ''));
    }
  }, [tagsFromAPI]);

  const handleAddTag = (field: string) => {
    if (currentTag.trim() !== '' && !tagsList.includes(currentTag.trim())) {
      let newTagsList = [...tagsList, currentTag.trim()];
      setTagsList(newTagsList);
      if(editable) {
        setValue(field, newTagsList.toString());
      }
      setCurrentTag(''); // Очищаем поле ввода после добавления
    }
  };

  const handleRemoveTag = (tagToRemove: string, field: string) => {
    let newTagsList = tagsList.filter(tag => tag != tagToRemove);
    if(editable) {
      setTagsList(newTagsList);
    }
    setValue(field, newTagsList.toString());
  };
  return (
    <View style={styles.section}>
      {title && <Text style={styles.label}>{title}</Text>}
      {renderEditorHint && renderEditorHint('tags')}
      <View style={styles.inputContainer}>
        {tagsList.length > 0 && tagsList.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            {editable ? (
              <TouchableOpacity onPress={() => handleRemoveTag(tag, field)} style={styles.tagCloseButton}>
                <Text style={styles.tagCloseText}>x</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}

        {editable ? (
          <TextInput
            style={styles.textInput}
            value={currentTag}
            onChangeText={setCurrentTag}
            placeholder="Добавить тег..."
            onSubmitEditing={() => handleAddTag(field)}
            returnKeyType="done"
            blurOnSubmit={false}
          />
        ) : null}
      </View>
    </View>
  )
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: TextColors.dim_gray,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row', // Чтобы теги располагались в строку
    flexWrap: 'wrap',     // И переносились на новую строку
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    minHeight: 50,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 3,
  },
  tagText: {
    fontFamily: 'Century-Regular',
    marginRight: 5,
  },
  tagCloseButton: {
    marginLeft: 5,
    padding: 2,
  },
  tagCloseText: {
    color: '#555',
    fontWeight: 'bold',
  },
  textInput: {
    flex: 1, // Чтобы TextInput занимал оставшееся место
    minHeight: 40, // Чтобы TextInput был достаточно высоким
    paddingHorizontal: 5,
    fontFamily: 'Century-Regular',
  },
});