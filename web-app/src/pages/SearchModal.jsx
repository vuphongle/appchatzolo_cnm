import React, { useState, useEffect, useRef } from 'react';
import "../css/ModelTimkiem_TinNhan.css"; // CSS riêng cho giao diện

const SearchModal = ({ isSearchModalOpen, setIsSearchModalOpen, chatMessages, searchQuery, setSearchQuery, handleSearchMessages }) => {
    const modalRef = useRef(null);

    // Đóng modal khi click ra ngoài
    const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
            setIsSearchModalOpen(false); // Đóng modal khi click ngoài
        }
    };

    // Dùng useEffect để lắng nghe sự kiện click ngoài
    useEffect(() => {
        if (isSearchModalOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Dọn dẹp khi modal không còn mở hoặc khi component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSearchModalOpen]);

    const [filteredMessages, setFilteredMessages] = useState([]);
    const [resultsCount, setResultsCount] = useState(0);
    const [currentResultIndex, setCurrentResultIndex] = useState(0);

    useEffect(() => {
        if (searchQuery === '' || searchQuery === 'Tin nhắn đã được thu hồi') {
            setFilteredMessages([]); // Khi không có từ khóa tìm kiếm
            setResultsCount(0);
            return;
        }

        const result = chatMessages.filter((msg) =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
            // Loại bỏ tin nhắn thu hồi khỏi kết quả
            && msg.content !== 'Tin nhắn đã được thu hồi'
        );
        setFilteredMessages(result);
        setResultsCount(result.length);
    }, [searchQuery, chatMessages]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            if (!searchQuery) {
                const highlightedElements = document.querySelectorAll('.highlight');
                highlightedElements.forEach((element) => {
                    element.classList.remove('highlight');
                });
                return;
            }

            if (filteredMessages.length > 0 && filteredMessages[currentResultIndex]) {
                const messageElement = document.getElementById(`message-${filteredMessages[currentResultIndex].id}`);
                if (messageElement) {
                    messageElement.scrollIntoView({ behavior: 'smooth' });
                    messageElement.classList.add('highlight');
                }
            }
        }
    };

    const handlePrevious = () => {
        if (currentResultIndex > 0 && filteredMessages[currentResultIndex - 1]) {
            setCurrentResultIndex(currentResultIndex - 1);
            const messageElement = document.getElementById(`message-${filteredMessages[currentResultIndex - 1].id}`);
            if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth' });
                messageElement.classList.add('highlight');
            }
        }
    };

    const handleNext = () => {
        if (currentResultIndex < filteredMessages.length - 1 && filteredMessages[currentResultIndex + 1]) {
            setCurrentResultIndex(currentResultIndex + 1);
            const messageElement = document.getElementById(`message-${filteredMessages[currentResultIndex + 1].id}`);
            if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth' });
                messageElement.classList.add('highlight');
            }
        }
    };

    const handleSearch = () => {
        handleSearchMessages();
    };

    return (
        isSearchModalOpen && (
            <div className="search-modal" onClick={handleClickOutside}>
                <div className="modal-content" ref={modalRef} onClick={(e) => e.stopPropagation()}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm tin nhắn..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <div className="result-navigation-row">
                        <span className="message-count">
                            {resultsCount > 0 ? `Kết quả: ${resultsCount}` : '0 kết quả'}
                        </span>
                        <button onClick={handlePrevious} disabled={currentResultIndex <= 0}>↑</button>
                        <button onClick={handleNext} disabled={currentResultIndex >= filteredMessages.length - 1}>↓</button>
                    </div>
                </div>
            </div>
        )
    );
};

export default SearchModal;
