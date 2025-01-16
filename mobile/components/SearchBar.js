import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SearchBar = ({ placeholder, leftIcon, rightIcon, onLeftIconPress, onRightIconPress, searchText, setSearchText }) => {
    return (
        <View style={styles.searchBar}>
            {leftIcon && (
                <TouchableOpacity onPress={onLeftIconPress}>
                    <Icon name={leftIcon} size={24} color="#888" style={styles.searchIcon} />
                </TouchableOpacity>
            )}
            <TextInput
                style={styles.searchInput}
                placeholder={placeholder || "Tìm kiếm"}
                value={searchText}
                onChangeText={setSearchText}
            />
            {rightIcon && (
                <TouchableOpacity onPress={onRightIconPress}>
                    <Icon name={rightIcon} size={24} color="#0056B3" style={styles.rightIcon} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 8,
        margin: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    rightIcon: {
        marginLeft: 10,
    },
});

export default SearchBar;
