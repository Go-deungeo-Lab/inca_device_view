import React, { useState, useEffect } from 'react';
import { deviceAPI } from '../services/api';
import { useSystemStatus } from '../contexts/SystemStatusContext';
import Header from '../components/Header';
import RentModal from '../components/RentModal';
import UserReturnModal from '../components/UserReturnModal';
import RentalHistoryModal from '../components/RentalHistoryModal';
import UserSystemStatusBanner from '../components/UserSystemStatusBanner';
import LoadingSpinner from '../components/LoadingSpinner';

function UserApp() {
    const [devices, setDevices] = useState([]);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showRentModal, setShowRentModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedReturnDevice, setSelectedReturnDevice] = useState(null);
    const [isReturning, setIsReturning] = useState(false);

    // 🆕 상태와 플랫폼 정렬 추가
    const [statusSortOrder, setStatusSortOrder] = useState('desc'); // desc: 대여중이 위로
    const [platformSortOrder, setPlatformSortOrder] = useState('asc'); // asc: Android가 먼저
    const [activeSortColumn, setActiveSortColumn] = useState('status'); // 현재 활성 정렬 컬럼

    // Context에서 시스템 상태 가져오기
    const { systemStatus, isTestMode, refreshSystemStatus } = useSystemStatus();

    useEffect(() => {
        fetchAllDevices();
    }, []);

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

    // 🆕 상태 정렬 토글
    const handleStatusSort = () => {
        setStatusSortOrder(statusSortOrder === 'asc' ? 'desc' : 'asc');
        setActiveSortColumn('status');
    };

    // 🆕 플랫폼 정렬 토글
    const handlePlatformSort = () => {
        setPlatformSortOrder(platformSortOrder === 'asc' ? 'desc' : 'asc');
        setActiveSortColumn('platform');
    };

    // 🆕 정렬된 디바이스 목록
    const sortedDevices = [...devices].sort((a, b) => {
        if (activeSortColumn === 'status') {
            // 상태 정렬: rented(1) > available(0)
            const aValue = a.status === 'rented' ? 1 : 0;
            const bValue = b.status === 'rented' ? 1 : 0;

            if (aValue !== bValue) {
                return statusSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }
        } else if (activeSortColumn === 'platform') {
            // 플랫폼 정렬: Android < iOS 알파벳 순
            const aValue = a.platform;
            const bValue = b.platform;

            if (aValue !== bValue) {
                if (platformSortOrder === 'asc') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            }
        }

        // 기본 2차 정렬: 디바이스 번호 순서
        const aNum = parseInt(a.deviceNumber) || 0;
        const bNum = parseInt(b.deviceNumber) || 0;
        return aNum - bNum;
    });

    // 🆕 정렬 아이콘 (활성 컬럼만 표시)
    const getSortIcon = (column) => {
        if (activeSortColumn !== column) {
            return <span className="text-gray-400 ml-1">↕️</span>;
        }

        const order = column === 'status' ? statusSortOrder : platformSortOrder;
        return (
            <span className="text-blue-600 ml-1">
                {order === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    // 전체 새로고침 (시스템 상태 포함)
    const handleRefreshAll = async () => {
        await Promise.all([
            fetchAllDevices(),
            refreshSystemStatus()
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

    // 대여 버튼 클릭 시 테스트 모드 확인
    const handleRentClick = () => {
        if (isTestMode) {
            let message = '';
            if (systemStatus?.testMessage) {
                message = `${systemStatus.testType ? `[${systemStatus.testType}]` : '[시스템 테스트]'}\n\n${systemStatus.testMessage}`;
            } else {
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
            await fetchAllDevices();
        } catch (error) {
            console.error('대여 실패:', error);

            if (error.response?.status === 503) {
                const errorMessage = error.response.data.message || '현재 시스템 테스트 기간으로 대여가 제한됩니다.';
                alert(errorMessage);
                refreshSystemStatus();
            } else {
                const errorMessage = error.response?.data?.message || '디바이스 대여에 실패했습니다.';
                alert(errorMessage);
            }
            throw error;
        }
    };

    // 다중 반납 처리
    const handleMultipleReturn = async (deviceIds, renterName) => {
        setIsReturning(true);
        try {
            const result = await deviceAPI.userReturnMultipleDevices(deviceIds, renterName);

            // 결과 처리
            if (result.data.summary.successCount > 0) {
                alert(`✅ ${result.data.summary.successCount}개 디바이스가 성공적으로 반납되었습니다!`);
            }

            if (result.data.summary.failedCount > 0) {
                const failedMessages = result.data.failed.map(f =>
                    `• ${f.deviceNumber}: ${f.reason}`
                ).join('\n');
                alert(`⚠️ 일부 디바이스 반납에 실패했습니다:\n\n${failedMessages}`);
            }

            await fetchAllDevices();
        } catch (error) {
            console.error('다중 반납 실패:', error);
            const errorMessage = error.response?.data?.message || '디바이스 일괄 반납에 실패했습니다.';
            alert(`❌ ${errorMessage}`);
            throw error;
        } finally {
            setIsReturning(false);
        }
    };

    // 단일 반납 처리
    const handleReturn = async (deviceId, renterName) => {
        setIsReturning(true);
        try {
            await deviceAPI.userReturnDevice(deviceId, renterName);
            alert('디바이스가 성공적으로 반납되었습니다!');
            await fetchAllDevices();
        } catch (error) {
            console.error('반납 실패:', error);
            throw error;
        } finally {
            setIsReturning(false);
        }
    };

    // 반납 모달 열기 (자동으로 해당 대여자의 모든 디바이스 표시)
    const handleReturnClick = (device) => {
        setSelectedReturnDevice(device);
        setShowReturnModal(true);
    };

    if (loading) {
        return <LoadingSpinner message="디바이스 목록을 불러오는 중..." />;
    }

    const availableDevices = devices.filter(d => d.status === 'available');
    const rentedDevices = devices.filter(d => d.status === 'rented');
    const canRent = !isTestMode && selectedDevices.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Header
                deviceCount={availableDevices.length}
                selectedCount={selectedDevices.length}
                onRefresh={handleRefreshAll}
                onRentClick={handleRentClick}
                onHistoryClick={() => setShowHistoryModal(true)}
                isRefreshing={refreshing}
                canRent={canRent}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 시스템 상태 배너 (테스트 모드일 때만 표시) */}
                <UserSystemStatusBanner />

                {/* 상태 및 선택 정보 */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleSelectAll}
                            disabled={isTestMode}
                            className={`text-sm font-medium transition-colors ${
                                isTestMode
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

                        {/* 테스트 모드 안내 */}
                        {isTestMode && (
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
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                                <input
                                    type="checkbox"
                                    checked={availableDevices.length > 0 && selectedDevices.length === availableDevices.length}
                                    onChange={handleSelectAll}
                                    disabled={isTestMode}
                                    className="w-6 h-6 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 cursor-pointer bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </th>

                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                                No.
                            </th>

                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 w-64">
                                제품명
                            </th>

                            {/* 🆕 플랫폼 컬럼 정렬 추가 */}
                            <th
                                className="px-6 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none w-32"
                                onClick={handlePlatformSort}
                                title="클릭하여 정렬"
                            >
                                <div className="flex items-center justify-center">
                                    플랫폼
                                    {getSortIcon('platform')}
                                </div>
                            </th>

                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                                OS
                            </th>

                            {/* 🆕 상태 컬럼 정렬 */}
                            <th
                                className="px-6 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none w-32"
                                onClick={handleStatusSort}
                                title="클릭하여 정렬"
                            >
                                <div className="flex items-center justify-center">
                                    상태
                                    {getSortIcon('status')}
                                </div>
                            </th>

                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 w-28">
                                대여자
                            </th>

                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                                반납
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {sortedDevices.map((device) => {
                            const isSelected = selectedDevices.includes(device.id);
                            const isRented = device.status === 'rented';
                            const isAvailable = device.status === 'available';

                            return (
                                <tr
                                    key={device.id}
                                    className={`transition-all select-none touch-manipulation ${
                                        isRented ? 'bg-red-50 dark:bg-red-900/20' :
                                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' :
                                                isAvailable && !isTestMode ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600' :
                                                    isTestMode ? 'opacity-75' : ''
                                    }`}
                                    onClick={() => isAvailable && !isTestMode && handleDeviceSelect(device.id)}
                                    style={{ minHeight: '60px' }}
                                >
                                    <td className="px-6 py-5 text-center">
                                        {isAvailable ? (
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleDeviceSelect(device.id)}
                                                disabled={isTestMode}
                                                className="w-6 h-6 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 cursor-pointer touch-manipulation bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">-</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-5 text-center text-base font-bold text-gray-900 dark:text-white">
                                        {device.deviceNumber}
                                    </td>

                                    <td className="px-6 py-5 text-center">
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

                                    <td className="px-6 py-5 text-center text-base text-gray-900 dark:text-white">
                                        {device.platform === 'iOS' ? '🍎 iOS' : '🤖 Android'}
                                    </td>

                                    <td className="px-6 py-5 text-center text-base text-gray-900 dark:text-white">
                                        {device.osVersion}
                                    </td>

                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-block px-3 py-2 text-sm rounded-full font-medium ${
                                            isRented
                                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                        }`}>
                                            {isRented ? '대여 중' : '대여 가능'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 text-center text-base text-gray-900 dark:text-white">
                                        {device.currentRenter || '-'}
                                    </td>

                                    <td className="px-6 py-5 text-center">
                                        {isRented ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReturnClick(device);
                                                }}
                                                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors touch-manipulation whitespace-nowrap"
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

                {/* 스마트 반납 모달 (자동으로 해당 대여자의 모든 디바이스 표시) */}
                <UserReturnModal
                    isOpen={showReturnModal}
                    onClose={() => setShowReturnModal(false)}
                    device={selectedReturnDevice}
                    onReturn={handleReturn} // 단일 반납용
                    onMultipleReturn={handleMultipleReturn} // 다중 반납용
                    isLoading={isReturning}
                />

                {/* 이력 보기 모달 */}
                <RentalHistoryModal
                    isOpen={showHistoryModal}
                    onClose={() => setShowHistoryModal(false)}
                />
            </main>
        </div>
    );
}

export default UserApp;