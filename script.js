// API 키
const apiKey = 'e0244f8a89954b9382022257250806';
const baseUrl = 'https://api.weatherapi.com/v1';

// DOM 요소
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const weatherInfo = document.getElementById('weather-info');
const forecastEl = document.getElementById('forecast');
const errorMessage = document.getElementById('error-message');
const locationName = document.getElementById('location-name');
const localTime = document.getElementById('local-time');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const precipitation = document.getElementById('precipitation');
const uv = document.getElementById('uv');
const forecastContainer = document.getElementById('forecast-container');
const recentSearchesContainer = document.getElementById('recent-searches');

// 이벤트 리스너
searchBtn.addEventListener('click', getWeatherData);
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeatherData();
    }
});

// 초기 로딩시 서울 날씨 표시
window.addEventListener('load', () => {
    // 최근 검색 로드
    loadRecentSearches();
    
    // 마지막 검색 위치 또는 기본값 사용
    const lastSearch = localStorage.getItem('lastSearch') || '서울';
    locationInput.value = lastSearch;
    getWeatherData();
});

// 로딩 애니메이션 표시 함수
function showLoading() {
    const originalContent = searchBtn.innerHTML;
    searchBtn.setAttribute('data-original-content', originalContent);
    searchBtn.innerHTML = `<div class="spinner-custom"></div>`;
    searchBtn.disabled = true;
    
    // 로딩 중에는 날씨 정보를 흐리게 표시
    if (weatherInfo.style.display !== 'none') {
        weatherInfo.classList.add('sleeping');
    }
    if (forecastEl.style.display !== 'none') {
        forecastEl.classList.add('sleeping');
    }
}

// 로딩 애니메이션 숨기기 함수
function hideLoading() {
    const originalContent = searchBtn.getAttribute('data-original-content');
    searchBtn.innerHTML = originalContent;
    searchBtn.disabled = false;
    
    // 로딩 완료 후 날씨 정보를 선명하게 표시
    weatherInfo.classList.remove('sleeping');
    forecastEl.classList.remove('sleeping');
}

// 최근 검색 로드
function loadRecentSearches() {
    const recentSearches = getRecentSearches();
    recentSearchesContainer.innerHTML = '';
    
    if (recentSearches.length === 0) {
        recentSearchesContainer.innerHTML = '<p class="text-gray-400 text-sm">최근 검색 내역이 없습니다.</p>';
        return;
    }
    
    recentSearches.forEach(search => {
        const searchItem = document.createElement('button');
        searchItem.className = 'recent-search-item px-3 py-1 rounded-full text-sm bg-white shadow-sm border border-gray-200 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300';
        searchItem.textContent = search;
        searchItem.addEventListener('click', () => {
            locationInput.value = search;
            getWeatherData();
        });
        
        recentSearchesContainer.appendChild(searchItem);
    });
}

// 최근 검색 가져오기
function getRecentSearches() {
    return JSON.parse(localStorage.getItem('recentSearches') || '[]');
}

// 최근 검색 저장
function saveRecentSearch(locationName) {
    let recentSearches = getRecentSearches();
    
    // 중복 검색어 제거
    recentSearches = recentSearches.filter(item => item !== locationName);
    
    // 새 검색어 추가
    recentSearches.unshift(locationName);
    
    // 최대 5개 저장
    if (recentSearches.length > 5) {
        recentSearches = recentSearches.slice(0, 5);
    }
    
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    localStorage.setItem('lastSearch', locationName);
    
    // UI 업데이트
    loadRecentSearches();
}

// 날씨 데이터 가져오기
async function getWeatherData() {
    const location = locationInput.value.trim();
    
    if (!location) {
        showError('위치를 입력해 주세요.');
        return;
    }
    
    try {
        // 로딩 상태 표시
        hideError();
        showLoading();
        
        const response = await fetch(`${baseUrl}/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=3&aqi=yes&lang=ko`);
        
        if (!response.ok) {
            if (response.status === 400) {
                showError('해당 위치를 찾을 수 없습니다. 다른 위치를 입력해 주세요.');
            } else {
                showError('날씨 정보를 가져오는 중 오류가 발생했습니다.');
            }
            hideLoading();
            return;
        }
        
        const data = await response.json();
        updateUI(data);
        hideLoading();
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('날씨 정보를 가져오는 중 오류가 발생했습니다.');
        hideLoading();
    }
}

