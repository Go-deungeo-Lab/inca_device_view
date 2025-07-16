import React from 'react';

function AccessDenied() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                    접근이 차단되었습니다
                </h2>
                <p className="text-gray-600 mb-6">
                    현재 IP 주소에서는 이 시스템에 접근할 수 없습니다.
                </p>
                <div className="bg-gray-100 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700">
                        관리자에게 문의하여 IP 주소를 허용 목록에 추가해달라고 요청하세요.
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    다시 시도
                </button>
            </div>
        </div>
    );
}

export default AccessDenied;
