import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import SearchBar from '../components/SearchBar';
import { UserContext } from '../context/UserContext';

const TinNhanScreen = () => {
    const [searchText, setSearchText] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const { fetchUserProfile } = useContext(UserContext);

    // Sử dụng useEffect để tự động tìm kiếm khi người dùng nhập
    useEffect(() => {
        if (!searchText.trim()) {
            setSearchResult(null);
            return;
        }

        const timer = setTimeout(() => {
            handleSearch();
        }, 500); // Trì hoãn 500ms trước khi tìm kiếm

        // Hủy bỏ setTimeout khi `searchText` thay đổi
        return () => clearTimeout(timer);
    }, [searchText]);

    const handleSearch = async () => {
        if (!searchText.trim()) return;

        setLoading(true);
        const result = await fetchUserProfile(searchText.trim());
        setSearchResult(result);
        setLoading(false);
    };

    const handleClearSearch = () => {
        setIsSearching(false);
        setSearchText('');
        setSearchResult(null);
    };

    return (
        <View style={styles.container}>
            {!isSearching ? (
                <>
                    <SearchBar
                        placeholder="Tìm kiếm số điện thoại"
                        leftIcon="search"
                        rightIcon="qr-code-scanner"
                        onRightIconPress={() => console.log('Scan QR button pressed')}
                        searchText={searchText}
                        setSearchText={(text) => {
                            setSearchText(text);
                            setIsSearching(!!text);
                        }}
                    />
                </>
            ) : (
                <View style={styles.searchScreen}>
                    <View style={styles.searchHeader}>
                        <SearchBar
                            placeholder="Tìm kiếm số điện thoại"
                            leftIcon="arrow-back"
                            onLeftIconPress={handleClearSearch}
                            searchText={searchText}
                            setSearchText={setSearchText}
                        />
                        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                            <Text style={styles.searchButtonText}>Tìm</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.resultContainer}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : searchResult ? (
                            <View style={styles.header}>
                                <Image
                                    source={{ uri: searchResult.avatar || 'https://placehold.co/100x100' }}
                                    style={styles.avatar}
                                />
                                <View>
                                    <Text style={styles.name}>{searchResult.name || 'Người dùng vô danh'}</Text>
                                    <Text style={styles.phone}>{searchResult.phoneNumber || 'Chưa có số điện thoại'}</Text>
                                </View>
                            </View>
                        ) : (
                            <Text style={styles.noResult}>
                                {searchText ? "Không tìm thấy người dùng" : "Nhập số điện thoại để tìm kiếm"}
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
    searchScreen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    searchButton: {
        marginLeft: 10,
        backgroundColor: '#007AFF',
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    searchButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultContainer: {
        padding: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#F9F9F9',
        borderRadius: 5,
        padding: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    phone: {
        fontSize: 16,
        color: '#555',
    },
    noResult: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default TinNhanScreen;