// UI 업데이트
function updateUI(data) {
    // 현재 날씨 정보 업데이트
    locationName.textContent = `${data.location.name}, ${data.location.country}`;
    
    // 현지 시간 표시
    const date = new Date(data.location.localtime);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    };
    localTime.innerHTML = `<i class="bi bi-clock mr-1"></i>${date.toLocaleString('ko-KR', options)}`;
    
    // 날씨 아이콘 및 상태
    weatherIcon.src = `https:${data.current.condition.icon}`;
    weatherIcon.alt = data.current.condition.text;
    
    // 날씨 아이콘에 날씨 상태에 따른 클래스 추가
    weatherIcon.className = `w-28 h-28 drop-shadow-lg ${getWeatherConditionClass(data.current.condition.code)}`;
    
    temperature.textContent = `${Math.round(data.current.temp_c)}°C`;
    condition.textContent = data.current.condition.text;
    feelsLike.innerHTML = `<i class="bi bi-thermometer-half mr-1"></i>체감 온도: ${Math.round(data.current.feelslike_c)}°C`;
    
    // 추가 날씨 데이터
    humidity.textContent = `${data.current.humidity}%`;
    wind.textContent = `${data.current.wind_kph} km/h`;
    precipitation.textContent = `${data.current.precip_mm} mm`;
    uv.textContent = data.current.uv;
    
    // 공기질 정보 추가 (AQI가 있는 경우)
    if (data.current.air_quality && data.current.air_quality['us-epa-index']) {
        const aqiLevel = getAQILevel(data.current.air_quality['us-epa-index']);
        addAirQualityInfo(aqiLevel, data.current.air_quality['us-epa-index']);
    }
    
    // 3일 예보 업데이트
    updateForecast(data.forecast.forecastday);
    
    // UI 표시 (애니메이션 효과 추가)
    weatherInfo.style.display = 'block';
    forecastEl.style.display = 'block';
    
    // 로컬 스토리지에 최근 검색 저장
    saveRecentSearch(data.location.name);
}

// 날씨 상태 클래스 반환
function getWeatherConditionClass(code) {
    // 1000-1003: 맑음/부분적으로 맑음
    if (code >= 1000 && code <= 1003) {
        return 'weather-condition-sun';
    }
    // 1006-1030: 구름
    else if (code >= 1006 && code <= 1030) {
        return 'weather-condition-cloud';
    }
    // 1063-1201: 비
    else if (code >= 1063 && code <= 1201) {
        return 'weather-condition-rain';
    }
    // 1204-1237: 눈/얼음
    else if (code >= 1204 && code <= 1237) {
        return 'weather-condition-snow';
    }
    // 1240-1282: 소나기/뇌우
    else if (code >= 1240 && code <= 1282) {
        return 'weather-condition-storm';
    }
    // 기본
    return '';
}

