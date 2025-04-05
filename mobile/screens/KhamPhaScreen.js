import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SearchBar from '../components/SearchBar';

const KhamPhaScreen = () => {
  const [searchText, setSearchText] = useState('');
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        placeholder="Tìm kiếm"
        leftIcon="search"
        rightIcon="notifications"
        searchText={searchText}
        setSearchText={setSearchText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  text: {
    fontSize: 18,
  },
});

export default KhamPhaScreen;
