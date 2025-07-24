import React, { useState, useEffect } from 'react';

function UserReturnModal({
                             isOpen,
                             onClose,
                             device, // 클릭한 디바이스
                             onReturn, // 단일 반납
                             onMultipleReturn, // 다중 반납
                             isLoading = false
                         }) {
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [renterDevices, setRenterDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [errors, setErrors] = useState({});

    const renterName = device?.currentRenter || '';

    // 모달이 열리면 해당 대여자의 모든 대여 디바이스 조회
    useEffect(() => {
        if (isOpen && renterName) {
            fetchRenterDevices(renterName);
        }
    }, [isOpen, renterName]);

    const fetchRenterDevices = async (name) => {
        try {
            setLoadingDevices(true);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/devices/user/${name}/rented`);
            if (response.ok) {
                const data = await response.json();
                setRenterDevices(data);
                // 🆕 현재 클릭한 디바이스를 기본 선택
                setSelectedDevices([device.id]);
            } else {
                setRenterDevices([device]); // 실패시 최소한 클릭한 디바이스라도
                setSelectedDevices([device.id]);
            }
        } catch (error) {
            console.error('대여 디바이스 조회 실패:', error);
            setRenterDevices([device]); // 실패시 최소한 클릭한 디바이스라도
            setSelectedDevices([device.id]);
        } finally {
            setLoadingDevices(false);
        }
    };

    const handleDeviceSelect = (deviceId) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    const handleSelectAll = () => {
        if (selectedDevices.length === renterDevices.length) {
            // 모두 선택된 상태라면 클릭한 디바이스만 남김
            setSelectedDevices([device.id]);
        } else {
            // 전체 선택
            setSelectedDevices(renterDevices.map(d => d.id));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedDevices.length === 0) {
            setErrors({ devices: '반납할 디바이스를 선택해주세요' });
            return;
        }

        setErrors({});

        try {
            if (selectedDevices.length === 1) {
                // 단일 반납
                await onReturn(selectedDevices[0], renterName);
            } else {
                // 다중 반납
                await onMultipleReturn(selectedDevices, renterName);
            }

            // 성공 시 폼 초기화
            setSelectedDevices([]);
            setRenterDevices([]);
            setErrors({});
            onClose();
        } catch (error) {
            console.error('반납 실패:', error);

            if (selectedDevices.length === 1) {
                // 단일 반납 에러 처리
                const errorMessage = error.response?.data?.message || '반납에 실패했습니다';
                setErrors({ general: errorMessage });
            }
        }
    };

    const handleClose = () => {
        setSelectedDevices([]);
        setRenterDevices([]);
        setErrors({});
        onClose();
    };

    if (!isOpen || !device) return null;

    const isMultipleMode = renterDevices.length > 1;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 touch-manipulation">
            <div className={`bg-white dark:bg-gray-800 rounded-lg w-full mx-4 transition-colors ${
                isMultipleMode ? 'max-w-4xl max-h-[90vh] flex flex-col' : 'max-w-md'
            }`}>
                {/* 헤더 */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        📱 디바이스 반납 - {renterName}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 w-8 h-8 flex items-center justify-center touch-manipulation"
                        disabled={isLoading}
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={isMultipleMode ? "flex flex-col flex-1" : ""}>
                    {/* 에러 메시지 */}
                    {errors.general && (
                        <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                            <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
                        </div>
                    )}

                    {/* 로딩 상태 */}
                    {loadingDevices && (
                        <div className="p-6 text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {renterName}님의 대여 디바이스를 조회하는 중...
                            </div>
                        </div>
                    )}

                    {/* 디바이스 목록 */}
                    {!loadingDevices && (
                        <div className={isMultipleMode ? "flex-1 overflow-hidden flex flex-col" : "p-6"}>
                            {/* 다중 모드: 선택 헤더 */}
                            {isMultipleMode && (
                                <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {renterName}님의 대여 중인 디바이스 ({renterDevices.length}개)
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                            disabled={isLoading}
                                        >
                                            {selectedDevices.length === renterDevices.length ? '선택 초기화' : '전체 선택'}
                                        </button>
                                    </div>

                                    {errors.devices && (
                                        <p className="text-red-500 dark:text-red-400 text-sm mb-4">{errors.devices}</p>
                                    )}

                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        선택된 디바이스: {selectedDevices.length}개
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                                        <div className="flex items-start">
                                            <span className="text-blue-600 dark:text-blue-400 mr-2">💡</span>
                                            <div className="text-blue-800 dark:text-blue-300 text-sm">
                                                <strong>팁:</strong> 여러 디바이스를 선택하여 한 번에 반납할 수 있습니다.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 디바이스 목록 표시 */}
                            <div className={isMultipleMode ? "flex-1 overflow-auto" : ""}>
                                {isMultipleMode ? (
                                    // 다중 모드: 카드 형태
                                    <div className="p-6">
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {renterDevices.map((deviceItem) => {
                                                const isSelected = selectedDevices.includes(deviceItem.id);
                                                const isClickedDevice = deviceItem.id === device.id;

                                                return (
                                                    <div
                                                        key={deviceItem.id}
                                                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                            isSelected
                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                                                        } ${isClickedDevice ? 'ring-2 ring-orange-300 dark:ring-orange-600' : ''}`}
                                                        onClick={() => !isLoading && handleDeviceSelect(deviceItem.id)}
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleDeviceSelect(deviceItem.id)}
                                                                className="w-5 h-5 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 cursor-pointer"
                                                                disabled={isLoading}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            <div className="flex flex-col items-end space-y-1">
                                                                <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full font-medium">
                                                                    대여 중
                                                                </span>
                                                                {isClickedDevice && (
                                                                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full font-medium">
                                                                        클릭된 디바이스
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">No.</span>
                                                                <span className="font-bold text-lg text-gray-900 dark:text-white">{deviceItem.deviceNumber}</span>
                                                            </div>

                                                            <h4 className="font-semibold text-gray-900 dark:text-white">{deviceItem.productName}</h4>

                                                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span>모델명:</span>
                                                                    <span className="font-medium">{deviceItem.modelName || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>OS:</span>
                                                                    <span className="font-medium">{deviceItem.osVersion}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>플랫폼:</span>
                                                                    <span className={`font-medium ${
                                                                        deviceItem.platform === 'iOS' ? 'text-gray-600 dark:text-gray-300' : 'text-green-600 dark:text-green-400'
                                                                    }`}>
                                                                        {deviceItem.platform === 'iOS' ? '🍎 iOS' : '🤖 Android'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {deviceItem.isRootedOrJailbroken && (
                                                                <div className="mt-2">
                                                                    <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full font-medium">
                                                                        ⚠️ {deviceItem.platform === 'iOS' ? '탈옥' : '루팅'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    // 단일 모드: 간단한 정보 표시
                                    <div>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">반납할 디바이스</h4>
                                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                                <div><strong>No.:</strong> {device.deviceNumber}</div>
                                                <div><strong>제품명:</strong> {device.productName}</div>
                                                <div><strong>대여자:</strong> {device.currentRenter}</div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
                                            <div className="flex items-start">
                                                <span className="text-blue-600 dark:text-blue-400 mr-2">ℹ️</span>
                                                <div className="text-blue-800 dark:text-blue-300 text-sm">
                                                    <strong>안내:</strong> 반납 처리 후 다른 사용자가 해당 디바이스를 대여할 수 있습니다.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 버튼 */}
                    {!loadingDevices && (
                        <div className={`p-6 ${isMultipleMode ? 'border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700' : ''}`}>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 touch-manipulation text-base"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || selectedDevices.length === 0}
                                    className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 touch-manipulation text-base font-medium"
                                >
                                    {isLoading ? '반납 처리 중...' :
                                        selectedDevices.length === 1 ? '반납 완료' : `${selectedDevices.length}개 디바이스 일괄 반납`
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default UserReturnModal;