// 공기질 레벨 반환
function getAQILevel(aqiIndex) {
    const levels = [
        { text: '좋음', color: 'success', textColor: 'text-green-700', bgColor: 'bg-green-50' },
        { text: '보통', color: 'info', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
        { text: '민감군 영향', color: 'warning', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
        { text: '나쁨', color: 'warning', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
        { text: '매우 나쁨', color: 'danger', textColor: 'text-red-700', bgColor: 'bg-red-50' },
        { text: '위험', color: 'danger', textColor: 'text-purple-700', bgColor: 'bg-purple-50' }
    ];
    
    return levels[aqiIndex - 1] || levels[0];
}

// 공기질 정보 추가
function addAirQualityInfo(aqiLevel, aqiValue) {
    // AQI 정보를 추가할 요소 찾기
    const weatherData = document.querySelector('.weather-data');
    
    // 이미 AQI 요소가 있는지 확인
    let aqiElement = document.getElementById('air-quality');
    if (!aqiElement) {
        // 새로운 AQI 요소 생성
        const div = document.createElement('div');
        div.className = 'col-span-2 mt-2';
        div.innerHTML = `
            <div id="air-quality" class="data-card ${aqiLevel.bgColor} rounded-xl p-4 flex items-center justify-between transform transition-all hover:scale-102">
                <div class="flex items-center">
                    <i class="bi bi-wind text-2xl ${aqiLevel.textColor} mr-3"></i>
                    <div>
                        <p class="text-gray-500 text-sm">공기질</p>
                        <p class="text-lg font-bold ${aqiLevel.textColor}">${aqiLevel.text}</p>
                    </div>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-medium ${aqiLevel.bgColor} border ${aqiLevel.textColor} border-opacity-50">${aqiValue}</span>
            </div>
        `;
        weatherData.appendChild(div);
    } else {
        // 기존 AQI 요소 업데이트
        aqiElement.className = `data-card ${aqiLevel.bgColor} rounded-xl p-4 flex items-center justify-between transform transition-all hover:scale-102`;
        aqiElement.innerHTML = `
            <div class="flex items-center">
                <i class="bi bi-wind text-2xl ${aqiLevel.textColor} mr-3"></i>
                <div>
                    <p class="text-gray-500 text-sm">공기질</p>
                    <p class="text-lg font-bold ${aqiLevel.textColor}">${aqiLevel.text}</p>
                </div>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-medium ${aqiLevel.bgColor} border ${aqiLevel.textColor} border-opacity-50">${aqiValue}</span>
        `;
    }
}

// 예보 업데이트
function updateForecast(forecastData) {
    forecastContainer.innerHTML = '';
    
    forecastData.forEach(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('ko-KR', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        
        // 일기 예보 클래스 가져오기
        const conditionClass = getWeatherConditionClass(day.day.condition.code);
        
        const forecastDay = document.createElement('div');
        
        forecastDay.innerHTML = `
            <div class="bg-white rounded-2xl p-6 shadow-lg h-full transform transition-all hover:translate-y-[-5px] hover:shadow-xl">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-bold text-gray-800">${dayName}</h4>
                    <p class="text-gray-500 text-sm">${dateStr}</p>
                </div>
                <div class="flex flex-col items-center my-4">
                    <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" class="w-20 h-20 ${conditionClass}">
                    <p class="text-gray-700 mt-2">${day.day.condition.text}</p>
                </div>
                <div class="flex justify-around items-center mb-4">
                    <div class="text-center">
                        <p class="text-xs text-gray-500 mb-1">최고</p>
                        <p class="text-xl font-bold text-red-500">${Math.round(day.day.maxtemp_c)}°</p>
                    </div>
                    <div class="h-8 border-l border-gray-200"></div>
                    <div class="text-center">
                        <p class="text-xs text-gray-500 mb-1">최저</p>
                        <p class="text-xl font-bold text-blue-500">${Math.round(day.day.mintemp_c)}°</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="bg-blue-50 rounded-lg p-2 flex items-center">
                        <i class="bi bi-droplet-fill text-blue-500 mr-1"></i>
                        <span>강수확률 ${day.day.daily_chance_of_rain}%</span>
                    </div>
                    <div class="bg-yellow-50 rounded-lg p-2 flex items-center">
                        <i class="bi bi-sun-fill text-yellow-500 mr-1"></i>
                        <span>자외선 ${day.day.uv}</span>
                    </div>
                    <div class="bg-indigo-50 rounded-lg p-2 flex items-center">
                        <i class="bi bi-wind text-indigo-500 mr-1"></i>
                        <span>풍속 ${day.day.maxwind_kph}km/h</span>
                    </div>
                    <div class="bg-pink-50 rounded-lg p-2 flex items-center">
                        <i class="bi bi-moisture text-pink-500 mr-1"></i>
                        <span>습도 ${day.day.avghumidity}%</span>
                    </div>
                </div>
            </div>
        `;
        
        forecastContainer.appendChild(forecastDay);
    });
}

// 에러 메시지 표시
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    weatherInfo.style.display = 'none';
    forecastEl.style.display = 'none';
}

// 에러 메시지 숨기기
function hideError() {
    errorMessage.classList.add('hidden');
}
