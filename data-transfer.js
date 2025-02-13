// Forrest Tindall Creationbase.io 2024

/*
COMPLETE SETUP INSTRUCTIONS:

1. FOLDER SETUP:
   - Open Windows Explorer
   - Go to C: drive
   - Create new folder: C:\purple-air-monitor\

2. FILE CREATION:
   a) Main Script (data-transfer.js):
      - Open Notepad
      - Copy this entire script
      - Click "Save As"
      - Navigate to C:\purple-air-monitor\
      - Set "Save as type" to "All Files (*.*)"
      - Name it: data-transfer.js
      - Click Save



1. Install Node.js from https://nodejs.org (LTS version)
2. Create a new directory for this project
3. Open Command Prompt in that directory
4. Run these commands:
   npm init -y
   npm install node-fetch@2.6.9 basic-ftp dotenv winston node-schedule

6. Save this script as 'data-transfer.js'

WINDOWS TASK SCHEDULER SETUP FOR 30-MINUTE INTERVALS:
Method 1 - Running continuously:
1. Run using: node data-transfer.js
   The script will run continuously and handle the 30-minute scheduling internally

Method 2 - Task Scheduler (preferred for production):
1. Open Task Scheduler (taskschd.msc)
2. Click "Create Basic Task"
3. Name: "Purple Air Data Collection"
4. Trigger: Daily
5. Advanced settings:
   - Check "Repeat task every: 30 minutes"
   - For a duration of: Indefinitely
6. Action: Start a program
7. Program/script: "C:\Program Files\nodejs\node.exe" (adjust path if needed)
8. Arguments: "full-path-to-your-script\data-transfer.js"
9. Start in: "full-path-to-your-script-directory"




/*
EAGLE.IO SETUP INSTRUCTIONS:

1. LOG INTO EAGLE.IO:
   - Go to https://eagle.io
   - Login with your credentials
   - Create a new workspace if needed

2. CREATE A DATA SOURCE:
   - Click "Add Source" in your workspace
   - Select "File Transport" as the source type
   - Configure FTP settings:
     * Transport: FTP
     * Host: ftp.eagle.io
     * Username: Your FTP username (same as FTP_USER in .env)
     * Security: FTPS (Explicit)
     * Remote Path: / (root directory)
     * File Pattern: purple-air-data-*.csv

3. CONFIGURE DATA PARSER:
   - Parser Type: Text (Delimited)
   - Format: CSV
   - Header Row: 1
   - Configure columns:
     * timestamp (TYPE: TIMESTAMP, Format: ISO8601)
     * pm2_5 (TYPE: NUMBER)
     * temperature (TYPE: NUMBER)
     * humidity (TYPE: NUMBER)

4. CREATE VISUALIZATION:
   - In your workspace, click "Add Display"
   - Choose visualization type (e.g., Chart, Table, or Dashboard)
   - Select the data source you created
   - Map the columns to your visualization:
     * X-axis: timestamp
     * Y-axis: pm2_5, temperature, or humidity

5. VERIFY DATA FLOW:
   - Wait for next data collection (30 minutes)
   - Check if new data appears in eagle.io
   - Verify timestamps are correct
   - Confirm values are displaying properly

Note: The FTP credentials in the .env file must match your eagle.io account settings
*/






import fetch from 'node-fetch';
import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
        apiKey: 'DD25F38A-78EE-11EF-95CB-42010A80000E',
        sensorId: '237037', // You must replace this with your actual sensor ID
        readKey: '', // Optional: add read key if required by your sensor
        apiUrl: 'https://api.purpleair.com/v1/sensors'
    },
    eagleIo: {
        apiKey: 'CiwSlVkt4x5aSmP4HuLIWaINIArE0QNxwVV5ZAhb',
        ftpHost: 'ftp.eagle.io',
        ftpUser: 'women-shop-suit',
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

// Replace the CommonJS main module check with ES Module version
if (import.meta.url === `file://${process.argv[1]}`) {
    logger.info('Starting Purple Air data collection service');
    
    dataCollectionTask()
        .then(() => {
            logger.info('Task completed, exiting');
            process.exit(0);
        })
        .catch(error => {
            logger.error('Task failed:', error);
            process.exit(1);
        });
}

export default dataCollectionTask;

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection:', error);
    process.exit(1);
});