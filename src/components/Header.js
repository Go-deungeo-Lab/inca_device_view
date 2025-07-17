// src/components/Header.js

import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

function Header({
                    deviceCount,
                    selectedCount,
                    onRefresh,
                    onRentClick,
                    onHistoryClick,
                    isRefreshing = false
                }) {
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            📱 디바이스 대여 시스템
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {deviceCount}개 디바이스 중 대여 가능
                        </p>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={toggleDarkMode}
                            className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors touch-manipulation"
                            title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
                        >
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>

                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="flex items-center px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 touch-manipulation"
                        >
                            <span className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`}>
                                🔄
                            </span>
                            {isRefreshing ? '새로고침 중...' : '새로고침'}
                        </button>

                        <button
                            onClick={onHistoryClick}
                            className="flex items-center px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors touch-manipulation"
                        >
                            📊 이력 보기
                        </button>

                        <button
                            onClick={onRentClick}
                            disabled={selectedCount === 0}
                            className={`flex items-center px-6 py-2 rounded-md font-semibold transition-colors touch-manipulation ${
                                selectedCount > 0
                                    ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            📋 대여하기
                            {selectedCount > 0 && (
                                <span className="ml-2 bg-blue-500 dark:bg-blue-600 text-white rounded-full px-2 py-1 text-xs">
                                    {selectedCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Header;