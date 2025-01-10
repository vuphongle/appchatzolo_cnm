import React, { useContext } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SearchContext } from '../context/SearchContext';

const SearchHeader = () => {
  const { searchQuery, setSearchQuery } = useContext(SearchContext);

  return (
    <View style={styles.container}>
        <View style={styles.containerTitle}>
          <Icon name="search" size={30} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Tìm kiếm..."
            placeholderTextColor= "white"
            onChangeText={setSearchQuery}
            value={searchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0093fa',
    paddingHorizontal: 10,
    flex: 1,
    height: 45,
    marginRight: 10,
  },
  containerTitle: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
    marginLeft: 5,
    color: 'white',
  },
  input: {
    height: 45,
    fontSize: 20,
    color: 'white',
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: '#0093fa',
    borderRadius: 8,
  },
});

export default SearchHeader;
