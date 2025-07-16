import React from 'react';
import DeviceCard from './DeviceCard';

function DeviceList({ devices, selectedDevices, onDeviceSelect }) {
    if (devices.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500 text-lg">현재 대여 가능한 디바이스가 없습니다.</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map(device => (
                <DeviceCard
                    key={device.id}
                    device={device}
                    isSelected={selectedDevices.includes(device.id)}
                    onSelect={onDeviceSelect}
                />
            ))}
        </div>
    );
}

export default DeviceList;