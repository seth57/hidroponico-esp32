// Websocket connection handling
const wsUrl = `ws://${window.location.hostname}/ws`;
// Fallback for local testing if not on ESP32
const url = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'ws://localhost:3000' 
    : wsUrl;

let ws;
let isConnected = false;
const statusIndicator = document.getElementById('connectionStatus');

function initWebSocket() {
    console.log('Trying to connect to: ' + url);
    ws = new WebSocket(url);

    ws.onopen = function(e) {
        console.log("[open] Connection established");
        isConnected = true;
        updateConnectionStatus();
    };

    ws.onmessage = function(event) {
        // console.log(`[message] Data received from server: ${event.data}`);
        try {
            const data = JSON.parse(event.data);
            handleIncomingData(data);
        } catch (e) {
            console.error("Failed to parse JSON", e);
        }
    };

    ws.onclose = function(event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            console.log('[close] Connection died');
        }
        isConnected = false;
        updateConnectionStatus();
        // Reconnect logic
        setTimeout(initWebSocket, 3000);
    };

    ws.onerror = function(error) {
        console.log(`[error] ${error.message}`);
    };
}

function updateConnectionStatus() {
    if(statusIndicator) {
        if(isConnected) {
            statusIndicator.classList.add('connected');
            statusIndicator.title = "Conectado";
        } else {
            statusIndicator.classList.remove('connected');
            statusIndicator.title = "Desconectado";
        }
    }
}

function sendCommand(commandObj) {
    if (isConnected && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(commandObj));
        return true;
    } else {
        console.warn("Cannot send, WebSocket not connected");
        // Show toast error
        showToast("Error de conexión. Comando no enviado.", "error");
        return false;
    }
}

// Data Handler
function handleIncomingData(data) {
    if(data.type === 'sensor_data') {
        updateDashboard(data);
    }
}

function updateDashboard(data) {
    // Update simple text values if they exist
    if(document.getElementById('phValue')) document.getElementById('phValue').innerText = data.ph.toFixed(1);
    if(document.getElementById('ecValue')) document.getElementById('ecValue').innerText = data.ec.toFixed(1);
    if(document.getElementById('tempValue')) document.getElementById('tempValue').innerText = data.temperature.toFixed(1) + '°C';
    
    // Here we would also update Chart.js instances if implemented
    if(window.updateCharts) {
        window.updateCharts(data);
    }
}

function showToast(message, type="info") {
    // Basic toast implementation
    console.log(`[TOAST - ${type}]: ${message}`);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
});
