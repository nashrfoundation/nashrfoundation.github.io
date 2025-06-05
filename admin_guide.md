# Nashr Foundation Leaderboard Admin Guide

## Overview
This document explains how to update the donor leaderboard on the Nashr Foundation website. The leaderboard displays the top donors and is designed to be easily editable by administrators without requiring technical knowledge.

## Leaderboard Data File
The leaderboard data is stored in a simple CSV (Comma-Separated Values) file that can be edited with any spreadsheet program like Microsoft Excel, Google Sheets, or even a simple text editor.

### File Location
The leaderboard data file is located at:
```
/home/ubuntu/nashr_foundation_website/src/data/leaderboard.csv
```

### File Format
The CSV file has the following columns:
1. **Rank** - The position of the donor on the leaderboard
2. **Name** - The name of the donor (can be anonymous or partially hidden for privacy)
3. **Amount** - The donation amount in Pakistani Rupees (₨)

Example:
```
Rank,Name,Amount
1,Ahmed K.,50000
2,Fatima S.,35000
3,Muhammad R.,25000
4,Aisha Z.,20000
5,Omar T.,15000
```

## How to Update the Leaderboard

### Using a Spreadsheet Program (Recommended)

1. **Download the CSV file** from the server or access it directly if you have server access
2. **Open the file** in your preferred spreadsheet program (Excel, Google Sheets, etc.)
3. **Edit the data** as needed:
   - Update existing entries
   - Add new donors
   - Remove entries
   - Re-order based on donation amounts
4. **Save the file** as CSV format
5. **Upload the updated file** back to the server, replacing the original file

### Using a Text Editor

1. **Open the CSV file** in any text editor
2. **Edit the data** directly, maintaining the comma-separated format
3. **Save the file**
4. **Upload the updated file** back to the server

## Important Notes

- Always maintain the header row (Rank,Name,Amount)
- Ensure the file remains in CSV format
- The website will automatically display the top entries from this file
- For privacy, consider using only first names or initials for last names
- The leaderboard will update as soon as the file is saved
- Make a backup of the file before making significant changes

## Troubleshooting

If the leaderboard doesn't update after editing the file:
1. Verify the file is saved in CSV format
2. Check that the file has been properly uploaded to the correct location
3. Ensure the file permissions allow the web server to read it
4. Clear your browser cache or try viewing the page in an incognito/private window

For additional assistance, please contact the website administrator.
