const fetch = require('node-fetch');
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const schedule = require('node-schedule');

// Configure logging
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Hardcoded Configuration
const config = {
    purpleAir: {
        apiKey: '',
        sensorId: '', // You must replace this with your actual sensor ID
        readKey: '', // Optional: add read key if required by your sensor
        apiUrl: 'https://api.purpleair.com/v1/sensors'
    },
    eagleIo: {
        apiKey: '',
        ftpHost: 'ftp.eagle.io',
        ftpUser: '',
        ftpPassword: '' // You must add your actual FTP password
    },
    localFile: path.join(__dirname, 'purple-air-data.csv')
};

async function fetchPurpleAirData() {
    try {
        logger.info('Starting Purple Air API request...');
        
        const url = `${config.purpleAir.apiUrl}/${config.purpleAir.sensorId}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-Key': config.purpleAir.apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Purple Air API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        console.log('Purple Air API Response:', JSON.stringify(data, null, 2));
        
        logger.info('Successfully received Purple Air data');
        return data;
    } catch (error) {
        logger.error('Error fetching Purple Air data:', error);
        throw error;
    }
}

function formatDataToCSV(data) {
    try {
        const timestamp = new Date().toISOString();
        const filename = `purple-air-data-${timestamp.replace(/[:.]/g, '-')}.csv`;
        config.localFile = path.join(__dirname, filename);

        // Extract values directly from sensor data
        const sensorData = data.sensor;
        
        // Build CSV string with proper header row and data format
        // Using header row for column labels as per eagle.io requirements
        let csvContent = [
            'Time,PM2.5 (ug/m3),Temperature (°C),Humidity (%)', // Header row with units
            `${timestamp},${sensorData['pm2.5'].toFixed(1)},${sensorData.temperature.toFixed(1)},${sensorData.humidity.toFixed(1)}`
        ].join('\n');
        
        // Write to file synchronously
        fs.writeFileSync(config.localFile, csvContent);
        
        return csvContent;
    } catch (error) {
        logger.error('Error formatting CSV data:', error);
        throw error;
    }
}

async function uploadToEagleIo() {
    const client = new ftp.Client(0);
    client.ftp.verbose = true;

    try {
        await client.access({
            host: config.eagleIo.ftpHost,
            user: config.eagleIo.ftpUser,
            password: config.eagleIo.ftpPassword,
            secure: false
        });

        logger.info('FTP connection established');
        
        const filename = path.basename(config.localFile);
        await client.uploadFrom(config.localFile, `./${filename}`);
        
        logger.info(' SUCCESS: Data successfully transferred to Eagle.io');
        console.log('\n SUCCESS: Data successfully transferred to Eagle.io\n');
    } catch (error) {
        logger.error('FTP error:', error);
        console.log('\n ERROR: Failed to transfer data to Eagle.io\n');
        throw error;
    } finally {
        await client.close();
    }
}

async function dataCollectionTask() {
    try {
        logger.info('Starting data collection task');
        
        const purpleAirData = await fetchPurpleAirData();
        console.log('Purple Air Data received:', {
            pm25: purpleAirData.sensor['pm2.5'],
            temp: purpleAirData.sensor.temperature,
            humidity: purpleAirData.sensor.humidity
        });
        
        const csvData = formatDataToCSV(purpleAirData);
        
        // Verify file exists and contains correct data before upload
        const fileContent = fs.readFileSync(config.localFile, 'utf8');
        console.log('File content before upload:', fileContent);
        
        await uploadToEagleIo();
        
        // Don't cleanup - comment out or remove this line
        // await cleanup();
        
        logger.info('Data collection task completed successfully');
    } catch (error) {
        logger.error('Data collection task error:', error);
        // Don't cleanup on error either
        // await cleanup();
        process.exit(1);
    }
}

if (require.main === module) {
    logger.info('Starting Purple Air data collection service');
    
    dataCollectionTask().catch(error => {
        logger.error('Initial task failed:', error);
        process.exit(1);
    });
    
    const job = schedule.scheduleJob('*/30 * * * *', () => {
        dataCollectionTask().catch(error => {
            logger.error('Scheduled task failed:', error);
        });
    });

    process.on('SIGTERM', () => {
        job.cancel();
        process.exit(0);
    });
    
    logger.info('Service scheduled to run every 30 minutes');
}

module.exports = dataCollectionTask;

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection:', error);
    process.exit(1);
});
