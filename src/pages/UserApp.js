import React, { useState, useEffect } from 'react';
import { deviceAPI, systemAPI } from '../services/api'; // 🆕 systemAPI 추가
import Header from '../components/Header';
import RentModal from '../components/RentModal';
import UserReturnModal from '../components/UserReturnModal';
import RentalHistoryModal from '../components/RentalHistoryModal';
import UserSystemStatusBanner from '../components/UserSystemStatusBanner'; // 🆕 추가
import LoadingSpinner from '../components/LoadingSpinner';

function UserApp() {
    const [devices, setDevices] = useState([]);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [systemStatus, setSystemStatus] = useState(null); // 🆕 시스템 상태
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showRentModal, setShowRentModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedReturnDevice, setSelectedReturnDevice] = useState(null);
    const [isReturning, setIsReturning] = useState(false);

    useEffect(() => {
        Promise.all([
            fetchAllDevices(),
            fetchSystemStatus() // 🆕 시스템 상태도 함께 조회
        ]);

        // 🆕 실시간 시스템 상태 확인 (2초마다)
        const systemStatusInterval = setInterval(fetchSystemStatus, 2000);

        // 🆕 페이지 포커스 시 상태 확인
        const handleFocus = () => {
            fetchSystemStatus();
        };

        // 🆕 페이지 가시성 변경 시 상태 확인
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchSystemStatus();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(systemStatusInterval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // 🆕 시스템 상태 조회
    const fetchSystemStatus = async () => {
        try {
            const response = await systemAPI.getSystemStatus();
            const newStatus = response.data;

            // 🆕 시스템 상태 변경 감지 및 알림
            if (systemStatus !== null) {
                // 테스트 모드가 새로 활성화된 경우
                if (!systemStatus.isTestMode && newStatus.isTestMode) {
                    const message = newStatus.testMessage
                        ? `⚠️ 시스템 테스트가 시작되었습니다!\n\n${newStatus.testMessage}`
                        : '⚠️ 시스템 테스트가 시작되어 디바이스 대여가 제한됩니다.';

                    // 잠깐 기다렸다가 알림 (상태 업데이트 후)
                    setTimeout(() => {
                        alert(message);
                    }, 100);
                }

                // 테스트 모드가 해제된 경우
                if (systemStatus.isTestMode && !newStatus.isTestMode) {
                    setTimeout(() => {
                        alert('✅ 시스템 테스트가 완료되었습니다!\n정상적으로 디바이스를 대여할 수 있습니다.');
                    }, 100);
                }
            }

            setSystemStatus(newStatus);
        } catch (error) {
            console.error('시스템 상태 조회 실패:', error);
        }
    };

    const fetchAllDevices = async () => {
        try {
            setRefreshing(true);
            const response = await deviceAPI.getAllDevices();
            setDevices(response.data);
        } catch (error) {
            console.error('디바이스 조회 실패:', error);
            alert('디바이스 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // 🆕 전체 새로고침 (시스템 상태 포함)
    const handleRefreshAll = async () => {
        await Promise.all([
            fetchAllDevices(),
            fetchSystemStatus()
        ]);
    };

    // 디바이스 선택/해제 (대여 가능한 디바이스만)
    const handleDeviceSelect = (deviceId) => {
        const device = devices.find(d => d.id === deviceId);
        if (device && device.status === 'rented') {
            return; // 대여중인 디바이스는 선택 불가
        }

        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    // 전체 선택/해제 (대여 가능한 디바이스만)
    const handleSelectAll = () => {
        const availableDevices = devices.filter(d => d.status === 'available');
        if (selectedDevices.length === availableDevices.length) {
            setSelectedDevices([]);
        } else {
            setSelectedDevices(availableDevices.map(device => device.id));
        }
    };

    // 🆕 대여 버튼 클릭 시 테스트 모드 확인
    const handleRentClick = () => {
        // 테스트 모드 확인
        if (systemStatus?.isTestMode) {
            let message = '';

            if (systemStatus.testMessage) {
                // 관리자가 설정한 메시지가 있으면 우선 표시
                message = `${systemStatus.testType ? `[${systemStatus.testType}]` : '[시스템 테스트]'}\n\n${systemStatus.testMessage}`;
            } else {
                // 기본 메시지
                message = '현재 시스템 테스트 기간으로 디바이스 대여가 제한됩니다. 관리자에게 문의해주세요.';
            }

            alert(message);
            return;
        }

        setShowRentModal(true);
    };

    // 대여 처리
    const handleRent = async (deviceIds, renterName) => {
        try {
            await deviceAPI.rentDevices({
                deviceIds,
                renterName
            });

            alert(`${deviceIds.length}개 디바이스가 성공적으로 대여되었습니다!`);
            setSelectedDevices([]);
            await fetchAllDevices(); // 목록 새로고침
        } catch (error) {
            console.error('대여 실패:', error);

            // 🆕 서버에서 503 에러(테스트 모드)가 오면 특별 처리
            if (error.response?.status === 503) {
                const errorMessage = error.response.data.message || '현재 시스템 테스트 기간으로 대여가 제한됩니다.';
                alert(errorMessage);
                // 시스템 상태 다시 확인
                await fetchSystemStatus();
            } else {
                const errorMessage = error.response?.data?.message || '디바이스 대여에 실패했습니다.';
                alert(errorMessage);
            }
            throw error;
        }
    };

    // 반납 처리
    const handleReturn = async (deviceId, renterName) => {
        setIsReturning(true);
        try {
            await deviceAPI.userReturnDevice(deviceId, renterName);
            alert('디바이스가 성공적으로 반납되었습니다!');
            await fetchAllDevices(); // 목록 새로고침
        } catch (error) {
            console.error('반납 실패:', error);
            throw error; // 모달에서 에러 처리
        } finally {
            setIsReturning(false);
        }
    };

    // 반납 모달 열기
    const handleReturnClick = (device) => {
        setSelectedReturnDevice(device);
        setShowReturnModal(true);
    };

    if (loading) {
        return <LoadingSpinner message="디바이스 목록을 불러오는 중..." />;
    }

    const availableDevices = devices.filter(d => d.status === 'available');
    const rentedDevices = devices.filter(d => d.status === 'rented');

    // 🆕 테스트 모드일 때 대여 버튼 비활성화
    const canRent = !systemStatus?.isTestMode && selectedDevices.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Header
                deviceCount={availableDevices.length}
                selectedCount={selectedDevices.length}
                onRefresh={handleRefreshAll} // 🆕 시스템 상태도 함께 새로고침
                onRentClick={handleRentClick} // 🆕 테스트 모드 확인하는 핸들러
                onHistoryClick={() => setShowHistoryModal(true)}
                isRefreshing={refreshing}
                // 🆕 테스트 모드일 때 버튼 비활성화
                canRent={canRent}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 🆕 시스템 상태 배너 (테스트 모드일 때만 표시) */}
                <UserSystemStatusBanner />

                {/* 상태 및 선택 정보 */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleSelectAll}
                            disabled={systemStatus?.isTestMode} // 🆕 테스트 모드일 때 비활성화
                            className={`text-sm font-medium transition-colors ${
                                systemStatus?.isTestMode
                                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                            }`}
                        >
                            {selectedDevices.length === availableDevices.length && availableDevices.length > 0 ? '전체 해제' : '전체 선택'}
                        </button>

                        {selectedDevices.length > 0 && (
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {selectedDevices.length}개 선택됨
                            </span>
                        )}

                        {/* 🆕 테스트 모드 안내 */}
                        {systemStatus?.isTestMode && (
                            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                                ⚠️ 대여 제한 중
                            </span>
                        )}
                    </div>

                    {/* 디바이스 현황 표시 */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                            ✅ 대여 가능: {availableDevices.length}개
                        </span>
                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full">
                            🔴 대여 중: {rentedDevices.length}개
                        </span>
                        <span>
                            🤖 Android: {devices.filter(d => d.platform === 'Android').length}개
                        </span>
                        <span>
                            🍎 iOS: {devices.filter(d => d.platform === 'iOS').length}개
                        </span>
                    </div>
                </div>

                {/* 디바이스 테이블 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={availableDevices.length > 0 && selectedDevices.length === availableDevices.length}
                                    onChange={handleSelectAll}
                                    disabled={systemStatus?.isTestMode} // 🆕 테스트 모드일 때 비활성화
                                    className="w-6 h-6 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 cursor-pointer bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">No.</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">제품명</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">플랫폼</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">OS</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">상태</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">대여자</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">액션</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {devices.map((device) => {
                            const isSelected = selectedDevices.includes(device.id);
                            const isRented = device.status === 'rented';
                            const isAvailable = device.status === 'available';
                            const isTestMode = systemStatus?.isTestMode;

                            return (
                                <tr
                                    key={device.id}
                                    className={`transition-all select-none touch-manipulation ${
                                        isRented ? 'bg-red-50 dark:bg-red-900/20' :
                                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' :
                                                isAvailable && !isTestMode ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600' :
                                                    isTestMode ? 'opacity-75' : ''
                                    }`}
                                    onClick={() => isAvailable && !isTestMode && handleDeviceSelect(device.id)} // 🆕 테스트 모드일 때 클릭 차단
                                    style={{ minHeight: '60px' }}
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center w-8 h-8">
                                            {isAvailable ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleDeviceSelect(device.id)}
                                                    disabled={isTestMode} // 🆕 테스트 모드일 때 비활성화
                                                    className="w-6 h-6 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 cursor-pointer touch-manipulation bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">-</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 text-base font-medium text-gray-900 dark:text-white">
                                        {device.deviceNumber}
                                    </td>

                                    <td className="px-6 py-5">
                                        <div>
                                            <div className="text-base font-medium text-gray-900 dark:text-white">
                                                {device.productName}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {device.modelName}
                                            </div>
                                            {device.isRootedOrJailbroken && (
                                                <span className="inline-block bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm px-3 py-1 rounded mt-2">
                                                    ⚠️ {device.platform === 'iOS' ? '탈옥' : '루팅'}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 text-base text-gray-900 dark:text-white">
                                        {device.platform === 'iOS' ? '🍎 iOS' : '🤖 Android'}
                                    </td>

                                    <td className="px-6 py-5 text-base text-gray-900 dark:text-white">
                                        {device.osVersion}
                                    </td>

                                    <td className="px-6 py-5">
                                        <span className={`inline-block px-3 py-2 text-sm rounded-full font-medium ${
                                            isRented
                                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                        }`}>
                                            {isRented ? '대여 중' : '대여 가능'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 text-base text-gray-900 dark:text-white">
                                        {device.currentRenter || '-'}
                                    </td>

                                    <td className="px-6 py-5">
                                        {isRented ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReturnClick(device);
                                                }}
                                                className="px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors touch-manipulation"
                                            >
                                                반납하기
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>

                    {devices.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📱</div>
                            <div className="text-gray-500 dark:text-gray-400 text-lg">디바이스가 없습니다.</div>
                        </div>
                    )}
                </div>

                {/* 대여 모달 */}
                <RentModal
                    isOpen={showRentModal}
                    onClose={() => setShowRentModal(false)}
                    selectedDevices={selectedDevices}
                    devices={devices}
                    onRent={handleRent}
                />

                {/* 반납 모달 (간단해진 버전) */}
                <UserReturnModal
                    isOpen={showReturnModal}
                    onClose={() => setShowReturnModal(false)}
                    device={selectedReturnDevice}
                    onReturn={handleReturn}
                    isLoading={isReturning}
                />

                {/* 이력 보기 모달 (공개 API 사용) */}
                <RentalHistoryModal
                    isOpen={showHistoryModal}
                    onClose={() => setShowHistoryModal(false)}
                />
            </main>
        </div>
    );
}

export default UserApp;