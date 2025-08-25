# Track It - Multi-Scale Tracker

A lightweight, privacy-focused web application for tracking personal metrics using different measurement scales. Perfect for monitoring mood, sleep quality, productivity, or any other personal metrics over time.

🌐 **Live Demo**: [timothyfraser.github.io/tracker](https://timothyfraser.github.io/tracker)

## ✨ Features

- **📱 Mobile-First Design**: Optimized for both mobile phones and desktop computers
- **🔒 Privacy-First**: All data stored locally in your browser - no accounts, no servers
- **📊 Visual Analytics**: Interactive charts to visualize trends over time
- **📁 Data Management**: Import/export data as CSV files
- **⚡ Progressive Web App**: Can be installed on mobile devices for offline use
- **🎯 Custom Metrics**: Create and track any personal metrics you want
- **📏 Multiple Scales**: Support for Likert (1-5), Binary (0-1), and Continuous (0-100) scales

## 🚀 Quick Start

1. **Visit the app**: Go to [timothyfraser.github.io/tracker](https://timothyfraser.github.io/tracker)
2. **Create your first metric**: Click "➕ Metrics", add a metric name (e.g., "Mood", "Sleep Quality"), and select a scale
3. **Record your first measurement**: Click "📊 Record", select your metric, set a value using the appropriate scale, and choose a date
4. **View your data**: Use "📈 Chart" to see trends or "📁 History" to view all records

## 📖 How to Use

### Creating Metrics
- Navigate to the **Metrics** tab
- Enter a metric name (e.g., "Energy Level", "Stress", "Productivity")
- Select a measurement scale:
  - **Likert (1-5)**: Traditional 5-point scale, default value: 3
  - **Binary (0-1)**: Yes/No or True/False, default value: 1
  - **Continuous (0-100)**: Percentage or intensity scale in intervals of 5, default value: 50
- Click "Add Metric"
- Your metric will appear in the summary table with its scale type

### Recording Measurements
- Go to the **Record** tab
- Select a metric from the dropdown
- The slider will automatically adjust to the correct scale for your selected metric
- Use the slider to set a value appropriate for the scale:
  - **Likert**: 1 (lowest) to 5 (highest)
  - **Binary**: 0 (No/False) or 1 (Yes/True)
  - **Continuous**: 0 to 100 in steps of 5
- **Date & Time Options**:
  - **Option A**: Use current time - the date/time fields auto-populate with current values
  - **Option B**: Manually adjust date and time using the dropdown selectors
  - Click "🕐 Now" button to quickly reset to current time
- Click "Record" to save

### Viewing Data
- **Visualize Tab**: See line charts with trend lines of your metrics over time
  - Filter by metric, year, month, and day
  - Choose aggregation level: By Hour, By Day, By Week, By Month, or By Year
  - **Time-based x-axis**: Points are spaced according to actual time intervals (e.g., 10 AM, 2 PM, 4 PM show proper 4-hour and 2-hour gaps)
  - Hover over points to see average values and record counts
  - Clear filters to see all data
- **History Tab**: View all records in a table format
  - Filter by metric, year, month, and day
  - Delete individual records if needed

### Data Management
- **Export**: Download all your data as a CSV file
- **Import**: Upload a previously exported CSV file to restore data
- **Backup**: Your data is automatically saved in your browser's local storage

## 🛠️ Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js for data visualization
- **Storage**: Browser localStorage for data persistence
- **PWA**: Service worker for offline functionality
- **Responsive**: Mobile-first CSS design

### File Structure
```
tracker/
├── index.html          # Main application
├── app.js             # Application logic
├── styles/
│   └── main.css       # Styling
├── manifest.json      # PWA configuration
├── service-worker.js  # Offline functionality
└── README.md         # This file
```

### Data Format
The app stores data in the following JSON structure:
```json
{
  "metrics": [
    {"name": "Mood", "scale": "likert"},
    {"name": "Sleep Quality", "scale": "continuous"}
  ],
  "records": [
    {
      "metric": "Mood",
      "value": "4",
      "date": "2025-01-15",
      "timestamp": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### CSV Export Format
```csv
metric,scale,value,date,timestamp
Mood,likert,4,2025-01-15,2025-01-15T10:30:00.000Z
Sleep Quality,continuous,75,2025-01-15,2025-01-15T10:31:00.000Z
```

## 🔧 Development

### Local Development
1. Clone the repository
2. Open `index.html` in a web browser
3. The app will work locally without any build process

### Deployment
- The app is designed to be deployed to GitHub Pages
- Simply push the files to a GitHub repository
- Enable GitHub Pages in the repository settings
- Point to the root directory

### Browser Compatibility
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome! Feel free to:
- Report bugs or issues
- Suggest new features
- Submit pull requests for improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Timothy Fraser**
- 🌐 [Website](https://timothyfraser.com)
- 📚 [Google Scholar](https://scholar.google.com/citations?user=Ty7f6yAAAAAJ&hl=en&authuser=1)
- 🐙 [GitHub](https://github.com/timothyfraser)

---

**Note**: This app stores all data locally in your browser. Clearing browser data or using private/incognito mode will remove your data. Always export your data regularly if it's important to you.
