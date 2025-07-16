import React, { useState, useEffect } from 'react';
import { deviceAPI } from '../services/api';
import Header from '../components/Header';
import DeviceList from '../components/DeviceList';
import RentModal from '../components/RentModal';
import LoadingSpinner from '../components/LoadingSpinner';

function UserApp() {
    const [devices, setDevices] = useState([]);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showRentModal, setShowRentModal] = useState(false);

    // 대여 가능한 디바이스 조회
    useEffect(() => {
        fetchAvailableDevices();
    }, []);

    const fetchAvailableDevices = async () => {
        try {
            setRefreshing(true);
            const response = await deviceAPI.getAvailableDevices();
            setDevices(response.data);
        } catch (error) {
            console.error('디바이스 조회 실패:', error);
            alert('디바이스 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // 디바이스 선택/해제
    const handleDeviceSelect = (deviceId) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    // 전체 선택/해제
    const handleSelectAll = () => {
        if (selectedDevices.length === devices.length) {
            setSelectedDevices([]);
        } else {
            setSelectedDevices(devices.map(device => device.id));
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
            await fetchAvailableDevices(); // 목록 새로고침
        } catch (error) {
            console.error('대여 실패:', error);
            const errorMessage = error.response?.data?.message || '디바이스 대여에 실패했습니다.';
            alert(errorMessage);
            throw error; // RentModal에서 로딩 상태 해제를 위해
        }
    };

    if (loading) {
        return <LoadingSpinner message="디바이스 목록을 불러오는 중..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                deviceCount={devices.length}
                selectedCount={selectedDevices.length}
                onRefresh={fetchAvailableDevices}
                onRentClick={() => setShowRentModal(true)}
                isRefreshing={refreshing}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 필터 및 선택 옵션 */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleSelectAll}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {selectedDevices.length === devices.length ? '전체 해제' : '전체 선택'}
                        </button>

                        {selectedDevices.length > 0 && (
                            <span className="text-sm text-gray-600">
                                {selectedDevices.length}개 선택됨
                            </span>
                        )}
                    </div>

                    {/* 플랫폼별 개수 표시 */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                            🤖 Android: {devices.filter(d => d.platform === 'Android').length}개
                        </span>
                        <span>
                            🍎 iOS: {devices.filter(d => d.platform === 'iOS').length}개
                        </span>
                    </div>
                </div>

                <DeviceList
                    devices={devices}
                    selectedDevices={selectedDevices}
                    onDeviceSelect={handleDeviceSelect}
                />

                <RentModal
                    isOpen={showRentModal}
                    onClose={() => setShowRentModal(false)}
                    selectedDevices={selectedDevices}
                    devices={devices}
                    onRent={handleRent}
                />
            </main>
        </div>
    );
}

export default UserApp;