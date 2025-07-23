// src/contexts/SystemStatusContext.js

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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

    // 🔥 이전 상태를 useRef로 관리하여 의존성 배열에서 제외
    const previousStatusRef = useRef(null);

    // 시스템 상태 조회 함수
    const fetchSystemStatus = useCallback(async (showAlert = false) => {
        try {
            const response = await systemAPI.getSystemStatus();
            const newStatus = response.data;

            // 상태 변경 감지 및 알림 (showAlert가 true일 때만)
            if (showAlert && previousStatusRef.current !== null) {
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

            // 🔥 이전 상태 업데이트
            previousStatusRef.current = newStatus;
            setSystemStatus(newStatus);
            setError(null);
        } catch (error) {
            console.error('시스템 상태 조회 실패:', error);
            setError(error);
        } finally {
            setLoading(false);
        }
    }, []); // 🔥 빈 의존성 배열

    useEffect(() => {
        // 초기 로드
        fetchSystemStatus(false);

        // 실시간 상태 확인 (5초마다로 증가 - 서버 부하 감소)
        const interval = setInterval(() => fetchSystemStatus(true), 5000);

        // 페이지 포커스 시 상태 확인
        const handleFocus = () => {
            fetchSystemStatus(true);
        };

        // 페이지 가시성 변경 시 상태 확인
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchSystemStatus(true);
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []); // 🔥 의존성 배열을 빈 배열로 수정 - 한 번만 실행

    // 수동 새로고침 함수
    const refreshSystemStatus = useCallback(() => {
        setLoading(true);
        fetchSystemStatus(true);
    }, [fetchSystemStatus]);

    return (
        <SystemStatusContext.Provider value={{
            systemStatus,
            loading,
            error,
            refreshSystemStatus,
            // 편의 속성들
            isTestMode: systemStatus?.isTestMode || false,
            testMessage: systemStatus?.testMessage,
            testType: systemStatus?.testType,
        }}>
            {children}
        </SystemStatusContext.Provider>
    );
};