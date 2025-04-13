import React, { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../context/WebSocket"; // Hook để sử dụng WebSocket
import "../css/video-call.css";

// Class quản lý cuộc gọi video
class VideoCall {
    constructor(userId, sendMessage) {
        this.userId = userId;
        this.sendMessage = sendMessage; // Truyền sendMessage vào constructor
        this.localStream = null;
        this.peerConnection = null;
        this.remoteStream = null;
        this.isCalling = false;
    }

    // Hàm bắt đầu cuộc gọi
    async startCall(remoteUserId) {
        if (this.isCalling) return;
        this.isCalling = true;

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.displayLocalStream(); // Hiển thị local stream
        } catch (err) {
            console.error("Error accessing media devices:", err);
            return;
        }

        this.peerConnection = new RTCPeerConnection();

        // Thêm local stream vào peer connection
        this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));

        // Khi nhận được stream từ remote peer
        this.peerConnection.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                this.remoteStream = event.streams[0];
                this.displayRemoteStream();
            }
        };

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendMessage({
                    type: "candidate",
                    candidate: event.candidate,
                    to: remoteUserId,
                });
            }
        };

        // Tạo offer và gửi qua WebSocket
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.sendMessage({
            type: "offer",
            offer: offer,
            to: remoteUserId,
        });
    }
    // video người gọi
    displayLocalStream() {
        const localVideoElement = document.getElementById("local-video");
        if (localVideoElement && this.localStream) {
            localVideoElement.srcObject = this.localStream;
        }
    }

    // Hiển thị remote stream (video của người nhận)
    displayRemoteStream() {
        const remoteVideoElement = document.getElementById("remote-video");
        if (remoteVideoElement && this.remoteStream) {
            remoteVideoElement.srcObject = this.remoteStream;
        }
    }

    // Kết thúc cuộc gọi
    endCall() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        this.isCalling = false;
    }
}
const VideoCallComponent = ({ remoteUserId, userId, isVideoCallVisible, setIsVideoCallVisible }) => {
    const { sendMessage } = useWebSocket(); // Lấy sendMessage từ WebSocket context
    const videoCallRef = useRef(null); // Sử dụng useRef để tránh re-render không cần thiết
    const [isCalling, setIsCalling] = useState(false); // State để quản lý trạng thái gọi

    // Khởi tạo VideoCall chỉ một lần khi component mount
    useEffect(() => {
        videoCallRef.current = new VideoCall(userId, sendMessage); // Khởi tạo đối tượng VideoCall
    }, [userId, sendMessage]);

    const startCall = () => {
        if (videoCallRef.current) {
            videoCallRef.current.startCall(remoteUserId);
            setIsCalling(true);
        }
    };

    const endCall = () => {
        if (videoCallRef.current) {
            videoCallRef.current.endCall();
            setIsCalling(false);
        }
    };

    const modalRef = useRef(null);

    // Đóng modal khi click ra ngoài
    const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
            if (videoCallRef.current) {
                videoCallRef.current.endCall(); // Kết thúc cuộc gọi
            }
            setIsCalling(false); // Cập nhật trạng thái gọi
            setIsVideoCallVisible(false); // Đóng modal
        }
    };

    // Dùng useEffect để lắng nghe sự kiện click ngoài
    useEffect(() => {
        if (isVideoCallVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Dọn dẹp khi modal không còn mở hoặc khi component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isVideoCallVisible]);

    if (!isVideoCallVisible) return null;

    return (
        <div className="video-call-modal-container" ref={modalRef}>
            <div className="video-call-modal-header">
                <h2>Cuộc gọi video</h2>
            </div>
            <div className="video-call-modal-buttons">
                <button onClick={startCall} disabled={isCalling}>Bắt đầu gọi video</button>
                <button onClick={endCall} disabled={!isCalling}>Kết thúc cuộc gọi</button>
            </div>
            <div className="video-call-modal-streams">
                <video id="local-video" autoPlay muted></video>
                <video id="remote-video" autoPlay></video>
            </div>
        </div>
    );
};

export default VideoCallComponent;