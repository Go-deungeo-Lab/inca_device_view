// src/contexts/SystemStatusContext.js - SSE 버전

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { systemAPI } from '../services/api';

const SystemStatusContext = createContext();

export const useSystemStatus = () => {
    const context = useContext(SystemStatusContext);
    if (!context) {
        throw new Error('useSystemStatus must be used within a SystemStatusProvider');
    }
    return context;
};

export const SystemStatusProvider = ({ children }) => {
    const [systemStatus, setSystemStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, disconnected

    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const previousStatusRef = useRef(null);

    // SSE 연결 생성
    const connectSSE = () => {
        try {
            // SSE URL 구성
            const baseUrl = process.env.REACT_APP_API_BASE_URL || window.location.origin;
            const sseUrl = `${baseUrl}/system/status/stream`;

            console.log('SSE 연결 시도:', sseUrl);
            setConnectionStatus('connecting');

            const eventSource = new EventSource(sseUrl);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('SSE 연결 성공');
                setConnectionStatus('connected');
                setError(null);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('SSE 메시지 수신:', data);

                    if (data.type === 'SYSTEM_STATUS_UPDATE') {
                        handleStatusUpdate(data.payload);
                    } else if (data.type === 'HEARTBEAT') {
                        // Heartbeat - 연결 유지 확인
                        console.log('SSE Heartbeat 수신');
                    }
                } catch (error) {
                    console.error('SSE 메시지 파싱 오류:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE 연결 오류:', error);
                setConnectionStatus('disconnected');

                // 연결이 끊어진 경우 자동 재연결 (5초 후)
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('SSE 재연결 시도...');
                    connectSSE();
                }, 5000);
            };

        } catch (error) {
            console.error('SSE 연결 생성 실패:', error);
            setError(error);
            setConnectionStatus('disconnected');

            // HTTP API로 폴백
            fallbackToHttp();
        }
    };

    // 상태 업데이트 처리
    const handleStatusUpdate = (newStatus) => {
        // 변경사항 감지 및 알림
        if (previousStatusRef.current !== null) {
            const prevStatus = previousStatusRef.current;

            // 테스트 모드가 새로 활성화된 경우
            if (!prevStatus.isTestMode && newStatus.isTestMode) {
                const message = newStatus.testMessage
                    ? `⚠️ 시스템 테스트가 시작되었습니다!\n\n${newStatus.testMessage}`
                    : '⚠️ 시스템 테스트가 시작되어 디바이스 대여가 제한됩니다.';

                setTimeout(() => {
                    alert(message);
                }, 100);
            }

            // 테스트 모드가 해제된 경우
            if (prevStatus.isTestMode && !newStatus.isTestMode) {
                setTimeout(() => {
                    alert('✅ 시스템 테스트가 완료되었습니다!\n정상적으로 디바이스를 대여할 수 있습니다.');
                }, 100);
            }
        }

        previousStatusRef.current = newStatus;
        setSystemStatus(newStatus);
        setLoading(false);
    };

    // HTTP API 폴백 (SSE 실패시)
    const fallbackToHttp = async () => {
        console.log('HTTP API 폴백 모드');
        try {
            const response = await systemAPI.getSystemStatus();
            handleStatusUpdate(response.data);
        } catch (error) {
            console.error('HTTP API 폴백 실패:', error);
            setError(error);
            setLoading(false);
        }
    };

    // 수동 새로고침
    const refreshSystemStatus = async () => {
        setLoading(true);
        await fallbackToHttp();
    };

    // SSE 연결 강제 재시도
    const reconnectSSE = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        connectSSE();
    };

    useEffect(() => {
        // 컴포넌트 마운트시 SSE 연결
        connectSSE();

        // 페이지 가시성 변경시 처리
        const handleVisibilityChange = () => {
            if (!document.hidden && connectionStatus === 'disconnected') {
                console.log('페이지 활성화 - SSE 재연결 시도');
                connectSSE();
            }
        };

        // 온라인/오프라인 상태 변경시 처리
        const handleOnline = () => {
            console.log('네트워크 온라인 - SSE 재연결 시도');
            connectSSE();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);

        // cleanup
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
        };
    }, []); // 한 번만 실행

    return (
        <SystemStatusContext.Provider value={{
            systemStatus,
            loading,
            error,
            connectionStatus,
            refreshSystemStatus,
            reconnectSSE,
            // 편의 속성들
            isTestMode: systemStatus?.isTestMode || false,
            testMessage: systemStatus?.testMessage,
            testType: systemStatus?.testType,
            // SSE 상태
            isConnected: connectionStatus === 'connected',
        }}>
            {children}
        </SystemStatusContext.Provider>
    );
};