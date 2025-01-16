import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SearchBar from '../components/SearchBar';

const TinNhanScreen = () => {
    const [searchText, setSearchText] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const data = [
        "Tin nhắn 1",
        "Tin nhắn 2",
        "Tin nhắn 3",
        "Tin nhắn 4",
        "Tin nhắn 5",
    ];

    const filteredData = searchText
        ? data.filter(item => item.toLowerCase().includes(searchText.toLowerCase()))
        : [];

    const handleScanQR = () => {
        console.log('Scan QR button pressed');
    };

    return (
        <View style={styles.container}>
            {!isSearching ? (
                <>
                    <SearchBar
                        placeholder="Tìm kiếm"
                        leftIcon="search"
                        rightIcon="qr-code-scanner"
                        onRightIconPress={handleScanQR}
                        searchText={searchText}
                        setSearchText={(text) => {
                            setSearchText(text);
                            setIsSearching(!!text);
                        }}
                    />
                    <ScrollView style={styles.scrollContainer}>
                        {data.map((item, index) => (
                            <Text key={index} style={styles.item}>{item}</Text>
                        ))}
                    </ScrollView>
                </>
            ) : (
                <View style={styles.searchScreen}>
                    <View style={styles.searchHeader}>
                        <SearchBar
                            placeholder="Tìm kiếm"
                            leftIcon="arrow-back"
                            searchText={searchText}
                            setSearchText={setSearchText}
                        />
                    </View>
                    <ScrollView style={styles.resultContainer}>
                        {filteredData.length > 0 ? (
                            filteredData.map((item, index) => (
                                <Text key={index} style={styles.resultItem}>{item}</Text>
                            ))
                        ) : (
                            <Text style={styles.noResult}>
                                {searchText ? "Không tìm thấy kết quả" : "Nhập để tìm kiếm"}
                            </Text>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F8FF',
    },
    scrollContainer: {
        flex: 1,
        padding: 10,
    },
    item: {
        fontSize: 18,
        color: '#333',
        marginBottom: 10,
    },
    searchScreen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#FFFFFF',
    },
    resultContainer: {
        padding: 10,
    },
    resultItem: {
        fontSize: 18,
        color: '#333',
        marginBottom: 10,
    },
    noResult: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default TinNhanScreen;
