import React, { useState, useEffect } from 'react';
import "../css/ModelTimkiem_TinNhan.css"; // CSS riêng cho giao diện

const SearchModal = ({ isSearchModalOpen, setIsSearchModalOpen, chatMessages, searchQuery, setSearchQuery, handleSearchMessages }) => {
    const [filteredMessages, setFilteredMessages] = useState([]);
    const [resultsCount, setResultsCount] = useState(0); // To keep track of the search result count
    const [currentResultIndex, setCurrentResultIndex] = useState(0); // To keep track of the current result index

    // Lọc tin nhắn khi searchQuery thay đổi
    useEffect(() => {
        if (searchQuery === '') {
            // Nếu không có từ khóa tìm kiếm, trả về kết quả ban đầu
            setFilteredMessages([]);
            setResultsCount(0);
            return;
        }

        const result = chatMessages.filter((msg) =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredMessages(result);
        setResultsCount(result.length); // Cập nhật kết quả tìm kiếm
    }, [searchQuery, chatMessages]);
    // Hàm hiển thị phần tin nhắn có từ khóa tìm kiếm, làm nổi bật phần tìm được
    // Hàm hiển thị phần tin nhắn có từ khóa tìm kiếm, làm nổi bật phần tìm được
    const highlightText = (text) => {
        if (!searchQuery) return text;  // Nếu không có từ khóa tìm kiếm, trả lại văn bản ban đầu
        const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));  // Chia văn bản thành các phần nhỏ
        return parts.map((part, index) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
                <span key={index} className="highlight">{part}</span>  // Tô màu vàng nếu là từ khóa
            ) : (
                part // Nếu không phải từ khóa, trả lại phần đó
            )
        );
    };


    // Khi nhấn Enter để cuộn đến tin nhắn và làm nổi bật
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            // Nếu không có từ khóa tìm kiếm, bỏ highlight và trả lại trạng thái bình thường
            if (!searchQuery) {
                const highlightedElements = document.querySelectorAll('.highlight');
                highlightedElements.forEach((element) => {
                    element.classList.remove('highlight'); // Xóa class highlight khi không có từ khóa
                });
                return; // Nếu không có từ khóa, không cần cuộn tới tin nhắn
            }

            // Nếu có từ khóa tìm kiếm, cuộn đến tin nhắn và làm nổi bật
            if (filteredMessages.length > 0 && filteredMessages[currentResultIndex]) {
                const messageElement = document.getElementById(`message-${filteredMessages[currentResultIndex].id}`);
                if (messageElement) {
                    messageElement.scrollIntoView({ behavior: 'smooth' });
                    messageElement.classList.add('highlight'); // Thêm class highlight cho tin nhắn
                }
            }
        }
    };

    // Di chuyển lên kết quả trước
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

    // Di chuyển xuống kết quả tiếp theo
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

    // Hàm xử lý khi nhấn nút tìm kiếm
    const handleSearch = () => {
        handleSearchMessages();  // Gọi hàm tìm kiếm từ cha (App component)
    };

    return (
        isSearchModalOpen && (
            <div className="search-modal">
                <div className="modal-content">
                    <input
                        type="text"
                        placeholder="Tìm kiếm tin nhắn..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} // Cập nhật search query
                        onKeyDown={handleKeyDown} // Gọi hàm khi nhấn Enter
                    />
                    <div className="message-count">
                        {resultsCount > 0 ? (
                            <span>kết quả trùng khớp: {resultsCount}</span>  // Hiển thị số lượng kết quả tìm thấy
                        ) : (
                            <span>0 kết qủa</span>  // Nếu không có kết quả
                        )}
                    </div>
                    <div className="navigation-buttons">
                        <button onClick={handlePrevious} disabled={currentResultIndex <= 0}>↑</button>
                        <button onClick={handleNext} disabled={currentResultIndex >= filteredMessages.length - 1}>↓</button>
                    </div>
                    <button onClick={handleSearch}>Tìm kiếm</button> {/* Nút tìm kiếm */}
                </div>
            </div>
        )
    );
};

export default SearchModal;
