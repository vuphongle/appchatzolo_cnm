import React, { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../context/WebSocket"; // Hook để sử dụng WebSocket
import "../css/video-call.css";

// Import hàm request permission và lấy token FCM
import { requestFirebaseNotificationPermission } from "../../src/services/firebase_messaging";

// Class quản lý cuộc gọi video
class VideoCall {
    constructor(userId, sendMessage) {
        this.userId = userId;
        this.sendMessage = sendMessage;
        this.localStream = null;
        this.peerConnection = null;
        this.remoteStream = null;
        this.isCalling = false;
        this.remoteUserId = null;
    }

    // Bắt đầu cuộc gọi (tạo offer và gửi đi)
    async startCall(remoteUserId) {
        if (this.isCalling) return;
        this.isCalling = true;
        this.remoteUserId = remoteUserId;

        try {
            // Lấy stream video, audio
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            this.displayLocalStream();

            // Tạo peer connection
            this.peerConnection = new RTCPeerConnection();

            // Thêm track local vào peer connection
            this.localStream.getTracks().forEach((track) => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            // Lắng nghe stream remote
            this.peerConnection.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    this.remoteStream = event.streams[0];
                    this.displayRemoteStream();
                }
            };

            // Gửi ICE candidate qua WebSocket signaling
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.sendMessage({
                        type: "candidate", // candidate giữ nguyên
                        candidate: event.candidate,
                        to: this.remoteUserId,
                        from: this.userId,
                    });
                }
            };

            // Tạo offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            // Gửi offer qua WebSocket với type chuẩn chữ thường
            this.sendMessage({
                type: "video_call_request", // sửa chữ thường
                offer: offer,
                to: this.remoteUserId,
                from: this.userId,
            });
        } catch (err) {
            console.error("Error starting call:", err);
            this.isCalling = false;
        }
    }

    displayLocalStream() {
        const localVideoElement = document.getElementById("local-video");
        if (localVideoElement && this.localStream) {
            localVideoElement.srcObject = this.localStream;
        }
    }

    displayRemoteStream() {
        const remoteVideoElement = document.getElementById("remote-video");
        if (remoteVideoElement && this.remoteStream) {
            remoteVideoElement.srcObject = this.remoteStream;
        }
    }

    // Nhận offer từ bên gọi và trả answer
    async receiveOffer(offer, fromUserId) {
        this.remoteUserId = fromUserId;
        this.isCalling = true;

        try {
            // Lấy stream local
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            this.displayLocalStream();

            // Tạo peer connection
            this.peerConnection = new RTCPeerConnection();

            // Thêm track local vào peer connection
            this.localStream.getTracks().forEach((track) => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            // Lắng nghe stream remote
            this.peerConnection.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    this.remoteStream = event.streams[0];
                    this.displayRemoteStream();
                }
            };

            // Gửi ICE candidate qua WebSocket signaling
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.sendMessage({
                        type: "candidate",
                        candidate: event.candidate,
                        to: fromUserId,
                        from: this.userId,
                    });
                }
            };

            // Set remote description offer
            await this.peerConnection.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            // Tạo answer
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            // Gửi answer qua WebSocket
            this.sendMessage({
                type: "answer",
                answer: answer,
                to: fromUserId,
                from: this.userId,
            });
        } catch (err) {
            console.error("Error receiving offer:", err);
        }
    }

    // Kết thúc cuộc gọi, dọn dẹp
    endCall() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
            this.localStream = null;
        }
        this.remoteStream = null;

        const localVideoElement = document.getElementById("local-video");
        if (localVideoElement) localVideoElement.srcObject = null;

        const remoteVideoElement = document.getElementById("remote-video");
        if (remoteVideoElement) remoteVideoElement.srcObject = null;

        this.isCalling = false;
        this.remoteUserId = null;
    }
}


