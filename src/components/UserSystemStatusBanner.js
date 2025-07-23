// src/components/UserSystemStatusBanner.js

import React from 'react';
import { useSystemStatus } from '../contexts/SystemStatusContext';
import { formatKoreanDateTime } from '../utils/timeUtils'; // 🆕 유틸리티 import

function UserSystemStatusBanner() {
    const { systemStatus, loading } = useSystemStatus();

    if (loading) {
        return null; // 로딩 중일 때는 배너를 숨김
    }

    if (!systemStatus) {
        return null;
    }

    // 정상 운영 중일 때는 배너를 표시하지 않음
    if (!systemStatus.isTestMode) {
        return null;
    }

    // 테스트 모드일 때만 경고 배너 표시
    return (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 mb-6 transition-colors">
            <div className="flex">
                <div className="flex-shrink-0">
                    <span className="text-red-400 dark:text-red-300 text-xl">⚠️</span>
                </div>
                <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                            {systemStatus.testType ? `${systemStatus.testType} 진행 중` : '시스템 테스트 진행 중'}
                        </h3>
                        {/* 🆕 실시간 업데이트 표시 */}
                        <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                            실시간 상태
                        </div>
                    </div>

                    <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                        <div className="flex items-start space-x-4">
                            <div className="flex-1">
                                {systemStatus.testMessage ? (
                                    // 🆕 관리자가 설정한 안내 메시지 우선 표시
                                    <div className="bg-red-100 dark:bg-red-900/40 rounded-md p-3 mb-3">
                                        <div className="font-medium text-red-800 dark:text-red-200 mb-2">📢 관리자 안내</div>
                                        <div className="text-red-700 dark:text-red-300 whitespace-pre-line">
                                            {systemStatus.testMessage}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="font-medium mb-1">시스템 상태:</div>
                                <ul className="space-y-1 list-disc list-inside">
                                    <li>현재 새로운 디바이스 대여가 일시적으로 제한됩니다</li>
                                    <li>이미 대여 중인 디바이스의 반납은 정상적으로 가능합니다</li>
                                    <li>테스트 완료 후 정상 서비스가 재개됩니다</li>
                                </ul>
                            </div>

                            {systemStatus.testStartDate && systemStatus.testEndDate && (
                                <div className="bg-red-100 dark:bg-red-900/40 rounded-md p-3 min-w-0 flex-shrink-0">
                                    <div className="font-medium text-red-800 dark:text-red-200 mb-1">테스트 기간</div>
                                    <div className="text-xs space-y-1">
                                        <div>시작: {formatKoreanDateTime(systemStatus.testStartDate)}</div> {/* 🆕 한국 시간으로 변환 */}
                                        <div>종료: {formatKoreanDateTime(systemStatus.testEndDate)}</div> {/* 🆕 한국 시간으로 변환 */}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserSystemStatusBanner;