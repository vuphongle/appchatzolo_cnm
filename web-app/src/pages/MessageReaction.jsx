import React, { useState, useEffect } from 'react';
import MessageService from "../services/MessageService";
import '../css/MessageReaction.css'; // Đảm bảo rằng bạn đã import CSS cho các emoji
import "../css/MainPage.css"; // CSS riêng cho giao diện

const MessageReaction = ({ messageId, userId, initialReactions = [] }) => {
    // Đảm bảo reactions luôn là mảng nếu không có dữ liệu
    const [reactions, setReactions] = useState(Array.isArray(initialReactions) ? initialReactions : []);
    const [reactionCount, setReactionCount] = useState({});
    useEffect(() => {
        setReactions(Array.isArray(initialReactions) ? initialReactions : []);
    }, [initialReactions]);
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
    const handleRemoveReaction = (reactionType) => {
        if (messageId) {
            MessageService.removeReact(messageId, userId)
                .then(() => {
                    setReactions(prev =>
                        Array.isArray(prev)
                            ? prev.filter(r =>
                                (typeof r === 'string') ||
                                (typeof r === 'object' && r.userId !== userId)
                            )
                            : []
                    );
                })
                .catch((error) => console.error("Lỗi khi xóa reaction", error));
        } else {
            console.error("Không tìm thấy ID của tin nhắn.");
        }
    };

    // Cập nhật số lượng reactions cho mỗi loại
    const updateReactionCount = (newReactions) => {
        const counts = {};
        newReactions.forEach(reaction => {
            // Nếu là object, lấy reactionType; nếu là string thì dùng luôn
            const type = typeof reaction === 'string' ? reaction : reaction.reactionType;
            if (type) {
                counts[type] = (counts[type] || 0) + 1;
            }
        });
        setReactionCount(counts);
    };

    const displayedReactions = (reactions || []).slice(0, 3);
    const isLikeDisabled = !reactions || reactions.length === 0;


    // Cập nhật lại reaction count khi reactions thay đổi
    useEffect(() => {
        updateReactionCount(reactions);
    }, [reactions]);
    useEffect(() => {
        console.log("reactionCount:", reactionCount);
    }, [reactionCount]);

    // Tạo mảng các loại reaction và số lượng, sắp xếp giảm dần, lấy tối đa 3 loại nhiều nhất
    const sortedReactions = Object.entries(reactionCount)
        .sort((a, b) => b[1] - a[1]) // Sắp xếp giảm dần theo số lượng
        .slice(0, 3); // Lấy tối đa 3 loại

    return (
        <div className="reactions">
            <span
                className={`emoji like ${reactions.includes('LIKE') ? 'active' : ''}`}
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
                {reactionCount['LIKE'] > 0 && (
                    <span className="reaction-count">{reactionCount['LIKE']}</span>
                )}
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
                    {reactionCount[reaction] > 0 && (
                        <span className="reaction-count">{reactionCount[reaction]}</span>
                    )}
                </span>
            ))}
            {/* Nút X để thu hồi reactions */}
            {reactions.length > 0 && (
                <span
                    className="close-reactions"
                    onClick={handleRemoveReaction}
                    role="img"
                    aria-label="Close"
                >
                    x
                </span>
            )}
        </div>
    );
};

export default MessageReaction;
