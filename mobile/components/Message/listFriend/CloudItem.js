import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
const CloudItem = ({ timestamp }) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('ScreenCloud')}
    >
      <View style={styles.iconContainer}>
        <View style={styles.cloudIcon}>
          <Image
            source={{
              uri: 'https://res-zalo.zadn.vn/upload/media/2021/6/4/2_1622800570007_369788.jpg',
            }}
            style={{ height: 40, width: 40, borderRadius: 50 }}
          />
        </View>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Cloud của tôi</Text>
        <Text style={styles.subtitle}>[Hình ảnh]</Text>
      </View>
      <Text style={styles.timestamp}>{timestamp}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  iconContainer: {
    marginRight: 12,
  },
  cloudIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#4B9CFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 24,
    height: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    opacity: 0.3,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 14,
    color: '#aaa',
  },
});

export default CloudItem;
