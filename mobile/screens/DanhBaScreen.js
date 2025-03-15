import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import SearchBar from '../components/SearchBar';
import { IPV4 } from '@env';
import { UserContext } from '../context/UserContext';

const DanhBaScreen = () => {
    const [searchText, setSearchText] = useState('');
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [sendersInfo, setSendersInfo] = useState({}); // Lưu thông tin người gửi
    const [receiversInfo, setReceiversInfo] = useState({}); // Lưu thông tin người nhận
    const { user, updateFriendRequestsCount, friendRequestsCount } = useContext(UserContext);

    // Lấy các lời mời kết bạn đã nhận
    useEffect(() => {
        const fetchFriendRequests = async () => {
            try {
                const response = await fetch(`${IPV4}/messages/invitations/received/${user?.id}`);
                const data = await response.json();
                setFriendRequests(data);

                // Lấy thông tin người gửi cho mỗi lời mời
                for (let request of data) {
                    const senderResponse = await fetch(`${IPV4}/user/findById/${request.senderID}`);
                    const senderData = await senderResponse.json();
                    setSendersInfo((prevInfo) => ({
                        ...prevInfo,
                        [request.id]: senderData, // Lưu thông tin người gửi theo ID lời mời
                    }));
                }
            } catch (error) {
                console.error('Error fetching friend requests:', error);
            }
        };

        // Lấy các lời mời đã gửi
        const fetchSentRequests = async () => {
            try {
                const response = await fetch(`${IPV4}/messages/invitations/sent/${user?.id}`);
                const data = await response.json();
                setSentRequests(data);

                // Lấy thông tin người nhận cho mỗi lời mời đã gửi
                for (let request of data) {
                    const receiverResponse = await fetch(`${IPV4}/user/findById/${request.receiverID}`);
                    const receiverData = await receiverResponse.json();
                    setReceiversInfo((prevInfo) => ({
                        ...prevInfo,
                        [request.id]: receiverData, // Lưu thông tin người nhận theo ID lời mời đã gửi
                    }));
                }
            } catch (error) {
                console.error('Error fetching sent requests:', error);
            }
        };

        fetchFriendRequests();
        fetchSentRequests();
    }, [user?.id, friendRequestsCount]);

    // Hàm xử lý "Chấp nhận" hoặc "Từ chối" lời mời
    const handleRequestResponse = async (requestId, senderId, receiverId, action) => {
        try {
            let url = '';
            let method = 'POST';

            if (action === 'accept') {
                url = `${IPV4}/messages/acceptFriendRequest/${senderId}/${receiverId}`;
            } else if (action === 'reject') {
                url = `${IPV4}/messages/invitations/${senderId}/${receiverId}`;
                method = 'DELETE';
            } else if (action === 'delete') {
                url = `${IPV4}/messages/invitations/${user?.id}/${receiverId}`;
                method = 'DELETE';
            }

            const response = await fetch(url, {
                method,
            });

            console.log(response);

            if (response.ok) {
                if (action === 'accept') {
                    setFriendRequests(friendRequests.filter((request) => request.senderID !== senderId));
                } else if (action === 'reject') {
                    setFriendRequests(friendRequests.filter((request) => request.id !== requestId));
                } else if (action === 'delete') {
                    setSentRequests(sentRequests.filter((request) => request.id !== requestId));
                }
                updateFriendRequestsCount();
            } else {
                console.log(`${action === 'accept' ? 'Chấp nhận' : action === 'reject' ? 'Từ chối' : 'Xóa'} lời mời thất bại`);
            }
        } catch (error) {
            console.error(`Có lỗi xảy ra khi ${action === 'accept' ? 'chấp nhận' : action === 'reject' ? 'từ chối' : 'xóa'} lời mời:`, error);
        }
    };

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

            <ScrollView style={styles.listContainer}>
                {/* Lời mời kết bạn */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Lời mời kết bạn</Text>
                    {friendRequests.length > 0 ? (
                        friendRequests.map((request) => (
                            <View key={request.id} style={styles.requestItem}>
                                {/* Hiển thị thông tin người gửi */}
                                {sendersInfo[request.id] && (
                                    <View style={styles.senderInfo}>
                                        <Image
                                            source={{ uri: sendersInfo[request.id].avatar }}
                                            style={styles.avatar}
                                        />
                                        <Text style={styles.senderName}>{sendersInfo[request.id].name}</Text>
                                    </View>
                                )}
                                <Text style={styles.requestText}>{request.content}</Text>
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleRequestResponse(request.id, request.senderID, request.receiverID, 'accept')}
                                    >
                                        <Text style={styles.actionButtonText}>Chấp nhận</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.rejectButton]}
                                        onPress={() => handleRequestResponse(request.id, request.senderID, request.receiverID, 'reject')}
                                    >
                                        <Text style={styles.actionButtonText}>Từ chối</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noRequestsText}>Chưa có lời mời kết bạn</Text>
                    )}
                </View>

                {/* Lời mời đã gửi */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Đã gửi</Text>
                    {sentRequests.length > 0 ? (
                        sentRequests.map((request) => (
                            <View key={request.id} style={styles.requestItem}>
                                {/* Hiển thị thông tin người nhận */}
                                {receiversInfo[request.id] && (
                                    <View style={styles.senderInfo}>
                                        <Image
                                            source={{ uri: receiversInfo[request.id].avatar }}
                                            style={styles.avatar}
                                        />
                                        <Text style={styles.senderName}>{receiversInfo[request.id].name}</Text>
                                    </View>
                                )}
                                <Text style={styles.requestText}>{request.content}</Text>
                                <Text style={styles.requestStatus}>Trạng thái: {request.status}</Text>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.deleteButton]}
                                    onPress={() => handleRequestResponse(request.id, request.senderID, request.receiverID, 'delete')}
                                >
                                    <Text style={styles.actionButtonText}>Xóa lời mời</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noRequestsText}>Chưa gửi lời mời nào</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F8FF',
    },
    listContainer: {
        padding: 10,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    requestItem: {
        backgroundColor: '#F9F9F9',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    senderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    senderName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    requestText: {
        fontSize: 16,
    },
    requestStatus: {
        fontSize: 14,
        color: '#888',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButton: {
        backgroundColor: '#34C759',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
    },
    rejectButton: {
        backgroundColor: '#FF3B30',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    noRequestsText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
    },
});

export default DanhBaScreen;
