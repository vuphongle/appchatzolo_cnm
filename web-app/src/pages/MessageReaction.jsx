import React, { useState, useEffect } from 'react';
import MessageService from "../services/MessageService";
import '../css/MessageReaction.css'; // Đảm bảo rằng bạn đã import CSS cho các emoji
import "../css/MainPage.css"; // CSS riêng cho giao diện
import { useWebSocket } from "../context/WebSocket";

const MessageReaction = ({ messageId, userId, initialReactions = [] }) => {
    // Đảm bảo reactions luôn là mảng nếu không có dữ liệu
    const [reactions, setReactions] = useState(Array.isArray(initialReactions) ? initialReactions : []);
    const [reactionCount, setReactionCount] = useState({});
    const { onMessage } = useWebSocket();


    useEffect(() => {
        const unsubscribe = onMessage((incomingMessage) => {
            if (incomingMessage.type === "REACT" && incomingMessage.messageId === messageId) {
                setReactions(prev => [
                    ...prev,
                    {
                        userId: incomingMessage.userId || "unknown",
                        reactionType: incomingMessage.reactionType,
                    }
                ]);
            }
            if (incomingMessage.type === "REMOVE_REACT") {
                const { messageId, userId } = incomingMessage;
                setReactions(prevMessages =>
                    prevMessages.map(msg => {
                        if (msg.id === messageId) {
                            const updatedReactions = msg.reactions.filter(
                                r => r.userId !== userId
                            );
                            return { ...msg, reactions: updatedReactions };
                        }
                        return msg;
                    })
                );
            }





        });

        return () => unsubscribe();
    }, [messageId, onMessage]);

    useEffect(() => {
        const isEqual = JSON.stringify(initialReactions) === JSON.stringify(reactions);
        if (!isEqual) {
            setReactions(Array.isArray(initialReactions) ? initialReactions : []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialReactions]);  // chỉ phụ thuộc initialReactions


    useEffect(() => {
        const counts = {};
        reactions.forEach(reaction => {
            const type = typeof reaction === 'string' ? reaction : reaction.reactionType;
            if (type) {
                counts[type] = (counts[type] || 0) + 1;
            }
        });
        const isEqual = JSON.stringify(counts) === JSON.stringify(reactionCount);
        if (!isEqual) {
            setReactionCount(counts);
        }
    }, [reactions, reactionCount]);
    const totalReactions = Object.values(reactionCount).reduce((sum, count) => sum + count, 0);


    // Hàm để xử lý thêm reaction vào tin nhắn
    const handleAddReaction = (reactionType) => {
        if (messageId) {
            MessageService.addReact(messageId, userId, reactionType)
                .then(updatedMessage => {
                    setReactions(updatedMessage.reactions); // Cập nhật reactions khi thêm mới
                })
                .catch((error) => console.error("Lỗi khi thêm reaction", error));
        } else {
            console.error("Không tìm thấy ID của tin nhắn.");
        }
    };

    // Hàm để xử lý xóa reaction khỏi tin nhắn
    const handleRemoveReaction = () => {  // ko cần reactionType
        if (messageId) {
            MessageService.removeReact(messageId, userId)
                .then(() => {
                    setReactions(prev =>
                        Array.isArray(prev)
                            ? prev.filter(r => r.userId !== userId)
                            : []
                    );
                })
                .catch((error) => console.error("Lỗi khi xóa reaction", error));
        } else {
            console.error("Không tìm thấy ID của tin nhắn.");
        }
    };



    const displayedReactions = (reactions || []).slice(0, 3);
    const isLikeDisabled = !reactions || reactions.length === 0;


    // // Cập nhật lại reaction count khi reactions thay đổi
    // useEffect(() => {
    //     updateReactionCount(reactions);
    // }, [reactions]);
    // useEffect(() => {
    //     console.log("reactionCount:", reactionCount);
    // }, [reactionCount]);

    // Tạo mảng các loại reaction và số lượng, sắp xếp giảm dần, lấy tối đa 3 loại nhiều nhất
    const sortedReactions = Object.entries(reactionCount)
        .sort((a, b) => b[1] - a[1]) // Sắp xếp giảm dần theo số lượng
        .slice(0, 3); // Lấy tối đa 3 loại

    return (
        <div className="reactions">
            {/* Tổng số reaction (đặt ở đầu nút Like) */}
            {totalReactions > 0 && (
                <div
                    className="reaction-icons-wrapper"
                    style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                    {sortedReactions.slice(0, 3).map(([reactionType, count], index, arr) => (
                        <span
                            key={reactionType}
                            className="reaction-icon"
                            role="img"
                            aria-label={reactionType}
                            title={`${reactionType}: ${count}`}
                        >
                            {reactionType === 'LIKE' && '👍'}
                            {reactionType === 'LOVE' && '❤️'}
                            {reactionType === 'HAHA' && '😂'}
                            {reactionType === 'WOW' && '😮'}
                            {reactionType === 'SAD' && '😢'}
                            {reactionType === 'ANGRY' && '😡'}


                            {/* Hiển thị tổng reactions bên cạnh reaction cuối cùng */}
                            {index === arr.length - 1 && (
                                <span className="total-reactions-badge">{totalReactions}</span>
                            )}
                        </span>
                    ))}
                </div>
            )}


            <span
                className={`emoji like ${reactions.some(r => r.reactionType === 'LIKE' && r.userId === userId) ? 'active' : ''}`}
                onClick={() => {
                    if (reactions.includes('LIKE')) {
                        handleRemoveReaction('LIKE');
                    } else {
                        handleAddReaction('LIKE');
                    }
                }}
                role="img"
                aria-label="Like"
                style={isLikeDisabled ? { opacity: 0.5 } : {}}
            >
                👍

            </span>


            {['LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'].map((reaction) => (
                <span
                    key={reaction}
                    className={`emoji ${reactions.includes(reaction) ? 'active' : ''}`}
                    onClick={() => {
                        if (reactions.includes(reaction)) {
                            handleRemoveReaction(reaction);
                        } else {
                            handleAddReaction(reaction);
                        }
                    }}
                    role="img"
                    aria-label={reaction}
                >
                    {reaction === 'LOVE' && '❤️'}
                    {reaction === 'HAHA' && '😂'}
                    {reaction === 'WOW' && '😮'}
                    {reaction === 'SAD' && '😢'}
                    {reaction === 'ANGRY' && '😡'}

                </span>

            ))}
            {/* Nút X để thu hồi reactions */}
            {reactions.some(r => r.userId === userId) && (
                <span
                    className="close-reactions"
                    onClick={handleRemoveReaction}
                    role="img"
                    aria-label="Close"
                > x
                </span>
            )}
        </div>
    );
};

export default MessageReaction;