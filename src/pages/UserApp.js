import React, { useState, useEffect } from 'react';
import { deviceAPI } from '../services/api';
import Header from '../components/Header';
import RentModal from '../components/RentModal';
import UserReturnModal from '../components/UserReturnModal';
import RentalHistoryModal from '../components/RentalHistoryModal';
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

    // 항상 모든 디바이스 조회 (대여 가능 + 대여중)
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
            const errorMessage = error.response?.data?.message || '디바이스 대여에 실패했습니다.';
            alert(errorMessage);
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Header
                deviceCount={availableDevices.length}
                selectedCount={selectedDevices.length}
                onRefresh={fetchAllDevices}
                onRentClick={() => setShowRentModal(true)}
                onHistoryClick={() => setShowHistoryModal(true)}
                isRefreshing={refreshing}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 상태 및 선택 정보 */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleSelectAll}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                            {selectedDevices.length === availableDevices.length && availableDevices.length > 0 ? '전체 해제' : '전체 선택'}
                        </button>

                        {selectedDevices.length > 0 && (
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {selectedDevices.length}개 선택됨
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
                                    className="w-6 h-6 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 cursor-pointer bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"
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

                            return (
                                <tr
                                    key={device.id}
                                    className={`transition-all select-none touch-manipulation ${
                                        isRented ? 'bg-red-50 dark:bg-red-900/20' :
                                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' :
                                                isAvailable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600' : ''
                                    }`}
                                    onClick={() => isAvailable && handleDeviceSelect(device.id)}
                                    style={{ minHeight: '60px' }}
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center w-8 h-8">
                                            {isAvailable ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleDeviceSelect(device.id)}
                                                    className="w-6 h-6 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 cursor-pointer touch-manipulation bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"
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

                {/* 반납 모달 */}
                <UserReturnModal
                    isOpen={showReturnModal}
                    onClose={() => setShowReturnModal(false)}
                    device={selectedReturnDevice}
                    onReturn={handleReturn}
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