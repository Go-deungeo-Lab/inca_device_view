import React, { useState } from 'react';

function RentModal({
                       isOpen,
                       onClose,
                       selectedDevices,
                       devices,
                       onRent
                   }) {
    const [renterName, setRenterName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!renterName.trim()) {
            alert('대여자 이름을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            await onRent(selectedDevices, renterName.trim());
            setRenterName('');
            onClose();
        } catch (error) {
            console.error('대여 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">디바이스 대여</h3>

                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                        선택된 디바이스: {selectedDevices.length}개
                    </p>
                    <div className="text-xs text-gray-500 space-y-1 max-h-32 overflow-y-auto">
                        {selectedDevices.map(deviceId => {
                            const device = devices.find(d => d.id === deviceId);
                            return device ? (
                                <div key={deviceId} className="flex items-center justify-between py-1">
                                    <span>• {device.deviceNumber} - {device.productName}</span>
                                    <span className="text-gray-400">
                                        {device.platform === 'iOS' ? '🍎' : '🤖'}
                                    </span>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        대여자 이름 *
                    </label>
                    <input
                        type="text"
                        value={renterName}
                        onChange={(e) => setRenterName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="이름을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        disabled={isLoading}
                    />
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !renterName.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? '대여 중...' : '대여하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RentModal;