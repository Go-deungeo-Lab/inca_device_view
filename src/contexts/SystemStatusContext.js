// src/contexts/SystemStatusContext.js - 정상 작동하는 SSE 버전

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
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const previousStatusRef = useRef(null);
    const isConnectingRef = useRef(false);

    // SSE 연결 생성
    const connectSSE = () => {
        // 이미 연결 중이거나 연결되어 있으면 중복 연결 방지
        if (isConnectingRef.current || connectionStatus === 'connected') {
            return;
        }

        isConnectingRef.current = true;

        try {
            const baseUrl = process.env.REACT_APP_API_BASE_URL || window.location.origin;
            const sseUrl = `${baseUrl}/system/status/stream`;

            console.log('📡 SSE 연결 시도:', sseUrl);
            setConnectionStatus('connecting');

            const eventSource = new EventSource(sseUrl);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('✅ SSE 연결 성공');
                setConnectionStatus('connected');
                setError(null);
                isConnectingRef.current = false;

                // 재연결 타이머가 있으면 취소
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'SYSTEM_STATUS_UPDATE') {
                        console.log('📨 시스템 상태 업데이트 수신');
                        handleStatusUpdate(data.payload);
                    } else if (data.type === 'HEARTBEAT') {
                        console.log('💓 SSE Heartbeat 수신');
                    }
                } catch (error) {
                    console.error('❌ SSE 메시지 파싱 오류:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.log('⚠️ SSE 연결 오류 발생');
                isConnectingRef.current = false;
                setConnectionStatus('disconnected');

                // 연결 상태가 CLOSED인 경우에만 재연결 시도
                if (eventSource.readyState === EventSource.CLOSED) {
                    console.log('🔄 5초 후 SSE 재연결 시도');
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectSSE();
                    }, 5000);
                }
            };

        } catch (error) {
            console.error('❌ SSE 연결 생성 실패:', error);
            setError(error);
            setConnectionStatus('disconnected');
            isConnectingRef.current = false;

            // HTTP 폴백
            fallbackToPolling();
        }
    };

    // 상태 업데이트 처리
    const handleStatusUpdate = (newStatus) => {
        // 상태 변경 감지 및 알림
        if (previousStatusRef.current !== null) {
            const prevStatus = previousStatusRef.current;

            // 테스트 모드가 새로 활성화된 경우
            if (!prevStatus.isTestMode && newStatus.isTestMode) {
                const message = newStatus.testMessage
                    ? `⚠️ 시스템 테스트가 시작되었습니다!\n\n${newStatus.testMessage}`
                    : '⚠️ 시스템 테스트가 시작되어 디바이스 대여가 제한됩니다.';

                setTimeout(() => alert(message), 100);
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

    // HTTP 폴링 폴백
    const fallbackToPolling = async () => {
        console.log('🔄 HTTP 폴링 모드로 전환');
        setConnectionStatus('polling');

        try {
            const response = await systemAPI.getSystemStatus();
            handleStatusUpdate(response.data);

            // 60초마다 폴링
            const pollInterval = setInterval(async () => {
                try {
                    const response = await systemAPI.getSystemStatus();
                    handleStatusUpdate(response.data);
                } catch (error) {
                    console.error('❌ 폴링 실패:', error);
                }
            }, 60000);

            // cleanup을 위해 ref에 저장
            eventSourceRef.current = {
                close: () => clearInterval(pollInterval),
                readyState: 1 // OPEN 상태로 설정
            };
        } catch (error) {
            console.error('❌ HTTP 폴백 실패:', error);
            setError(error);
            setLoading(false);
        }
    };

    // SSE 연결 정리
    const cleanupSSE = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        isConnectingRef.current = false;
        setConnectionStatus('disconnected');
    };

    useEffect(() => {
        // 컴포넌트 마운트시 SSE 연결
        connectSSE();

        // 페이지 가시성 변경시 처리
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('📄 페이지 숨김 - SSE 유지');
                // 페이지가 숨겨져도 SSE 연결 유지
            } else {
                console.log('👁️ 페이지 활성화 - SSE 상태 확인');
                // 연결이 끊어져 있으면 재연결
                if (connectionStatus === 'disconnected' && !isConnectingRef.current) {
                    connectSSE();
                }
            }
        };

        // 네트워크 상태 변경시 처리
        const handleOnline = () => {
            console.log('🌐 네트워크 온라인 - SSE 재연결');
            if (connectionStatus === 'disconnected') {
                connectSSE();
            }
        };

        const handleOffline = () => {
            console.log('📶 네트워크 오프라인');
            setConnectionStatus('offline');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            cleanupSSE();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []); // 빈 의존성 배열로 한 번만 실행

    // 수동 새로고침
    const refreshSystemStatus = async () => {
        setLoading(true);
        try {
            const response = await systemAPI.getSystemStatus();
            handleStatusUpdate(response.data);
        } catch (error) {
            console.error('❌ 수동 새로고침 실패:', error);
            setError(error);
        }
    };

    return (
        <SystemStatusContext.Provider value={{
            systemStatus,
            loading,
            error,
            connectionStatus,
            refreshSystemStatus,
            // 편의 속성들
            isTestMode: systemStatus?.isTestMode || false,
            testMessage: systemStatus?.testMessage,
            testType: systemStatus?.testType,
            // 연결 상태
            isConnected: connectionStatus === 'connected',
        }}>
            {children}
        </SystemStatusContext.Provider>
    );
};