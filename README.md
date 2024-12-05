![596CAF84-D13C-4882-8743-C0055049C5C4-preview](https://github.com/user-attachments/assets/67bfbbfd-426b-4793-a058-e6ee011ec831)

# Purple Air Data Collection & Transfer System

A robust Node.js application that automates the collection of air quality data from Purple Air sensors and seamlessly transfers it to Eagle.io for visualization and analysis. This project demonstrates practical implementation of API integration, automated data collection, FTP file transfer, and enterprise-level logging.

## 🚀 Key Features

- Real-time air quality data collection from Purple Air sensors
- Automated data transformation and CSV formatting
- Secure FTP transfer to Eagle.io platform
- Robust error handling and logging system
- Configurable scheduling system
- Windows Task Scheduler integration

## 🛠️ Technologies Used

- **Node.js** - Runtime environment
- **node-fetch** - HTTP requests to Purple Air API
- **basic-ftp** - FTP file transfer implementation
- **winston** - Enterprise-level logging
- **node-schedule** - Task scheduling
- **dotenv** - Environment variable management

## 📋 Prerequisites

- Node.js (LTS version)
- Purple Air sensor access
- Eagle.io account with FTP credentials
- Windows environment (for Task Scheduler integration)

## 🔧 Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/purple-air-monitor.git
cd purple-air-monitor
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables by creating a `.env` file:
   env
PURPLE_AIR_API_KEY=your_api_key
PURPLE_AIR_SENSOR_ID=your_sensor_id
EAGLE_IO_API_KEY=your_eagle_io_key
FTP_HOST=ftp.eagle.io
FTP_USER=your_username

## 💻 Usage

### Manual Execution

```bash
node data-transfer.js
```

### Automated Scheduling
The application can be configured to run automatically using:
- Internal node-schedule (runs every 30 minutes)
- Windows Task Scheduler (recommended for production)

## 🏗️ Architecture

├── data-transfer.js # Main application file
├── .env # Environment configuration
├── package.json # Project dependencies
└── logs/
├── error.log # Error logging
└── combined.log # Complete application logging


## 🔍 Key Implementation Details

- **API Integration**: Implements secure communication with Purple Air's API using authentication headers
- **Data Transformation**: Converts raw sensor data into formatted CSV files with proper timestamps
- **Error Handling**: Comprehensive error catching and logging system for debugging and monitoring
- **FTP Transfer**: Secure file transfer implementation with retry logic
- **Scheduling**: Flexible scheduling system with both internal and external options

## 🛡️ Error Handling

The application includes:
- Comprehensive error logging
- Graceful failure handling
- Process monitoring for uncaught exceptions
- Automatic retry mechanisms for network operations

## 📊 Monitoring

- Detailed logging system using Winston
- Separate error and combined log files
- Timestamp-based log entries
- JSON-formatted logs for easy parsing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the copywrite

## 🔗 Contact

Your Name - Forrest Tindall - [https://www.linkedin.com/in/forrest-tindall]

Project Link: [[https://github.com/yourusername/purple-air-monitor]([https://github.com/yourusername/purple-air-monitor](https://github.com/forresttindall/PurpleAir-to-Eagle.io)]

---


*This project was developed as part of an environmental monitoring initiative to track air quality metrics in real-time.*