const VideoCallComponent = ({
    remoteUserId,
    userId,
    isVideoCallVisible,
    setIsVideoCallVisible,
}) => {
    const { sendMessage, onMessage } = useWebSocket();
    const videoCallRef = useRef(null);
    const [isCalling, setIsCalling] = useState(false);
    const modalRef = useRef(null);

    // Hàm đăng ký token FCM lên backend
    const registerFcmToken = async () => {
        if (!userId) return;

        try {
            const token = await requestFirebaseNotificationPermission();
            if (token) {
                await fetch("http://localhost:8080/fcm/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId,
                        fcmToken: token,
                    }),
                });
                console.log("FCM token registered with backend:", token);
            }
        } catch (error) {
            console.error("Error registering FCM token:", error);
        }
    };

    useEffect(() => {
        if (userId) {
            registerFcmToken();
        }
    }, [userId]);

    // Gửi request lên backend trước khi gọi WebRTC (đẩy FCM)
    const triggerCallStart = async () => {
        try {
            await fetch("http://localhost:8080/calls/start", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fromUserId: userId,       // phải là 'fromUserId'
                    toUserId: remoteUserId,   // phải là 'toUserId'
                }),
            });
        } catch (err) {
            console.error("Error sending call start to backend:", err);
        }
    };


    // Hàm bắt đầu gọi
    const handleStartCall = async () => {
        if (!videoCallRef.current) return;

        await triggerCallStart(); // Gửi lên backend
        await videoCallRef.current.startCall(remoteUserId);
        setIsCalling(true);
    };

    // Xử lý nhận message từ WebSocket
    useEffect(() => {
        if (!videoCallRef.current) return;

        const handleMessage = async (message) => {
            if (!videoCallRef.current) return;

            switch (message.type) {
                case "Video_call_request":
                    if (message.to === userId) {
                        await videoCallRef.current.receiveOffer(message.offer, message.from);
                        setIsCalling(true);
                        setIsVideoCallVisible(true);
                    }
                    break;

                case "answer":
                    if (videoCallRef.current.peerConnection) {
                        await videoCallRef.current.peerConnection.setRemoteDescription(
                            new RTCSessionDescription(message.answer)
                        );
                    }
                    break;

                case "candidate":
                    if (
                        videoCallRef.current.peerConnection &&
                        message.candidate
                    ) {
                        await videoCallRef.current.peerConnection.addIceCandidate(
                            new RTCIceCandidate(message.candidate)
                        );
                    }
                    break;

                default:
                    break;
            }
        };

        const unsubscribe = onMessage(handleMessage);
        return () => unsubscribe();
    }, [onMessage, userId, setIsVideoCallVisible]);

    // Khởi tạo VideoCall instance
    useEffect(() => {
        videoCallRef.current = new VideoCall(userId, sendMessage);
    }, [userId, sendMessage]);

    // Đóng cuộc gọi khi click ngoài modal
    const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
            if (videoCallRef.current) {
                videoCallRef.current.endCall();
            }
            setIsCalling(false);
            setIsVideoCallVisible(false);
        }
    };

    useEffect(() => {
        if (isVideoCallVisible) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isVideoCallVisible]);

    // Kết thúc cuộc gọi
    const handleEndCall = () => {
        if (videoCallRef.current) {
            videoCallRef.current.endCall();
            setIsCalling(false);
            setIsVideoCallVisible(false);
        }
    };

    if (!isVideoCallVisible) return null;

    return (
        <div className="video-call-modal-container" ref={modalRef}>
            <div className="video-call-modal-header">
                <h2>Cuộc gọi video</h2>
            </div>

            <div className="video-call-modal-buttons">
                <button onClick={handleStartCall} disabled={isCalling}>
                    Bắt đầu gọi video
                </button>
                <button onClick={handleEndCall} disabled={!isCalling}>
                    Kết thúc cuộc gọi
                </button>
            </div>

            <div className="video-call-modal-streams">
                <video id="local-video" autoPlay muted></video>
                <video id="remote-video" autoPlay></video>
            </div>
        </div>
    );
};

export default VideoCallComponent;
