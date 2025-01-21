import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import MyMessageItem from './MyMessagaItem'; 
import MessageItem from './MessageItem'; 

// Dữ liệu mẫu 
const mockRoomState = {
    lstChat: [
        {
            user: { _id: '1', avatar: 'https://randomuser.me/api/portraits/women/43.jpg', email: 'user1@example.com' },
            content: 'Bạn có tôi đã tốt như nào không!!!',
            createdAt: '9:00 AM',
            type: 'text',
            reacts: [{ emoji: '' }],
            _id: 'msg1',
        },
 
        {
            user: { _id: '1', avatar: 'https://randomuser.me/api/portraits/women/43.jpg', email: 'user1@example.com' },
            content: 'https://via.placeholder.com/150https://i.pinimg.com/236x/85/40/33/854033242929cb15cd206e07b3981d58.jpg',
            createdAt: '9:10 AM',
            type: 'image',
            reacts: [{ emoji: '' }],
            _id: 'msg3',
        },
        {
            user: { _id: '3', avatar: 'https://randomuser.me/api/portraits/women/45.jpg', email: 'Nhancach02' },
            content: 'Ối dồi ôii',
            createdAt: '9:15 AM',
            type: 'text',
            reacts: [{ emoji: '' }],
            _id: 'msg4',
        },
         {
            user: { _id: '3', avatar: 'https://randomuser.me/api/portraits/women/45.jpg', email: 'Nhancach02' },
            content: 'https://i.pinimg.com/736x/c8/30/e5/c830e58ae00a80faecbc11663347e74f.jpg',
            createdAt: '9:15 AM',
            type: 'image',
            reacts: [{ emoji: '' }],
            _id: 'msg4',
        },
           {
            user: { _id: '3', avatar: 'https://randomuser.me/api/portraits/women/45.jpg', email: 'Nhancach02' },
            content: 'bình tĩnh thôi bạn ơi',
            createdAt: '9:15 AM',
            type: 'text',
            reacts: [{ emoji: '' }],
            _id: 'msg4',
        },
              {
            user: { _id: '1', avatar: 'https://randomuser.me/api/portraits/women/43.jpg', email: 'user1@example.com' },
            content: 'sơ chưa ní!!',
            createdAt: '9:00 AM',
            type: 'text',
            reacts: [{ emoji: '' }],
            _id: 'msg1',
        },
    ],
};

const mockUserState = {
    user: { _id: '1', email: 'user1@example.com' },
};
//truyen vao id-account
const BodyChat = () => {
    const roomState = mockRoomState; 
    const userState = mockUserState; 
    let count = 0;
    const owner = '3';

    return (
        <ScrollView style={styles.container}>
            {roomState.lstChat.map((e) => {
                count++;
                const isMyMessage = e.user._id === userState.user._id;
                const isOwner = e.user._id === owner;
                let emoji = null;

                if (e.reacts != null) {
                    e.reacts.map((x) => {
                        emoji = x.emoji;
                    });
                }

                if (isMyMessage) {
                    return (
                        <MyMessageItem
                            key={count}
                            avatar={e.user.avatar}
                            name={e.user.email}
                            time={e.createdAt}
                            message={e.content}
                            type={e.type}
                            owner={isOwner}
                            _id={e._id}
                            emoji={emoji}
                        />
                    );
                } else {
                    return (
                        <MessageItem
                            key={count}
                            avatar={e.user.avatar}
                            name={e.user.email}
                            time={e.createdAt}
                            message={e.content}
                            type={e.type}
                            owner={isOwner}
                            _id={e._id}
                            emoji={emoji}
                        />
                    );
                }
            })}
        </ScrollView>
    );
};

export default BodyChat;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 10,
        paddingVertical: 20,
    },
});
